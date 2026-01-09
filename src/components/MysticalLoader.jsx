import React, { useState, useEffect } from 'react'

const loadingMessages = [
  {
    lines: ['Your wounds are your wisdom.', 'Your pain is your power.']
  },
  {
    lines: [
      'Your Chart Is Loading',
      'This takes about a minute.',
      "Which is honestly way less time than you've spent wondering \"why am I like this?\""
    ]
  },
  {
    lines: [
      'Almost there…',
      'Your chart is syncing.',
      'Your Chiron placement is being calculated.',
      'Your shadow is about to get a name.'
    ]
  },
  {
    lines: ['Hang tight.', 'This is where the real clarity starts.']
  }
]

function MysticalLoader() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const currentMessage = loadingMessages[messageIndex]

  return (
    <div className="fixed inset-0 bg-cream/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative w-64 h-64 mx-auto mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-magenta/20 to-rose/30 animate-pulse-slow shadow-2xl shadow-magenta/30" />
          </div>

          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-magenta shadow-lg shadow-magenta/50" />
          </div>

          <div className="absolute inset-0 animate-spin-reverse-slow">
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-3 rounded-full bg-rose shadow-lg shadow-rose/50" />
          </div>

          <div className="absolute inset-4 animate-spin-slower">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-magenta/70 shadow-lg shadow-magenta/40" />
          </div>

          <div className="absolute inset-8 animate-spin-reverse-slower">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-rose/80 shadow-lg shadow-rose/40" />
          </div>

          <div className="absolute inset-0 animate-float">
            <div className="absolute top-12 right-8 text-2xl opacity-60 animate-twinkle">✨</div>
          </div>

          <div className="absolute inset-0 animate-float-delayed">
            <div className="absolute bottom-12 left-8 text-2xl opacity-60 animate-twinkle-delayed">✨</div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl animate-pulse-slow">🌙</div>
          </div>
        </div>

        <div className="space-y-3 max-w-lg mx-auto px-4">
          <div className="min-h-[120px] flex flex-col justify-center">
            {currentMessage.lines.map((line, index) => (
              <p
                key={index}
                className={`${index === 0 ? 'text-xl md:text-2xl font-bold text-magenta mb-2' : 'text-base md:text-lg text-brown/80'} animate-fade-in`}
              >
                {line}
              </p>
            ))}
          </div>
          <div className="flex justify-center gap-1">
            <span className="w-2 h-2 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MysticalLoader
