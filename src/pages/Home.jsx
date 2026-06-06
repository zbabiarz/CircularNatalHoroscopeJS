import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Form from '../components/Form'
import MysticalLoader from '../components/MysticalLoader'
import SparkleImage from '../components/SparkleImage'
import TurbulentFlow from '../components/ui/turbulent-flow'
import { calculateChironData } from '../utils/astroUtils'
import { supabase } from '../lib/supabase'

function Home() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)

    try {
      const result = await calculateChironData(formData)

      const { data: dbData, error: dbError } = await supabase
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
          shadow_text: result.shadowText,
          ai_report_status: 'pending'
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
      }

      const resultId = dbData?.id

      let aiReport = ''
      let reportStatus = 'pending'

      if (resultId) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 200000)

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
            reportStatus = reportData.status || 'completed'

            await supabase
              .from('shadow_work_results')
              .update({
                ai_report: aiReport,
                ai_report_status: reportStatus
              })
              .eq('id', resultId)
          } else {
            console.error('Failed to generate AI report:', await reportResponse.text())
            reportStatus = 'failed'

            await supabase
              .from('shadow_work_results')
              .update({
                ai_report_status: 'failed',
                ai_report_error: 'Failed to generate report'
              })
              .eq('id', resultId)
          }
        } catch (reportError) {
          console.error('Error generating AI report:', reportError)
          reportStatus = 'failed'

          await supabase
            .from('shadow_work_results')
            .update({
              ai_report_status: 'failed',
              ai_report_error: reportError.message || 'Unknown error'
            })
            .eq('id', resultId)
        }
      }

      try {
        const response = await fetch('https://effortlessai.app.n8n.cloud/webhook/475b8845-0604-47ab-af7e-fe011922dcdd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'form_submission',
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
            reportStatus: reportStatus,
            timestamp: new Date().toISOString()
          })
        })
        if (response.ok) {
          console.log('Form data successfully sent to webhook')
        } else {
          console.error('Webhook response not OK:', response.status)
        }
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
        chironDegree: result.chironDegree,
        resultId: resultId || ''
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
      <TurbulentFlow />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.20)', zIndex: 1 }} />
      {isSubmitting && <MysticalLoader />}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative" style={{ zIndex: 2 }}>
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8 fade-in">
            <div className="rounded-2xl p-6 md:p-8 mb-8">
              <div className="flex justify-center mb-6">
                <SparkleImage
                  src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613e8dcef1017f2aad7c2f.png"
                  alt="Shadow Work Astro"
                  className="w-16 h-16 md:w-20 md:h-20"
                />
              </div>
              <p className="text-sm font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#437e78' }}>
                Free Instant Report
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mb-5 text-white leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Your shadow has been in your birth chart this whole time!
              </h1>
              <p className="text-base text-white/90 leading-relaxed inline-block rounded-xl px-4 py-3" style={{ fontFamily: "'Montserrat', sans-serif", background: 'rgba(0,0,0,0.45)' }}>
                I'll tell you your deepest shadow and how it's run your whole life based on your Chiron placement. Eerily accurate. Totally liberating. Enter your birth info and let me blow your mind.
              </p>
            </div>
          </div>

          <div className="rounded-2xl shadow-xl p-8 md:p-10" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Form onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 px-2">
            <div className="relative pb-4">
              <div className="rounded-2xl p-4 shadow-lg" style={{ background: 'rgba(230,230,235,0.95)' }}>
                <p className="text-gray-800 text-[15px] leading-relaxed" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                  It was unbelievably accurate for me. The words and prompts were exactly what I needed right now in my shadow work journey like a smack in the face &#x1F610;
                </p>
                <div className="flex justify-end mt-1">
                  <span className="text-[11px]" style={{ color: '#8e8e93', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>10:41 AM</span>
                </div>
              </div>
              <div className="absolute -bottom-1 left-3 flex items-center rounded-full px-2 py-1 shadow-md" style={{ background: 'rgba(60,60,67,0.85)', border: '2px solid rgba(0,0,0,0.3)' }}>
                <span className="text-sm leading-none">&#x1F525;</span>
                <div className="w-5 h-5 rounded-full overflow-hidden ml-1">
                  <img
                    src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="relative pb-4">
              <div className="rounded-2xl p-4 shadow-lg" style={{ background: 'rgba(230,230,235,0.95)' }}>
                <p className="text-gray-800 text-[15px] leading-relaxed" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                  Holy shit Morgan this was so accurate that it made me cry!! It was beyond spot on
                </p>
                <div className="flex justify-end mt-1">
                  <span className="text-[11px]" style={{ color: '#8e8e93', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>09:42 AM</span>
                </div>
              </div>
              <div className="absolute -bottom-1 left-3 flex items-center rounded-full px-2 py-1 shadow-md" style={{ background: 'rgba(60,60,67,0.85)', border: '2px solid rgba(0,0,0,0.3)' }}>
                <span className="text-sm leading-none">&#x1F525;</span>
                <div className="w-5 h-5 rounded-full overflow-hidden ml-1">
                  <img
                    src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-6 text-center text-sm rounded-xl p-4">
            <span className="text-white/60" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              This insight is intended to support your personal growth and healing journey.
            </span>
          </footer>
        </div>
      </div>
    </>
  )
}

export default Home
