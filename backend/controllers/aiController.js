import asyncHandler from '../utils/asyncHandler.js'

/**
 * Chat with AI using Gemini API
 * @route POST /api/ai/chat
 * @body {string} query - User's question
 */
export const chatWithAI = asyncHandler(async (req, res) => {
  const { query } = req.body

  if (!query || !query.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Query is required',
    })
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  // Default to gemini-2.0-flash-lite (lightweight and efficient)
  // Alternative options: gemini-2.0-flash, gemini-2.5-flash, gemini-pro-latest, gemini-2.5-pro
  // Users can override with GEMINI_MODEL in .env if needed
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'
  const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta'
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  
  // Log the model being used for debugging
  console.log(`[Gemini API] Using model: ${GEMINI_MODEL}, API version: ${GEMINI_API_VERSION}`)

  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      message: 'Gemini API key is not configured',
    })
  }

  try {
    // Create context for the AI about Routely's purpose
    const systemPrompt = `You are a helpful AI assistant for Routely, a smart urban travel and safety app in Malaysia. 
You help users with questions about:
- Route planning and safety
- Air quality and pollution information
- Traffic conditions
- Safe areas and routes
- Best times to travel
- Health and wellbeing related to urban travel

Provide helpful, accurate, and concise answers. When discussing routes or locations, focus on Malaysia, especially areas like Kuala Lumpur, Penang, Johor, and Selangor.
If you don't have real-time data, provide general advice based on common patterns and best practices.

User question: ${query.trim()}`

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000) // 55 seconds timeout

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: GEMINI_API_URL.replace(GEMINI_API_KEY, 'HIDDEN'),
      })
      
      if (response.status === 401 || response.status === 403) {
        return res.status(500).json({
          success: false,
          message: 'Invalid Gemini API key. Please check your configuration in backend/.env',
        })
      }

      if (response.status === 404) {
        const errorMessage = errorData.error?.message || `Model "${GEMINI_MODEL}" not found. The model name may be incorrect or deprecated.`
        
        // Try to provide helpful suggestion
        let suggestion = `Please try updating GEMINI_MODEL in backend/.env. `
        suggestion += `Common working models: "gemini-pro" (for v1beta), "gemini-2.0-flash-exp" (newer). `
        suggestion += `You can also list available models with: curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"`
        
        return res.status(500).json({
          success: false,
          message: `Gemini API 404 Error: ${errorMessage}. ${suggestion}`,
        })
      }

      const errorMessage = errorData.error?.message || `Gemini API error: ${response.status} ${response.statusText}`
      throw new Error(errorMessage)
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API')
    }

    const aiResponse = data.candidates[0].content.parts[0].text

    res.json({
      success: true,
      data: {
        response: aiResponse,
        query: query.trim(),
      },
    })
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    
    // Fallback to local intelligent response system
    console.log('[Fallback] Using local response system due to Gemini API failure')
    const fallbackResponse = generateFallbackResponse(query.trim())
    
    if (fallbackResponse) {
      return res.json({
        success: true,
        data: {
          response: fallbackResponse,
          query: query.trim(),
          fallback: true, // Indicate this is a fallback response
        },
      })
    }
    
    // If fallback also fails, return error
    let statusCode = 500
    let message = 'Failed to get AI response. Please try again later.'
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      message = 'Unable to connect to Gemini API. Please check your internet connection.'
    } else if (error.message.includes('timeout')) {
      message = 'Request to Gemini API timed out. Please try again.'
    } else if (error.message) {
      message = error.message
    }
    
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
})

/**
 * Fallback response generator when Gemini API is unavailable
 * Provides intelligent responses based on keywords and patterns
 */
function generateFallbackResponse(query) {
  const lowerQuery = query.toLowerCase()
  
  // Route safety questions
  if (lowerQuery.includes('safe') || lowerQuery.includes('safety') || lowerQuery.includes('secure')) {
    if (lowerQuery.includes('jog') || lowerQuery.includes('running') || lowerQuery.includes('run')) {
      return `For safe jogging in Malaysia, I recommend:

🏃 **Best Times:**
• Early morning (6-8 AM) - Lower traffic, better air quality
• Evening (6-7 PM) - Still daylight, moderate traffic

📍 **Safe Locations:**
• KLCC Park - Well-lit, secure, popular with joggers
• Taman Tasik Titiwangsa - Large park with good visibility
• Perdana Botanical Gardens - Safe, monitored areas

💡 **Safety Tips:**
• Stick to well-lit, populated routes
• Avoid isolated areas, especially at night
• Share your route with guardians
• Use the Route Planner to check air quality before heading out
• Consider using the Guardian Connect feature for location sharing

Would you like me to help you plan a specific route?`
    }
    
    if (lowerQuery.includes('night') || lowerQuery.includes('evening') || lowerQuery.includes('dark')) {
      return `For safe travel at night in Malaysia:

🌙 **Night Safety Tips:**
• Use well-lit main roads and avoid shortcuts through alleys
• Stay in populated areas with good visibility
• Share your live location with guardians using the Guardian Connect feature
• Plan your route in advance using the Route Planner

📍 **Safer Areas at Night:**
• City center areas (KLCC, Bukit Bintang) - Well-lit and monitored
• Shopping malls and their surroundings
• Areas with active night markets or food stalls

🚗 **Transportation:**
• Use ride-sharing services (Grab, Uber) for late-night travel
• If walking, stay on main roads with streetlights
• Avoid isolated parking areas

💡 **Emergency:**
• Keep the AirSOS feature ready for emergencies
• Ensure your guardians are set up in Guardian Connect

Would you like help setting up location sharing with your guardians?`
    }
    
    return `For route safety in Malaysia:

✅ **General Safety Guidelines:**
• Plan routes through well-lit, populated areas
• Check air quality before heading out (use Route Planner)
• Share your location with trusted guardians
• Avoid isolated areas, especially at night
• Use main roads with good visibility

📍 **Safe Route Planning:**
• Use the Route Planner to see traffic and safety scores
• Check air quality for your destination
• Review multiple route options

💡 **Features to Use:**
• Guardian Connect - Share live location with trusted contacts
• Route Planner - Get safety scores and air quality data
• AirSOS - Emergency assistance when needed

Would you like help with a specific route or location?`
  }
  
  // Air quality questions
  if (lowerQuery.includes('air') || lowerQuery.includes('pollution') || lowerQuery.includes('aqi') || lowerQuery.includes('clean')) {
    if (lowerQuery.includes('cleanest') || lowerQuery.includes('best air')) {
      return `For the cleanest air in Malaysia:

🌿 **Areas with Best Air Quality:**
• Cameron Highlands - High altitude, excellent air quality
• Taman Negara - Pristine rainforest air
• Penang National Park - Coastal fresh air
• Putrajaya Wetlands - Clean, filtered air
• KLCC Park - Urban park with better air quality

📍 **Finding Clean Air:**
• Use the Route Planner to check AQI (Air Quality Index) for any destination
• Parks and green spaces generally have better air quality
• Coastal areas often have fresher air
• Avoid industrial areas and heavy traffic zones

💡 **Tips:**
• Check AQI before planning outdoor activities
• Early morning (6-8 AM) usually has better air quality
• Use the Multiple Destinations feature to compare air quality at different locations

Would you like to check air quality for a specific location?`
    }
    
    return `About Air Quality in Malaysia:

🌬️ **Understanding AQI:**
• 0-50: Good - Safe for everyone
• 51-100: Moderate - Acceptable for most people
• 101-150: Unhealthy for Sensitive Groups
• 151-200: Unhealthy - Avoid outdoor activities
• 201+: Very Unhealthy - Stay indoors

📍 **Check Air Quality:**
• Use the Route Planner to see real-time AQI for any destination
• The Multiple Destinations feature shows AQI for each location
• Weather cards display current air quality data

💡 **Improving Air Quality Exposure:**
• Plan routes through parks and green spaces
• Avoid heavy traffic areas during rush hours
• Check AQI before outdoor activities
• Use air quality data when planning routes

Would you like to check the air quality for a specific destination?`
  }
  
  // Traffic questions
  if (lowerQuery.includes('traffic') || lowerQuery.includes('congestion') || lowerQuery.includes('busy') || lowerQuery.includes('jam')) {
    return `About Traffic in Malaysia:

🚗 **Best Times to Avoid Traffic:**
• Avoid rush hours: 7-9 AM and 5-7 PM
• Weekends generally have lighter traffic
• Public holidays see reduced traffic

📍 **Traffic Planning:**
• Use the Route Planner to see real-time traffic congestion
• Check multiple route options for better alternatives
• The Route Summary shows traffic levels for each route

💡 **Tips:**
• Plan routes during off-peak hours when possible
• Use the Multiple Destinations feature to compare travel times
• Check transportation recommendations for each destination

🚌 **Alternative Transportation:**
• Public transit (LRT, MRT, buses) can avoid traffic
• Consider walking or cycling for short distances
• Use the transportation recommendations in Multiple Destinations

Would you like help planning a route with minimal traffic?`
  }
  
  // Route planning questions
  if (lowerQuery.includes('route') || lowerQuery.includes('directions') || lowerQuery.includes('way') || lowerQuery.includes('path')) {
    return `Route Planning in Routely:

🗺️ **Route Planner Features:**
• Plan routes with real-time traffic data
• See safety scores for each route
• Check air quality at your destination
• View multiple route options
• Get transportation recommendations

📍 **How to Use:**
1. Go to Route Planner
2. Enter your origin and destination
3. View route options with safety and traffic data
4. Check weather and air quality at destination
5. Share your route with guardians if needed

💡 **Multiple Destinations:**
• Add multiple destinations to compare
• See estimated travel times
• Check air quality for each location
• Get transportation recommendations

Would you like help with a specific route?`
  }
  
  // General travel advice
  if (lowerQuery.includes('travel') || lowerQuery.includes('trip') || lowerQuery.includes('journey')) {
    return `Travel Planning Tips for Malaysia:

✈️ **Planning Your Trip:**
• Use Route Planner to check routes and safety
• Check air quality for your destinations
• Set up Guardian Connect to share your location
• Review traffic conditions before heading out

📍 **Key Features:**
• Route Planner - Plan safe routes with real-time data
• Multiple Destinations - Compare locations and air quality
• Guardian Connect - Share live location with trusted contacts
• AirSOS - Emergency assistance when needed

💡 **Safety Tips:**
• Always share your route with guardians
• Check air quality before outdoor activities
• Plan routes through safe, well-lit areas
• Keep emergency contacts ready

Would you like help with a specific aspect of travel planning?`
  }
  
  // Health questions
  if (lowerQuery.includes('health') || lowerQuery.includes('healthy') || lowerQuery.includes('exercise') || lowerQuery.includes('fitness')) {
    return `Health and Fitness Tips for Urban Travel:

🏃 **Healthy Routes:**
• Parks and green spaces for jogging/walking
• Check air quality before outdoor exercise
• Early morning (6-8 AM) for best air quality
• Use Route Planner to find safe exercise routes

🌿 **Air Quality for Health:**
• Avoid exercising when AQI is above 100
• Choose routes with lower pollution levels
• Parks generally have better air quality
• Check destination AQI before planning activities

💡 **Features:**
• Route Planner shows air quality at destinations
• Multiple Destinations compares air quality
• Guardian Connect for safety during activities

Would you like to find healthy routes in a specific area?`
  }
  
  // Location-specific questions
  if (lowerQuery.includes('kuala lumpur') || lowerQuery.includes('kl') || lowerQuery.includes('penang') || lowerQuery.includes('johor') || lowerQuery.includes('selangor')) {
    return `For ${query.match(/\b(kuala lumpur|kl|penang|johor|selangor|malaysia)\b/i)?.[0] || 'this location'}:

📍 **Planning Your Visit:**
• Use Route Planner to check routes and safety
• Check air quality for your destination
• Review traffic conditions
• Find safe areas and parks

💡 **Features to Use:**
• Route Planner - Plan your routes with safety data
• Multiple Destinations - Compare locations and air quality
• Guardian Connect - Share your location during travel
• Weather & AQI - Check conditions at your destination

Would you like help planning a specific route or checking air quality?`
  }
  
  // Default helpful response
  return `I'm here to help with your travel and safety questions in Malaysia! 

Here's what I can assist with:

🗺️ **Route Planning**
• Plan safe routes with real-time traffic data
• Check safety scores for different routes
• Find the best transportation options

🌬️ **Air Quality**
• Check AQI (Air Quality Index) for any location
• Find areas with cleanest air
• Plan activities based on air quality

🚗 **Traffic & Transportation**
• Avoid traffic congestion
• Get transportation recommendations
• Compare travel times

📍 **Safety**
• Find safe routes and areas
• Get safety tips for different times
• Plan secure travel routes

💡 **Features Available:**
• Route Planner - Plan routes with safety and traffic data
• Multiple Destinations - Compare locations and air quality
• Guardian Connect - Share live location
• AirSOS - Emergency assistance

How can I help you today? Try asking about:
• "Which route is safer for jogging?"
• "Where has the cleanest air?"
• "What's the best time to avoid traffic?"
• "How can I find safe walking routes?"`
}

export default {
  chatWithAI,
}

