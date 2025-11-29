const RouteSummaryCard = ({ route, loading = false }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center py-4">No route selected</p>
      </div>
    )
  }

  // Handle both backend format and frontend format
  const distance = route.distance || route.totalDistance || 0
  const duration = route.duration || route.estimatedTime || 0
  const safetyScore = route.safetyScore || route.safety || 0
  const waypoints = route.waypoints || route.steps || []

  // Count unsafe segments
  const unsafeCount = route.unsafeSegments?.length || 0
  const highRiskCount = route.unsafeSegments?.filter(s => s.severity === 'high').length || 0

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Summary</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Distance:</span>
          <span className="font-medium text-gray-900">
            {distance.toFixed(1)} km
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Estimated Time:</span>
          <span className="font-medium text-gray-900">
            {Math.round(duration)} min
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Safety Score:</span>
          <span className={`font-bold text-lg ${
            safetyScore >= 75 ? 'text-green-600' :
            safetyScore >= 50 ? 'text-yellow-600' :
            safetyScore >= 25 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {safetyScore}%
          </span>
        </div>
        {safetyScore > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  safetyScore >= 75 ? 'bg-green-600' :
                  safetyScore >= 50 ? 'bg-yellow-600' :
                  safetyScore >= 25 ? 'bg-orange-600' : 'bg-red-600'
                }`}
                style={{ width: `${safetyScore}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {safetyScore >= 75 ? 'Very Safe' :
               safetyScore >= 50 ? 'Safe' :
               safetyScore >= 25 ? 'Moderate Risk' : 'High Risk'}
            </p>
          </div>
        )}

        {unsafeCount > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 text-sm">Unsafe Segments:</span>
              <span className="font-medium text-red-600 text-sm">
                {unsafeCount}
              </span>
            </div>
            {highRiskCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">High Risk:</span>
                <span className="font-medium text-red-700 text-sm">
                  {highRiskCount}
                </span>
              </div>
            )}
          </div>
        )}
        
        {route.start && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Start:</p>
            <p className="text-sm font-medium text-gray-900">
              {route.start.address || `${route.start.lat?.toFixed(4)}, ${route.start.lng?.toFixed(4)}`}
            </p>
          </div>
        )}

        {route.destination && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Destination:</p>
            <p className="text-sm font-medium text-gray-900">
              {route.destination.address || `${route.destination.lat?.toFixed(4)}, ${route.destination.lng?.toFixed(4)}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RouteSummaryCard
