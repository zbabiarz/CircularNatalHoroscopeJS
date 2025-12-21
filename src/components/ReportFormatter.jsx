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
    const styles = {
      intro: {
        bg: 'bg-gradient-to-r from-magenta/5 to-rose/5',
        border: 'border-l-4 border-magenta/30',
        titleColor: 'text-brown',
        textColor: 'text-brown/90'
      },
      archetype: {
        bg: 'bg-gradient-to-r from-magenta/10 to-rose/10',
        border: 'border-l-4 border-magenta',
        titleColor: 'text-magenta',
        textColor: 'text-brown/90'
      },
      theme: {
        bg: 'bg-gradient-to-r from-rose/10 to-magenta/5',
        border: 'border-l-4 border-rose',
        titleColor: 'text-magenta',
        textColor: 'text-brown/90'
      },
      chiron: {
        bg: 'bg-gradient-to-r from-magenta/5 to-rose/10',
        border: 'border-l-4 border-magenta/40',
        titleColor: 'text-brown',
        textColor: 'text-brown/90'
      },
      wound: {
        bg: 'bg-gradient-to-r from-brown/5 to-rose/10',
        border: 'border-l-4 border-brown/40',
        titleColor: 'text-brown',
        textColor: 'text-brown/90'
      },
      feels: {
        bg: 'bg-gradient-to-r from-rose/10 to-brown/5',
        border: 'border-l-4 border-rose/50',
        titleColor: 'text-brown',
        textColor: 'text-brown/90'
      },
      shadow: {
        bg: 'bg-gradient-to-r from-brown/10 to-rose/5',
        border: 'border-l-4 border-brown/60',
        titleColor: 'text-brown',
        textColor: 'text-brown/90'
      },
      medicine: {
        bg: 'bg-gradient-to-r from-magenta/10 to-magenta/5',
        border: 'border-l-4 border-magenta',
        titleColor: 'text-magenta',
        textColor: 'text-brown/90'
      },
      invitation: {
        bg: 'bg-gradient-to-r from-rose/15 to-magenta/10',
        border: 'border-l-4 border-rose',
        titleColor: 'text-magenta',
        textColor: 'text-brown/90'
      },
      prompts: {
        bg: 'bg-gradient-to-r from-brown/5 to-brown/10',
        border: 'border-l-4 border-brown/50',
        titleColor: 'text-brown',
        textColor: 'text-brown/80'
      },
      default: {
        bg: 'bg-cream/30',
        border: 'border-l-4 border-rose/30',
        titleColor: 'text-brown',
        textColor: 'text-brown/90'
      }
    }
    return styles[type] || styles.default
  }

  const sections = formatReport(report)

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
            className={`${style.bg} ${style.border} rounded-lg transition-all duration-300 hover:shadow-md ${collapsible ? 'cursor-pointer' : ''} no-break mb-4`}
          >
            {section.title && (
              <div
                onClick={() => collapsible && toggleSection(index)}
                data-collapsible-header={collapsible || undefined}
                data-expanded={collapsible ? isExpanded : undefined}
                className={`p-6 ${collapsible && !isExpanded ? 'pb-6' : 'pb-2'} ${collapsible ? 'hover:opacity-80' : ''}`}
              >
                <h3 className={`text-xl md:text-2xl font-bold ${style.titleColor} flex items-center justify-between gap-2`}>
                  <span className="flex items-center gap-2">
                    {section.type === 'archetype' && '✨'}
                    {section.type === 'theme' && '🌙'}
                    {section.type === 'chiron' && '💔'}
                    {section.type === 'wound' && '💫'}
                    {section.type === 'feels' && '🌊'}
                    {section.type === 'shadow' && '🌑'}
                    {section.type === 'medicine' && '🔮'}
                    {section.type === 'invitation' && '⭐'}
                    {section.type === 'prompts' && '📝'}
                    {section.title}
                  </span>
                  {collapsible && (
                    <svg
                      className={`w-6 h-6 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''} print:hidden`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </h3>
              </div>
            )}

            <div
              className={`overflow-hidden transition-all duration-500 ${
                !collapsible || isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className={`px-6 pb-6 space-y-4 ${style.textColor} leading-relaxed relative ${showSparkles ? 'sparkle-reveal' : ''}`}>
                {showSparkles && (
                  <>
                    <div className="sparkle sparkle-1" style={{ top: '10%', left: '15%' }}>✨</div>
                    <div className="sparkle sparkle-2" style={{ top: '30%', right: '20%' }}>✨</div>
                    <div className="sparkle sparkle-3" style={{ top: '50%', left: '10%' }}>✨</div>
                    <div className="sparkle sparkle-4" style={{ top: '70%', right: '15%' }}>✨</div>
                    <div className="sparkle sparkle-5" style={{ top: '20%', right: '40%' }}>✨</div>
                    <div className="sparkle sparkle-6" style={{ top: '60%', left: '35%' }}>✨</div>
                  </>
                )}
                {section.content.map((paragraph, pIndex) => {
                  if (paragraph.startsWith('-')) {
                    return (
                      <div key={pIndex} className="flex gap-3 items-start">
                        <span className="text-magenta mt-1 flex-shrink-0">•</span>
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
