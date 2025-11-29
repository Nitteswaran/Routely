/**
 * Utility to list available Gemini models
 * Can be used to test which models are available with your API key
 */
import fetch from 'node-fetch'

export async function listAvailableModels(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required')
  }

  try {
    // Try v1beta first
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (data.models && Array.isArray(data.models)) {
      return {
        success: true,
        models: data.models.map(model => ({
          name: model.name,
          displayName: model.displayName,
          supportedGenerationMethods: model.supportedGenerationMethods,
        })),
      }
    }
    
    return {
      success: false,
      message: 'Unexpected response format',
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get the best available model for generateContent
 */
export async function getBestModel(apiKey) {
  const result = await listAvailableModels(apiKey)
  
  if (!result.success || !result.models) {
    // Fallback to default
    return 'gemini-pro'
  }
  
  // Find models that support generateContent
  const supportedModels = result.models.filter(
    model => model.supportedGenerationMethods?.includes('generateContent')
  )
  
  // Prefer newer models, but fallback to gemini-pro
  const preferred = supportedModels.find(m => 
    m.name.includes('gemini-2') || 
    m.name.includes('gemini-1.5')
  )
  
  if (preferred) {
    // Extract just the model name from the full path
    const nameParts = preferred.name.split('/')
    return nameParts[nameParts.length - 1]
  }
  
  // Fallback to gemini-pro if available
  const geminiPro = supportedModels.find(m => m.name.includes('gemini-pro'))
  if (geminiPro) {
    const nameParts = geminiPro.name.split('/')
    return nameParts[nameParts.length - 1]
  }
  
  // Last resort - return first available
  if (supportedModels.length > 0) {
    const nameParts = supportedModels[0].name.split('/')
    return nameParts[nameParts.length - 1]
  }
  
  return 'gemini-pro'
}

