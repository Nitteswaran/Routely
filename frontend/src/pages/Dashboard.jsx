import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoaderAnimation from '../components/LoaderAnimation'

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [journalEntries, setJournalEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [journalForm, setJournalForm] = useState({
    title: '',
    content: '',
    location: { name: '', lat: null, lng: null },
    tags: [],
    mood: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadUserData()
    loadJournalEntries()
  }, [])

  const loadUserData = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        setUser(response.data.data)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      if (error.response?.status === 401) {
        // Not authenticated, redirect to login
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadJournalEntries = async () => {
    try {
      const response = await api.get('/journal?limit=10')
      if (response.data.success) {
        setJournalEntries(response.data.data)
      }
    } catch (error) {
      console.error('Error loading journal entries:', error)
    }
  }

  const handleJournalSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await api.post('/journal', journalForm)
      if (response.data.success) {
        await loadJournalEntries()
        await loadUserData() // Refresh to get updated points
        setShowJournalForm(false)
        setJournalForm({
          title: '',
          content: '',
          location: { name: '', lat: null, lng: null },
          tags: [],
          mood: '',
        })
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create journal entry')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteJournal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this journal entry?')) {
      return
    }

    try {
      const response = await api.delete(`/journal/${id}`)
      if (response.data.success) {
        await loadJournalEntries()
        await loadUserData()
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete journal entry')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderAnimation text="Loading your dashboard..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load user data</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const displayName = user?.name || user?.email || 'User'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {displayName}!</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Points</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{user?.points || 0}</p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Journal Entries</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{user?.journalEntriesCount || 0}</p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Incidents Reported</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{user?.incidentsReportedCount || 0}</p>
            </div>
            <div className="text-4xl">🚨</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Achievements</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{user?.achievements?.length || 0}</p>
            </div>
            <div className="text-4xl">🎖️</div>
          </div>
        </div>
      </div>

      {/* Journal Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Journal</h2>
          <button
            onClick={() => setShowJournalForm(!showJournalForm)}
            className="btn-primary"
          >
            {showJournalForm ? 'Cancel' : '+ New Entry'}
          </button>
        </div>

        {/* Journal Form */}
        {showJournalForm && (
          <form onSubmit={handleJournalSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={journalForm.title}
                onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value })}
                className="input-field"
                placeholder="Journey title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={journalForm.content}
                onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })}
                className="input-field"
                rows={5}
                placeholder="Share your journey or experience..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mood
                </label>
                <select
                  value={journalForm.mood}
                  onChange={(e) => setJournalForm({ ...journalForm, mood: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select mood...</option>
                  <option value="happy">😊 Happy</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="stressed">😰 Stressed</option>
                  <option value="excited">🤩 Excited</option>
                  <option value="tired">😴 Tired</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name (Optional)
                </label>
                <input
                  type="text"
                  value={journalForm.location.name}
                  onChange={(e) => setJournalForm({
                    ...journalForm,
                    location: { ...journalForm.location, name: e.target.value }
                  })}
                  className="input-field"
                  placeholder="e.g., Kuala Lumpur"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Entry (+10 Points)'}
            </button>
          </form>
        )}

        {/* Journal Entries List */}
        {journalEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No journal entries yet</p>
            <p className="text-sm">Start documenting your journeys!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <div key={entry._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                    {entry.location?.name && (
                      <p className="text-sm text-gray-500 mt-1">📍 {entry.location.name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteJournal(entry._id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  {entry.mood && (
                    <span>
                      {entry.mood === 'happy' && '😊'}
                      {entry.mood === 'neutral' && '😐'}
                      {entry.mood === 'stressed' && '😰'}
                      {entry.mood === 'excited' && '🤩'}
                      {entry.mood === 'tired' && '😴'}
                    </span>
                  )}
                  {entry.pointsAwarded > 0 && (
                    <span className="text-green-600 font-medium">+{entry.pointsAwarded} points</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/leaderboard')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="font-semibold mb-2">🏆 View Leaderboard</h3>
          <p className="text-sm text-gray-600">See how you rank against others</p>
        </button>

        <button
          onClick={() => navigate('/achievements')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="font-semibold mb-2">🎖️ My Achievements</h3>
          <p className="text-sm text-gray-600">View your unlocked badges</p>
        </button>

        <button
          onClick={() => navigate('/route-planner')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <h3 className="font-semibold mb-2">🗺️ Plan Route</h3>
          <p className="text-sm text-gray-600">Start planning your next journey</p>
        </button>
      </div>
    </div>
  )
}

export default Dashboard
