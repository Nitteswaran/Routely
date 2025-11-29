import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const MultipleDestinations = ({ userLocation }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const geocoderRef = useRef(null)
  const directionsServiceRef = useRef(null)
  const [destinations, setDestinations] = useState([])
  const [newDestination, setNewDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const markersRef = useRef([])

  // Load Google Maps script
  useEffect(() => {
    if (scriptLoaded || !GOOGLE_MAPS_API_KEY) return

    // Check if script already exists
    if (window.google && window.google.maps) {
      setScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,directions`
    script.async = true
    script.defer = true
    script.onload = () => {
      setScriptLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps script')
      setError('Failed to load Google Maps. Please check your API key and network connection.')
    }
    document.head.appendChild(script)
  }, [scriptLoaded])

  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return

    // Initialize map
    const center = userLocation 
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : { lat: 3.1390, lng: 101.6869 } // Default: Kuala Lumpur

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })

    geocoderRef.current = new window.google.maps.Geocoder()
    directionsServiceRef.current = new window.google.maps.DirectionsService()

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
    }
  }, [userLocation, scriptLoaded])

  const fetchDestinationInfo = async (destination) => {
    if (!geocoderRef.current || !directionsServiceRef.current) return

    setLoading(true)
    setError(null)

    try {
      // Geocode the destination to get coordinates
      const geocodeResult = await new Promise((resolve, reject) => {
        geocoderRef.current.geocode(
          { address: destination.address },
          (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              resolve(results[0])
            } else {
              reject(new Error('Geocoding failed'))
            }
          }
        )
      })

      const location = geocodeResult.geometry.location
      const coords = { lat: location.lat(), lng: location.lng() }

      // Get estimated travel time (driving only)
      const origin = userLocation 
        ? `${userLocation.lat},${userLocation.lng}`
        : '3.1390,101.6869'

      const routeResult = await new Promise((resolve, reject) => {
        directionsServiceRef.current.route(
          {
            origin,
            destination: coords,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK' && result.routes && result.routes.length > 0) {
              resolve(result.routes[0].legs[0])
            } else {
              reject(new Error('Route calculation failed'))
            }
          }
        )
      })

      // Fetch AQI data for the destination
      let aqiData = null
      try {
        const aqiResponse = await api.get('/aqi', {
          params: { lat: coords.lat, lng: coords.lng },
        })
        if (aqiResponse.data?.success) {
          aqiData = aqiResponse.data.data
        }
      } catch (aqiError) {
        console.warn('Failed to fetch AQI:', aqiError)
      }

      // Create marker
      const marker = new window.google.maps.Marker({
        position: coords,
        map: mapInstanceRef.current,
        label: {
          text: `${destinations.length + 1}`,
          color: 'white',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      })
      markersRef.current.push(marker)

      // Update destination with info
      setDestinations(prev => prev.map(dest => 
        dest.id === destination.id
          ? {
              ...dest,
              coordinates: coords,
              estimatedTime: routeResult.duration.text,
              distance: routeResult.distance.text,
              aqi: aqiData,
              loaded: true,
            }
          : dest
      ))

      // Fit map to show all markers
      const bounds = new window.google.maps.LatLngBounds()
      if (userLocation) {
        bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng))
      }
      markersRef.current.forEach(m => bounds.extend(m.getPosition()))
      if (!bounds.isEmpty()) {
        mapInstanceRef.current.fitBounds(bounds)
      }

    } catch (err) {
      console.error('Error fetching destination info:', err)
      setDestinations(prev => prev.map(dest => 
        dest.id === destination.id
          ? { ...dest, error: 'Failed to fetch information', loaded: true }
          : dest
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleAddDestination = () => {
    if (!newDestination.trim() || loading) return

    const destination = {
      id: Date.now(),
      address: newDestination.trim(),
      name: newDestination.trim(),
      loaded: false,
    }

    setDestinations([...destinations, destination])
    setNewDestination('')

    // Fetch info for the new destination
    if (scriptLoaded) {
      fetchDestinationInfo(destination)
    }
  }

  useEffect(() => {
    // Fetch info for destinations that haven't been loaded yet
    if (scriptLoaded && geocoderRef.current && directionsServiceRef.current) {
      destinations.forEach(dest => {
        if (!dest.loaded && !dest.error) {
          fetchDestinationInfo(dest)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded, destinations.length])

  const handleRemoveDestination = (id) => {
    // Remove marker
    const markerIndex = markersRef.current.findIndex(m => {
      const dest = destinations.find(d => d.id === id)
      return dest && m.getPosition().lat() === dest.coordinates?.lat && m.getPosition().lng() === dest.coordinates?.lng
    })
    if (markerIndex !== -1) {
      markersRef.current[markerIndex].setMap(null)
      markersRef.current.splice(markerIndex, 1)
    }
    
    setDestinations(destinations.filter(dest => dest.id !== id))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddDestination()
    }
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full rounded-lg overflow-hidden shadow-md relative bg-gray-100 flex items-center justify-center" style={{ minHeight: '600px' }}>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-lg text-sm max-w-md mx-4">
          <p className="font-semibold mb-2">⚠️ Google Maps API Key Required</p>
          <p className="text-xs mb-2">
            Add your Google Maps API key to <code className="bg-yellow-200 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in your <code className="bg-yellow-200 px-1 rounded">.env</code> file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ minHeight: '600px' }}>
      {/* Destinations List */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={newDestination}
            onChange={(e) => setNewDestination(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter destination address"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddDestination}
            disabled={!newDestination.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Add
          </button>
        </div>

        {destinations.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {destinations.map((dest, index) => (
              <div
                key={dest.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">{dest.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveDestination(dest.id)}
                    className="ml-2 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-medium flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>

                {!dest.loaded && (
                  <div className="text-xs text-gray-500 ml-8">Loading...</div>
                )}

                {dest.loaded && dest.error && (
                  <div className="text-xs text-red-500 ml-8">{dest.error}</div>
                )}

                {dest.loaded && !dest.error && (
                  <>
                    {/* Estimated Time at Top */}
                    {dest.estimatedTime && (
                      <div className="ml-8 mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xs font-semibold text-blue-900 mb-0.5">
                          ⏱️ Estimated Travel Time
                        </div>
                        <div className="text-sm font-bold text-blue-700">
                          {dest.estimatedTime} {dest.distance && `(${dest.distance})`}
                        </div>
                      </div>
                    )}

                    {/* Air Pollution Info */}
                    {dest.aqi && (
                      <div className="ml-8 p-2 bg-green-50 rounded border border-green-200">
                        <div className="text-xs font-semibold text-green-900 mb-1">
                          🌬️ Air Pollution Rate
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <div className="text-xs text-green-700">AQI: {dest.aqi.aqiCategory}</div>
                            <div className="text-xs text-gray-600">{dest.name}</div>
                          </div>
                          <div
                            className={`px-3 py-1.5 rounded-full border-2 font-bold text-base ${
                              dest.aqi.aqi <= 50
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : dest.aqi.aqi <= 100
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                : dest.aqi.aqi <= 150
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : dest.aqi.aqi <= 200
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-purple-100 text-purple-800 border-purple-300'
                            }`}
                          >
                            {dest.aqi.aqi}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                          <span>PM2.5: <strong>{dest.aqi.pm25} μg/m³</strong></span>
                          <span>PM10: <strong>{dest.aqi.pm10} μg/m³</strong></span>
                        </div>
                      </div>
                    )}

                    {!dest.aqi && dest.loaded && (
                      <div className="ml-8 text-xs text-gray-500">
                        Air pollution data unavailable
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {destinations.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Add destinations to see air pollution rates and estimated travel times
          </p>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Fetching destination information...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm z-10">
            <p className="font-semibold">⚠️ Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MultipleDestinations

