import User from '../models/User.js'
import Achievement from '../models/Achievement.js'
import JournalEntry from '../models/Journal.js'
import Incident from '../models/Incident.js'

/**
 * Check and award achievements based on user progress
 */
export const checkAndAwardAchievements = async (userId) => {
  try {
    // Initialize default achievements
    await Achievement.initializeDefaultAchievements()
    
    const user = await User.findById(userId)
    if (!user) return

    // Get all available achievements
    const achievements = await Achievement.find()
    
    // Get user statistics
    const journalEntries = await JournalEntry.countDocuments({ userId })
    const incidents = await Incident.find({ userId })
    const incidentsReported = incidents.length
    const pollutionIncidents = incidents.filter(i => i.type === 'Air Pollution').length
    const trafficIncidents = incidents.filter(i => i.type === 'Road Block' || i.type === 'Accident').length
    const safetyIncidents = incidents.filter(i => i.type === 'Accident').length

    // Check consecutive days for journal entries
    const consecutiveDays = await calculateConsecutiveDays(userId)

    // Check each achievement
    for (const achievement of achievements) {
      // Skip if already unlocked
      if (user.achievements.some(a => a.achievementId === achievement.id)) {
        continue
      }

      let unlocked = false

      // Check requirements
      for (const [requirement, value] of achievement.requirements.entries()) {
        switch (requirement) {
          case 'journalEntries':
            if (journalEntries >= value) unlocked = true
            break
          case 'incidentsReported':
            if (incidentsReported >= value) unlocked = true
            break
          case 'pollutionIncidents':
            if (pollutionIncidents >= value) unlocked = true
            break
          case 'trafficIncidents':
            if (trafficIncidents >= value) unlocked = true
            break
          case 'safetyIncidents':
            if (safetyIncidents >= value) unlocked = true
            break
          case 'totalPoints':
            if (user.points >= value) unlocked = true
            break
          case 'consecutiveDays':
            if (consecutiveDays >= value) unlocked = true
            break
        }

        if (!unlocked) break
      }

      if (unlocked) {
        // Award achievement
        user.achievements.push({
          achievementId: achievement.id,
          unlockedAt: new Date(),
        })
        
        // Award points
        if (achievement.pointsReward > 0) {
          user.points = (user.points || 0) + achievement.pointsReward
        }

        await user.save()
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error)
  }
}

/**
 * Calculate consecutive days of journal entries
 */
const calculateConsecutiveDays = async (userId) => {
  const entries = await JournalEntry.find({ userId })
    .sort({ createdAt: -1 })
    .limit(30) // Check last 30 entries

  if (entries.length === 0) return 0

  let consecutiveDays = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    checkDate.setHours(0, 0, 0, 0)
    
    const nextDate = new Date(checkDate)
    nextDate.setDate(nextDate.getDate() + 1)

    const hasEntry = entries.some(entry => {
      const entryDate = new Date(entry.createdAt)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate.getTime() === checkDate.getTime()
    })

    if (hasEntry) {
      consecutiveDays++
    } else {
      break
    }
  }

  return consecutiveDays
}

export default {
  checkAndAwardAchievements,
}

