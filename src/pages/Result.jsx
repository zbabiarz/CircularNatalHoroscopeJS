import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { shadowMap } from '../data/shadowMap'
import SparkleImage from '../components/SparkleImage'
import TurbulentFlow from '../components/ui/turbulent-flow'
import ShareModal from '../components/ShareModal'

const STRIPE_LINK = 'https://buy.stripe.com/8x23cn9tVerAcRF3Ef7ok02'

function Result() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

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
  }, [])

  if (!name || !shadowId) {
    return (
      <>
        <TurbulentFlow />
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative" style={{ zIndex: 2 }}>
          <div className="text-center">
            <p className="text-white/70 text-lg mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              No results found. Run your birth chart first.
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:scale-105"
              style={{ background: '#c3cd42', color: '#1E2220', fontFamily: "'Montserrat', sans-serif" }}
            >
              Run Your Chart
            </button>
          </div>
        </div>
      </>
    )
  }

  const archetypeName = shadowData.archetype.startsWith('The ')
    ? shadowData.archetype
    : `The ${shadowData.archetype}`

  return (
    <>
      <TurbulentFlow />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1 }} />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative" style={{ zIndex: 2 }}>
        <div className="max-w-2xl w-full">

          <div className={`text-center mb-8 rounded-2xl p-8 md:p-10 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(195,205,66,0.2)' }}>
            <div className="flex justify-center mb-5">
              <SparkleImage
                src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613e8dcef1017f2aad7c2f.png"
                alt="Your Shadow Map"
                className="w-24 h-24"
              />
            </div>

            <p className="text-sm font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: '#c3cd42', fontFamily: "'Montserrat', sans-serif" }}>
              Your Shadow Map
            </p>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {name}
            </h1>

            <p className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#c3cd42', fontFamily: "'Montserrat', sans-serif" }}>
              {archetypeName}
            </p>

            <div className="inline-block rounded-xl px-6 py-4 mb-6" style={{ background: 'rgba(195,205,66,0.08)', border: '1px solid rgba(195,205,66,0.15)' }}>
              <p className="text-white/90 text-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Chiron in <span className="font-semibold text-white">{chironSign}</span>
                {chironHouse && chironHouse !== 'Unknown' && (
                  <> in the <span className="font-semibold text-white">{chironHouse}</span></>
                )}
                {chironDegree && (
                  <> at <span className="font-semibold text-white">{parseFloat(chironDegree).toFixed(1)}°</span></>
                )}
              </p>
            </div>

            <p className="text-white/70 text-base leading-relaxed max-w-lg mx-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {shadowData.description}
            </p>
          </div>

          <div className={`rounded-2xl p-8 md:p-10 mb-8 text-center transition-all duration-800 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(195,205,66,0.2)' }}>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              This is just the surface.
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-4 max-w-lg mx-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Your Chiron placement reveals the deepest shadow pattern running your entire life — your relationships, your career, your money, your body, all of it.
            </p>
            <p className="text-white/70 text-base leading-relaxed mb-8 max-w-lg mx-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Get your full 26-page Shadow Map and see exactly how this wound has been operating behind the scenes — and how to flip it into the thing that actually gives you your edge.
            </p>

            <div className="space-y-3 mb-8 max-w-sm mx-auto text-left">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0" style={{ color: '#c3cd42' }}>&#10022;</span>
                <p className="text-white/80 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  How your wound shows up in relationships, career, money, and your body
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0" style={{ color: '#c3cd42' }}>&#10022;</span>
                <p className="text-white/80 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  The protection patterns you built (and why they're keeping you stuck)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0" style={{ color: '#c3cd42' }}>&#10022;</span>
                <p className="text-white/80 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Your hidden superpower and how to actually use it
                </p>
              </div>
            </div>

            <a
              href={STRIPE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-bold tracking-wide px-10 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 text-lg"
              style={{ background: '#c3cd42', color: '#1E2220', fontFamily: "'Montserrat', sans-serif" }}
            >
              Get Your Full Shadow Map — $37
            </a>

            <p className="text-white/40 mt-4 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              26-page personalized deep dive delivered to your inbox
            </p>
          </div>

          <div className={`flex gap-4 justify-center flex-wrap transition-all duration-800 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', fontFamily: "'Montserrat', sans-serif" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Your Placement
            </button>
          </div>

          <div className={`mt-10 text-center transition-all duration-800 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-white/40 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Questions? Email{' '}
              <a href="mailto:magic@lovelightandblackholes.com" className="transition-colors hover:text-white/60" style={{ color: '#c3cd42' }}>
                magic@lovelightandblackholes.com
              </a>
            </p>
          </div>

          <footer className="mt-6 text-center text-sm text-white/40" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            This insight is intended to support your personal growth.
          </footer>
        </div>
      </div>

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
    </>
  )
}

export default Result
