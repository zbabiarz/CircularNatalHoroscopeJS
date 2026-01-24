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
    {
      name: 'Copy Link',
      icon: '📋',
      action: handleCopyToClipboard,
      color: 'bg-gray-100 hover:bg-gray-200'
    },
    {
      name: 'Email',
      icon: '✉️',
      action: handleEmail,
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      action: handleWhatsApp,
      color: 'bg-green-50 hover:bg-green-100'
    },
    {
      name: 'SMS',
      icon: '📱',
      action: handleSMS,
      color: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      name: 'Facebook',
      icon: '👍',
      action: handleFacebook,
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      name: 'Twitter',
      icon: '𝕏',
      action: handleTwitter,
      color: 'bg-sky-50 hover:bg-sky-100'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      action: handleLinkedIn,
      color: 'bg-blue-50 hover:bg-blue-100'
    }
  ]

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-magenta/20 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brown">Share the Magic ✨</h2>
          <button
            onClick={onClose}
            className="text-brown/60 hover:text-brown transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-brown/70 mb-6 text-sm leading-relaxed">
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
              className={`flex flex-col items-center gap-2 p-4 rounded-lg ${option.color} border border-transparent hover:border-magenta/30 transition-all duration-300 group`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {option.icon}
              </span>
              <span className="text-xs font-medium text-brown text-center">
                {option.name}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-magenta/5 rounded-lg p-4 border border-magenta/20">
          <p className="text-xs text-brown/60 mb-2 font-medium">Share URL:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-white border border-magenta/20 rounded px-3 py-2 text-sm text-brown truncate focus:outline-none focus:ring-2 focus:ring-magenta/30"
            />
            <button
              onClick={handleCopyToClipboard}
              className="bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded font-medium text-sm transition-colors whitespace-nowrap"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-brown/10 hover:bg-brown/20 text-brown font-medium py-3 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}