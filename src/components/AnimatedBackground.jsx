import React, { useState, useEffect } from 'react'

const images = [
  'https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/696135642dd5fddbe2547440.jpg',
  'https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613564cc792f07001dd2a6.jpg',
  'https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69613564f8a93b64ef42e6e8.jpg'
]

function AnimatedBackground() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 -z-10">
      {images.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-2000"
          style={{
            backgroundImage: `url(${image})`,
            opacity: currentIndex === index ? 1 : 0
          }}
        />
      ))}
    </div>
  )
}

export default AnimatedBackground
