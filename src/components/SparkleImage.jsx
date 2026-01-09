import React, { useState, useEffect } from 'react'

function Sparkle({ style }) {
  return (
    <svg
      className="absolute pointer-events-none"
      style={style}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

function SparkleImage({ src, alt, className }) {
  const [sparkles, setSparkles] = useState([])

  useEffect(() => {
    const createSparkle = () => {
      const id = Date.now() + Math.random()
      const sparkle = {
        id,
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 80 + 10}%`,
        size: Math.random() * 8 + 8,
        duration: Math.random() * 1 + 1.5,
        delay: Math.random() * 0.5,
      }
      return sparkle
    }

    const initialSparkles = Array.from({ length: 3 }, createSparkle)
    setSparkles(initialSparkles)

    const interval = setInterval(() => {
      setSparkles(prev => {
        const filtered = prev.filter(s => Date.now() - s.id < 2500)
        if (filtered.length < 4 && Math.random() > 0.3) {
          return [...filtered, createSparkle()]
        }
        return filtered
      })
    }, 800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative inline-block ${className || ''}`}>
      <img src={src} alt={alt} className="w-full h-full object-contain" />
      {sparkles.map(sparkle => (
        <Sparkle
          key={sparkle.id}
          style={{
            left: sparkle.left,
            top: sparkle.top,
            width: sparkle.size,
            height: sparkle.size,
            color: 'rgba(255, 255, 255, 0.9)',
            animation: `sparkle-fade ${sparkle.duration}s ease-in-out ${sparkle.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes sparkle-fade {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          30% {
            opacity: 1;
            transform: scale(1) rotate(45deg);
          }
          70% {
            opacity: 1;
            transform: scale(1.1) rotate(90deg);
          }
          100% {
            opacity: 0;
            transform: scale(0) rotate(180deg);
          }
        }
      `}</style>
    </div>
  )
}

export default SparkleImage
