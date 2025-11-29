import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Environment configuration
 * Validates required environment variables
 */
export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  
  // Database
  // For production, use MongoDB Atlas connection string:
  // mongodb+srv://username:password@cluster.mongodb.net/routely?retryWrites=true&w=majority
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/routely',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // API Keys (optional)
  MAPBOX_TOKEN: process.env.MAPBOX_TOKEN || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // JWT (if needed in future)
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
}

/**
 * Validate required environment variables
 */
export const validateEnv = () => {
  const required = ['MONGODB_URI']
  const missing = required.filter(key => !process.env[key] && !env[key])
  
  if (missing.length > 0 && env.NODE_ENV === 'production') {
    console.error('❌ Missing required environment variables:', missing.join(', '))
    process.exit(1)
  }
  
  if (env.NODE_ENV === 'development') {
    console.log('📝 Environment:', env.NODE_ENV)
    console.log('🔗 MongoDB URI:', env.MONGODB_URI)
    console.log('🌐 Frontend URL:', env.FRONTEND_URL)
    if (env.MAPBOX_TOKEN) {
      console.log('🗺️  Mapbox Token: Configured')
    } else {
      console.log('⚠️  Mapbox Token: Not configured (optional)')
    }
    if (env.GEMINI_API_KEY) {
      console.log('🤖 Gemini API Key: Configured')
    } else {
      console.log('⚠️  Gemini API Key: Not configured (required for AI Advice)')
    }
  }
}

export default env

