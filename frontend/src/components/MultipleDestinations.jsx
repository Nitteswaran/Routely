import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Component to update map view when destinations change
function MapUpdater({ userLocation, destinations }) {
  const map = useMap()

  useEffect(() => {
    if (!userLocation || destinations.length === 0) return

    const bounds = L.latLngBounds([userLocation])
    destinations.forEach(dest => {
      if (dest.coordinates) {
        bounds.extend([dest.coordinates.lat, dest.coordinates.lng])
      }
    })
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, userLocation, destinations])

  return null
}

const MultipleDestinations = ({ userLocation }) => {
  const [destinations, setDestinations] = useState([])
  const [newDestination, setNewDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mapCenter, setMapCenter] = useState([3.1390, 101.6869]) // Default: Kuala Lumpur

  // Update map center when user location changes
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng])
    }
  }, [userLocation])

  // Calculate travel times and get transit recommendations
  const calculateTravelTimes = async (origin, destination) => {
    const results = {
      driving: null,
      transit: null,
      walking: null,
      transitRecommendations: [],
    }

    if (!GOOGLE_MAPS_API_KEY) {
      // Fallback: Calculate estimated times without API
      const distance = calculateDistance(
        origin.lat, origin.lng,
        destination.lat, destination.lng
      )
      
      results.driving = {
        duration: Math.round(distance * 1.5), // ~1.5 min per km
        distance: distance,
        text: `${Math.round(distance * 1.5)} min`,
      }
      
      results.transit = {
        duration: Math.round(distance * 2.5), // Transit is slower
        distance: distance,
        text: `${Math.round(distance * 2.5)} min`,
      }
      
      results.walking = {
        duration: Math.round(distance * 12), // ~12 min per km walking
        distance: distance,
        text: `${Math.round(distance * 12)} min`,
      }

      // Generate transit recommendations
      results.transitRecommendations = generateTransitRecommendations(origin, destination, distance)
      return results
    }

    try {
      // Use Google Maps Directions API for accurate calculations
      const originStr = `${origin.lat},${origin.lng}`
      const destStr = `${destination.lat},${destination.lng}`

      // Get driving time
      const drivingResponse = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${originStr}&destination=${destStr}&` +
        `mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      )
      const drivingData = await drivingResponse.json()
      if (drivingData.routes && drivingData.routes.length > 0) {
        const leg = drivingData.routes[0].legs[0]
        results.driving = {
          duration: Math.round(leg.duration.value / 60),
          distance: leg.distance.value / 1000,
          text: leg.duration.text,
        }
      }

      // Get transit time
      const transitResponse = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${originStr}&destination=${destStr}&` +
        `mode=transit&key=${GOOGLE_MAPS_API_KEY}`
      )
      const transitData = await transitResponse.json()
      if (transitData.routes && transitData.routes.length > 0) {
        const route = transitData.routes[0]
        const leg = route.legs[0]
        results.transit = {
          duration: Math.round(leg.duration.value / 60),
          distance: leg.distance.value / 1000,
          text: leg.duration.text,
          steps: route.legs.flatMap(l => l.steps.map(step => ({
            instruction: step.html_instructions,
            travelMode: step.travel_mode,
            duration: step.duration?.text,
            transitDetails: step.transit_details,
          }))),
        }
        results.transitRecommendations = parseTransitRecommendations(route)
      } else {
        // Fallback transit recommendations if no transit route found
        const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng)
        results.transitRecommendations = generateTransitRecommendations(origin, destination, distance)
      }

      // Get walking time
      const walkingResponse = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${originStr}&destination=${destStr}&` +
        `mode=walking&key=${GOOGLE_MAPS_API_KEY}`
      )
      const walkingData = await walkingResponse.json()
      if (walkingData.routes && walkingData.routes.length > 0) {
        const leg = walkingData.routes[0].legs[0]
        results.walking = {
          duration: Math.round(leg.duration.value / 60),
          distance: leg.distance.value / 1000,
          text: leg.duration.text,
        }
      }
    } catch (err) {
      console.error('Error calculating travel times:', err)
      // Fallback calculation
      const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng)
      results.driving = { duration: Math.round(distance * 1.5), distance, text: `${Math.round(distance * 1.5)} min` }
      results.transit = { duration: Math.round(distance * 2.5), distance, text: `${Math.round(distance * 2.5)} min` }
      results.walking = { duration: Math.round(distance * 12), distance, text: `${Math.round(distance * 12)} min` }
      results.transitRecommendations = generateTransitRecommendations(origin, destination, distance)
    }

    return results
  }

  // Parse transit recommendations from Google Maps response
  const parseTransitRecommendations = (route) => {
    const recommendations = []
    
    route.legs.forEach(leg => {
      leg.steps.forEach(step => {
        if (step.travel_mode === 'TRANSIT' && step.transit_details) {
          const details = step.transit_details
          recommendations.push({
            type: details.line?.vehicle?.type || 'TRANSIT',
            name: details.line?.name || 'Transit',
            shortName: details.line?.short_name || '',
            headsign: details.headsign || '',
            numStops: details.num_stops || 0,
            duration: step.duration?.text || '',
            departureStop: details.departure_stop?.name || '',
            arrivalStop: details.arrival_stop?.name || '',
          })
        }
      })
    })

    return recommendations
  }

  // Generate transit recommendations (fallback for when API doesn't return transit)
  const generateTransitRecommendations = (origin, destination, distance) => {
    const recommendations = []
    
    // Simulate Malaysia transit options (LRT, MRT, Monorail, Bus)
    if (distance > 2) {
      // For longer distances, suggest LRT/MRT
      recommendations.push({
        type: 'RAIL',
        name: 'LRT / MRT',
        shortName: 'LRT',
        headsign: 'City Center',
        numStops: Math.max(3, Math.round(distance / 2)),
        duration: `${Math.round(distance * 2)} min`,
        departureStop: 'Nearest LRT Station',
        arrivalStop: 'Destination Station',
        icon: '🚇',
      })
    }

    if (distance > 1) {
      // Suggest bus for medium distances
      recommendations.push({
        type: 'BUS',
        name: 'RapidKL Bus',
        shortName: 'Bus',
        headsign: 'City Route',
        numStops: Math.max(5, Math.round(distance * 3)),
        duration: `${Math.round(distance * 3)} min`,
        departureStop: 'Nearest Bus Stop',
        arrivalStop: 'Destination Bus Stop',
        icon: '🚌',
      })
    }

    // Always suggest walking for short distances
    if (distance < 2) {
      recommendations.push({
        type: 'WALKING',
        name: 'Walking',
        shortName: 'Walk',
        headsign: '',
        numStops: 0,
        duration: `${Math.round(distance * 12)} min`,
        departureStop: 'Current Location',
        arrivalStop: 'Destination',
        icon: '🚶',
      })
    }

    return recommendations
  }

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Geocode address to coordinates
  const geocodeAddress = async (address) => {
    if (!GOOGLE_MAPS_API_KEY) {
      // Fallback: Return mock coordinates
      return { lat: 3.1390 + Math.random() * 0.1, lng: 101.6869 + Math.random() * 0.1 }
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return { lat: location.lat, lng: location.lng }
      }
    } catch (err) {
      console.error('Geocoding error:', err)
    }
    return null
  }

  const fetchDestinationInfo = async (destination) => {
    setLoading(true)
    setError(null)

    try {
      // Geocode the destination
      const coords = await geocodeAddress(destination.address)
      if (!coords) {
        throw new Error('Could not find location')
      }

      // Calculate travel times from user location
      const origin = userLocation || { lat: 3.1390, lng: 101.6869 }
      const travelInfo = await calculateTravelTimes(origin, coords)

      // Fetch AQI data
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

      // Update destination with all info
      setDestinations(prev => prev.map(dest =>
        dest.id === destination.id
          ? {
              ...dest,
              coordinates: coords,
              ...travelInfo,
              aqi: aqiData,
              loaded: true,
            }
          : dest
      ))
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
    fetchDestinationInfo(destination)
  }

  const handleRemoveDestination = (id) => {
    setDestinations(destinations.filter(dest => dest.id !== id))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddDestination()
    }
  }

  // Get best transportation option
  const getBestTransportation = (dest) => {
    if (!dest.loaded || dest.error) return null

    const options = []
    if (dest.driving) options.push({ type: 'driving', ...dest.driving, icon: '🚗' })
    if (dest.transit) options.push({ type: 'transit', ...dest.transit, icon: '🚇' })
    if (dest.walking) options.push({ type: 'walking', ...dest.walking, icon: '🚶' })

    if (options.length === 0) return null

    // Sort by duration and return the fastest
    options.sort((a, b) => a.duration - b.duration)
    return options[0]
  }


  return (
    <div className="w-full h-full flex flex-col" style={{ minHeight: '600px' }}>
      {/* Destinations List */}
      <div className="bg-white p-4 border-b border-gray-200 max-h-96 overflow-y-auto">
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
          <div className="space-y-3">
            {destinations.map((dest, index) => {
              const bestTransport = getBestTransportation(dest)
              return (
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
                      {/* Simple Distance & Time Info */}
                      {bestTransport && (
                        <div className="ml-8 mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-xs text-gray-600">
                            Distance: <span className="font-semibold text-gray-900">{bestTransport.distance?.toFixed(1)} km</span>
                            {bestTransport.text && (
                              <> • Estimated time: <span className="font-semibold text-gray-900">{bestTransport.text}</span></>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Air Pollution Info */}
                      {dest.aqi && (
                        <div className="ml-8 p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-xs font-semibold text-green-900 mb-1">
                            🌬️ Air Quality
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-green-700">AQI: {dest.aqi.aqiCategory}</div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${
                              dest.aqi.aqi <= 50 ? 'bg-green-100 text-green-800' :
                              dest.aqi.aqi <= 100 ? 'bg-yellow-100 text-yellow-800' :
                              dest.aqi.aqi <= 150 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {dest.aqi.aqi}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {destinations.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Add destinations to see distance, travel time, and air quality information
          </p>
        )}
      </div>

      {/* Leaflet Map */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>
                <div className="text-center">
                  <div className="font-semibold">📍 Your Location</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Markers */}
          {destinations.map((dest, index) => {
            if (!dest.coordinates) return null
            const bestTransport = getBestTransportation(dest)
            return (
              <Marker
                key={dest.id}
                position={[dest.coordinates.lat, dest.coordinates.lng]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="
                    background-color: #3b82f6;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 12px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  ">${index + 1}</div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              >
                <Popup>
                  <div>
                    <div className="font-semibold mb-1">{dest.name}</div>
                    {bestTransport && (
                      <div className="text-xs text-gray-600">
                        Best: {bestTransport.icon} {bestTransport.text}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Route Lines */}
          {userLocation && destinations.map((dest) => {
            if (!dest.coordinates) return null
            return (
              <Polyline
                key={`route-${dest.id}`}
                positions={[
                  [userLocation.lat, userLocation.lng],
                  [dest.coordinates.lat, dest.coordinates.lng],
                ]}
                color="#3b82f6"
                weight={3}
                opacity={0.6}
                dashArray="10, 5"
              />
            )
          })}

          <MapUpdater userLocation={userLocation} destinations={destinations} />
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Fetching destination information...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm z-[1000]">
            <p className="font-semibold">⚠️ Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MultipleDestinations
