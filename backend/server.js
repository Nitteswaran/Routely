import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectDB } from './config/database.js'
import { env, validateEnv } from './config/env.js'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

// Validate environment variables
validateEnv()

// Initialize Express app
const app = express()

// Create HTTP server
const httpServer = createServer(app)

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// ==================== Middleware ====================

// CORS configuration - Restrict to Vercel app in production, allow localhost in development
const VERCEL_APP_URL = 'https://routely-eosin.vercel.app'

const allowedOrigins = env.NODE_ENV === 'production' 
  ? [VERCEL_APP_URL] // Only allow Vercel app in production
  : [
      VERCEL_APP_URL, // Also allow Vercel in development for testing
      env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
    ]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) only in development
      if (!origin) {
        if (env.NODE_ENV === 'development') {
          return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        // In development, allow localhost on any port
        if (env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Body parser middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware (development only)
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// ==================== Routes ====================

// Gemini route (direct access)
app.post('/gemini', async (req, res) => {
  try {
    const userPrompt = req.body.prompt

    if (!userPrompt || !userPrompt.trim()) {
      return res.status(400).json({ 
        error: 'Prompt is required' 
      })
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key is not configured' 
      })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: userPrompt }]
          }]
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Failed to get response from Gemini API' 
      })
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
})

// API routes
app.use('/api', routes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Routely API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      gemini: '/gemini (POST)',
      documentation: 'Coming soon',
    },
  })
})

// ==================== Error Handling ====================

// 404 handler (must be after all routes)
app.use(notFound)

// Error handler (must be last)
app.use(errorHandler)

// ==================== Socket.IO ====================

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id)

  // Join a room for tracking
  socket.on('join-tracking', (data) => {
    socket.join(data.roomId)
    console.log(`📍 Socket ${socket.id} joined room: ${data.roomId}`)
  })

  // Handle location updates
  socket.on('location-update', (data) => {
    // Broadcast to all clients in the room
    io.to(data.roomId).emit('location-update', data)
  })

  // Handle emergency alerts
  socket.on('emergency-alert', (data) => {
    // Broadcast emergency to all connected clients
    io.emit('emergency-alert', data)
    console.log('🚨 Emergency alert broadcasted:', data)
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id)
  })
})

// Make io available to routes
app.set('io', io)

// ==================== Database Connection ====================

// Connect to MongoDB
connectDB()

// ==================== Server Startup ====================

// Use PORT from environment (Render sets this automatically) or default to 5000
const PORT = process.env.PORT || env.PORT

httpServer.listen(PORT, () => {
  console.log('🚀 Server started successfully')
  console.log(`📍 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${env.NODE_ENV}`)
  if (env.NODE_ENV === 'development') {
    console.log(`🔗 API URL: http://localhost:${PORT}`)
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  httpServer.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

export { io }
