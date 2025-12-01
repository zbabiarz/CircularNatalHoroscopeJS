import React, { useState, useRef } from 'react'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'

const libraries = ['places']

function Form({ onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    birthTime: '',
    birthLocation: '',
    birthCoordinates: null
  })

  const autocompleteRef = useRef(null)

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey || '',
    libraries
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        setFormData({
          ...formData,
          birthLocation: place.formatted_address || place.name,
          birthCoordinates: [lat, lng]
        })
      }
    }
  }

  const handleLocationInputChange = (e) => {
    setFormData({
      ...formData,
      birthLocation: e.target.value,
      birthCoordinates: null
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.birthDate) {
      alert('Please fill in all required fields')
      return
    }

    if (!formData.birthTime || !formData.birthLocation || !formData.birthCoordinates) {
      alert('Birth time and location are required. Please select a location from the dropdown.')
      return
    }

    onSubmit(formData)
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold mb-2">Error loading location search</p>
        <p className="text-sm">Please check that your Google Maps API key is configured correctly in the .env file.</p>
      </div>
    )
  }

  if (!googleMapsApiKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p className="font-semibold mb-2">Google Maps API Key Required</p>
        <p className="text-sm mb-2">To use location search, you need to:</p>
        <ol className="text-sm list-decimal ml-5 space-y-1">
          <li>Get a Google Maps API key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
          <li>Enable the "Places API" and "Maps JavaScript API"</li>
          <li>Add it to your .env file as: VITE_GOOGLE_MAPS_API_KEY=your_key_here</li>
          <li>Restart the development server</li>
        </ol>
      </div>
    )
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
          Birth Time <span className="text-magenta">*</span>
        </label>
        <input
          type="time"
          id="birthTime"
          name="birthTime"
          value={formData.birthTime}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
        />
        <p className="text-xs text-brown/60 mt-1">Required for accurate house placement</p>
      </div>

      <div>
        <label htmlFor="birthLocation" className="block text-sm font-semibold text-brown mb-2">
          Birth Location <span className="text-magenta">*</span>
        </label>
        {isLoaded ? (
          <Autocomplete
            onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
            onPlaceChanged={handlePlaceChanged}
            options={{
              types: ['(cities)'],
              fields: ['formatted_address', 'geometry', 'name']
            }}
          >
            <input
              type="text"
              id="birthLocation"
              name="birthLocation"
              value={formData.birthLocation}
              onChange={handleLocationInputChange}
              className="w-full px-4 py-3 border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
              placeholder="Start typing city name..."
            />
          </Autocomplete>
        ) : (
          <input
            type="text"
            id="birthLocation"
            name="birthLocation"
            value={formData.birthLocation}
            onChange={handleLocationInputChange}
            disabled
            className="w-full px-4 py-3 border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50 opacity-50"
            placeholder="Loading location search..."
          />
        )}
        <p className="text-xs text-brown/60 mt-1">
          {formData.birthCoordinates
            ? `✓ Location selected (${formData.birthCoordinates[0].toFixed(4)}, ${formData.birthCoordinates[1].toFixed(4)})`
            : 'Start typing and select your birth city from the dropdown'
          }
        </p>
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
