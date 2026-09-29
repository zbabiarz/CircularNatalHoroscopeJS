import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Internal only: called by the Stripe webhook after a confirmed payment using
// the service role key. Without this check anyone could push an arbitrary
// payload (recipient address and attachment included) into the delivery flow.
function isInternalCaller(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return false;
  const header = req.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (token.length !== serviceKey.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ serviceKey.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (!isInternalCaller(req)) {
    return new Response(
      JSON.stringify({ success: false, error: "Not authorized" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const payload = await req.json();

    console.log('Forwarding PDF data to webhook...');
    const webhookResponse = await fetch('https://effortlessai.app.n8n.cloud/webhook/f99dc2b5-b950-4752-ab9b-cbac9d60da0f', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
            ...payload,
            type: 'paid_report_delivery',
          })
    });

    const responseText = await webhookResponse.text();
    console.log('Webhook response:', webhookResponse.status, responseText);

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status} ${responseText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'PDF data sent successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending to webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Delivery failed' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});