import React, { useState } from 'react'

const PASSCODE = '7777'

function AdminLogin({ onAuthenticated }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code === PASSCODE) {
      sessionStorage.setItem('admin_authenticated', 'true')
      onAuthenticated()
    } else {
      setError('Incorrect code')
      setShake(true)
      setCode('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCode(val)
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className={`bg-white rounded-2xl shadow-lg p-8 text-center transition-transform ${shake ? 'animate-shake' : ''}`}>
          <div className="w-16 h-16 bg-brown/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brown mb-2">Admin Access</h1>
          <p className="text-brown/60 text-sm mb-6">Enter your 4-digit access code</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={handleChange}
              placeholder="----"
              className="w-full text-center text-3xl tracking-[0.5em] font-mono py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-brown focus:outline-none transition-colors bg-gray-50"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-3">{error}</p>
            )}
            <button
              type="submit"
              disabled={code.length !== 4}
              className="w-full mt-6 bg-brown hover:bg-brown/90 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
