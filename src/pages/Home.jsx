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
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1 }} />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 px-2">
            <div className="rounded-2xl overflow-hidden p-3" style={{ background: 'rgba(30,30,35,0.7)' }}>
              <img
                src="https://assets.cdn.filesafe.space/KQwViSotgXlhDFQY6Xfg/media/6a236520e8bb5ac427f064ac.png"
                alt="Testimonial"
                className="rounded-lg w-full"
              />
            </div>
            <div className="rounded-2xl overflow-hidden p-3" style={{ background: 'rgba(30,30,35,0.7)' }}>
              <img
                src="https://assets.cdn.filesafe.space/KQwViSotgXlhDFQY6Xfg/media/6a236520f607d4002b9b5de6.png"
                alt="Testimonial"
                className="rounded-lg w-full"
              />
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
