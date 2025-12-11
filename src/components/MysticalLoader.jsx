import React from 'react'

function MysticalLoader({ message = "Calculating your celestial coordinates..." }) {
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

        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-magenta animate-fade-in">
            {message}
          </h3>
          <div className="flex justify-center gap-1">
            <span className="w-2 h-2 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-brown/60 text-sm animate-fade-in-delayed">
            Channeling cosmic wisdom...
          </p>
        </div>
      </div>
    </div>
  )
}

export default MysticalLoader
