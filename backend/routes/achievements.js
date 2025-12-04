import express from 'express'
import Achievement from '../models/Achievement.js'
import asyncHandler from '../utils/asyncHandler.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/achievements
 * Get all available achievements
 */
router.get('/', asyncHandler(async (req, res) => {
  // Initialize default achievements
  await Achievement.initializeDefaultAchievements()
  
  const achievements = await Achievement.find().sort({ category: 1, pointsReward: -1 })

  res.json({
    success: true,
    count: achievements.length,
    data: achievements,
  })
}))

/**
 * GET /api/achievements/my
 * Get current user's unlocked achievements
 */
router.get('/my', protect, asyncHandler(async (req, res) => {
  const User = (await import('../models/User.js')).default
  const user = await User.findById(req.user.id)

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    })
  }

  // Get all achievements with unlock status
  await Achievement.initializeDefaultAchievements()
  const allAchievements = await Achievement.find()
  
  const achievementsWithStatus = allAchievements.map(achievement => {
    const unlocked = user.achievements.find(
      a => a.achievementId === achievement.id
    )
    
    return {
      ...achievement.toObject(),
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt || null,
    }
  })

  res.json({
    success: true,
    data: achievementsWithStatus,
    unlockedCount: user.achievements.length,
    totalCount: allAchievements.length,
  })
}))

export default router

