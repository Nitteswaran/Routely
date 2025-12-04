import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * GET /api/leaderboard
 * Get leaderboard of users ranked by points
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const users = await User.find({})
    .select('name email points achievements journalEntriesCount incidentsReportedCount')
    .sort({ points: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean()

  // Add rank
  const rankedUsers = users.map((user, index) => ({
    ...user,
    rank: skip + index + 1,
  }))

  const total = await User.countDocuments({})

  res.json({
    success: true,
    data: rankedUsers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  })
})

/**
 * GET /api/leaderboard/me
 * Get current user's rank
 */
export const getMyRank = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const user = await User.findById(userId)

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    })
  }

  // Calculate rank
  const usersWithMorePoints = await User.countDocuments({
    points: { $gt: user.points || 0 },
  })

  const rank = usersWithMorePoints + 1

  res.json({
    success: true,
    data: {
      rank,
      points: user.points || 0,
      totalUsers: await User.countDocuments({}),
    },
  })
})

export default {
  getLeaderboard,
  getMyRank,
}

