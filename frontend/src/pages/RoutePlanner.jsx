import { useState, useEffect } from 'react'
import GoogleMapView from '../components/GoogleMapView'
import MultipleDestinations from '../components/MultipleDestinations'
import RouteSummaryCard from '../components/RouteSummaryCard'
import DestinationWeatherCard from '../components/DestinationWeatherCard'
import LoaderAnimation from '../components/LoaderAnimation'
import api from '../services/api'
import { calculateSafetyScore } from '../utils/safetyScore'

const RoutePlanner = () => {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [showUserLocation, setShowUserLocation] = useState(false)
  const [routeOptions, setRouteOptions] = useState([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [viewMode, setViewMode] = useState('single') // 'single' or 'commutes'
  const [destinationCoords, setDestinationCoords] = useState(null)

  // Get user's current location
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

  const handlePlanRoute = async () => {
    if (!origin || !destination) {
      setError('Please enter both origin and destination')
      return
    }

    setLoading(true)
    setError(null)
    setRoute(null)
    setRouteOptions([])

    // Google Maps will handle routing client-side, so we just set the origin/destination
    // The GoogleMapView component will automatically fetch and display the route
    setLoading(false)
  }

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setOrigin(`${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`)
      setShowUserLocation(true)
    } else {
      setError('Unable to get your current location')
    }
  }

  const handleRouteLoad = async (routeData) => {
    // Calculate safety score for the route
    let safetyScore = 75 // Default score
    
    try {
      // Fetch safety data for start and destination points
      if (routeData.start && routeData.destination) {
        // Set coordinates for destination weather card
        setDestinationCoords({
          lat: routeData.destination.lat,
          lng: routeData.destination.lng,
        })

        const startResponse = await api.get('/surroundings', {
          params: {
            lat: routeData.start.lat,
            lng: routeData.start.lng,
          },
        })
        
        const destResponse = await api.get('/surroundings', {
          params: {
            lat: routeData.destination.lat,
            lng: routeData.destination.lng,
          },
        })

        if (startResponse.data?.success && destResponse.data?.success) {
          const startSafety = startResponse.data.data
          const destSafety = destResponse.data.data
          
          // Calculate average safety score
          const startScore = calculateSafetyScore({
            crowdDensity: startSafety.crowdDensity || 50,
            lighting: startSafety.lighting || 50,
            incidents: startSafety.incidentsNearby || 5,
            weatherRisk: startSafety.weatherRisk || 30,
          })
          
          const destScore = calculateSafetyScore({
            crowdDensity: destSafety.crowdDensity || 50,
            lighting: destSafety.lighting || 50,
            incidents: destSafety.incidentsNearby || 5,
            weatherRisk: destSafety.weatherRisk || 30,
          })
          
          // Convert 0-3 scale to 0-100 percentage
          const avgScore = ((startScore + destScore) / 2 / 3) * 100
          safetyScore = Math.round(avgScore)
        }
      }
    } catch (error) {
      console.warn('Failed to fetch safety data, using default score:', error)
    }

    // Add safety score to route data
    const routeWithSafety = {
      ...routeData,
      safetyScore: safetyScore,
    }

    setRoute(routeWithSafety)
    
    // Set route options if alternatives exist
    if (routeData.alternatives && routeData.alternatives.length > 0) {
      setRouteOptions([routeWithSafety, ...routeData.alternatives])
    } else {
      setRouteOptions([routeWithSafety])
    }
  }

  // Get origin and destination for Google Maps
  const getOrigin = () => {
    if (!origin) return null
    // If it's coordinates, convert to Google Maps format
    if (origin.includes(',')) {
      const [lat, lng] = origin.split(',').map(Number)
      return { lat, lng }
    }
    // If it's an address, return as string
    return origin
  }

  const getDestination = () => {
    if (!destination) return null
    // If it's coordinates, convert to Google Maps format
    if (destination.includes(',')) {
      const [lat, lng] = destination.split(',').map(Number)
      return { lat, lng }
    }
    // If it's an address, return as string
    return destination
  }

  // Calculate average congestion
  const getAverageCongestion = () => {
    if (!route?.congestion || !Array.isArray(route.congestion)) return null
    const avg = route.congestion.reduce((a, b) => a + b, 0) / route.congestion.length
    return Math.round(avg)
  }

  const getCongestionLevel = (value) => {
    if (!value) return 'Unknown'
    if (value <= 30) return 'Low'
    if (value <= 60) return 'Moderate'
    return 'High'
  }

  const getCongestionColor = (value) => {
    if (!value) return 'gray'
    if (value <= 30) return 'green'
    if (value <= 60) return 'yellow'
    return 'red'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Route Planner</h1>
        <p className="text-gray-600">Plan your route with real-time traffic and safety in mind</p>
      </div>

      {/* View Mode Toggle */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Plan Your Route</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Single Route
            </button>
            <button
              onClick={() => setViewMode('commutes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'commutes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Multiple Destinations
            </button>
          </div>
        </div>
        
        {viewMode === 'single' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Origin
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                disabled={!userLocation}
              >
                Use Current Location
              </button>
            </div>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Enter starting location or address"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination or address"
              className="input-field"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePlanRoute}
            disabled={!origin || !destination || loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Planning Route...' : 'Plan Route with Google Maps'}
          </button>
        </div>
        )}
      </div>

      {/* Route Options */}
      {routeOptions.length > 1 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Route Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {routeOptions.map((opt, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedRouteIndex(index)
                  setRoute(opt)
                }}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedRouteIndex === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="font-semibold text-gray-900">Route {index + 1}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {opt.distance ? `${opt.distance.toFixed(1)} km` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  {opt.duration ? `${opt.duration} min` : 'N/A'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map and Route Summary */}
      {viewMode === 'commutes' ? (
        <div className="card p-0 overflow-hidden" style={{ minHeight: '600px' }}>
          <MultipleDestinations userLocation={userLocation} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GoogleMapView
              center={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: 3.1390, lng: 101.6869 }}
              zoom={13}
              height="500px"
              origin={getOrigin()}
              destination={getDestination()}
              route={route}
              onRouteLoad={handleRouteLoad}
            />
          </div>
          <div>
            <RouteSummaryCard route={route} loading={loading} />
          
          {/* Traffic Congestion Info */}
          {route && getAverageCongestion() !== null && (
            <div className="card mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Traffic Congestion</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Level:</span>
                  <span className={`font-bold text-${getCongestionColor(getAverageCongestion())}-600`}>
                    {getCongestionLevel(getAverageCongestion())}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Congestion Score:</span>
                  <span className="font-medium text-gray-900">
                    {getAverageCongestion()}/100
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>0-30: Low</span>
                    <div className="w-3 h-3 bg-yellow-500 rounded ml-2"></div>
                    <span>30-60: Moderate</span>
                    <div className="w-3 h-3 bg-red-500 rounded ml-2"></div>
                    <span>60+: High</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Destination Weather & AQI - Only show in single route mode */}
      {viewMode === 'single' && destinationCoords && (
        <DestinationWeatherCard
          location={destination || 'Destination'}
          coordinates={destinationCoords}
        />
      )}
    </div>
  )
}

export default RoutePlanner
