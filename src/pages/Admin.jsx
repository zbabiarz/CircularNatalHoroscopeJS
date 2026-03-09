import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import AdminLogin from '../components/AdminLogin'
import AdminDetailModal from '../components/AdminDetailModal'

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

const PER_PAGE = 100

function Admin() {
  const [authenticated, setAuthenticated] = useState(
    sessionStorage.getItem('admin_authenticated') === 'true'
  )
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [signFilter, setSignFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    if (!authenticated) return
    fetchEntries()
  }, [authenticated, page, signFilter, sortField, sortDir])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      let countQuery = supabase
        .from('shadow_work_results')
        .select('*', { count: 'exact', head: true })

      if (signFilter) {
        countQuery = countQuery.eq('chiron_sign', signFilter)
      }

      const { count } = await countQuery
      setTotalCount(count || 0)

      const from = (page - 1) * PER_PAGE
      const to = from + PER_PAGE - 1

      let query = supabase
        .from('shadow_work_results')
        .select('id, name, email, birth_date, birth_time, birth_location, chiron_sign, chiron_house, chiron_degree, shadow_id, shadow_text, ai_report, ai_report_status, ai_report_error, created_at')
        .order(sortField, { ascending: sortDir === 'asc' })
        .range(from, to)

      if (signFilter) {
        query = query.eq('chiron_sign', signFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching entries:', error)
        return
      }

      setEntries(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
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
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleSignFilter = (sign) => {
    setSignFilter(sign)
    setPage(1)
  }

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Birth Date', 'Birth Time', 'Birth Location', 'Chiron Sign', 'Chiron House', 'Chiron Degree', 'Shadow ID', 'Report Status', 'Submitted']
    const rows = filteredEntries.map(e => [
      e.name,
      e.email,
      e.birth_date,
      e.birth_time || '',
      e.birth_location || '',
      e.chiron_sign,
      e.chiron_house || '',
      e.chiron_degree || '',
      e.shadow_id,
      e.ai_report_status || '',
      e.created_at
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `shadow-work-leads-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const formatTimestamp = (ts) => {
    if (!ts) return '-'
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">&#8597;</span>
    return <span className="ml-1">{sortDir === 'asc' ? '&#9650;' : '&#9660;'}</span>
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated')
    setAuthenticated(false)
  }

  if (!authenticated) {
    return <AdminLogin onAuthenticated={() => setAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-brown">Admin Dashboard</h1>
            <p className="text-sm text-brown/50">{totalCount} total leads</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-brown/50 hover:text-brown transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-brown focus:outline-none transition-colors bg-white"
            />
          </div>
          <select
            value={signFilter}
            onChange={(e) => handleSignFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-brown focus:outline-none transition-colors bg-white text-brown min-w-[160px]"
          >
            <option value="">All Signs</option>
            {ZODIAC_SIGNS.map(sign => (
              <option key={sign} value={sign}>{sign}</option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brown hover:bg-brown/90 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        {signFilter && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-brown/60">
              Showing {totalCount} {signFilter} leads
            </span>
            <button
              onClick={() => handleSignFilter('')}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-brown/70 px-2 py-1 rounded-lg transition-colors"
            >
              Clear filter
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-brown/60 cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('name')}>
                    Name <SortIcon field="name" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-brown/60 cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('email')}>
                    Email <SortIcon field="email" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-brown/60 cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('birth_date')}>
                    Birth Date <SortIcon field="birth_date" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-brown/60 cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('chiron_sign')}>
                    Sign <SortIcon field="chiron_sign" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-brown/60">House</th>
                  <th className="text-left px-4 py-3 font-medium text-brown/60">Degree</th>
                  <th className="text-left px-4 py-3 font-medium text-brown/60">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-brown/60 cursor-pointer hover:text-brown transition-colors" onClick={() => handleSort('created_at')}>
                    Submitted <SortIcon field="created_at" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-brown/60 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-brown/40">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brown/30"></div>
                        <span>Loading leads...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-brown/40">
                      {search ? 'No results match your search.' : 'No entries found.'}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <td className="px-4 py-3 font-medium text-brown">{entry.name}</td>
                      <td className="px-4 py-3 text-brown/70">{entry.email}</td>
                      <td className="px-4 py-3 text-brown/70">{formatDate(entry.birth_date)}</td>
                      <td className="px-4 py-3 text-brown/70">{entry.chiron_sign}</td>
                      <td className="px-4 py-3 text-brown/70">{entry.chiron_house || '-'}</td>
                      <td className="px-4 py-3 text-brown/70">{entry.chiron_degree ? `${parseFloat(entry.chiron_degree).toFixed(1)}°` : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadge(entry.ai_report_status)}`}>
                          {entry.ai_report_status || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brown/70">{formatTimestamp(entry.created_at)}</td>
                      <td className="px-4 py-3">
                        <button className="text-brown/30 hover:text-brown transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-brown/50">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-brown"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-brown"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedEntry && (
        <AdminDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  )
}

export default Admin
