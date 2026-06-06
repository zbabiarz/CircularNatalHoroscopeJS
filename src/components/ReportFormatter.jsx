import React, { useState } from 'react'

function ReportFormatter({ report }) {
  const [expandedSections, setExpandedSections] = useState({})
  const [sparkles, setSparkles] = useState({})

  const formatReport = (text) => {
    const lines = text.split('\n')
    const sections = []
    let currentSection = null

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      const headerMatch = trimmedLine.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/)

      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection)
        }

        const title = headerMatch[1].trim()
        const inlineContent = headerMatch[2].trim()

        currentSection = {
          title,
          content: inlineContent ? [inlineContent] : [],
          type: getSectionType(title)
        }
      } else if (trimmedLine && currentSection) {
        currentSection.content.push(trimmedLine)
      } else if (trimmedLine && !currentSection) {
        sections.push({
          title: null,
          content: [trimmedLine],
          type: 'intro'
        })
      }
    })

    if (currentSection) {
      sections.push(currentSection)
    }

    return sections
  }

  const getSectionType = (title) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('archetype')) return 'archetype'
    if (lowerTitle.includes('theme')) return 'theme'
    if (lowerTitle.includes("chiron's story")) return 'chiron'
    if (lowerTitle.includes('core wound')) return 'wound'
    if (lowerTitle.includes('how it feels')) return 'feels'
    if (lowerTitle.includes('shadow pattern')) return 'shadow'
    if (lowerTitle.includes('medicine')) return 'medicine'
    if (lowerTitle.includes('invitation')) return 'invitation'
    if (lowerTitle.includes('journal') || lowerTitle.includes('reflection')) return 'prompts'
    return 'default'
  }

  const isCollapsible = (type) => {
    return !['archetype', 'theme', 'intro', 'default'].includes(type)
  }

  const toggleSection = (index) => {
    const isExpanding = !expandedSections[index]

    setExpandedSections(prev => ({
      ...prev,
      [index]: isExpanding
    }))

    if (isExpanding) {
      setSparkles(prev => ({ ...prev, [index]: true }))
      setTimeout(() => {
        setSparkles(prev => ({ ...prev, [index]: false }))
      }, 1200)
    }
  }

  const getSectionStyle = (type) => {
    const tealBase = 'rgba(67,126,120,'
    const styles = {
      intro: {
        bg: `bg-gradient-to-r from-[${tealBase}0.08)] to-transparent`,
        border: `border-l-4`,
        borderColor: `${tealBase}0.3)`,
        titleColor: 'text-white',
        textColor: 'text-white/80'
      },
      archetype: {
        bg: '',
        border: 'border-l-4',
        borderColor: '#437e78',
        titleColor: '',
        textColor: 'text-white/80'
      },
      theme: {
        bg: '',
        border: 'border-l-4',
        borderColor: `${tealBase}0.6)`,
        titleColor: '',
        textColor: 'text-white/80'
      },
      default: {
        bg: '',
        border: 'border-l-4',
        borderColor: `${tealBase}0.2)`,
        titleColor: 'text-white',
        textColor: 'text-white/80'
      }
    }
    return styles[type] || styles.default
  }

  const allSections = formatReport(report)
  const sections = allSections.filter(s => !['medicine', 'invitation', 'prompts'].includes(s.type))

  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        const style = getSectionStyle(section.type)
        const collapsible = isCollapsible(section.type)
        const isExpanded = expandedSections[index]
        const showSparkles = sparkles[index]

        return (
          <div
            key={index}
            className={`rounded-lg transition-all duration-300 ${collapsible ? 'cursor-pointer' : ''} pdf-section mb-6`}
            style={{
              background: 'rgba(10,10,15,0.75)',
              borderLeft: `4px solid ${style.borderColor || 'rgba(67,126,120,0.2)'}`,
            }}
          >
            {section.title && (
              <div
                onClick={() => collapsible && toggleSection(index)}
                data-collapsible-header={collapsible ? 'true' : undefined}
                data-expanded={collapsible ? (isExpanded ? 'true' : 'false') : undefined}
                className={`p-6 ${collapsible && !isExpanded ? 'pb-6' : 'pb-2'} ${collapsible ? 'hover:opacity-80' : ''}`}
              >
                <h3 className="text-xl md:text-2xl font-bold flex items-center justify-between gap-2" style={{ color: '#437e78', fontFamily: "'Montserrat', sans-serif" }}>
                  <span>{section.title}</span>
                  {collapsible && (
                    <span className="relative flex-shrink-0 print:hidden" style={{ filter: 'drop-shadow(0 0 6px rgba(67,126,120,0.7)) drop-shadow(0 0 12px rgba(67,126,120,0.4))' }}>
                      <svg
                        className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'animate-pulse'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: '#5fb8ae' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  )}
                </h3>
              </div>
            )}

            <div
              className={`overflow-hidden transition-all duration-500 ${
                !collapsible || isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className={`px-6 pb-6 space-y-4 leading-relaxed relative ${showSparkles ? 'sparkle-reveal' : ''}`} style={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'Montserrat', sans-serif" }}>
                {showSparkles && (
                  <>
                    <div className="sparkle sparkle-1" style={{ top: '10%', left: '15%', color: '#437e78' }}>*</div>
                    <div className="sparkle sparkle-2" style={{ top: '30%', right: '20%', color: '#437e78' }}>*</div>
                    <div className="sparkle sparkle-3" style={{ top: '50%', left: '10%', color: '#437e78' }}>*</div>
                    <div className="sparkle sparkle-4" style={{ top: '70%', right: '15%', color: '#437e78' }}>*</div>
                  </>
                )}
                {section.content.map((paragraph, pIndex) => {
                  if (paragraph.startsWith('-')) {
                    return (
                      <div key={pIndex} className="flex gap-3 items-start">
                        <span className="mt-1 flex-shrink-0" style={{ color: '#437e78' }}>&#8226;</span>
                        <p className="flex-1">{paragraph.substring(1).trim()}</p>
                      </div>
                    )
                  }
                  return <p key={pIndex} className="text-base md:text-lg">{paragraph}</p>
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ReportFormatter
