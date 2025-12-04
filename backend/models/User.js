import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // Don't include password in queries by default
  },
  phone: String,
  location: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    email: String,
    relationship: String,
  }],
  // Points and gamification
  points: {
    type: Number,
    default: 0,
  },
  achievements: [{
    achievementId: String,
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Journal statistics
  journalEntriesCount: {
    type: Number,
    default: 0,
  },
  incidentsReportedCount: {
    type: Number,
    default: 0,
  },
  lastJournalEntryAt: Date,
  lastIncidentReportedAt: Date,
  // Spam prevention
  lastActions: [{
    action: String, // 'journal' or 'incident'
    timestamp: Date,
  }],
}, {
  timestamps: true,
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Index for leaderboard queries
userSchema.index({ points: -1 })
userSchema.index({ email: 1 })

const User = mongoose.model('User', userSchema)

export default User

