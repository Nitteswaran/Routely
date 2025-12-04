import JournalEntry from '../models/Journal.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import { checkAndAwardAchievements } from '../utils/achievements.js'

/**
 * POST /api/journal
 * Create a new journal entry
 */
export const createJournalEntry = asyncHandler(async (req, res) => {
  const { title, content, location, tags, mood } = req.body
  const userId = req.user.id

  // Validation
  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: 'Title and content are required',
    })
  }

  // Check spam prevention - limit to 10 journal entries per hour
  const user = await User.findById(userId)
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  // Clean old actions (older than 1 hour)
  user.lastActions = user.lastActions.filter(
    action => new Date(action.timestamp) > oneHourAgo
  )

  const recentJournalEntries = user.lastActions.filter(
    action => action.action === 'journal' && new Date(action.timestamp) > oneHourAgo
  ).length

  if (recentJournalEntries >= 10) {
    return res.status(429).json({
      success: false,
      message: 'Too many journal entries. Please wait before creating another entry.',
    })
  }

  // Points for journal entry (10 points per entry, max 50 points per hour)
  let pointsAwarded = 10
  if (recentJournalEntries >= 5) {
    pointsAwarded = 0 // No points after 5 entries per hour
  }

  // Create journal entry
  const journalEntry = await JournalEntry.create({
    userId,
    title,
    content,
    location: location || undefined,
    tags: tags || [],
    mood: mood || undefined,
    pointsAwarded,
  })

  // Update user stats
  user.journalEntriesCount = (user.journalEntriesCount || 0) + 1
  user.points = (user.points || 0) + pointsAwarded
  user.lastJournalEntryAt = now
  user.lastActions.push({ action: 'journal', timestamp: now })
  await user.save()

  // Check and award achievements
  await checkAndAwardAchievements(userId)

  res.status(201).json({
    success: true,
    message: 'Journal entry created successfully',
    data: {
      ...journalEntry.toObject(),
      pointsAwarded,
    },
  })
})

/**
 * GET /api/journal
 * Get user's journal entries
 */
export const getJournalEntries = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { limit = 50, page = 1 } = req.query

  const skip = (parseInt(page) - 1) * parseInt(limit)

  const entries = await JournalEntry.find({ userId })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)

  const total = await JournalEntry.countDocuments({ userId })

  res.json({
    success: true,
    count: entries.length,
    total,
    data: entries,
  })
})

/**
 * GET /api/journal/:id
 * Get a specific journal entry
 */
export const getJournalEntry = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { id } = req.params

  const entry = await JournalEntry.findOne({ _id: id, userId })
  
  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Journal entry not found',
    })
  }

  res.json({
    success: true,
    data: entry,
  })
})

/**
 * DELETE /api/journal/:id
 * Delete a journal entry
 */
export const deleteJournalEntry = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { id } = req.params

  const entry = await JournalEntry.findOne({ _id: id, userId })
  
  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Journal entry not found',
    })
  }

  // Refund points if any were awarded
  if (entry.pointsAwarded > 0) {
    const user = await User.findById(userId)
    user.points = Math.max(0, (user.points || 0) - entry.pointsAwarded)
    user.journalEntriesCount = Math.max(0, (user.journalEntriesCount || 0) - 1)
    await user.save()
  }

  await JournalEntry.findByIdAndDelete(id)

  res.json({
    success: true,
    message: 'Journal entry deleted successfully',
  })
})

export default {
  createJournalEntry,
  getJournalEntries,
  getJournalEntry,
  deleteJournalEntry,
}

