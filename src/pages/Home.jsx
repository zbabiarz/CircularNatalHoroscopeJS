import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Form from '../components/Form'
import { calculateChironData } from '../utils/astroUtils'
import { supabase } from '../lib/supabase'

function Home() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)

    try {
      const result = await calculateChironData(formData)

      let aiReport = ''

      try {
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
            })
          }
        )

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
        await fetch('https://n8n.yourdomain.com/webhook/chiron_shadow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result)
        })
      } catch (webhookError) {
        console.warn('Webhook error:', webhookError)
      }

      localStorage.setItem('aiReport', aiReport)

      const params = new URLSearchParams({
        shadowId: result.shadowId,
        name: result.name,
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 fade-in">
          <div className="flex justify-center mb-4">
            <img
              src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/692dea5973043ab3e50866e2.png"
              alt="Shadow Work Astro Quiz Logo"
              className="w-16 h-16 shimmer"
            />
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