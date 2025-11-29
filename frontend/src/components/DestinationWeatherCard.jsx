import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'

const DestinationWeatherCard = ({ location, coordinates }) => {
  const [weather, setWeather] = useState(null)
  const [aqi, setAqi] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const prevCoordsRef = useRef(null)

  useEffect(() => {
    // Only fetch if coordinates actually changed
    if (!coordinates || !coordinates.lat || !coordinates.lng) return
    
    const coordsKey = `${coordinates.lat},${coordinates.lng}`
    if (prevCoordsRef.current === coordsKey) return
    
    prevCoordsRef.current = coordsKey
    fetchWeatherAndAQI(coordinates.lat, coordinates.lng)
  }, [coordinates])

  const fetchWeatherAndAQI = async (lat, lng) => {
    setLoading(true)
    setError(null)
    try {
      // Fetch weather and AQI in parallel
      const [weatherResponse, aqiResponse] = await Promise.all([
        api.get('/weather', { params: { lat, lng } }),
        api.get('/aqi', { params: { lat, lng } }),
      ])

      if (weatherResponse.data?.success) {
        setWeather(weatherResponse.data.data)
      } else {
        throw new Error(weatherResponse.data?.message || 'Failed to fetch weather')
      }

      if (aqiResponse.data?.success) {
        setAqi(aqiResponse.data.data)
      }
    } catch (error) {
      console.error('Error fetching weather/AQI:', error)
      setError('Unable to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="animate-pulse w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-2 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="card p-4">
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">
            {error || 'Weather data unavailable'}
          </p>
        </div>
      </div>
    )
  }

  const getWeatherColor = (condition) => {
    const conditionLower = condition?.toLowerCase() || ''
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
    }
    if (conditionLower.includes('cloudy')) {
      return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
    }
    if (conditionLower.includes('rain') || conditionLower.includes('storm')) {
      return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
    }
    return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
  }

  const getAQIBadgeColor = (aqiValue) => {
    if (aqiValue <= 50) return 'bg-green-100 text-green-800 border-green-300'
    if (aqiValue <= 100) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (aqiValue <= 150) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (aqiValue <= 200) return 'bg-red-100 text-red-800 border-red-300'
    if (aqiValue <= 300) return 'bg-purple-100 text-purple-800 border-purple-300'
    return 'bg-red-200 text-red-900 border-red-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card border ${getWeatherColor(weather.condition)} p-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">Destination Weather</h4>
          <p className="text-xs text-gray-600 truncate">{location || 'Destination'}</p>
        </div>
        <div className="text-2xl ml-2 flex-shrink-0">
          {weather.icon}
        </div>
      </div>

      {/* Temperature */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {weather.temperature}°
          </span>
          <span className="text-xs text-gray-600">
            Feels like {weather.feelsLike}°
          </span>
        </div>
        <div className="text-sm font-medium text-gray-700 mt-0.5">
          {weather.condition}
        </div>
      </div>

      {/* Weather Details Grid - Compact */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">Humidity</div>
          <div className="text-sm font-semibold text-gray-900">
            {weather.humidity}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">Wind</div>
          <div className="text-sm font-semibold text-gray-900">
            {weather.windSpeed}
          </div>
          <div className="text-xs text-gray-600">{weather.windDirection}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">UV</div>
          <div className="text-sm font-semibold text-gray-900">
            {weather.uvIndex}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">Visibility</div>
          <div className="text-sm font-semibold text-gray-900">
            {weather.visibility}km
          </div>
        </div>
      </div>

      {/* AQI Section - Compact */}
      {aqi && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Air Quality Index</div>
              <div className="text-xs font-medium text-gray-700">
                {aqi.aqiCategory}
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full border font-bold text-base ${getAQIBadgeColor(aqi.aqi)}`}>
              {aqi.aqi}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div>
              <span className="text-gray-500">PM2.5: </span>
              <span className="font-semibold text-gray-900">{aqi.pm25}</span>
            </div>
            <div>
              <span className="text-gray-500">PM10: </span>
              <span className="font-semibold text-gray-900">{aqi.pm10}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default DestinationWeatherCard

