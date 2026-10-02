import React, { useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const cream = '#f9f2eb'
const rose = '#c6beba'
const magenta = '#8d1246'

function AdminDetailModal({ entry, onClose }) {
  const [regenerating, setRegenerating] = useState(false)
  const [regenResult, setRegenResult] = useState(null)


  const handleRegenerate = async (sendEmail) => {
    const passcode = sessionStorage.getItem('admin_passcode')
    if (!passcode) return

    setRegenerating(true)
    setRegenResult(null)

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/regenerate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          passcode,
          resultId: entry.id,
          sendEmail,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setRegenResult({ success: false, message: data.error || `Server returned ${res.status}` })
      } else {
        setRegenResult({
          success: true,
          message: `Report: ${data.reportLength?.toLocaleString()} chars, PDF: ${data.pdfPages} pages, Email: ${data.deliveryStatus}`,
        })
      }
    } catch (err) {
      setRegenResult({ success: false, message: err.message })
    } finally {
      setRegenerating(false)
    }
  }


  if (!entry) return null

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTimestamp = (ts) => {
    if (!ts) return '—'
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  const getStatusStyle = (status) => {
    const map = {
      completed: { background: 'rgba(34,197,94,0.12)', color: 'rgba(134,239,172,0.9)', border: '1px solid rgba(34,197,94,0.2)' },
      failed: { background: 'rgba(239,68,68,0.12)', color: 'rgba(252,165,165,0.9)', border: '1px solid rgba(239,68,68,0.2)' },
      pending: { background: 'rgba(141,18,70,0.15)', color: 'rgba(198,190,186,0.8)', border: '1px solid rgba(141,18,70,0.3)' },
      error: { background: 'rgba(239,68,68,0.12)', color: 'rgba(252,165,165,0.9)', border: '1px solid rgba(239,68,68,0.2)' },
      incomplete_generic_voice: { background: 'rgba(245,158,11,0.12)', color: 'rgba(252,211,77,0.9)', border: '1px solid rgba(245,158,11,0.2)' },
      incomplete_missing_sections: { background: 'rgba(239,68,68,0.12)', color: 'rgba(252,165,165,0.9)', border: '1px solid rgba(239,68,68,0.2)' },
      incomplete_too_short: { background: 'rgba(239,68,68,0.12)', color: 'rgba(252,165,165,0.9)', border: '1px solid rgba(239,68,68,0.2)' },
    }
    return map[status] || { background: 'rgba(255,255,255,0.05)', color: 'rgba(198,190,186,0.5)', border: '1px solid rgba(198,190,186,0.1)' }
  }

  const generateSummary = (report) => {
    if (!report) return null
    const cleaned = report.replace(/[#*_`]/g, '').replace(/\n+/g, ' ')
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 10)
    const summaryLines = sentences.slice(0, 5).map(s => s.trim())
    return summaryLines.join('. ') + (summaryLines.length > 0 ? '.' : '')
  }

  const summary = generateSummary(entry.ai_report)

  const fields = [
    { label: 'Email', value: entry.email, span: 2 },
    { label: 'Birth Date', value: formatDate(entry.birth_date) },
    { label: 'Birth Time', value: entry.birth_time || 'Not provided' },
    { label: 'Birth Location', value: entry.birth_location || 'Not provided', span: 2 },
    { label: 'Chiron Sign', value: entry.chiron_sign },
    { label: 'Chiron House', value: entry.chiron_house || 'Unknown' },
    { label: 'Chiron Degree', value: entry.chiron_degree ? `${parseFloat(entry.chiron_degree).toFixed(2)}°` : '—' },
    { label: 'Shadow ID', value: entry.shadow_id },
    { label: 'Submitted', value: formatTimestamp(entry.created_at), span: 2 },
  ]

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'radial-gradient(ellipse at top, #2a0f1a 0%, #120709 100%)',
          border: '1px solid rgba(198,190,186,0.1)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(141,18,70,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(198,190,186,0.07)' }}
        >
          <div>
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: "'Cinzel', serif", color: cream, letterSpacing: '0.06em' }}
            >
              {entry.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {entry.chiron_sign && (
                <p style={{ color: rose, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                  CHIRON IN {entry.chiron_sign.toUpperCase()}
                </p>
              )}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={entry.has_purchased
                  ? { background: 'rgba(234,179,8,0.12)', color: 'rgba(250,204,21,0.9)', border: '1px solid rgba(234,179,8,0.25)', letterSpacing: '0.05em' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(198,190,186,0.45)', border: '1px solid rgba(198,190,186,0.08)', letterSpacing: '0.05em' }
                }
              >
                {entry.has_purchased ? 'Paid' : 'Free'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(198,190,186,0.4)', border: '1px solid rgba(198,190,186,0.08)' }}
            onMouseEnter={e => e.currentTarget.style.color = cream}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(198,190,186,0.4)'}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {fields.map(({ label, value, span }) => (
              <div key={label} className={span === 2 ? 'col-span-2' : ''}>
                <p
                  className="text-xs mb-1"
                  style={{ color: 'rgba(198,190,186,0.35)', letterSpacing: '0.1em' }}
                >
                  {label.toUpperCase()}
                </p>
                <p className="text-sm" style={{ color: cream }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(198,190,186,0.07)', paddingTop: '1.25rem' }}>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs" style={{ color: 'rgba(198,190,186,0.35)', letterSpacing: '0.1em' }}>
                REPORT STATUS
              </p>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ ...getStatusStyle(entry.ai_report_status), letterSpacing: '0.05em' }}
              >
                {entry.ai_report_status === 'incomplete_generic_voice' ? 'incomplete' : (entry.ai_report_status || 'unknown')}
              </span>
            </div>

            {entry.ai_report_error && (
              <div
                className="rounded-xl p-3 mb-4"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <p className="text-xs" style={{ color: 'rgba(252,165,165,0.8)' }}>{entry.ai_report_error}</p>
              </div>
            )}

            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(141,18,70,0.06)',
                border: '1px solid rgba(141,18,70,0.15)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs" style={{ color: 'rgba(198,190,186,0.35)', letterSpacing: '0.1em' }}>
                  REPORT SUMMARY
                </p>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(141,18,70,0.2)', color: rose, border: '1px solid rgba(141,18,70,0.3)', letterSpacing: '0.05em' }}
                >
                  Summary
                </span>
              </div>
              {summary ? (
                <>
                  <p
                    className="text-sm leading-relaxed italic"
                    style={{ color: 'rgba(249,242,235,0.7)' }}
                  >
                    {summary}
                  </p>
                  <p
                    className="text-xs mt-3"
                    style={{ color: 'rgba(198,190,186,0.25)' }}
                  >
                    Full report is {entry.ai_report.length.toLocaleString()} characters
                  </p>
                </>
              ) : (
                <p className="text-sm italic" style={{ color: 'rgba(198,190,186,0.3)' }}>
                  No report generated yet.
                </p>
              )}
            </div>
          </div>

          {/* REGENERATE + SEND */}
          <div style={{ borderTop: '1px solid rgba(198,190,186,0.07)', paddingTop: '1.25rem', marginTop: '1rem' }}>
            <p className="text-xs mb-2" style={{ color: 'rgba(198,190,186,0.4)' }}>
              Regenerate the report from scratch and email it.
            </p>
            <button
              onClick={() => handleRegenerate(true)}
              disabled={regenerating}
              style={{
                background: regenerating ? '#555' : '#C3CD42',
                color: '#1E2220',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: regenerating ? 'wait' : 'pointer',
                opacity: regenerating ? 0.6 : 1,
              }}
            >
              {regenerating ? 'Working...' : 'Regenerate + Send Email'}
            </button>
            {regenResult && (
              <div
                className="rounded-xl p-3 mt-3"
                style={{
                  background: regenResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${regenResult.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}
              >
                <p className="text-sm" style={{ color: regenResult.success ? 'rgba(134,239,172,0.9)' : 'rgba(252,165,165,0.9)' }}>
                  {regenResult.success ? 'Done — ' : 'Error — '}{regenResult.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDetailModal
