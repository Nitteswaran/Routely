/**
 * Error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)
  console.error('Error stack:', err.stack)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  // Handle MongoDB duplicate key error
  if (err.code === 11000 || err.name === 'MongoServerError') {
    const field = Object.keys(err.keyPattern || {})[0]
    return res.status(400).json({
      success: false,
      message: `A user with this ${field} already exists`,
    })
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(e => e.message).join(', ')
    return res.status(400).json({
      success: false,
      message: `Validation error: ${messages}`,
    })
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: {
        stack: err.stack,
        details: err,
      }
    }),
  })
}

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

