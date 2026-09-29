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

  try {
    const { passcode, resultId, sendEmail } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authRes = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_passcode_ok`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ p_passcode: passcode }),
    });

    if (!authRes.ok || (await authRes.json()) !== true) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resultId || typeof resultId !== "string") {
      return new Response(
        JSON.stringify({ error: "A valid result is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ error: "Record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const record = records[0];

    // Step 1: Generate the AI report
    console.log("Regenerating report for:", record.name);
    const reportRes = await fetch(
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
          chironDegree: Number(record.chiron_degree) || 0,
        }),
      }
    );

    if (!reportRes.ok) {
      const errText = await reportRes.text();
      return new Response(
        JSON.stringify({ error: `Report generation failed: ${errText.slice(0, 300)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reportData = await reportRes.json();
    console.log("Report generated:", reportData.report?.length, "chars, status:", reportData.status);

    if (!reportData.report || reportData.report.length < 5000) {
      return new Response(
        JSON.stringify({
          error: `AI did not produce a valid report (got ${reportData.report?.length ?? 0} chars, status: ${reportData.status})`,
          reportPreview: reportData.report?.slice(0, 200),
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save report to database
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
          ai_report: reportData.report,
          ai_report_status: reportData.status || "completed",
          ai_report_error: null,
        }),
      }
    );

    // Step 2: Generate the PDF
    console.log("Generating PDF...");
    const pdfRes = await fetch(
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
          chironDegree: Number(record.chiron_degree) || 0,
          shadowId: record.shadow_id,
          report: reportData.report,
        }),
      }
    );

    if (!pdfRes.ok) {
      const errText = await pdfRes.text();
      return new Response(
        JSON.stringify({ error: `PDF generation failed: ${errText.slice(0, 300)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pdfData = await pdfRes.json();
    console.log("PDF generated, pages:", pdfData.pages);

    // Step 3: Send to delivery webhook (only if requested)
    let deliveryStatus = "skipped";
    if (sendEmail) {
      console.log("Sending to delivery webhook...");
      const webhookRes = await fetch(
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
            chironDegree: Number(record.chiron_degree) || 0,
            shadowId: record.shadow_id,
            resultId: record.id,
            pdfUrl: pdfData.publicUrl,
            pdfBase64: pdfData.pdfBase64,
            type: "paid_report_delivery",
          }),
        }
      );

      if (webhookRes.ok) {
        deliveryStatus = "sent";
      } else {
        deliveryStatus = `failed (${webhookRes.status})`;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reportLength: reportData.report.length,
        reportStatus: reportData.status,
        pdfPages: pdfData.pages,
        deliveryStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Regeneration error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
