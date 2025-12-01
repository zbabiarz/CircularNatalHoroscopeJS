import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Form from '../components/Form'
import { calculateChironData } from '../utils/astroUtils'

function Home() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    
    try {
      const result = await calculateChironData(formData)
      
      try {
        await fetch('https://n8n.yourdomain.com/webhook/chiron_shadow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result)
        })
      } catch (webhookError) {
        console.warn('Webhook error:', webhookError)
      }
      
      const params = new URLSearchParams({
        shadowId: result.shadowId,
        name: result.name,
        chironSign: result.chironSign,
        chironHouse: result.chironHouse || '',
        chironDegree: result.chironDegree || ''
      })
      
      navigate(`/result?${params.toString()}`)
    } catch (error) {
      console.error('Error:', error)
      alert('There was an error calculating your Chiron placement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 fade-in">
          <div className="flex justify-center mb-4">
            <div className="text-6xl shimmer">✨</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-brown mb-4">
            Shadow Work Astro Quiz
          </h1>
          <p className="text-lg text-brown/80">
            Discover your Chiron placement and unlock deeper insights into your healing journey
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-rose/30">
          <Form onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
        
        <footer className="mt-8 text-center text-sm text-brown/60">
          This insight is intended to support your personal growth and healing journey.
        </footer>
      </div>
    </div>
  )
}

export default Home