import express from 'express'
import Guardian from '../models/Guardian.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// GET /api/guardians - Get all guardians for current user
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString()

    const guardians = await Guardian.find({ 
      userId,
      isActive: true 
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      data: guardians,
      count: guardians.length,
    })
  } catch (error) {
    console.error('Error fetching guardians:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guardians',
      error: error.message,
    })
  }
})

// POST /api/guardians - Create a new guardian
router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, email, relationship } = req.body

    // Clean and validate input
    const cleanName = name?.trim()
    const cleanPhone = phone?.trim() || ''
    const cleanEmail = email?.trim() || ''

    // Validation
    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      })
    }

    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'At least one contact method (phone or email) is required',
      })
    }

    // Validate phone format if provided (more flexible regex)
    if (cleanPhone) {
      // Allow various phone formats: +1234567890, 1234567890, (123) 456-7890, etc.
      // Remove all non-digit characters except + at the start for validation
      const digitsOnly = cleanPhone.replace(/[^\d+]/g, '')
      // Should have at least 7 digits (minimum valid phone number)
      const digitCount = digitsOnly.replace(/[^0-9]/g, '').length
      if (digitCount < 7 || digitCount > 15) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Please enter a valid phone number with 7-15 digits.',
        })
      }
    }

    // Validate email format if provided
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        })
      }
    }

    const userId = req.user._id.toString()

    // Check if guardian already exists (same phone or email)
    const existingGuardian = await Guardian.findOne({
      userId,
      $or: [
        ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ...(cleanEmail ? [{ email: cleanEmail.toLowerCase() }] : []),
      ],
      isActive: true,
    })

    if (existingGuardian) {
      return res.status(400).json({
        success: false,
        message: 'A guardian with this phone or email already exists',
      })
    }

    // Use cleaned values
    const finalPhone = cleanPhone || undefined
    const finalEmail = cleanEmail ? cleanEmail.toLowerCase() : undefined

    const guardian = new Guardian({
      userId,
      name: cleanName,
      phone: finalPhone,
      email: finalEmail,
      relationship: relationship || 'other',
    })

    await guardian.save()

    res.status(201).json({
      success: true,
      message: 'Guardian added successfully',
      data: guardian,
    })
  } catch (error) {
    console.error('Error creating guardian:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors,
    })
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message).join(', ')
      return res.status(400).json({
        success: false,
        message: `Validation error: ${validationErrors}`,
        error: validationErrors,
      })
    }

    if (error.name === 'MongoServerError' || error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A guardian with this contact information already exists',
        error: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create guardian. Please check if the database is connected.',
      error: error.message,
    })
  }
})

// DELETE /api/guardians/:id - Delete a guardian
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id.toString()

    const guardian = await Guardian.findOne({ _id: id, userId })

    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found',
      })
    }

    // Soft delete by setting isActive to false
    guardian.isActive = false
    await guardian.save()

    // Or hard delete:
    // await Guardian.findByIdAndDelete(id)

    res.json({
      success: true,
      message: 'Guardian removed successfully',
      data: guardian,
    })
  } catch (error) {
    console.error('Error deleting guardian:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid guardian ID',
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete guardian',
      error: error.message,
    })
  }
})

// POST /api/guardians/:id/test-alert - Send test alert to guardian
router.post('/:id/test-alert', async (req, res) => {
  try {
    const { id } = req.params
    // TODO: In production, get userId from authenticated session
    const userId = req.query.userId || req.user?.id || 'default-user-id'

    const guardian = await Guardian.findOne({ _id: id, userId, isActive: true })

    if (!guardian) {
      return res.status(404).json({
        success: false,
        message: 'Guardian not found',
      })
    }

    // Update last notified timestamp
    guardian.lastNotified = new Date()
    await guardian.save()

    // TODO: In production, send actual notification:
    // - Send SMS if phone is provided
    // - Send email if email is provided
    // - Send push notification if app is installed

    const io = req.app.get('io')
    if (io) {
      io.emit('test-alert', {
        guardianId: guardian._id,
        guardianName: guardian.name,
        timestamp: new Date().toISOString(),
      })
    }

    res.json({
      success: true,
      message: `Test alert sent to ${guardian.name}`,
      data: {
        guardian: guardian.name,
        contact: guardian.phone || guardian.email,
        sentAt: guardian.lastNotified,
      },
    })
  } catch (error) {
    console.error('Error sending test alert:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send test alert',
      error: error.message,
    })
  }
})

export default router

