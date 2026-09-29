import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function AdminLogin({ onAuthenticated }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [checking, setChecking] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!passcode || checking) return

    setChecking(true)
    setError(false)

    // The passcode is never compared in the browser. The server verifies it and
    // simply refuses to return any data when it does not match.
    const { error: rpcError } = await supabase.rpc('admin_count_results', {
      p_passcode: passcode,
      p_sign_filter: null,
    })

    setChecking(false)

    if (rpcError) {
      setError(true)
      setShake(true)
      setTimeout(() => {
        setPasscode('')
        setShake(false)
        setError(false)
        inputRef.current?.focus()
      }, 900)
      return
    }

    setGlowing(true)
    setTimeout(() => {
      sessionStorage.setItem('admin_passcode', passcode)
      onAuthenticated(passcode)
    }, 400)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at center top, #2a0f1a 0%, #1a0a10 40%, #0d0608 100%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              background: i % 3 === 0 ? '#c6beba' : i % 3 === 1 ? '#8d1246' : '#f9f2eb',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.6 + 0.2,
              animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: Math.random() * 3 + 's',
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(141,18,70,0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        <div
          className={`relative rounded-3xl p-8 text-center transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(198,190,186,0.12)',
            backdropFilter: 'blur(20px)',
            boxShadow: glowing
              ? '0 0 60px rgba(141,18,70,0.6), 0 0 120px rgba(141,18,70,0.3), inset 0 0 40px rgba(141,18,70,0.1)'
              : '0 0 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            transition: 'box-shadow 0.5s ease',
          }}
        >
          <div className="mb-8">
            <div
              className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center relative"
              style={{
                background: 'radial-gradient(circle, rgba(141,18,70,0.25) 0%, rgba(141,18,70,0.05) 100%)',
                border: '1px solid rgba(141,18,70,0.4)',
                boxShadow: '0 0 20px rgba(141,18,70,0.3)',
              }}
            >
              <svg
                className="w-9 h-9"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#c6beba' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{
                fontFamily: "'Cinzel', serif",
                color: '#f9f2eb',
                letterSpacing: '0.08em',
              }}
            >
              Sacred Access
            </h1>
            <p style={{ color: 'rgba(198,190,186,0.5)', fontSize: '0.8rem', letterSpacing: '0.12em' }}>
              ENTER YOUR CODE
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="password"
              autoComplete="current-password"
              value={passcode}
              onChange={(e) => { setPasscode(e.target.value); setError(false) }}
              placeholder="••••••••••"
              className="w-full text-center text-lg font-mono px-4 py-3 mb-6 rounded-xl outline-none transition-all duration-200"
              style={{
                background: passcode ? 'rgba(141,18,70,0.15)' : 'rgba(255,255,255,0.04)',
                border: error
                  ? '1px solid rgba(220,38,38,0.6)'
                  : passcode
                    ? '1px solid rgba(141,18,70,0.6)'
                    : '1px solid rgba(198,190,186,0.12)',
                color: '#f9f2eb',
                boxShadow: passcode ? '0 0 12px rgba(141,18,70,0.2)' : 'none',
              }}
            />

            {error && (
              <p
                className="text-xs mb-4"
                style={{ color: 'rgba(248,113,113,0.8)', letterSpacing: '0.1em' }}
              >
                INCORRECT CODE
              </p>
            )}

            <button
              type="submit"
              disabled={!passcode || checking}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                fontFamily: "'Cinzel', serif",
                letterSpacing: '0.1em',
                background: passcode
                  ? 'linear-gradient(135deg, #8d1246 0%, #c6beba22 100%)'
                  : 'rgba(141,18,70,0.15)',
                border: '1px solid rgba(141,18,70,0.5)',
                color: '#f9f2eb',
                boxShadow: passcode ? '0 0 20px rgba(141,18,70,0.3)' : 'none',
              }}
            >
              {checking ? 'Checking…' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
