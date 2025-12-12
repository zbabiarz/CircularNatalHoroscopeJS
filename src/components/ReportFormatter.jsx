import React from 'react'

function ReportFormatter({ report }) {
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
    if (lowerTitle.includes('core wound')) return 'wound'
    if (lowerTitle.includes('how it feels')) return 'feels'
    if (lowerTitle.includes('shadow pattern')) return 'shadow'
    if (lowerTitle.includes('medicine')) return 'medicine'
    if (lowerTitle.includes('invitation')) return 'invitation'
    if (lowerTitle.includes('journal') || lowerTitle.includes('reflection')) return 'prompts'
    return 'default'
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

        return (
          <div
            key={index}
            className={`${style.bg} ${style.border} rounded-lg p-6 transition-all duration-300 hover:shadow-md`}
          >
            {section.title && (
              <h3 className={`text-xl md:text-2xl font-bold ${style.titleColor} mb-4 flex items-center gap-2`}>
                {section.type === 'archetype' && '✨'}
                {section.type === 'theme' && '🌙'}
                {section.type === 'wound' && '💫'}
                {section.type === 'feels' && '🌊'}
                {section.type === 'shadow' && '🌑'}
                {section.type === 'medicine' && '🔮'}
                {section.type === 'invitation' && '⭐'}
                {section.type === 'prompts' && '📝'}
                {section.title}
              </h3>
            )}
            <div className={`space-y-4 ${style.textColor} leading-relaxed`}>
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
        )
      })}
    </div>
  )
}

export default ReportFormatter
