import { useState } from 'react'
import api from '../services/api'

const INCIDENT_TYPES = [
  'Air Pollution',
  'Flood',
  'Road Block',
  'Accident',
  'Other'
]

const IncidentReportModal = ({ isOpen, onClose, coordinates, onSuccess }) => {
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!type) {
      setError('Please select an incident type')
      return
    }

    if (!coordinates || coordinates.lat === undefined || coordinates.lng === undefined) {
      setError('Invalid coordinates')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await api.post('/incidents', {
        type,
        description: description.trim(),
        lat: coordinates.lat,
        lng: coordinates.lng,
        timestamp: new Date().toISOString(),
      })

      if (response.data.success) {
        const incident = response.data.data
        const pointsEarned = incident.pointsAwarded || 0
        
        // Show success message with points
        if (pointsEarned > 0) {
          alert(`Incident reported successfully! You earned ${pointsEarned} points! 🎉`)
        } else {
          alert('Incident reported successfully! (Sign in to earn points)')
        }
        
        // Reset form
        setType('')
        setDescription('')
        setError('')
        
        // Notify parent component
        if (onSuccess) {
          onSuccess(incident)
        }
        
        // Close modal
        onClose()
      } else {
        setError(response.data.message || 'Failed to submit incident')
      }
    } catch (err) {
      console.error('Error submitting incident:', err)
      setError(err.response?.data?.message || 'Failed to submit incident. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setType('')
      setDescription('')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Report Incident</h2>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Coordinates Display */}
          {coordinates && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Selected Location</p>
              <p className="text-xs text-gray-600">
                Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Incident Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Type <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              disabled={submitting}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select incident type...</option>
              {INCIDENT_TYPES.map((incidentType) => (
                <option key={incidentType} value={incidentType}>
                  {incidentType}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={4}
              placeholder="Provide additional details about the incident..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !type}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IncidentReportModal

