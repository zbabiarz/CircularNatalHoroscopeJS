import React from 'react'

function AdminDetailModal({ entry, onClose }) {
  if (!entry) return null

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A'
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const generateSummary = (report) => {
    if (!report) return 'No report generated yet.'
    const sentences = report.replace(/[#*_]/g, '').split(/[.!?]+/).filter(s => s.trim().length > 10)
    const summaryLines = sentences.slice(0, 5).map(s => s.trim())
    return summaryLines.join('. ') + (summaryLines.length > 0 ? '.' : '')
  }

  const fields = [
    { label: 'Name', value: entry.name },
    { label: 'Email', value: entry.email },
    { label: 'Birth Date', value: formatDate(entry.birth_date) },
    { label: 'Birth Time', value: entry.birth_time || 'Not provided' },
    { label: 'Birth Location', value: entry.birth_location || 'Not provided' },
    { label: 'Chiron Sign', value: entry.chiron_sign },
    { label: 'Chiron House', value: entry.chiron_house || 'Unknown' },
    { label: 'Chiron Degree', value: entry.chiron_degree ? `${parseFloat(entry.chiron_degree).toFixed(2)}°` : 'N/A' },
    { label: 'Shadow ID', value: entry.shadow_id },
    { label: 'Submitted', value: formatTimestamp(entry.created_at) },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-brown">{entry.name}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-brown/60 hover:text-brown"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(85vh - 65px)' }}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {fields.map((field) => (
              <div key={field.label} className={field.label === 'Birth Location' ? 'col-span-2' : ''}>
                <p className="text-xs font-medium text-brown/50 uppercase tracking-wide mb-1">{field.label}</p>
                <p className="text-sm text-brown">{field.value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-medium text-brown/50 uppercase tracking-wide">Report Status</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(entry.ai_report_status)}`}>
                {entry.ai_report_status || 'unknown'}
              </span>
            </div>

            {entry.ai_report_error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-600">{entry.ai_report_error}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-brown/50 uppercase tracking-wide mb-2">Report Summary</p>
              <p className="text-sm text-brown/80 leading-relaxed italic">
                {generateSummary(entry.ai_report)}
              </p>
              {entry.ai_report && (
                <p className="text-xs text-brown/40 mt-3">
                  This is a summary. Full report is {entry.ai_report.length.toLocaleString()} characters.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDetailModal
