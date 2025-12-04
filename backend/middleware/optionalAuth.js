import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Optional auth middleware - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
      req.user = await User.findById(decoded.id).select('-password')
    } catch (error) {
      // Ignore token errors for optional auth
      req.user = null
    }
  }

  next()
}

export default { optionalAuth }

