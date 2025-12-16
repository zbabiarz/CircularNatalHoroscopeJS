import React from 'react'

export default function TypewriterText({ text, className = '' }) {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="typewriter-char"
          style={{
            animationDelay: `${index * 0.08}s`
          }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}
