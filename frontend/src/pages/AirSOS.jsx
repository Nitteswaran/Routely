import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BreathingAnimation from '../components/BreathingAnimation'
import api from '../services/api'
import LoaderAnimation from '../components/LoaderAnimation'

const AirSOS = () => {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [breathingMode, setBreathingMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Processing...')
  const [safeSpots, setSafeSpots] = useState([])
  const [trackingActive, setTrackingActive] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [showGuardianModal, setShowGuardianModal] = useState(false)
  const [guardians, setGuardians] = useState([])
  const [loadingGuardians, setLoadingGuardians] = useState(false)
  const [showAddGuardianForm, setShowAddGuardianForm] = useState(false)
  const [guardianForm, setGuardianForm] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'other',
  })
  const [submittingGuardian, setSubmittingGuardian] = useState(false)
  const navigate = useNavigate()

  // Get user location on mount (optional, for initial display)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting initial location:', error)
          // Don't show error on mount, user can still use the feature
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000, // Accept location up to 1 minute old
        }
      )
    }
  }, [])

  const handleActivateEmergency = async () => {
    setEmergencyActive(true)
    setBreathingMode(true) // Auto-start breathing exercise
    
    // Start tracking automatically
    try {
      await handleStartTracking()
    } catch (error) {
      console.error('Failed to start tracking:', error)
    }
  }

  // Auto-activate emergency when page loads (if coming from SOS button)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('activate') === 'true') {
      handleActivateEmergency()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDeactivateEmergency = () => {
    setEmergencyActive(false)
    setBreathingMode(false)
    setTrackingActive(false)
  }

  const handleCallEmergency = () => {
    window.location.href = 'tel:911' // or your local emergency number
  }

  const fetchGuardians = async () => {
    setLoadingGuardians(true)
    try {
      const response = await api.get('/guardians')
      
      if (response.data.success) {
        setGuardians(response.data.data || [])
        setShowAddGuardianForm(response.data.data.length === 0)
      }
    } catch (error) {
      console.error('Error fetching guardians:', error)
      // If no guardians, show add form
      setGuardians([])
      setShowAddGuardianForm(true)
    } finally {
      setLoadingGuardians(false)
    }
  }

  const handleNotifyGuardians = () => {
    setShowGuardianModal(true)
    fetchGuardians()
  }

  const handleAddGuardian = async (e) => {
    e.preventDefault()
    setSubmittingGuardian(true)
    
    try {
      const response = await api.post('/guardians', guardianForm)
      
      if (response.data.success) {
        setGuardianForm({ name: '', phone: '', email: '', relationship: 'other' })
        setShowAddGuardianForm(false)
        await fetchGuardians() // Reload guardians list
        alert('Guardian added successfully!')
      }
    } catch (error) {
      console.error('Error adding guardian:', error)
      alert(error.response?.data?.message || 'Failed to add guardian. Please try again.')
    } finally {
      setSubmittingGuardian(false)
    }
  }

  const handleNotifySingleGuardian = async (guardian) => {
    if (!guardian.phone) {
      alert(`${guardian.name} does not have a phone number. Cannot send WhatsApp message.`)
      return
    }

    // Get current location
    const getCurrentLocation = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'))
          return
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          (error) => {
            resolve(userLocation) // Fallback to stored location
          },
          { enableHighAccuracy: true, timeout: 5000 }
        )
      })
    }

    try {
      const location = await getCurrentLocation()
      
      // Create emergency message
      const locationText = location
        ? `My location: https://www.google.com/maps?q=${location.lat},${location.lng}`
        : 'Location unavailable'
      
      const emergencyMessage = `🚨 EMERGENCY ALERT 🚨\n\nI need help!\n\n${locationText}\n\nTime: ${new Date().toLocaleString()}\n\nSent from Routely Emergency SOS`

      const phoneNumber = guardian.phone.replace(/[^\d+]/g, '')
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(emergencyMessage)}`
      
      window.open(whatsappUrl, '_blank')
      setShowGuardianModal(false)
    } catch (error) {
      console.error('Error notifying guardian:', error)
      alert('Failed to notify guardian. Please try again.')
    }
  }

  const handleNavigateToSafeSpot = async () => {
    setLoading(true)
    setLoadingMessage('Getting your location...')
    
    // First, get the user's current location
    const getCurrentLocation = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'))
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            // Update state with fresh location
            setUserLocation(location)
            console.log('Current location obtained:', location)
            resolve(location)
          },
          (error) => {
            console.error('Error getting location:', error)
            let errorMessage = 'Unable to get your location. '
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage += 'Please enable location permissions in your browser settings.'
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage += 'Location information is unavailable.'
            } else if (error.code === error.TIMEOUT) {
              errorMessage += 'Location request timed out. Please try again.'
            } else {
              errorMessage += 'Please enable location services.'
            }
            reject(new Error(errorMessage))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0, // Force fresh location
          }
        )
      })
    }

    try {
      // Get fresh location first
      const currentLocation = await getCurrentLocation()
      
      if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
        alert('Location not available. Please enable location services and try again.')
        setLoading(false)
        return
      }

      setLoadingMessage('Finding nearby safe spots...')
      console.log('Fetching safe spots for location:', currentLocation)

      // Then fetch safe spots using the current location
      const response = await api.get('/safe-spots', {
        params: {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          radius: 2, // 2km walking distance
        },
      })

      if (response.data.success && response.data.data.length > 0) {
        console.log('Safe spots found:', response.data.data)
        // Verify distances are calculated correctly
        response.data.data.forEach((spot, index) => {
          console.log(`Spot ${index + 1}: ${spot.name} - ${spot.distance}km away, ${spot.walkingTime} min walk`)
        })
        setSafeSpots(response.data.data)
        // Don't auto-open maps, let user see the list first
      } else {
        alert('No safe spots found within walking distance (2km). Please try calling emergency services.')
        setSafeSpots([])
      }
    } catch (error) {
      console.error('Error fetching safe spots:', error)
      alert(error.message || 'Failed to find safe spots. Please try again.')
      setSafeSpots([])
    } finally {
      setLoading(false)
      setLoadingMessage('Processing...')
    }
  }

  const handleOpenInMaps = (spot) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=walking`
    window.open(url, '_blank')
  }

  const handleStartTracking = async () => {
    if (trackingActive) return

    setLoading(true)
    try {
      const response = await api.post('/sos/start-tracking', {
        location: userLocation,
        timestamp: new Date().toISOString(),
      })

      if (response.data.success) {
        setTrackingActive(true)
        alert('Live tracking started. Your location is being shared.')
      }
    } catch (error) {
      console.error('Error starting tracking:', error)
      alert('Failed to start tracking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Full-screen emergency mode
  if (emergencyActive) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-red-600 via-red-700 to-orange-600 flex flex-col items-center justify-center min-h-screen">
        {/* Breathing Animation - Centered and Responsive */}
        <div className="flex-1 flex items-center justify-center w-full px-4 py-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 lg:p-10 max-w-lg w-full">
            <h3 className="text-white text-2xl md:text-3xl lg:text-4xl font-semibold mb-6 md:mb-8 text-center">
              Stay Calm - Follow Your Breath
            </h3>
            <div className="flex justify-center mb-6">
              <BreathingAnimation className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg" fullScreen={true} />
            </div>
            <p className="text-white/90 text-center text-base md:text-lg lg:text-xl">
              Breathe in and out slowly with the animation
            </p>
          </div>
        </div>

        {/* Emergency Action Buttons */}
        <div className="w-full px-4 pb-6">
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            <button
              onClick={handleCallEmergency}
              className="bg-white text-red-600 font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Call Emergency</span>
            </button>

            <button
              onClick={handleNavigateToSafeSpot}
              disabled={loading || !userLocation}
              className="bg-white text-red-600 font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Find Safe Spot</span>
            </button>

            <button
              onClick={handleNotifyGuardians}
              disabled={loading}
              className="bg-white text-red-600 font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Notify Guardians</span>
            </button>

            <button
              onClick={handleStartTracking}
              disabled={loading || trackingActive}
              className={`font-bold py-4 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                trackingActive
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-red-600 hover:bg-red-50'
              } disabled:opacity-50`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{trackingActive ? 'Tracking Active' : 'Live Tracking'}</span>
            </button>
          </div>

          {/* Safe Spots List in Emergency Mode */}
          {safeSpots.length > 0 && (
            <div className="mt-6 w-full max-w-2xl mx-auto px-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <h3 className="text-white text-lg font-semibold mb-3">Nearby Safe Spots (Walking Distance)</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {safeSpots.slice(0, 3).map((spot) => (
                    <div
                      key={spot.id}
                      className="bg-white/20 rounded-lg p-3 border border-white/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm mb-1">{spot.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-white/90">
                            <span>📍 {spot.distance} km</span>
                            {spot.walkingTime && <span>🚶 {spot.walkingTime} min</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenInMaps(spot)}
                          className="ml-2 px-3 py-1 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium"
                        >
                          Go
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Deactivate Button */}
          <button
            onClick={handleDeactivateEmergency}
            className="mt-4 w-full max-w-2xl mx-auto bg-white/20 backdrop-blur-md text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/30 transition-all border-2 border-white/30"
          >
            Deactivate Emergency
          </button>
        </div>
      </div>
    )
  }

  // Normal view (before emergency is activated)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AirSOS</h1>
        <p className="text-gray-600">Emergency assistance and support</p>
      </div>

      {/* Emergency Activation Card */}
      <div className="card bg-gradient-to-r from-emergency-red to-emergency-orange text-white">
        <div className="text-center py-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Emergency Assistance</h2>
          <p className="text-white/90 mb-6 text-lg">
            Activate emergency mode to get immediate help and support
          </p>
          <button
            onClick={handleActivateEmergency}
            className="bg-white text-red-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-red-50 transition-all text-lg"
          >
            Activate Emergency Mode
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleCallEmergency}
              className="btn-emergency w-full text-left flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Call Emergency Services</span>
            </button>
            <button
              onClick={handleNavigateToSafeSpot}
              disabled={loading}
              className="btn-primary w-full text-left flex items-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Find Nearest Safe Spot</span>
            </button>
            <button
              onClick={handleNotifyGuardians}
              disabled={loading}
              className="btn-secondary w-full text-left flex items-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Notify Guardians</span>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Information</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong className="text-gray-900">Emergency Mode:</strong> Activates full-screen
              emergency interface with breathing exercises and quick access to help.
            </p>
            <p>
              <strong className="text-gray-900">Live Tracking:</strong> Share your location in
              real-time with trusted guardians and emergency services.
            </p>
            <p>
              <strong className="text-gray-900">Safe Spots:</strong> Find the nearest safe
              locations like police stations, hospitals, or community centers.
            </p>
          </div>
        </div>
      </div>

      {/* Safe Spots List */}
      {safeSpots.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Nearby Safe Spots (Walking Distance)</h3>
          <div className="space-y-3">
            {safeSpots.slice(0, 5).map((spot) => (
              <div
                key={spot.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{spot.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{spot.address}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-600 font-medium">
                        📍 {spot.distance} km away
                      </span>
                      {spot.walkingTime && (
                        <span className="text-gray-600">
                          🚶 {spot.walkingTime} min walk
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        spot.category === 'police' ? 'bg-blue-100 text-blue-800' :
                        spot.category === 'medical' ? 'bg-red-100 text-red-800' :
                        spot.category === '24hour_store' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {spot.category === 'police' ? 'Police' :
                         spot.category === 'medical' ? 'Medical' :
                         spot.category === '24hour_store' ? '24-Hour Store' :
                         'Well-Lit Area'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenInMaps(spot)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Directions
                  </button>
                </div>
                {spot.phone && (
                  <div className="mt-2 text-sm text-gray-600">
                    📞 <a href={`tel:${spot.phone}`} className="text-blue-600 hover:underline">
                      {spot.phone}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8">
            <LoaderAnimation text={loadingMessage} />
          </div>
        </div>
      )}

      {/* Guardian Modal */}
      {showGuardianModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {showAddGuardianForm ? 'Add Guardian' : 'Notify Guardians'}
              </h2>
              <button
                onClick={() => {
                  setShowGuardianModal(false)
                  setShowAddGuardianForm(false)
                  setGuardianForm({ name: '', phone: '', email: '', relationship: 'other' })
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {loadingGuardians ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderAnimation text="Loading guardians..." />
                </div>
              ) : showAddGuardianForm ? (
                // Add Guardian Form
                <form onSubmit={handleAddGuardian} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={guardianForm.name}
                      onChange={(e) => setGuardianForm({ ...guardianForm, name: e.target.value })}
                      className="input-field"
                      placeholder="Guardian's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={guardianForm.phone}
                      onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })}
                      className="input-field"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={guardianForm.email}
                      onChange={(e) => setGuardianForm({ ...guardianForm, email: e.target.value })}
                      className="input-field"
                      placeholder="guardian@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <select
                      value={guardianForm.relationship}
                      onChange={(e) => setGuardianForm({ ...guardianForm, relationship: e.target.value })}
                      className="input-field"
                    >
                      <option value="family">Family</option>
                      <option value="friend">Friend</option>
                      <option value="colleague">Colleague</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <p className="text-xs text-gray-500">
                    * At least one contact method (phone or email) is required
                  </p>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddGuardianForm(false)
                        if (guardians.length > 0) {
                          setShowGuardianModal(false)
                        }
                      }}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingGuardian || (!guardianForm.phone && !guardianForm.email)}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {submittingGuardian ? 'Adding...' : 'Add Guardian'}
                    </button>
                  </div>
                </form>
              ) : guardians.length === 0 ? (
                // No Guardians - Show Add Form
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Guardians Added</h3>
                  <p className="text-gray-600 mb-6">
                    Add a guardian to notify them in case of emergency
                  </p>
                  <button
                    onClick={() => setShowAddGuardianForm(true)}
                    className="btn-primary"
                  >
                    Add Guardian
                  </button>
                </div>
              ) : (
                // Guardian List
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      Select a guardian to notify via WhatsApp
                    </p>
                    <button
                      onClick={() => setShowAddGuardianForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Another
                    </button>
                  </div>

                  {guardians.map((guardian) => (
                    <div
                      key={guardian._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{guardian.name}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            {guardian.phone && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{guardian.phone}</span>
                              </div>
                            )}
                            {guardian.email && (
                              <div className="flex items-center gap-1 mt-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{guardian.email}</span>
                              </div>
                            )}
                            <div className="mt-1">
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                {guardian.relationship}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleNotifySingleGuardian(guardian)}
                        disabled={!guardian.phone}
                        className={`w-full mt-3 py-2 px-4 rounded-lg font-medium transition-colors ${
                          guardian.phone
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {guardian.phone ? (
                          <>
                            <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Notify via WhatsApp
                          </>
                        ) : (
                          'No phone number'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AirSOS
