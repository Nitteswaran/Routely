import Incident from '../models/Incident.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import { checkAndAwardAchievements } from '../utils/achievements.js'

/**
 * POST /api/incidents
 * Create a new incident report (userId is optional - can be anonymous)
 */
export const createIncident = asyncHandler(async (req, res) => {
  const { type, description, lat, lng, timestamp } = req.body
  const userId = req.user?.id // Optional - allows anonymous reports

  // Validate required fields
  if (!type || lat === undefined || lng === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Type, latitude, and longitude are required',
    })
  }

  // Validate incident type
  const validTypes = ['Air Pollution', 'Flood', 'Road Block', 'Accident', 'Other']
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid incident type. Must be one of: ${validTypes.join(', ')}`,
    })
  }

  // Validate coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude must be numbers',
    })
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinates. Lat must be between -90 and 90, Lng must be between -180 and 180',
    })
  }

  let pointsAwarded = 0

  // Award points and check spam if user is authenticated
  if (userId) {
    const user = await User.findById(userId)
    if (user) {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      
      // Clean old actions
      user.lastActions = user.lastActions.filter(
        action => new Date(action.timestamp) > oneHourAgo
      )

      // Check spam - limit to 5 incidents per hour
      const recentIncidents = user.lastActions.filter(
        action => action.action === 'incident' && new Date(action.timestamp) > oneHourAgo
      ).length

      if (recentIncidents >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many incident reports. Please wait before reporting another incident.',
        })
      }

      // Award points (20 points per incident, max 3 per hour)
      if (recentIncidents < 3) {
        pointsAwarded = 20
        user.points = (user.points || 0) + pointsAwarded
        user.incidentsReportedCount = (user.incidentsReportedCount || 0) + 1
        user.lastIncidentReportedAt = now
        user.lastActions.push({ action: 'incident', timestamp: now })
        await user.save()

        // Check achievements
        await checkAndAwardAchievements(userId)
      }
    }
  }

  // Create incident
  const incident = await Incident.create({
    userId: userId || undefined,
    type,
    description: description || '',
    lat,
    lng,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    pointsAwarded,
  })

  res.status(201).json({
    success: true,
    message: 'Incident reported successfully',
    data: {
      ...incident.toObject(),
      pointsAwarded,
    },
  })
})

/**
 * GET /api/incidents
 * Get all incidents (optionally filtered by type or date range)
 */
export const getIncidents = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, limit = 100 } = req.query

  // Build query
  const query = {}

  // Filter by type if provided
  if (type) {
    const validTypes = ['Air Pollution', 'Flood', 'Road Block', 'Accident', 'Other']
    if (validTypes.includes(type)) {
      query.type = type
    }
  }

  // Filter by date range if provided
  if (startDate || endDate) {
    query.timestamp = {}
    if (startDate) {
      query.timestamp.$gte = new Date(startDate)
    }
    if (endDate) {
      query.timestamp.$lte = new Date(endDate)
    }
  }

  // Fetch incidents
  const incidents = await Incident.find(query)
    .sort({ timestamp: -1 }) // Most recent first
    .limit(parseInt(limit))

  res.json({
    success: true,
    count: incidents.length,
    data: incidents,
  })
})

/**
 * DELETE /api/incidents/:id
 * Delete an incident by ID
 */
export const deleteIncident = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ID format
  if (!id || id.length !== 24) {
    return res.status(400).json({
      success: false,
      message: 'Invalid incident ID',
    })
  }

  // Find incident
  const incident = await Incident.findById(id)

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: 'Incident not found',
    })
  }

  // If user is authenticated and owns the incident, refund points
  if (req.user && incident.userId && incident.userId.toString() === req.user.id) {
    if (incident.pointsAwarded > 0) {
      const user = await User.findById(req.user.id)
      if (user) {
        user.points = Math.max(0, (user.points || 0) - incident.pointsAwarded)
        user.incidentsReportedCount = Math.max(0, (user.incidentsReportedCount || 0) - 1)
        await user.save()
      }
    }
  }

  // Delete incident
  await Incident.findByIdAndDelete(id)

  res.json({
    success: true,
    message: 'Incident deleted successfully',
    data: incident,
  })
})

export default {
  createIncident,
  getIncidents,
  deleteIncident,
}

