import mongoose from 'mongoose'

const achievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '🏆',
  },
  category: {
    type: String,
    enum: ['journal', 'incident', 'pollution', 'traffic', 'safety', 'community'],
    required: true,
  },
  requirements: {
    type: Map,
    of: Number, // e.g., { journalEntries: 5, incidentsReported: 10 }
  },
  pointsReward: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

// Initialize default achievements if they don't exist
achievementSchema.statics.initializeDefaultAchievements = async function() {
  const defaultAchievements = [
    {
      id: 'first_journal',
      name: 'First Journey',
      description: 'Logged your first journey entry',
      icon: '📝',
      category: 'journal',
      requirements: { journalEntries: 1 },
      pointsReward: 10,
    },
    {
      id: 'journal_enthusiast',
      name: 'Journal Enthusiast',
      description: 'Logged 10 journey entries',
      icon: '📖',
      category: 'journal',
      requirements: { journalEntries: 10 },
      pointsReward: 50,
    },
    {
      id: 'first_incident',
      name: 'Community Helper',
      description: 'Reported your first incident',
      icon: '🚨',
      category: 'incident',
      requirements: { incidentsReported: 1 },
      pointsReward: 20,
    },
    {
      id: 'incident_reporter',
      name: 'Active Reporter',
      description: 'Reported 10 incidents',
      icon: '📢',
      category: 'incident',
      requirements: { incidentsReported: 10 },
      pointsReward: 100,
    },
    {
      id: 'pollution_warrior',
      name: 'Pollution Warrior',
      description: 'Reported 5 air pollution incidents',
      icon: '🌬️',
      category: 'pollution',
      requirements: { pollutionIncidents: 5 },
      pointsReward: 75,
    },
    {
      id: 'traffic_spotter',
      name: 'Traffic Spotter',
      description: 'Reported 5 traffic incidents',
      icon: '🚗',
      category: 'traffic',
      requirements: { trafficIncidents: 5 },
      pointsReward: 75,
    },
    {
      id: 'safety_guardian',
      name: 'Safety Guardian',
      description: 'Reported 5 safety-related incidents',
      icon: '🛡️',
      category: 'safety',
      requirements: { safetyIncidents: 5 },
      pointsReward: 75,
    },
    {
      id: 'community_champion',
      name: 'Community Champion',
      description: 'Earned 500 points',
      icon: '👑',
      category: 'community',
      requirements: { totalPoints: 500 },
      pointsReward: 150,
    },
    {
      id: 'weekly_logger',
      name: 'Consistent Logger',
      description: 'Logged entries for 7 consecutive days',
      icon: '📅',
      category: 'journal',
      requirements: { consecutiveDays: 7 },
      pointsReward: 100,
    },
  ]

  for (const achievement of defaultAchievements) {
    await this.findOneAndUpdate(
      { id: achievement.id },
      achievement,
      { upsert: true, new: true }
    )
  }
}

const Achievement = mongoose.model('Achievement', achievementSchema)

export default Achievement

