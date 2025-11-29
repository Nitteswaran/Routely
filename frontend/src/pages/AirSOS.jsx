import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BreathingAnimation from '../components/BreathingAnimation'
import api from '../services/api'
import LoaderAnimation from '../components/LoaderAnimation'
import { getGuardians } from '../utils/localStorage'

const AirSOS = () => {
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [breathingMode, setBreathingMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [safeSpots, setSafeSpots] = useState([])
  const [trackingActive, setTrackingActive] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const navigate = useNavigate()

  // Get user location on mount
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
          console.error('Error getting location:', error)
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

  const handleNotifyGuardians = () => {
    setLoading(true)
    try {
      const guardians = getGuardians()
      
      if (guardians.length === 0) {
        alert('No guardians added. Please add guardians first in the Guardian Connect page.')
        setLoading(false)
        return
      }

      // Create emergency message
      const locationText = userLocation 
        ? `My location: https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`
        : 'Location unavailable'
      
      const emergencyMessage = `🚨 EMERGENCY ALERT 🚨\n\nI need help!\n\n${locationText}\n\nTime: ${new Date().toLocaleString()}\n\nSent from Routely Emergency SOS`

      // Notify each guardian via WhatsApp if they have a phone number
      const guardiansWithPhone = guardians.filter(g => g.phone)
      
      if (guardiansWithPhone.length === 0) {
        alert('No guardians with phone numbers found. Please add phone numbers to your guardians.')
        setLoading(false)
        return
      }

      // Open WhatsApp for the first guardian (or you could loop through all)
      const firstGuardian = guardiansWithPhone[0]
      const phoneNumber = firstGuardian.phone.replace(/[^\d+]/g, '')
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(emergencyMessage)}`
      
      window.open(whatsappUrl, '_blank')
      
      // If there are more guardians, alert user
      if (guardiansWithPhone.length > 1) {
        setTimeout(() => {
          alert(`Opening WhatsApp for ${firstGuardian.name}. You may need to manually notify ${guardiansWithPhone.length - 1} other guardian(s).`)
        }, 500)
      } else {
        alert(`Opening WhatsApp to notify ${firstGuardian.name}`)
      }
    } catch (error) {
      console.error('Error notifying guardians:', error)
      alert('Failed to notify guardians. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateToSafeSpot = async () => {
    setLoading(true)
    try {
      const response = await api.get('/safe-spots', {
        params: userLocation ? {
          lat: userLocation.lat,
          lng: userLocation.lng,
        } : {},
      })

      if (response.data.success && response.data.data.length > 0) {
        const nearestSpot = response.data.data[0]
        // Open in maps app
        const url = `https://www.google.com/maps/dir/?api=1&destination=${nearestSpot.lat},${nearestSpot.lng}`
        window.open(url, '_blank')
        setSafeSpots(response.data.data)
      } else {
        alert('No safe spots found nearby')
      }
    } catch (error) {
      console.error('Error fetching safe spots:', error)
      alert('Failed to find safe spots. Please try again.')
    } finally {
      setLoading(false)
    }
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
              disabled={loading}
              className="bg-white text-red-600 font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Safe Spot</span>
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

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8">
            <LoaderAnimation text="Processing..." />
          </div>
        </div>
      )}
    </div>
  )
}

export default AirSOS
