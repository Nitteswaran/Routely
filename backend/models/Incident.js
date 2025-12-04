import mongoose from 'mongoose'

const incidentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Air Pollution', 'Flood', 'Road Block', 'Accident', 'Other'],
  },
  description: {
    type: String,
    default: '',
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  pointsAwarded: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

// Index for faster geospatial queries
incidentSchema.index({ lat: 1, lng: 1 })
incidentSchema.index({ timestamp: -1 })
incidentSchema.index({ type: 1 })

const Incident = mongoose.model('Incident', incidentSchema)

export default Incident

