import React, { useState } from 'react'

export default function ShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = window.location.origin
  const shareMessage = "This just blew my mind! Find your shadow in the stars. https://shadow.lovelightandblackholes.com"

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleEmail = () => {
    const subject = encodeURIComponent("Check Out This Shadow Work Experience")
    const body = encodeURIComponent(`${shareMessage}\n\n${shareUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareMessage}\n\n${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleSMS = () => {
    const text = encodeURIComponent(`${shareMessage} ${shareUrl}`)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      window.open(`sms:&body=${text}`)
    } else {
      window.open(`sms:?body=${text}`)
    }
  }

  const handleFacebook = () => {
    const url = encodeURIComponent(shareUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, 'facebook-share', 'width=600,height=400')
  }

  const handleTwitter = () => {
    const text = encodeURIComponent(shareMessage)
    const url = encodeURIComponent(shareUrl)
    const hashtags = "ChironShadow,ShadowWork,Astrology"
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`, 'twitter-share', 'width=600,height=400')
  }

  const handleLinkedIn = () => {
    const url = encodeURIComponent(shareUrl)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, 'linkedin-share', 'width=600,height=400')
  }

  const shareOptions = [
    { name: 'Copy Link', icon: 'Link', action: handleCopyToClipboard },
    { name: 'Email', icon: 'Mail', action: handleEmail },
    { name: 'WhatsApp', icon: 'Chat', action: handleWhatsApp },
    { name: 'SMS', icon: 'SMS', action: handleSMS },
    { name: 'Facebook', icon: 'FB', action: handleFacebook },
    { name: 'Twitter', icon: 'X', action: handleTwitter },
    { name: 'LinkedIn', icon: 'In', action: handleLinkedIn }
  ]

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all"
        style={{ background: '#111', border: '1px solid rgba(67,126,120,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>Share</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <p className="text-white/50 mb-6 text-sm leading-relaxed" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {shareMessage}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => {
                option.action()
                if (option.name !== 'Copy Link') {
                  setTimeout(() => onClose(), 300)
                }
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-300 group"
              style={{
                background: 'rgba(67,126,120,0.06)',
                borderColor: 'rgba(67,126,120,0.15)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(67,126,120,0.15)'
                e.currentTarget.style.borderColor = 'rgba(67,126,120,0.35)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(67,126,120,0.06)'
                e.currentTarget.style.borderColor = 'rgba(67,126,120,0.15)'
              }}
            >
              <span className="text-sm font-semibold group-hover:scale-110 transition-transform" style={{ color: '#437e78' }}>
                {option.icon}
              </span>
              <span className="text-xs font-medium text-white/60" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {option.name}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-lg p-4" style={{ background: 'rgba(67,126,120,0.08)', border: '1px solid rgba(67,126,120,0.15)' }}>
          <p className="text-xs text-white/40 mb-2 font-medium" style={{ fontFamily: "'Montserrat', sans-serif" }}>Share URL:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 rounded px-3 py-2 text-sm text-white truncate focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(67,126,120,0.2)', fontFamily: "'Montserrat', sans-serif" }}
            />
            <button
              onClick={handleCopyToClipboard}
              className="text-white px-4 py-2 rounded font-medium text-sm transition-colors whitespace-nowrap"
              style={{ background: '#437e78', fontFamily: "'Montserrat', sans-serif" }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 text-white/50 font-medium py-3 rounded-lg transition-colors hover:bg-white/5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Montserrat', sans-serif" }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
