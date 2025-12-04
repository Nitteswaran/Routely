import { useState, useEffect } from 'react'
import api from '../services/api'
import LoaderAnimation from '../components/LoaderAnimation'

const Achievements = () => {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [unlockedCount, setUnlockedCount] = useState(0)

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      const response = await api.get('/achievements/my')
      if (response.data.success) {
        setAchievements(response.data.data)
        setUnlockedCount(response.data.unlockedCount || 0)
      }
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderAnimation text="Loading achievements..." />
      </div>
    )
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
        <p className="text-gray-600">
          Unlock badges by contributing to the community
        </p>
      </div>

      {/* Progress Card */}
      <div className="card bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-700 font-medium">Progress</p>
            <p className="text-4xl font-bold text-purple-900 mt-1">
              {unlockedCount}/{achievements.length}
            </p>
            <p className="text-sm text-purple-600 mt-1">Achievements unlocked</p>
          </div>
          <div className="text-6xl">🎖️</div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-purple-200 rounded-full h-3">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Unlocked ({unlockedAchievements.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement._id || achievement.id}
                className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300"
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">{achievement.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{achievement.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                  {achievement.pointsReward > 0 && (
                    <p className="text-xs text-orange-600 font-medium">
                      +{achievement.pointsReward} points
                    </p>
                  )}
                  {achievement.unlockedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Locked ({lockedAchievements.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement._id || achievement.id}
                className="card bg-gray-50 border-2 border-gray-200 opacity-75"
              >
                <div className="text-center">
                  <div className="text-5xl mb-3 filter grayscale">{achievement.icon}</div>
                  <h3 className="font-semibold text-gray-700 mb-1">{achievement.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{achievement.description}</p>
                  {achievement.pointsReward > 0 && (
                    <p className="text-xs text-gray-400 font-medium">
                      +{achievement.pointsReward} points
                    </p>
                  )}
                  <div className="mt-3 text-xs text-gray-400">
                    🔒 Locked
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No achievements available</p>
        </div>
      )}
    </div>
  )
}

export default Achievements

