import React, { useId, useState } from 'react'

export default function CollapsibleSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="group w-full flex items-center justify-between gap-4 text-left py-1"
      >
        <span className="text-base font-semibold uppercase tracking-[0.16em] transition-opacity duration-200 group-hover:opacity-80" style={{ color: '#c3cd42', fontFamily: "'Montserrat', sans-serif" }}>
          {title}
        </span>
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-white/10 ${isOpen ? 'rotate-180' : ''}`}
          style={{ border: '1px solid rgba(195,205,66,0.35)', color: '#c3cd42' }}
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div
        id={contentId}
        className="grid transition-all duration-500 ease-in-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
