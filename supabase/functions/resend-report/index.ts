import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const { resultId } = await req.json();
    if (!resultId || typeof resultId !== "string") {
      return new Response(JSON.stringify({ error: "resultId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the record
    const recordRes = await fetch(
      `${supabaseUrl}/rest/v1/shadow_work_results?id=eq.${resultId}&select=*`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    const records = await recordRes.json();
    if (!records || records.length === 0) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const record = records[0];

    if (!record.ai_report || record.ai_report.length < 5000) {
      return new Response(
        JSON.stringify({ error: "No valid report found in record" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate PDF from existing report
    console.log("Generating PDF for:", record.name);
    const pdfRes = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
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
        chironDegree: Number(record.chiron_degree) || 0,
        shadowId: record.shadow_id,
        report: record.ai_report,
      }),
    });

    if (!pdfRes.ok) {
      const errText = await pdfRes.text();
      return new Response(
        JSON.stringify({ error: `PDF generation failed: ${errText.slice(0, 300)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pdfData = await pdfRes.json();
    console.log("PDF generated, pages:", pdfData.pages);

    // Send to delivery webhook
    const webhookRes = await fetch(`${supabaseUrl}/functions/v1/send-pdf-webhook`, {
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
        chironDegree: Number(record.chiron_degree) || 0,
        shadowId: record.shadow_id,
        resultId: record.id,
        pdfUrl: pdfData.publicUrl,
        pdfBase64: pdfData.pdfBase64,
      }),
    });

    if (webhookRes.ok) {
      console.log("Email delivery sent successfully");
    } else {
      const errText = await webhookRes.text();
      console.error("Email delivery failed:", errText.slice(0, 300));
    }

    // Update status to completed
    await fetch(
      `${supabaseUrl}/rest/v1/shadow_work_results?id=eq.${resultId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          ai_report_status: "completed",
          ai_report_error: null,
        }),
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        pdfPages: pdfData.pages,
        deliverySent: webhookRes.ok,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
