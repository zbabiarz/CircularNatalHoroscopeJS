import React from 'react'

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-pulse"
        style={{
          backgroundImage: `url(https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613564cc792f07001dd2a6.jpg)`,
          filter: 'brightness(1.1) contrast(1.05)',
          animation: 'glow 3s ease-in-out infinite alternate'
        }}
      />
      <style>{`
        @keyframes glow {
          0% {
            filter: brightness(1) contrast(1);
          }
          100% {
            filter: brightness(1.2) contrast(1.1);
          }
        }
      `}</style>
    </div>
  )
}

export default AnimatedBackground
