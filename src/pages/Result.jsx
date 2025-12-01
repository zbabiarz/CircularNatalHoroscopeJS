import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { shadowMap } from '../data/shadowMap'

function Result() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <div className={`text-center mb-8 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="flex justify-center mb-4">
            <div className="text-6xl shimmer">🌙</div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brown mb-2">
            {name}'s Chiron Shadow
          </h1>
          <p className="text-xl text-magenta font-semibold">
            The {shadowData.archetype}
          </p>
        </div>
        
        <div className={`bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-rose/30 mb-6 transition-all duration-800 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-rose/30">
            <div className="text-center">
              <p className="text-sm text-brown/60 mb-1">Chiron Sign</p>
              <p className="text-2xl font-bold text-magenta">{chironSign}</p>
            </div>
            {chironHouse && (
              <div className="text-center">
                <p className="text-sm text-brown/60 mb-1">Chiron House</p>
                <p className="text-2xl font-bold text-magenta">{chironHouse}</p>
              </div>
            )}
            {chironDegree && (
              <div className="text-center md:col-span-2">
                <p className="text-sm text-brown/60 mb-1">Chiron Degree</p>
                <p className="text-lg font-semibold text-brown">{parseFloat(chironDegree).toFixed(2)}°</p>
              </div>
            )}
          </div>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-brown/90 leading-relaxed whitespace-pre-line">
              {shadowData.description}
            </p>
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
        
        <footer className="mt-8 text-center text-sm text-brown/60">
          This insight is intended to support your personal growth and healing journey.
        </footer>
      </div>
    </div>
  )
}

export default Result