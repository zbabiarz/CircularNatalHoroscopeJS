import React, { useState } from 'react'

function Form({ onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    birthTime: '',
    birthLocation: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.birthDate) {
      alert('Please fill in all required fields')
      return
    }
    
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-brown mb-2">
          Full Name <span className="text-magenta">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-brown mb-2">
          Email <span className="text-magenta">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="birthDate" className="block text-sm font-semibold text-brown mb-2">
          Birth Date <span className="text-magenta">*</span>
        </label>
        <input
          type="date"
          id="birthDate"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
        />
      </div>

      <div>
        <label htmlFor="birthTime" className="block text-sm font-semibold text-brown mb-2">
          Birth Time <span className="text-sm text-brown/60">(optional)</span>
        </label>
        <input
          type="time"
          id="birthTime"
          name="birthTime"
          value={formData.birthTime}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
        />
      </div>

      <div>
        <label htmlFor="birthLocation" className="block text-sm font-semibold text-brown mb-2">
          Birth Location <span className="text-sm text-brown/60">(optional - City, State or coordinates)</span>
        </label>
        <input
          type="text"
          id="birthLocation"
          name="birthLocation"
          value={formData.birthLocation}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
          placeholder="Los Angeles, CA or 34.05, -118.24"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-magenta hover:bg-magenta/90 text-white font-semibold py-4 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Calculating...' : 'Reveal My Chiron Shadow'}
      </button>
    </form>
  )
}

export default Form