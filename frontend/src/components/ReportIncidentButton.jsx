const ReportIncidentButton = ({ onClick, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
        isActive
          ? 'bg-red-600 hover:bg-red-700 scale-110'
          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 scale-100'
      }`}
      aria-label={isActive ? 'Cancel reporting' : 'Report incident'}
      title={isActive ? 'Click on map to select location' : 'Report an incident'}
    >
      {isActive ? (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
    </button>
  )
}

export default ReportIncidentButton

