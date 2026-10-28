import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (req.headers.get('Authorization') !== `Bearer ${serviceKey}`) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { resultId, email } = await req.json();
    if (!resultId && !email) {
      return json({ error: 'resultId or email is required' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    let lookup = supabase
      .from('shadow_work_results')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);
    lookup = resultId ? lookup.eq('id', resultId) : lookup.eq('email', email);

    const { data: found, error: lookupError } = await lookup.maybeSingle();
    if (lookupError) {
      console.error('Record lookup failed:', lookupError);
      return json({ error: 'Lookup failed' }, 500);
    }
    if (!found) {
      console.error('No shadow_work_results record for:', resultId || email);
      return json({ error: 'Record not found' }, 404);
    }

    // Flipping has_purchased only when it is still false is the single-use claim:
    // whichever caller (Stripe notice or buyer's return) wins runs the pipeline once.
    const { data: claimed, error: claimError } = await supabase
      .from('shadow_work_results')
      .update({ has_purchased: true })
      .eq('id', found.id)
      .eq('has_purchased', false)
      .select('*')
      .maybeSingle();

    if (claimError) {
      console.error('Failed to mark as purchased:', claimError);
      return json({ error: 'Could not mark as purchased' }, 500);
    }
    if (!claimed) {
      console.log('Already fulfilled, skipping:', found.id);
      return json({ status: 'already_fulfilled' });
    }

    console.log('Marked has_purchased = true for record:', claimed.id);
    EdgeRuntime.waitUntil(runPipeline(claimed, supabase, supabaseUrl, serviceKey));
    return json({ status: 'started' }, 202);
  } catch (error: any) {
    console.error('fulfill-order error:', error);
    return json({ error: 'Internal error' }, 500);
  }
});

async function callFunction(supabaseUrl: string, serviceKey: string, name: string, body: unknown) {
  return fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
    body: JSON.stringify(body),
  });
}

async function runPipeline(record: any, supabase: ReturnType<typeof createClient>, supabaseUrl: string, serviceKey: string) {
  try {
    if (record.ai_report && record.ai_report.length > 5000 && record.ai_report_status === 'completed') {
      console.log('Report already completed and delivered, skipping regeneration');
      return;
    }

    const reportInput = {
      name: record.name,
      chironSign: record.chiron_sign,
      chironHouse: record.chiron_house,
      chironDegree: Number(record.chiron_degree) || 0,
    };

    console.log('Generating deep dive report...');
    const reportResponse = await callFunction(supabaseUrl, serviceKey, 'generate-report', reportInput);

    if (!reportResponse.ok) {
      const errText = await reportResponse.text();
      console.error('Report generation failed:', errText);
      await supabase
        .from('shadow_work_results')
        .update({ ai_report_status: 'error', ai_report_error: `Report generation failed: ${errText.slice(0, 500)}` })
        .eq('id', record.id);
      return;
    }

    let reportData = await reportResponse.json();
    console.log('Report generated, length:', reportData.report?.length, 'status:', reportData.status);

    for (let retryAttempt = 0; retryAttempt < 2; retryAttempt++) {
      if (reportData.isValid && (reportData.report?.length ?? 0) >= 5000) break;

      const backoffMs = 2000 * (retryAttempt + 1);
      console.warn(`Report incomplete (len=${reportData.report?.length ?? 0}, status=${reportData.status}), retry ${retryAttempt + 1}/2 after ${backoffMs}ms...`);
      await new Promise((r) => setTimeout(r, backoffMs));

      const retryResponse = await callFunction(supabaseUrl, serviceKey, 'generate-report', reportInput);
      if (!retryResponse.ok) {
        console.error('Retry HTTP failure:', retryResponse.status);
        continue;
      }
      const retryData = await retryResponse.json();
      console.log('Retry report length:', retryData.report?.length, 'status:', retryData.status);
      if ((retryData.report?.length ?? 0) > (reportData.report?.length ?? 0)) {
        reportData = retryData;
      }
    }

    // Failures are left for the admin dashboard's "Regenerate + Send" instead of
    // sending the customer a "your map is ready" email with no usable report.
    if (!reportData.report || reportData.report.length < 5000) {
      console.error('Report is too short or empty after retry, aborting pipeline');
      await supabase
        .from('shadow_work_results')
        .update({
          ai_report: reportData.report || null,
          ai_report_status: 'error',
          ai_report_error: `AI did not produce a usable report (length: ${reportData.report?.length ?? 0}, status: ${reportData.status ?? 'unknown'})`,
        })
        .eq('id', record.id);
      return;
    }

    if (!reportData.isValid) {
      console.warn(`Report has minor voice flags (status: ${reportData.status}) but is long enough (${reportData.report.length} chars) — proceeding with delivery`);
    }

    await supabase
      .from('shadow_work_results')
      .update({ ai_report: reportData.report, ai_report_status: reportData.status || 'completed', ai_report_error: null })
      .eq('id', record.id);

    console.log('Generating PDF...');
    const pdfResponse = await callFunction(supabaseUrl, serviceKey, 'generate-pdf', {
      ...reportInput,
      email: record.email,
      shadowId: record.shadow_id,
      report: reportData.report,
    });

    if (!pdfResponse.ok) {
      console.error('PDF generation failed:', await pdfResponse.text());
      return;
    }

    const pdfData = await pdfResponse.json();
    console.log('PDF generated successfully');

    const webhookResponse = await callFunction(supabaseUrl, serviceKey, 'send-pdf-webhook', {
      ...reportInput,
      email: record.email,
      shadowId: record.shadow_id,
      resultId: record.id,
      pdfUrl: pdfData.publicUrl,
      pdfBase64: pdfData.pdfBase64,
    });

    if (!webhookResponse.ok) {
      console.error('Webhook delivery failed:', await webhookResponse.text());
      return;
    }

    console.log('Full pipeline complete for:', record.email);
  } catch (error) {
    console.error('Pipeline error:', error);
    await supabase
      .from('shadow_work_results')
      .update({ ai_report_status: 'error', ai_report_error: `Pipeline error: ${String(error).slice(0, 500)}` })
      .eq('id', record.id);
  }
}
