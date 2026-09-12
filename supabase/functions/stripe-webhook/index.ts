import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));
  if (!timestampPart || !sigPart) return false;

  const timestamp = timestampPart.split("=")[1];
  const expectedSig = sigPart.split("=")[1];
  const signedPayload = `${timestamp}.${payload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === expectedSig;
}

async function processPayment(email: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: record, error: fetchError } = await supabase
    .from("shadow_work_results")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !record) {
    console.error("Could not find record for email:", email, fetchError);
    return;
  }

  console.log("Found record:", record.id, "for email:", email);

  const { error: updateError } = await supabase
    .from("shadow_work_results")
    .update({ has_purchased: true })
    .eq("id", record.id);

  if (updateError) {
    console.error("Failed to update has_purchased:", updateError);
    return;
  }

  console.log("Marked has_purchased = true for record:", record.id);

  // Generate the deep dive AI report
  console.log("Generating deep dive report...");
  const reportResponse = await fetch(
    `${supabaseUrl}/functions/v1/generate-report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        name: record.name,
        chironSign: record.chiron_sign,
        chironHouse: record.chiron_house,
        chironDegree: record.chiron_degree,
      }),
    }
  );

  if (!reportResponse.ok) {
    const errText = await reportResponse.text();
    console.error("Report generation failed:", errText);
    await supabase
      .from("shadow_work_results")
      .update({
        ai_report_status: "error",
        ai_report_error: `Report generation failed: ${errText.slice(0, 500)}`,
      })
      .eq("id", record.id);
    return;
  }

  const reportData = await reportResponse.json();
  console.log(
    "Report generated, length:",
    reportData.report?.length,
    "status:",
    reportData.status
  );

  await supabase
    .from("shadow_work_results")
    .update({
      ai_report: reportData.report,
      ai_report_status: reportData.status || "completed",
      ai_report_error: null,
    })
    .eq("id", record.id);

  // Generate PDF
  console.log("Generating PDF...");
  const pdfResponse = await fetch(
    `${supabaseUrl}/functions/v1/generate-pdf`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        name: record.name,
        email: record.email,
        chironSign: record.chiron_sign,
        chironHouse: record.chiron_house,
        chironDegree: record.chiron_degree,
        shadowId: record.shadow_id,
        report: reportData.report,
      }),
    }
  );

  if (!pdfResponse.ok) {
    const errText = await pdfResponse.text();
    console.error("PDF generation failed:", errText);
    return;
  }

  const pdfData = await pdfResponse.json();
  console.log("PDF generated successfully");

  // Send to n8n webhook for email delivery
  console.log("Sending PDF to delivery webhook...");
  const webhookResponse = await fetch(
    `${supabaseUrl}/functions/v1/send-pdf-webhook`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        name: record.name,
        email: record.email,
        chironSign: record.chiron_sign,
        chironHouse: record.chiron_house,
        chironDegree: record.chiron_degree,
        shadowId: record.shadow_id,
        pdfBase64: pdfData.pdfBase64,
      }),
    }
  );

  if (!webhookResponse.ok) {
    const errText = await webhookResponse.text();
    console.error("Webhook delivery failed:", errText);
    return;
  }

  console.log("Full pipeline complete for:", email);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyStripeSignature(body, signature, stripeSecret);
    if (!isValid) {
      console.error("Invalid Stripe signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event = JSON.parse(body);
    console.log("Stripe event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail =
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.email;

      if (!customerEmail) {
        console.error("No customer email found in session:", session.id);
        return new Response(
          JSON.stringify({ received: true, warning: "No customer email" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Payment completed for:", customerEmail);

      // Process in background so Stripe gets a fast 200
      EdgeRuntime.waitUntil(processPayment(customerEmail));
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
