import React from 'react'
import '../styles/DiscoBall.css'

function DiscoBall() {
  return (
    <div className="disco-ball-container">
      <div className="disco-ball">
        <div className="disco-ball-middle"></div>
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`disco-facet disco-facet-${i}`}></div>
        ))}
      </div>
      <div className="disco-light disco-light-1"></div>
      <div className="disco-light disco-light-2"></div>
      <div className="disco-light disco-light-3"></div>
    </div>
  )
}

export default DiscoBall
