import express from 'express'
import healthRoutes from './health.js'
import trackingRoutes from './tracking.js'
import userRoutes from './user.js'
import emergencyRoutes from './emergency.js'
import routeRoutes from './route.js'
import sosRoutes from './sos.js'
import safeSpotsRoutes from './safeSpots.js'
import guardiansRoutes from './guardians.js'
import aqiRoutes from './aqi.js'
import forumRoutes from './forum.js'
import surroundingsRoutes from './surroundings.js'
import weatherRoutes from './weather.js'
import aiRoutes from './ai.js'
import trafficRoutes from './traffic.js'
import incidentsRoutes from './incidents.js'
import authRoutes from './auth.js'
import journalRoutes from './journal.js'
import leaderboardRoutes from './leaderboard.js'
import achievementsRoutes from './achievements.js'

const router = express.Router()

// Base health check route
router.use('/health', healthRoutes)

// API routes
router.use('/tracking', trackingRoutes)
router.use('/users', userRoutes)
router.use('/emergency', emergencyRoutes)
router.use('/route', routeRoutes)
router.use('/sos', sosRoutes)
router.use('/safe-spots', safeSpotsRoutes)
router.use('/guardians', guardiansRoutes)
router.use('/aqi', aqiRoutes)
router.use('/forum', forumRoutes)
router.use('/surroundings', surroundingsRoutes)
router.use('/weather', weatherRoutes)
router.use('/ai', aiRoutes)
router.use('/traffic', trafficRoutes)
router.use('/incidents', incidentsRoutes)
router.use('/auth', authRoutes)
router.use('/journal', journalRoutes)
router.use('/leaderboard', leaderboardRoutes)
router.use('/achievements', achievementsRoutes)

export default router

