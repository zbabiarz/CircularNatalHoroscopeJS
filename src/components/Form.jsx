import React, { useState, useRef, useEffect } from 'react'
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
  const [timeComponents, setTimeComponents] = useState({
    hour: '',
    minute: '',
    period: 'AM'
  })
  const [apiStatus, setApiStatus] = useState('loading')
  const [showBirthTimeWarning, setShowBirthTimeWarning] = useState(false)

  const autocompleteRef = useRef(null)

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey || '',
    libraries,
    preventGoogleFontsLoading: true
  })

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps API Error:', loadError)
      setApiStatus('error')
    } else if (isLoaded) {
      setApiStatus('loaded')
    }
  }, [isLoaded, loadError])

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

  const handleTimeChange = (field, value) => {
    const newTimeComponents = {
      ...timeComponents,
      [field]: value
    }
    setTimeComponents(newTimeComponents)

    // Convert to 24-hour format if we have all components
    if (newTimeComponents.hour && newTimeComponents.minute) {
      let hour24 = parseInt(newTimeComponents.hour)
      if (newTimeComponents.period === 'PM' && hour24 !== 12) {
        hour24 += 12
      } else if (newTimeComponents.period === 'AM' && hour24 === 12) {
        hour24 = 0
      }
      const time24 = `${hour24.toString().padStart(2, '0')}:${newTimeComponents.minute}`
      setFormData({
        ...formData,
        birthTime: time24
      })
    } else {
      setFormData({
        ...formData,
        birthTime: ''
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.birthDate || !formData.birthLocation) {
      alert('Please fill in all required fields (name, email, birth date, and birth location)')
      return
    }

    const birthYear = new Date(formData.birthDate).getFullYear()
    if (isNaN(birthYear) || birthYear < 1900 || birthYear > new Date().getFullYear()) {
      alert('Please enter a valid birth date with a year between 1900 and ' + new Date().getFullYear() + '.')
      return
    }

    if (!formData.birthCoordinates) {
      alert('Please select your birth location from the dropdown suggestions.')
      return
    }

    if (!formData.birthTime) {
      setShowBirthTimeWarning(true)
      return
    }

    onSubmit(formData)
  }

  const handleConfirmWithoutBirthTime = () => {
    setShowBirthTimeWarning(false)
    onSubmit(formData)
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

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold mb-2">Google Maps API Error</p>
        <p className="text-sm mb-3">The API key is present but there's an issue loading the Maps API.</p>
        <div className="text-sm space-y-2 mb-3">
          <p className="font-semibold">Common fixes:</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Go to <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console APIs</a></li>
            <li>Make sure these APIs are enabled:
              <ul className="list-disc ml-5 mt-1">
                <li>Places API (New)</li>
                <li>Maps JavaScript API</li>
                <li>Geocoding API</li>
              </ul>
            </li>
            <li>Ensure billing is enabled for your project</li>
            <li>Check that your API key has no restrictions blocking localhost</li>
            <li>Wait a few minutes after enabling APIs, then refresh this page</li>
          </ol>
        </div>
        <details className="text-xs mt-2">
          <summary className="cursor-pointer font-medium">Technical details</summary>
          <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">{loadError.message || 'Unknown error'}</pre>
        </details>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-2">
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
              min="1900-01-01"
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brown mb-2">
              Birth Time <span className="text-brown/40">(Optional)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={timeComponents.hour}
                onChange={(e) => handleTimeChange('hour', e.target.value)}
                className="px-2 md:px-3 py-2 md:py-3 text-sm md:text-base border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
              >
                <option value="">Hour</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
              <select
                value={timeComponents.minute}
                onChange={(e) => handleTimeChange('minute', e.target.value)}
                className="px-2 md:px-3 py-2 md:py-3 text-sm md:text-base border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
              >
                <option value="">Min</option>
                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(min => (
                  <option key={min} value={min}>{min}</option>
                ))}
              </select>
              <select
                value={timeComponents.period}
                onChange={(e) => handleTimeChange('period', e.target.value)}
                className="px-2 md:px-3 py-2 md:py-3 text-sm md:text-base border border-rose rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 bg-cream/50"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>
        <p className="text-xs text-brown/60 mt-1">Optional - needed for house placement accuracy</p>
      </div>

      <div>
        <label htmlFor="birthLocation" className="block text-sm font-semibold text-brown mb-2">
          Birth Location <span className="text-magenta">*</span>
        </label>
        {isLoaded && apiStatus === 'loaded' ? (
          <Autocomplete
            onLoad={(autocomplete) => {
              autocompleteRef.current = autocomplete
              console.log('Autocomplete loaded successfully')
            }}
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
              autoComplete="off"
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
            : 'Required - start typing and select your birth city from the dropdown'
          }
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-magenta hover:bg-magenta/90 text-white font-semibold py-4 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed button-glow"
      >
        {isSubmitting ? 'Calculating...' : 'Get my instant report!'}
      </button>

      {showBirthTimeWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 md:p-8 animate-fade-in">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-10a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brown mb-2">Don't know your exact birth time?</h3>
            </div>

            <p className="text-brown/70 mb-6 text-center">
              That's ok! You'll still discover your shadow medicine, it just won't be as detailed.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBirthTimeWarning(false)}
                className="flex-1 px-4 py-2 border border-brown/20 text-brown font-semibold rounded-lg hover:bg-brown/5 transition-colors duration-200"
              >
                Add Birth Time
              </button>
              <button
                type="button"
                onClick={handleConfirmWithoutBirthTime}
                className="flex-1 px-4 py-3 bg-magenta hover:bg-magenta/90 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Okay, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

export default Form
