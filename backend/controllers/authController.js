import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  })
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password',
    })
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    })
  }

  // Check if user exists
  const userExists = await User.findOne({ email: email.toLowerCase() })
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    })
  }

  try {
    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || undefined,
      points: 0,
    })

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          points: user.points,
          achievements: user.achievements,
        },
      },
    })
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Handle duplicate email error
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      })
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ')
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages}`,
      })
    }
    
    // Re-throw to be caught by error handler
    throw error
  }
})

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    })
  }

  // Check user and password
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    })
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    })
  }

  // Generate token
  const token = generateToken(user._id)

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
        achievements: user.achievements,
      },
    },
  })
})

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  
  res.json({
    success: true,
    data: user,
  })
})

export default {
  register,
  login,
  getMe,
}

