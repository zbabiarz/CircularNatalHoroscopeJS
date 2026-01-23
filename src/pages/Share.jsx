import React, { useState } from 'react'
import ShareModal from '../components/ShareModal'
import SparkleImage from '../components/SparkleImage'
import TurbulentFlow from '../components/ui/turbulent-flow'

function Share() {
  const [isModalOpen, setIsModalOpen] = useState(true)

  return (
    <>
      <TurbulentFlow />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8 fade-in">
            <div className="backdrop-blur-md bg-black/40 rounded-2xl p-8 border border-white/10">
              <div className="flex justify-center mb-6">
                <SparkleImage
                  src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613e8dcef1017f2aad7c2f.png"
                  alt="Shadow Work Astro"
                  className="w-16 h-16 md:w-20 md:h-20"
                />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)' }}>
                Share the Shadow Work Magic
              </h1>
              <p className="text-lg text-white/90 leading-relaxed mb-6" style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)' }}>
                Help others discover their deepest wounds and transform them into wisdom.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-magenta hover:bg-magenta/90 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Share Now
              </button>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl p-8 border border-rose/30">
            <h2 className="text-2xl font-bold mb-4 text-brown">About Shadow Work</h2>
            <p className="text-brown/80 leading-relaxed mb-4">
              Shadow work is the path to discovering and healing your deepest wounds. Using astrology and your Chiron placement, this tool reveals with shocking accuracy where you've been hurt and how to transform that pain into power.
            </p>
            <p className="text-brown/80 leading-relaxed">
              Your shadow is not something to fear - it's the key to your personal transformation. Share this experience with someone who's ready to embrace their healing journey.
            </p>
          </div>
        </div>
      </div>

      <ShareModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

export default Share
