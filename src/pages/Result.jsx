import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { shadowMap } from '../data/shadowMap'
import ReportFormatter from '../components/ReportFormatter'
import SparkleImage from '../components/SparkleImage'
import TurbulentFlow from '../components/ui/turbulent-flow'
import ShareModal from '../components/ShareModal'
import { supabase } from '../lib/supabase'

function Result() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [aiReport, setAiReport] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfSentToWebhook, setPdfSentToWebhook] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
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
          await new Promise(resolve => setTimeout(resolve, 2000))

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
            setPdfSentToWebhook(true)
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
            <div className={`text-center mb-8 rounded-2xl p-8 transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(67,126,120,0.3)' }}>
              <div className="flex justify-center mb-4">
                <SparkleImage
                  src="https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613e8dcef1017f2aad7c2f.png"
                  alt="Shadow Work Astro Quiz Logo"
                  className="w-32 h-32"
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {name}'s Chiron Shadow
              </h1>
              <p className="text-xl font-semibold" style={{ color: '#437e78', fontFamily: "'Montserrat', sans-serif" }}>
                {shadowData.archetype.startsWith('The ') ? shadowData.archetype : `The ${shadowData.archetype}`}
              </p>
              <div className="mt-4 text-white/70" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <p className="text-base">
                  Chiron in {chironSign}
                  {chironHouse && chironHouse !== 'Unknown' && ` in the ${chironHouse}`}
                  {chironDegree && ` at ${parseFloat(chironDegree).toFixed(2)}`}
                </p>
              </div>
            </div>

            <div className={`rounded-2xl shadow-xl p-8 md:p-10 mb-6 transition-all duration-800 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(67,126,120,0.25)', backdropFilter: 'blur(12px)' }}>
              <div className="max-w-none">
                {isLoadingReport ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mb-4" style={{ borderColor: '#437e78' }}></div>
                    <p className="text-white/70 text-lg mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>Generating your personalized report...</p>
                    <p className="text-white/40 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>This may take up to 30 seconds</p>
                  </div>
                ) : aiReport ? (
                  <ReportFormatter report={aiReport} />
                ) : (
                  <p className="text-white/80 leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Montserrat', sans-serif" }}>
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
              className="text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              style={{ background: '#437e78', fontFamily: "'Montserrat', sans-serif" }}
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
              onClick={() => setIsShareModalOpen(true)}
              className="text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', fontFamily: "'Montserrat', sans-serif" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>

          <div className={`mt-10 rounded-2xl shadow-xl p-8 md:p-10 text-center transition-all duration-800 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(67,126,120,0.25)' }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              ok. so now what?
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              I'm not going to rock your world with all this info and leave you hanging. I gotchu!
            </p>
            <p className="text-white/70 text-base leading-relaxed mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Knowing your wound doesn't heal it. Understanding your pattern doesn't stop you from running it.
            </p>
            <p className="text-white/70 text-base leading-relaxed mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Wound to Wisdom is the "what do I actually DO with this" part that I created just for you to make sense of all of this. It's time to turn this lifetime of pain into the thing that actually gives you your edge.
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-base" style={{ color: '#437e78', fontFamily: "'Montserrat', sans-serif" }}>
                &#10022; 3 short, potent lessons
              </p>
              <p className="text-base" style={{ color: '#437e78', fontFamily: "'Montserrat', sans-serif" }}>
                &#10022; the practice, not more information
              </p>
              <p className="text-base" style={{ color: '#437e78', fontFamily: "'Montserrat', sans-serif" }}>
                &#10022; start today for just $37 w/ lifetime access
              </p>
            </div>
            <p className="text-white/70 text-base leading-relaxed mb-8" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              It's about damn time you put this pattern out to pasture to see just how good it can get!
            </p>
            <div className="mb-8">
              <a
                href="https://lovelightandblackholes.com/wound-to-wisdom"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-white font-bold tracking-wide px-10 py-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 text-base"
                style={{ background: '#437e78', fontFamily: "'Montserrat', sans-serif" }}
              >
                I'm ready to go deeper
              </a>
            </div>
            <p className="text-white/50 mt-6 text-sm leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              You've got mail! This report will be emailed to you as a PDF so you can keep it forever.
            </p>
            <p className="text-white/40 mt-4 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Questions? Email me at{' '}
              <a href="mailto:magic@lovelightandblackholes.com" className="transition-colors" style={{ color: '#437e78' }}>
                magic@lovelightandblackholes.com
              </a>
            </p>
          </div>

          <footer className="mt-8 text-center text-sm text-white/40" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            This insight is intended to support your personal growth and healing journey.
          </footer>
        </div>
      </div>

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
    </>
  )
}

export default Result
