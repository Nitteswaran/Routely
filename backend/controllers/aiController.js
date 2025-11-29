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
  // Default to gemini-2.5-flash (fast, efficient, and available)
  // Alternative options: gemini-2.0-flash, gemini-pro-latest, gemini-2.5-pro
  // Users can override with GEMINI_MODEL in .env if needed
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
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
    
    // Handle different error types
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

export default {
  chatWithAI,
}

