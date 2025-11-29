import { useState, useEffect, useRef } from 'react'
import MapView from '../components/MapView'
import LoaderAnimation from '../components/LoaderAnimation'
import { 
  getGuardians, 
  addGuardian, 
  updateGuardian, 
  deleteGuardian,
  initializeDefaultData 
} from '../utils/localStorage'

const GuardianConnect = () => {
  const [guardians, setGuardians] = useState([])
  const [loading, setLoading] = useState(true)
  const [sharingLocation, setSharingLocation] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'other',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [lastSentTime, setLastSentTime] = useState(null)
  const locationWatchIdRef = useRef(null)
  const locationUpdateIntervalRef = useRef(null)
  const currentLocationRef = useRef(null)

  // Initialize default data and fetch guardians on mount
  useEffect(() => {
    initializeDefaultData()
    loadGuardians()
    
    // Get user location
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

  const loadGuardians = () => {
    setLoading(true)
    try {
      const data = getGuardians()
      setGuardians(data)
    } catch (error) {
      console.error('Error loading guardians:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.phone && !formData.email) {
      errors.contact = 'Either phone or email is required'
    }
    
    if (formData.phone && formData.phone.trim()) {
      // More flexible phone validation - just check for minimum digits
      const digitsOnly = formData.phone.replace(/[^\d+]/g, '').replace(/\+/g, '')
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        errors.phone = 'Phone number must have 7-15 digits'
      }
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const guardianData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        relationship: formData.relationship || 'other',
      }

      if (editingId) {
        // Update existing guardian
        const updated = updateGuardian(editingId, guardianData)
        if (updated) {
          loadGuardians()
          resetForm()
        } else {
          alert('Failed to update guardian')
        }
      } else {
        // Add new guardian
        addGuardian(guardianData)
        loadGuardians()
        resetForm()
      }
    } catch (error) {
      console.error('Error saving guardian:', error)
      alert('Failed to save guardian. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: 'other',
    })
    setFormErrors({})
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleEdit = (guardian) => {
    setFormData({
      name: guardian.name || '',
      phone: guardian.phone || '',
      email: guardian.email || '',
      relationship: guardian.relationship || 'other',
    })
    setEditingId(guardian.id)
    setShowAddForm(true)
    setFormErrors({})
  }

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to remove this guardian?')) {
      return
    }

    try {
      const success = deleteGuardian(id)
      if (success) {
        loadGuardians()
        if (editingId === id) {
          resetForm()
        }
      } else {
        alert('Failed to remove guardian. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting guardian:', error)
      alert('Failed to remove guardian. Please try again.')
    }
  }

  const handleWhatsApp = (guardian) => {
    if (!guardian.phone) {
      alert('No phone number available for this guardian.')
      return
    }

    // Clean phone number - remove spaces, dashes, parentheses, etc.
    const phoneNumber = guardian.phone.replace(/[^\d+]/g, '')
    
    // Ensure phone number starts with country code
    let whatsappNumber = phoneNumber
    if (!whatsappNumber.startsWith('+')) {
      // If no +, assume it's a local number and you might want to add country code
      // For now, just use as is or add + prefix if it doesn't start with a digit
      whatsappNumber = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber
    }

    // Open WhatsApp with the phone number
    const whatsappUrl = `https://wa.me/${whatsappNumber}`
    window.open(whatsappUrl, '_blank')
  }

  const sendLocationToGuardians = (location) => {
    const guardians = getGuardians()
    if (guardians.length === 0) {
      alert('No guardians added. Please add at least one guardian first.')
      return
    }

    const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`
    const timestamp = new Date()
    const locationMessage = `📍 My current location:\n${locationUrl}\n\nCoordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\nTime: ${timestamp.toLocaleString()}`

    // Send to each guardian with phone number via WhatsApp
    guardians.forEach((guardian, index) => {
      if (guardian.phone) {
        // Clean phone number
        let phoneNumber = guardian.phone.replace(/[^\d+]/g, '')
        
        // Remove leading 0 if present and add country code if needed
        if (phoneNumber.startsWith('0')) {
          phoneNumber = phoneNumber.substring(1)
        }
        
        // Ensure it starts with country code (add +60 for Malaysia if no +)
        if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+60' + phoneNumber
        }

        // Create WhatsApp URL with location message
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(locationMessage)}`
        
        // Open WhatsApp in new tab (delay slightly for multiple guardians)
        setTimeout(() => {
          window.open(whatsappUrl, '_blank')
        }, index * 500) // Stagger by 500ms to avoid popup blockers
      }
    })

    // Update last sent time
    setLastSentTime(timestamp)
  }

  const handleShareLocation = () => {
    if (!sharingLocation) {
      // Start sharing
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser')
        return
      }

      // Request permission and get initial location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(location)
          setSharingLocation(true)
          
          // Send initial location
          sendLocationToGuardians(location)
          
          // Store current location in ref
          currentLocationRef.current = location
          
          // Watch position for updates
          locationWatchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
              setUserLocation(newLocation)
              currentLocationRef.current = newLocation
            },
            (error) => {
              console.error('Error watching position:', error)
              alert('Error tracking location. Please check your location permissions.')
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          )
          
          // Send location updates every 30 seconds
          locationUpdateIntervalRef.current = setInterval(() => {
            if (currentLocationRef.current) {
              sendLocationToGuardians(currentLocationRef.current)
            }
          }, 30000) // Update every 30 seconds
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Failed to get your location. Please enable location permissions.')
        }
      )
    } else {
      // Stop sharing
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current)
        locationWatchIdRef.current = null
      }
      
      if (locationUpdateIntervalRef.current !== null) {
        clearInterval(locationUpdateIntervalRef.current)
        locationUpdateIntervalRef.current = null
      }
      
      setSharingLocation(false)
      currentLocationRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current)
      }
      if (locationUpdateIntervalRef.current !== null) {
        clearInterval(locationUpdateIntervalRef.current)
      }
    }
  }, [])

  const getRelationshipIcon = (relationship) => {
    const icons = {
      family: '👨‍👩‍👧‍👦',
      friend: '👫',
      colleague: '💼',
      other: '👤',
    }
    return icons[relationship] || icons.other
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Guardian Connect</h1>
        <p className="text-gray-600">Stay connected with your trusted guardians</p>
      </div>

      {/* Location Sharing Toggle */}
      <div className={`card ${sharingLocation ? 'border-2 border-green-500 bg-green-50' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold">Location Sharing</h2>
              {sharingLocation && (
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {sharingLocation
                ? `Your location is being shared with ${guardians.length} guardian${guardians.length !== 1 ? 's' : ''}. Updates sent every 30 seconds.`
                : 'Share your live location with your guardians'}
            </p>
            {sharingLocation && userLocation && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  Current: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
                {lastSentTime && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ Last sent: {lastSentTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleShareLocation}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              sharingLocation
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {sharingLocation ? 'Stop Sharing' : 'Start Sharing'}
          </button>
        </div>
      </div>

      {/* Add/Edit Guardian Form */}
      {showAddForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Edit Guardian' : 'Add New Guardian'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Guardian's name"
                className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                required
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  className={`input-field ${formErrors.phone ? 'border-red-500' : ''}`}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="guardian@example.com"
                  className={`input-field ${formErrors.email ? 'border-red-500' : ''}`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
            </div>

            {formErrors.contact && (
              <p className="text-sm text-red-600">{formErrors.contact}</p>
            )}
            {formErrors.submit && (
              <p className="text-sm text-red-600">{formErrors.submit}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="family">Family</option>
                <option value="friend">Friend</option>
                <option value="colleague">Colleague</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {submitting 
                  ? (editingId ? 'Updating...' : 'Adding...') 
                  : (editingId ? 'Update Guardian' : 'Add Guardian')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Guardians List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Guardians</h2>
          {!showAddForm && (
            <button
              onClick={() => {
                resetForm()
                setShowAddForm(true)
              }}
              className="btn-primary"
            >
              + Add Guardian
            </button>
          )}
        </div>

        {loading ? (
          <LoaderAnimation text="Loading guardians..." />
        ) : guardians.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No guardians added yet</p>
            <button
              onClick={() => {
                resetForm()
                setShowAddForm(true)
              }}
              className="btn-primary"
            >
              Add Your First Guardian
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {guardians.map((guardian) => (
              <div
                key={guardian.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">
                    {getRelationshipIcon(guardian.relationship)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{guardian.name}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {guardian.phone && <div>📞 {guardian.phone}</div>}
                      {guardian.email && <div>✉️ {guardian.email}</div>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {guardian.phone && (
                    <button
                      onClick={() => handleWhatsApp(guardian)}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      title="Open WhatsApp"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      WhatsApp
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(guardian)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    title="Edit guardian"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(guardian.id)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    title="Remove guardian"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Location Map */}
      {sharingLocation && userLocation && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Shared Location</h3>
          </div>
          <MapView
            center={[userLocation.lat, userLocation.lng]}
            zoom={15}
            height="400px"
            showUserLocation={true}
            markers={[
              { lat: userLocation.lat, lng: userLocation.lng, popup: 'Your Location' },
            ]}
          />
        </div>
      )}

      {/* Emergency Contact */}
      <div className="card bg-red-50 border-2 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Emergency Contact
        </h3>
        <p className="text-sm text-red-700 mb-4">
          In case of emergency, all guardians will be notified automatically.
        </p>
        <button 
          onClick={() => {
            // Navigate to AirSOS page
            window.location.href = '/air-sos?activate=true'
          }}
          className="btn-emergency w-full"
        >
          Activate Emergency Mode
        </button>
      </div>
    </div>
  )
}

export default GuardianConnect
