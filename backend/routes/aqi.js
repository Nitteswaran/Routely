import express from 'express'
const router = express.Router()

// Haversine formula to calculate distance between two coordinates in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Real Malaysian locations with good AQI (parks, beaches, nature areas)
// These are actual coordinates of popular places in Malaysia
const malaysianPlaces = [
  {
    id: 1,
    name: 'Taman Tasik Titiwangsa',
    type: 'park',
    address: 'Titiwangsa, Kuala Lumpur',
    lat: 3.1725,
    lng: 101.7008,
    aqi: 25,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 12,
    pm10: 18,
    description: 'Large urban park with lake, excellent for morning exercise',
    amenities: ['Parking', 'Restrooms', 'Walking Paths', 'Lake'],
  },
  {
    id: 2,
    name: 'KLCC Park',
    type: 'park',
    address: 'Kuala Lumpur City Centre, KL',
    lat: 3.1578,
    lng: 101.7120,
    aqi: 28,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 14,
    pm10: 20,
    description: 'Beautiful park in the heart of KL with fountains and gardens',
    amenities: ['Parking', 'Restrooms', 'Children Playground', 'Fountains'],
  },
  {
    id: 3,
    name: 'Perdana Botanical Gardens',
    type: 'park',
    address: 'Jalan Perdana, Kuala Lumpur',
    lat: 3.1478,
    lng: 101.6886,
    aqi: 22,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 10,
    pm10: 16,
    description: 'Extensive botanical gardens with diverse plant collections',
    amenities: ['Parking', 'Restrooms', 'Café', 'Museum'],
  },
  {
    id: 4,
    name: 'Batu Caves',
    type: 'outdoor',
    address: 'Gombak, Selangor',
    lat: 3.2373,
    lng: 101.6839,
    aqi: 30,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 15,
    pm10: 22,
    description: 'Limestone hill with caves and temple, elevated location with good air',
    amenities: ['Parking', 'Restrooms', 'Temple', 'Cave Tours'],
  },
  {
    id: 5,
    name: 'Taman Botani Negara Shah Alam',
    type: 'park',
    address: 'Shah Alam, Selangor',
    lat: 3.0833,
    lng: 101.5167,
    aqi: 20,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 9,
    pm10: 15,
    description: 'National botanical garden with extensive green spaces',
    amenities: ['Parking', 'Restrooms', 'Walking Trails', 'Picnic Areas'],
  },
  {
    id: 6,
    name: 'Penang National Park',
    type: 'park',
    address: 'Teluk Bahang, Penang',
    lat: 5.4667,
    lng: 100.2000,
    aqi: 18,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 8,
    pm10: 14,
    description: 'Coastal national park with beaches and forest trails',
    amenities: ['Parking', 'Restrooms', 'Beach Access', 'Hiking Trails'],
  },
  {
    id: 7,
    name: 'Desaru Beach',
    type: 'beach',
    address: 'Desaru, Johor',
    lat: 1.5667,
    lng: 104.1333,
    aqi: 24,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 11,
    pm10: 18,
    description: 'Beautiful beach with fresh sea air and clean environment',
    amenities: ['Parking', 'Restrooms', 'Beach Access', 'Resorts'],
  },
  {
    id: 8,
    name: 'Cameron Highlands',
    type: 'mountain',
    address: 'Cameron Highlands, Pahang',
    lat: 4.4833,
    lng: 101.3833,
    aqi: 15,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 6,
    pm10: 12,
    description: 'Highland area with excellent air quality and cool climate',
    amenities: ['Parking', 'Restaurants', 'Tea Plantations', 'Hiking'],
  },
  {
    id: 9,
    name: 'Taman Negara',
    type: 'forest',
    address: 'Kuala Tahan, Pahang',
    lat: 4.7000,
    lng: 102.4333,
    aqi: 12,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 5,
    pm10: 10,
    description: 'Ancient rainforest with pristine air quality',
    amenities: ['Parking', 'Accommodation', 'Jungle Trails', 'River Activities'],
  },
  {
    id: 10,
    name: 'Putrajaya Wetlands',
    type: 'park',
    address: 'Putrajaya',
    lat: 2.9333,
    lng: 101.6833,
    aqi: 26,
    aqiCategory: 'Good',
    aqiColor: '#00e400',
    pm25: 13,
    pm10: 19,
    description: 'Man-made wetlands with diverse birdlife and clean air',
    amenities: ['Parking', 'Restrooms', 'Bird Watching', 'Cycling Paths'],
  },
]

// GET /api/aqi - Get AQI for a specific location
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      })
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values',
      })
    }

    // Find nearest place to estimate AQI
    let nearestPlace = malaysianPlaces[0]
    let minDistance = calculateDistance(latitude, longitude, nearestPlace.lat, nearestPlace.lng)

    malaysianPlaces.forEach(place => {
      const distance = calculateDistance(latitude, longitude, place.lat, place.lng)
      if (distance < minDistance) {
        minDistance = distance
        nearestPlace = place
      }
    })

    // Generate AQI based on location (simulate real-time AQI)
    // In production, integrate with a real AQI API like OpenWeatherMap Air Pollution API
    const hash = Math.floor((latitude * 100 + longitude) % 100)
    const baseAQI = nearestPlace.aqi
    const variation = (hash % 20) - 10 // -10 to +10 variation
    const aqi = Math.max(0, Math.min(300, baseAQI + variation))

    // Determine AQI category and color
    let aqiCategory, aqiColor
    if (aqi <= 50) {
      aqiCategory = 'Good'
      aqiColor = '#00e400'
    } else if (aqi <= 100) {
      aqiCategory = 'Moderate'
      aqiColor = '#ffff00'
    } else if (aqi <= 150) {
      aqiCategory = 'Unhealthy for Sensitive Groups'
      aqiColor = '#ff7e00'
    } else if (aqi <= 200) {
      aqiCategory = 'Unhealthy'
      aqiColor = '#ff0000'
    } else if (aqi <= 300) {
      aqiCategory = 'Very Unhealthy'
      aqiColor = '#8f3f97'
    } else {
      aqiCategory = 'Hazardous'
      aqiColor = '#7e0023'
    }

    // Generate PM2.5 and PM10 based on AQI
    const pm25 = Math.round((aqi / 2) + (hash % 10))
    const pm10 = Math.round((aqi / 1.5) + (hash % 15))

    res.json({
      success: true,
      data: {
        aqi: Math.round(aqi),
        aqiCategory,
        aqiColor,
        pm25,
        pm10,
        location: {
          lat: latitude,
          lng: longitude,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching AQI:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AQI data',
      error: error.message,
    })
  }
})

// GET /api/aqi/places - Get nearby places with good AQI
router.get('/places', async (req, res) => {
  try {
    console.log('AQI places endpoint called with:', req.query)
    const { lat, lng, radius = 10 } = req.query // radius in km

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      })
    }

    // Validate lat/lng are numbers
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values',
      })
    }

    // Calculate real distances from user location
    const placesWithDistance = malaysianPlaces.map(place => {
      const distance = calculateDistance(latitude, longitude, place.lat, place.lng)
      return {
        ...place,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
      }
    })

    // Filter by radius and sort by distance
    const radiusNum = parseFloat(radius) || 10
    const filteredPlaces = placesWithDistance
      .filter(place => place.distance <= radiusNum)
      .sort((a, b) => a.distance - b.distance)

    // If no places found within radius, return the 5 nearest places anyway
    const resultPlaces = filteredPlaces.length > 0 
      ? filteredPlaces 
      : placesWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)

    res.json({
      success: true,
      data: resultPlaces,
      count: resultPlaces.length,
      userLocation: {
        lat: latitude,
        lng: longitude,
      },
      radius: radiusNum,
    })
  } catch (error) {
    console.error('Error fetching AQI places:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch places with good AQI',
      error: error.message,
    })
  }
})

export default router
