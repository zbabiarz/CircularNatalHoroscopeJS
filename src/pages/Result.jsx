import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { shadowMap } from '../data/shadowMap'
import ReportFormatter from '../components/ReportFormatter'
import SparkleImage from '../components/SparkleImage'
import TurbulentFlow from '../components/ui/turbulent-flow'
import { supabase } from '../lib/supabase'

function Result() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [aiReport, setAiReport] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfSentToWebhook, setPdfSentToWebhook] = useState(false)
  const pdfContentRef = useRef(null)

  const name = searchParams.get('name')
  const email = searchParams.get('email')
  const chironSign = searchParams.get('chironSign')
  const chironHouse = searchParams.get('chironHouse')
  const chironDegree = searchParams.get('chironDegree')
  const shadowId = searchParams.get('shadowId')
  const resultId = searchParams.get('resultId')

  const [reportStatus, setReportStatus] = useState('pending')
  const [isLoadingReport, setIsLoadingReport] = useState(true)

  const shadowData = shadowMap[shadowId] || {
    archetype: 'Unknown',
    description: 'We could not determine your shadow at this time.'
  }

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)

    const loadReport = async () => {
      const storedReport = localStorage.getItem('aiReport')
      if (storedReport && storedReport.length > 100) {
        setAiReport(storedReport)
        setReportStatus('completed')
        setIsLoadingReport(false)
        localStorage.removeItem('aiReport')
        return
      }

      if (resultId) {
        try {
          const { data, error } = await supabase
            .from('shadow_work_results')
            .select('ai_report, ai_report_status, ai_report_error')
            .eq('id', resultId)
            .single()

          if (!error && data) {
            if (data.ai_report) {
              setAiReport(data.ai_report)
              setReportStatus(data.ai_report_status || 'completed')
              setIsLoadingReport(false)
            } else if (data.ai_report_status === 'failed') {
              setReportStatus('failed')
              setIsLoadingReport(false)
            } else {
              setReportStatus(data.ai_report_status || 'pending')
              setIsLoadingReport(true)

              setTimeout(() => {
                setIsLoadingReport(false)
                setReportStatus('timeout')
              }, 30000)
            }
          } else {
            setIsLoadingReport(false)
          }
        } catch (err) {
          console.error('Error loading report from database:', err)
          setIsLoadingReport(false)
        }
      } else {
        setIsLoadingReport(false)
      }
    }

    loadReport()
  }, [])

  useEffect(() => {
    if (!resultId || !isLoadingReport || reportStatus !== 'pending') {
      return
    }

    let attempts = 0
    const maxAttempts = 10

    const pollInterval = setInterval(async () => {
      attempts++

      if (attempts >= maxAttempts) {
        setIsLoadingReport(false)
        setReportStatus('timeout')
        clearInterval(pollInterval)
        return
      }

      try {
        const { data, error } = await supabase
          .from('shadow_work_results')
          .select('ai_report, ai_report_status, ai_report_error')
          .eq('id', resultId)
          .single()

        if (!error && data) {
          if (data.ai_report) {
            setAiReport(data.ai_report)
            setReportStatus(data.ai_report_status || 'completed')
            setIsLoadingReport(false)
          } else if (data.ai_report_status === 'failed') {
            setReportStatus('failed')
            setIsLoadingReport(false)
          } else if (data.ai_report_status !== 'pending') {
            setReportStatus(data.ai_report_status)
            setIsLoadingReport(false)
          }
        }
      } catch (err) {
        console.error('Error polling report status:', err)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [resultId, isLoadingReport, reportStatus])

  useEffect(() => {
    if (aiReport && !pdfSentToWebhook && isVisible && !isLoadingReport) {
      const sendPdfToWebhook = async () => {
        try {
          console.log('Starting PDF generation for webhook...')
          await new Promise(resolve => setTimeout(resolve, 2000))

          console.log('Calling generate-pdf Edge Function...')
          const pdfApiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`
          const pdfResponse = await fetch(pdfApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              name: name,
              chironSign: chironSign,
              chironHouse: chironHouse,
              chironDegree: parseFloat(chironDegree),
              archetype: shadowData.archetype,
              report: aiReport
            })
          })

          if (!pdfResponse.ok) {
            throw new Error(`PDF generation failed: ${await pdfResponse.text()}`)
          }

          const { url: publicUrl, fileName } = await pdfResponse.json()
          console.log('PDF generated successfully:', publicUrl)

          console.log('Sending PDF URL to webhook...')
          const webhookApiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-pdf-webhook`
          const webhookResponse = await fetch(webhookApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              type: 'pdf_report',
              name: name,
              email: email,
              chironSign: chironSign,
              chironHouse: chironHouse,
              chironDegree: chironDegree,
              shadowId: shadowId,
              pdfUrl: publicUrl,
              filename: fileName,
              timestamp: new Date().toISOString()
            })
          })

          if (webhookResponse.ok) {
            console.log('PDF URL successfully sent to webhook')
            setPdfSentToWebhook(true)
          } else {
            console.error('Webhook response not OK:', webhookResponse.status, await webhookResponse.text())
          }
        } catch (error) {
          console.error('Error in PDF generation/sending process:', error)
        }
      }

      sendPdfToWebhook()
    }
  }, [aiReport, isVisible, pdfSentToWebhook, isLoadingReport, name, email, chironSign, chironHouse, chironDegree, shadowId, shadowData.archetype])

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true)

    try {
      console.log('Calling generate-pdf Edge Function...')
      const pdfApiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`
      const pdfResponse = await fetch(pdfApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          name: name,
          chironSign: chironSign,
          chironHouse: chironHouse,
          chironDegree: parseFloat(chironDegree),
          archetype: shadowData.archetype,
          report: aiReport || shadowData.description
        })
      })

      if (!pdfResponse.ok) {
        throw new Error(`PDF generation failed: ${await pdfResponse.text()}`)
      }

      const { url: pdfUrl } = await pdfResponse.json()
      console.log('PDF generated successfully:', pdfUrl)

      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${name.replace(/\s+/g, '-')}-chiron-shadow-report.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('There was an error generating the PDF. Please try again.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <>
      <TurbulentFlow />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      <div className="max-w-3xl w-full">
        <div ref={pdfContentRef} className="pdf-content">
          <div className={`text-center mb-8 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <div className="flex justify-center mb-4">
              <SparkleImage
                src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613e8dcef1017f2aad7c2f.png"
                alt="Shadow Work Astro Quiz Logo"
                className="w-32 h-32"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)' }}>
              {name}'s Chiron Shadow
            </h1>
            <p className="text-xl text-white font-semibold" style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)' }}>
              {shadowData.archetype.startsWith('The ') ? shadowData.archetype : `The ${shadowData.archetype}`}
            </p>
            <div className="mt-4 text-white/90" style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)' }}>
              <p className="text-base">
                Chiron in {chironSign}
                {chironHouse && chironHouse !== 'Unknown' && ` in the ${chironHouse}`}
                {chironDegree && ` at ${parseFloat(chironDegree).toFixed(2)}°`}
              </p>
            </div>
          </div>

          <div className={`bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-rose/30 mb-6 transition-all duration-800 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <div className="max-w-none">
              {isLoadingReport ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-magenta mb-4"></div>
                  <p className="text-brown/80 text-lg mb-2">Generating your personalized report...</p>
                  <p className="text-brown/60 text-sm">This may take up to 30 seconds</p>
                </div>
              ) : aiReport ? (
                <ReportFormatter report={aiReport} />
              ) : (
                <p className="text-brown/90 leading-relaxed whitespace-pre-line">
                  {shadowData.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={`flex gap-4 justify-center flex-wrap transition-all duration-800 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf || isLoadingReport}
            className="bg-rose hover:bg-rose/90 text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          >
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-magenta hover:bg-magenta/90 text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Continue Your Healing Journey
          </button>
        </div>

        <div className={`mt-10 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 text-center transition-all duration-800 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <p className="text-white mb-4 text-lg" style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)' }}>
            Want to dive deeper into your shadow work journey?
          </p>
          <p className="text-white font-semibold mb-6 text-xl" style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)' }}>
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

        <footer className="mt-8 text-center text-sm text-white/70" style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)' }}>
          This insight is intended to support your personal growth and healing journey.
        </footer>
      </div>
    </div>
    </>
  )
}

export default Result