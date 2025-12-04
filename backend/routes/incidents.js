import express from 'express'
import { createIncident, getIncidents, deleteIncident } from '../controllers/incidentsController.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// POST /api/incidents - Create a new incident (optional auth for anonymous reports)
router.post('/', optionalAuth, createIncident)

// GET /api/incidents - Get all incidents (public)
router.get('/', getIncidents)

// DELETE /api/incidents/:id - Delete an incident (requires auth if user wants to delete their own)
router.delete('/:id', optionalAuth, deleteIncident)

export default router

