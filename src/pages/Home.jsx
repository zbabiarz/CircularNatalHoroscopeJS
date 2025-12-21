import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Form from '../components/Form'
import MysticalLoader from '../components/MysticalLoader'
import { calculateChironData } from '../utils/astroUtils'
import { supabase } from '../lib/supabase'

function Home() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Calculating your celestial coordinates...')

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    setLoadingMessage('Calculating your celestial coordinates...')

    try {
      const result = await calculateChironData(formData)

      setLoadingMessage('Channeling your personalized shadow wisdom...')

      let aiReport = ''

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000)

        const reportResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: result.name,
              chironSign: result.chironSign,
              chironHouse: result.chironHouse,
              chironDegree: result.chironDegree
            }),
            signal: controller.signal
          }
        )

        clearTimeout(timeoutId)

        if (reportResponse.ok) {
          const reportData = await reportResponse.json()
          aiReport = reportData.report
        } else {
          console.error('Failed to generate AI report:', await reportResponse.text())
        }
      } catch (reportError) {
        console.error('Error generating AI report:', reportError)
      }

      const { error: dbError } = await supabase
        .from('shadow_work_results')
        .insert({
          name: result.name,
          email: result.email,
          birth_date: formData.birthDate,
          birth_time: formData.birthTime || null,
          birth_location: formData.birthLocation || null,
          chiron_sign: result.chironSign,
          chiron_degree: result.chironDegree,
          chiron_house: result.chironHouse === 'Unknown' ? null : result.chironHouse,
          shadow_id: result.shadowId,
          shadow_text: result.shadowText
        })

      if (dbError) {
        console.error('Database error:', dbError)
      }

      try {
        await fetch('https://effortlessai.app.n8n.cloud/webhook-test/475b8845-0604-47ab-af7e-fe011922dcdd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: result.name,
            email: result.email,
            birthDate: formData.birthDate,
            birthTime: formData.birthTime || null,
            birthLocation: formData.birthLocation || null,
            birthCoordinates: formData.birthCoordinates || null,
            chironSign: result.chironSign,
            chironDegree: result.chironDegree,
            chironHouse: result.chironHouse,
            shadowId: result.shadowId,
            aiReport: aiReport,
            timestamp: new Date().toISOString()
          })
        })
      } catch (webhookError) {
        console.error('Webhook error:', webhookError)
      }

      localStorage.setItem('aiReport', aiReport)

      const params = new URLSearchParams({
        shadowId: result.shadowId,
        name: result.name,
        email: result.email,
        chironSign: result.chironSign,
        chironHouse: result.chironHouse,
        chironDegree: result.chironDegree
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
    <>
      {isSubmitting && <MysticalLoader message={loadingMessage} />}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
        <div className="text-center mb-8 fade-in">
          <div className="flex justify-center mb-4">
            <img
              src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/692dea5973043ab3e50866e2.png"
              alt="Shadow Work Astro Quiz Logo"
              className="w-32 h-32 shimmer"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 magical-title">
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
    </>
  )
}

export default Home