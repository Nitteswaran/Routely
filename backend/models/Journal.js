import mongoose from 'mongoose'

const journalEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  location: {
    name: String,
    lat: Number,
    lng: Number,
  },
  tags: [String],
  mood: {
    type: String,
    enum: ['happy', 'neutral', 'stressed', 'excited', 'tired', 'other'],
  },
  pointsAwarded: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

// Indexes for efficient queries
journalEntrySchema.index({ userId: 1, createdAt: -1 })
journalEntrySchema.index({ createdAt: -1 })

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema)

export default JournalEntry

