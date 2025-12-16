import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { shadowMap } from '../data/shadowMap'
import ReportFormatter from '../components/ReportFormatter'

function Result() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [aiReport, setAiReport] = useState('')

  const name = searchParams.get('name')
  const chironSign = searchParams.get('chironSign')
  const chironHouse = searchParams.get('chironHouse')
  const chironDegree = searchParams.get('chironDegree')
  const shadowId = searchParams.get('shadowId')

  const shadowData = shadowMap[shadowId] || {
    archetype: 'Unknown',
    description: 'We could not determine your shadow at this time.'
  }

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)

    const storedReport = localStorage.getItem('aiReport')
    if (storedReport) {
      setAiReport(storedReport)
      localStorage.removeItem('aiReport')
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <div className={`text-center mb-8 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="flex justify-center mb-4">
            <img
              src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/692dea5973043ab3e50866e2.png"
              alt="Shadow Work Astro Quiz Logo"
              className="w-32 h-32 shimmer"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brown mb-2">
            {name}'s Chiron Shadow
          </h1>
          <p className="text-xl text-magenta font-semibold">
            {shadowData.archetype.startsWith('The ') ? shadowData.archetype : `The ${shadowData.archetype}`}
          </p>
          <div className="mt-4 text-brown/70">
            <p className="text-base">
              Chiron in {chironSign}
              {chironHouse && chironHouse !== 'Unknown' && ` in the ${chironHouse}`}
              {chironDegree && ` at ${parseFloat(chironDegree).toFixed(2)}°`}
            </p>
          </div>
        </div>
        
        <div className={`bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-rose/30 mb-6 transition-all duration-800 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="max-w-none">
            {aiReport ? (
              <ReportFormatter report={aiReport} />
            ) : (
              <p className="text-brown/90 leading-relaxed whitespace-pre-line">
                {shadowData.description}
              </p>
            )}
          </div>
        </div>
        
        <div className={`text-center transition-all duration-800 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <button
            onClick={() => navigate('/')}
            className="bg-magenta hover:bg-magenta/90 text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Continue Your Healing Journey
          </button>
        </div>

        <div className={`mt-10 bg-gradient-to-br from-rose/20 to-magenta/10 rounded-2xl p-8 text-center transition-all duration-800 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <p className="text-brown/80 mb-4 text-lg">
            Want to dive deeper into your shadow work journey?
          </p>
          <p className="text-magenta font-semibold mb-6 text-xl">
            Follow Morgan for more insights
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <a
              href="https://www.instagram.com/morganlives"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-magenta hover:text-white text-magenta font-semibold px-6 py-3 rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@morganlives"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-magenta hover:text-white text-magenta font-semibold px-6 py-3 rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              TikTok
            </a>
            <a
              href="https://www.facebook.com/morganlives"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-magenta hover:text-white text-magenta font-semibold px-6 py-3 rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </a>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-brown/60">
          This insight is intended to support your personal growth and healing journey.
        </footer>
      </div>
    </div>
  )
}

export default Result