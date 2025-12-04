import { useState, useEffect } from 'react'
import api from '../services/api'
import LoaderAnimation from '../components/LoaderAnimation'

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
    loadMyRank()
  }, [])

  const loadLeaderboard = async () => {
    try {
      const response = await api.get('/leaderboard?limit=50')
      if (response.data.success) {
        setLeaderboard(response.data.data)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMyRank = async () => {
    try {
      const response = await api.get('/leaderboard/me')
      if (response.data.success) {
        setMyRank(response.data.data)
      }
    } catch (error) {
      console.error('Error loading my rank:', error)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderAnimation text="Loading leaderboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-600">Top contributors ranked by points</p>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Your Rank</p>
              <p className="text-4xl font-bold text-blue-900 mt-1">#{myRank.rank}</p>
              <p className="text-sm text-blue-600 mt-1">{myRank.points} points</p>
            </div>
            <div className="text-6xl">🏆</div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Points</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Journals</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Incidents</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Achievements</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr
                  key={user._id || user.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index < 3 ? 'bg-yellow-50/30' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{user.rank}</span>
                      {getRankIcon(user.rank) && (
                        <span className="text-2xl">{getRankIcon(user.rank)}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-bold text-blue-600">{user.points || 0}</span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">
                    {user.journalEntriesCount || 0}
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">
                    {user.incidentsReportedCount || 0}
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">
                    {user.achievements?.length || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No users on the leaderboard yet</p>
            <p className="text-sm mt-1">Be the first to earn points!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard

