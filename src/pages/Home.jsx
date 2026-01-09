import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Form from '../components/Form'
import MysticalLoader from '../components/MysticalLoader'
import SparkleImage from '../components/SparkleImage'
import { GradientMesh } from '../components/ui/gradient-mesh'
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
      <div className="fixed inset-0 -z-10">
        <GradientMesh
          colors={["#8d1246", "#c6beba", "#382a25"]}
          distortion={4}
          swirl={0.3}
          speed={0.5}
          waveAmp={0.08}
          waveFreq={8}
          waveSpeed={0.15}
          grain={0.04}
        />
      </div>
      {isSubmitting && <MysticalLoader />}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="max-w-2xl w-full">
        <div className="text-center mb-8 fade-in">
          <div className="backdrop-blur-md bg-black/40 rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex justify-center mb-6">
              <SparkleImage
                src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613e8dcef1017f2aad7c2f.png"
                alt="Shadow Work Astro"
                className="w-32 h-32 md:w-40 md:h-40"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)' }}>
              Shadow Work Astro Reading
            </h1>
            <p className="text-lg text-white" style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)' }}>
              Discover your Chiron placement and unlock deeper insights into your healing journey
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-rose/30">
          <Form onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>

        <footer className="mt-8 text-center text-sm backdrop-blur-md bg-black/40 rounded-xl p-4 border border-white/10">
          <span className="text-white" style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)' }}>
            This insight is intended to support your personal growth and healing journey.
          </span>
        </footer>
      </div>
    </div>
    </>
  )
}

export default Home