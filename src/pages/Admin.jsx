import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import AdminLogin from '../components/AdminLogin'
import AdminDetailModal from '../components/AdminDetailModal'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

const PER_PAGE = 100

const darkBg = {
  background: 'radial-gradient(ellipse at center top, #2a0f1a 0%, #1a0a10 40%, #0d0608 100%)',
  minHeight: '100vh',
}

const glassPanel = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(198,190,186,0.1)',
  backdropFilter: 'blur(12px)',
}

const magentaAccent = '#8d1246'
const cream = '#f9f2eb'
const rose = '#c6beba'

function StatusBadge({ status }) {
  const styles = {
    completed: { background: 'rgba(34,197,94,0.12)', color: 'rgba(134,239,172,0.9)', border: '1px solid rgba(34,197,94,0.2)' },
    failed: { background: 'rgba(239,68,68,0.12)', color: 'rgba(252,165,165,0.9)', border: '1px solid rgba(239,68,68,0.2)' },
    pending: { background: 'rgba(141,18,70,0.15)', color: 'rgba(198,190,186,0.8)', border: '1px solid rgba(141,18,70,0.3)' },
    error: { background: 'rgba(239,68,68,0.12)', color: 'rgba(252,165,165,0.9)', border: '1px solid rgba(239,68,68,0.2)' },
    incomplete_generic_voice: { background: 'rgba(245,158,11,0.12)', color: 'rgba(252,211,77,0.9)', border: '1px solid rgba(245,158,11,0.2)' },
    incomplete_missing_sections: { background: 'rgba(239,68,68,0.12)', color: 'rgba(252,165,165,0.9)', border: '1px solid rgba(239,68,68,0.2)' },
    incomplete_too_short: { background: 'rgba(239,68,68,0.12)', color: 'rgba(252,165,165,0.9)', border: '1px solid rgba(239,68,68,0.2)' },
  }
  const s = styles[status] || { background: 'rgba(255,255,255,0.05)', color: 'rgba(198,190,186,0.5)', border: '1px solid rgba(198,190,186,0.1)' }
  const label = status === 'incomplete_generic_voice' ? 'incomplete' : (status || '—')
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ ...s, letterSpacing: '0.05em' }}
    >
      {label}
    </span>
  )
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span style={{ color: 'rgba(198,190,186,0.2)', marginLeft: 4 }}>⇅</span>
  return <span style={{ color: magentaAccent, marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
}

function Admin() {
  const [passcode, setPasscode] = useState(
    sessionStorage.getItem('admin_passcode') || ''
  )
  const authenticated = Boolean(passcode)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [signFilter, setSignFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [sendingId, setSendingId] = useState(null)
  const [sendResult, setSendResult] = useState({})

  useEffect(() => {
    if (!authenticated) return
    fetchEntries()
  }, [authenticated, passcode, page, signFilter, sortField, sortDir])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const { data: countData, error: countError } = await supabase
        .rpc('admin_count_results', {
          p_passcode: passcode,
          p_sign_filter: signFilter || null,
        })
      if (countError) {
        // The server rejected the passcode. Drop the session and show the gate again.
        sessionStorage.removeItem('admin_passcode')
        setPasscode('')
        return
      }
      setTotalCount(Number(countData) || 0)

      const offset = (page - 1) * PER_PAGE

      const { data, error } = await supabase
        .rpc('admin_list_results', {
          p_passcode: passcode,
          p_sign_filter: signFilter || null,
          p_sort_field: sortField,
          p_sort_dir: sortDir,
          p_offset: offset,
          p_limit: PER_PAGE,
        })
      if (error) {
        sessionStorage.removeItem('admin_passcode')
        setPasscode('')
        return
      }
      setEntries(data || [])
    } catch (err) {
      console.error('Could not load entries')
    } finally {
      setLoading(false)
    }
  }

  const handleForceSend = async (entry) => {
    setSendingId(entry.id)
    setSendResult(prev => ({ ...prev, [entry.id]: null }))
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/resend-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ resultId: entry.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendResult(prev => ({ ...prev, [entry.id]: { success: false, message: data.error || `Failed (${res.status})` }}))
      } else {
        setSendResult(prev => ({ ...prev, [entry.id]: { success: true, message: `Sent! PDF: ${data.pdfPages} pages, delivered: ${data.deliverySent}` }}))
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ai_report_status: 'completed', ai_report_error: null } : e))
      }
    } catch (err) {
      setSendResult(prev => ({ ...prev, [entry.id]: { success: false, message: err.message }}))
    } finally {
      setSendingId(null)
    }
  }

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries
    const term = search.toLowerCase()
    return entries.filter(e =>
      e.name?.toLowerCase().includes(term) ||
      e.email?.toLowerCase().includes(term)
    )
  }, [entries, search])

  const totalPages = Math.ceil(totalCount / PER_PAGE)

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPage(1)
  }

  const handleSignFilter = (sign) => { setSignFilter(sign); setPage(1) }

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Birth Date', 'Birth Time', 'Birth Location', 'Chiron Sign', 'Chiron House', 'Chiron Degree', 'Shadow ID', 'Report Status', 'Submitted']
    const rows = filteredEntries.map(e => [
      e.name, e.email, e.birth_date, e.birth_time || '', e.birth_location || '',
      e.chiron_sign, e.chiron_house || '', e.chiron_degree || '',
      e.shadow_id, e.ai_report_status || '', e.created_at
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `shadow-work-leads-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  if (!authenticated) {
    return <AdminLogin onAuthenticated={(code) => setPasscode(code)} />
  }

  return (
    <div style={darkBg}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            background: i % 3 === 0 ? rose : i % 3 === 1 ? magentaAccent : cream,
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            opacity: Math.random() * 0.4 + 0.1,
            animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: Math.random() * 4 + 's',
          }} />
        ))}
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <div
          className="sticky top-0"
          style={{
            background: 'rgba(13,6,8,0.85)',
            borderBottom: '1px solid rgba(198,190,186,0.08)',
            backdropFilter: 'blur(20px)',
            zIndex: 20,
          }}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
            <div>
              <h1
                className="text-xl font-bold"
                style={{ fontFamily: "'Cinzel', serif", color: cream, letterSpacing: '0.06em' }}
              >
                Shadow Work Portal
              </h1>
              <p style={{ color: 'rgba(198,190,186,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em', marginTop: 2 }}>
                {totalCount.toLocaleString()} TOTAL LEADS
              </p>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem('admin_passcode'); setPasscode('') }}
              className="text-xs transition-colors"
              style={{ color: 'rgba(198,190,186,0.35)', letterSpacing: '0.1em' }}
              onMouseEnter={e => e.target.style.color = rose}
              onMouseLeave={e => e.target.style.color = 'rgba(198,190,186,0.35)'}
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(198,190,186,0.3)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  ...glassPanel,
                  color: cream,
                  fontSize: '0.85rem',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(141,18,70,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(198,190,186,0.1)'}
              />
            </div>
            <select
              value={signFilter}
              onChange={e => handleSignFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none min-w-[160px]"
              style={{ ...glassPanel, color: signFilter ? cream : 'rgba(198,190,186,0.45)', fontSize: '0.85rem' }}
            >
              <option value="" style={{ background: '#1a0a10' }}>All Signs</option>
              {ZODIAC_SIGNS.map(sign => (
                <option key={sign} value={sign} style={{ background: '#1a0a10' }}>{sign}</option>
              ))}
            </select>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                fontFamily: "'Cinzel', serif",
                letterSpacing: '0.06em',
                background: 'linear-gradient(135deg, rgba(141,18,70,0.8) 0%, rgba(141,18,70,0.5) 100%)',
                border: '1px solid rgba(141,18,70,0.6)',
                color: cream,
                boxShadow: '0 0 20px rgba(141,18,70,0.2)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(141,18,70,0.4)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(141,18,70,0.2)'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          {signFilter && (
            <div className="mb-4 flex items-center gap-2">
              <span style={{ color: 'rgba(198,190,186,0.4)', fontSize: '0.8rem', letterSpacing: '0.08em' }}>
                {totalCount} {signFilter.toUpperCase()} LEADS
              </span>
              <button
                onClick={() => handleSignFilter('')}
                className="text-xs px-2 py-0.5 rounded-lg transition-colors"
                style={{ background: 'rgba(141,18,70,0.15)', color: rose, border: '1px solid rgba(141,18,70,0.3)' }}
              >
                clear
              </button>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={{ ...glassPanel, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(198,190,186,0.06)', background: 'rgba(141,18,70,0.06)' }}>
                    {[
                      { label: 'Name', field: 'name' },
                      { label: 'Email', field: 'email' },
                      { label: 'Birth Date', field: 'birth_date' },
                      { label: 'Sign', field: 'chiron_sign' },
                      { label: 'House', field: null },
                      { label: 'Degree', field: null },
                      { label: 'Status', field: null },
                      { label: 'Submitted', field: 'created_at' },
                      { label: '', field: null },
                      { label: '', field: null },
                    ].map(({ label, field }) => (
                      <th
                        key={label}
                        className={`text-left px-4 py-3.5 text-xs font-medium ${field ? 'cursor-pointer' : ''}`}
                        style={{ color: 'rgba(198,190,186,0.45)', letterSpacing: '0.1em', userSelect: 'none' }}
                        onClick={() => field && handleSort(field)}
                        onMouseEnter={e => field && (e.currentTarget.style.color = rose)}
                        onMouseLeave={e => field && (e.currentTarget.style.color = 'rgba(198,190,186,0.45)')}
                      >
                        {label.toUpperCase()}
                        {field && <SortIcon field={field} sortField={sortField} sortDir={sortDir} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-20" style={{ color: 'rgba(198,190,186,0.3)' }}>
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 rounded-full border-t-2 border-b-2 animate-spin" style={{ borderColor: magentaAccent }} />
                          <span style={{ letterSpacing: '0.1em', fontSize: '0.75rem' }}>LOADING</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-20" style={{ color: 'rgba(198,190,186,0.25)', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
                        {search ? 'NO RESULTS FOUND' : 'NO ENTRIES YET'}
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className="transition-all duration-150 cursor-pointer group"
                        style={{ borderBottom: '1px solid rgba(198,190,186,0.04)' }}
                        onClick={() => setSelectedEntry(entry)}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(141,18,70,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-4 py-3.5 font-medium text-sm" style={{ color: cream }}>{entry.name}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: 'rgba(198,190,186,0.55)' }}>{entry.email}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: 'rgba(198,190,186,0.55)' }}>{fmt(entry.birth_date)}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: rose }}>{entry.chiron_sign}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: 'rgba(198,190,186,0.45)' }}>{entry.chiron_house || '—'}</td>
                        <td className="px-4 py-3.5 text-sm font-mono" style={{ color: 'rgba(198,190,186,0.45)' }}>
                          {entry.chiron_degree ? `${parseFloat(entry.chiron_degree).toFixed(1)}°` : '—'}
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={entry.ai_report_status} /></td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: 'rgba(198,190,186,0.35)' }}>{fmt(entry.created_at)}</td>
                        <td className="px-4 py-3.5">
                          <span className="transition-all duration-150" style={{ color: 'rgba(198,190,186,0.2)' }}>›</span>
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          {entry.ai_report_status !== 'completed' && entry.ai_report ? (
                            <button
                              onClick={() => handleForceSend(entry)}
                              disabled={sendingId === entry.id}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap"
                              style={{
                                background: sendingId === entry.id ? 'rgba(141,18,70,0.3)' : 'rgba(195,205,66,0.15)',
                                color: sendingId === entry.id ? 'rgba(198,190,186,0.4)' : 'rgba(195,205,66,0.9)',
                                border: '1px solid rgba(195,205,66,0.3)',
                                cursor: sendingId === entry.id ? 'wait' : 'pointer',
                                opacity: sendingId === entry.id ? 0.5 : 1,
                              }}
                              onMouseEnter={e => { if (sendingId !== entry.id) e.currentTarget.style.background = 'rgba(195,205,66,0.25)' }}
                              onMouseLeave={e => { if (sendingId !== entry.id) e.currentTarget.style.background = 'rgba(195,205,66,0.15)' }}
                            >
                              {sendingId === entry.id ? 'Sending...' : 'Force Send'}
                            </button>
                          ) : sendResult[entry.id] ? (
                            <span className="text-xs" style={{ color: sendResult[entry.id].success ? 'rgba(134,239,172,0.7)' : 'rgba(252,165,165,0.7)' }}>
                              {sendResult[entry.id].success ? 'Sent' : 'Failed'}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'rgba(198,190,186,0.15)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3.5"
                style={{ borderTop: '1px solid rgba(198,190,186,0.06)' }}
              >
                <p className="text-xs" style={{ color: 'rgba(198,190,186,0.3)', letterSpacing: '0.1em' }}>
                  PAGE {page} OF {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-1.5 text-xs rounded-lg transition-all"
                    style={{
                      ...glassPanel,
                      color: page === 1 ? 'rgba(198,190,186,0.2)' : rose,
                      letterSpacing: '0.08em',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-1.5 text-xs rounded-lg transition-all"
                    style={{
                      ...glassPanel,
                      color: page === totalPages ? 'rgba(198,190,186,0.2)' : rose,
                      letterSpacing: '0.08em',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedEntry && (
        <AdminDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  )
}

export default Admin
