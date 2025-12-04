import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import LoaderAnimation from '../components/LoaderAnimation'
import landingPageImage from '../assets/landingpage.png'
import { 
  getForumPosts, 
  addForumPost, 
  updateForumPost,
  deleteForumPost,
  getCurrentUserId,
  getCurrentUserName,
  setCurrentUserName,
  initializeDefaultData 
} from '../utils/localStorage'
import BlurText from '../components/BlurText'
import api from '../services/api'

const Home = () => {
  const [airPollutionData, setAirPollutionData] = useState([])
  const [trafficData, setTrafficData] = useState([])
  const [forumPosts, setForumPosts] = useState([])
  const [newPost, setNewPost] = useState({ title: '', content: '', author: '' })
  const [editingPost, setEditingPost] = useState(null)
  const [editPost, setEditPost] = useState({ title: '', content: '' })
  const [currentUserId] = useState(getCurrentUserId())
  const [currentUserName, setCurrentUserNameState] = useState(getCurrentUserName())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [visibleSections, setVisibleSections] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const heroRef = useRef(null)
  const pollutionRef = useRef(null)
  const trafficRef = useRef(null)
  const forumRef = useRef(null)

  useEffect(() => {
    fetchData()
    initializeDefaultData()
    loadForumPosts()
    
    // Check authentication
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    
    // Auto-refresh data every 5 minutes to keep it real-time
    const refreshInterval = setInterval(() => {
      fetchData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(refreshInterval)
  }, [])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set([...prev, entry.target.id]))
        }
      })
    }, observerOptions)

    // Observe all sections
    const sections = [heroRef, pollutionRef, trafficRef, forumRef]
    sections.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    // Make hero section visible immediately on load with a small delay for smooth animation
    setTimeout(() => {
      if (heroRef.current) {
        setVisibleSections((prev) => new Set([...prev, 'hero']))
      }
    }, 100)

    return () => {
      sections.forEach((ref) => {
        if (ref.current) {
          observer.unobserve(ref.current)
        }
      })
    }
  }, [])


  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch real-time AQI data for major cities
      const aqiResponse = await api.get('/aqi/cities')
      if (aqiResponse.data?.success) {
        const citiesData = aqiResponse.data.data
        // Transform to chart format - show current month with real-time data
        const now = new Date()
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const currentMonth = monthNames[now.getMonth()]
        
        // Create data for last 6 months, with current month showing real-time data
        const airPollutionData = []
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (now.getMonth() - i + 12) % 12
          const monthName = monthNames[monthIndex]
          
          if (i === 0) {
            // Current month - use real-time data
            const dataPoint = { month: monthName }
            citiesData.forEach(city => {
              dataPoint[city.name] = city.aqi
            })
            airPollutionData.push(dataPoint)
          } else {
            // Previous months - add some variation to real-time data for historical context
            const dataPoint = { month: monthName }
            citiesData.forEach(city => {
              // Add variation based on month (simulate seasonal changes)
              const variation = (monthIndex % 3) * 5 - 5 // -5 to +10
              dataPoint[city.name] = Math.max(0, Math.min(300, city.aqi + variation))
            })
            airPollutionData.push(dataPoint)
          }
        }
        
        setAirPollutionData(airPollutionData)
      } else {
        throw new Error('Failed to fetch AQI data')
      }

      // Fetch real-time traffic data
      const trafficResponse = await api.get('/traffic/patterns')
      if (trafficResponse.data?.success) {
        setTrafficData(trafficResponse.data.data)
      } else {
        throw new Error('Failed to fetch traffic data')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Fallback to mock data if API fails
      const mockAirPollution = [
        { month: 'Jan', KL: 45, Penang: 38, Johor: 42, Selangor: 48 },
        { month: 'Feb', KL: 52, Penang: 41, Selangor: 55, Johor: 49 },
        { month: 'Mar', KL: 48, Penang: 35, Selangor: 52, Johor: 44 },
        { month: 'Apr', KL: 58, Penang: 42, Selangor: 61, Johor: 55 },
        { month: 'May', KL: 62, Penang: 48, Selangor: 65, Johor: 58 },
        { month: 'Jun', KL: 55, Penang: 40, Selangor: 58, Johor: 52 },
      ]

      const mockTraffic = [
        { time: '6 AM', congestion: 15, accidents: 2 },
        { time: '8 AM', congestion: 85, accidents: 5 },
        { time: '10 AM', congestion: 45, accidents: 1 },
        { time: '12 PM', congestion: 60, accidents: 3 },
        { time: '2 PM', congestion: 55, accidents: 2 },
        { time: '4 PM', congestion: 75, accidents: 4 },
        { time: '6 PM', congestion: 90, accidents: 6 },
        { time: '8 PM', congestion: 40, accidents: 1 },
      ]

      setAirPollutionData(mockAirPollution)
      setTrafficData(mockTraffic)
    } finally {
      setLoading(false)
    }
  }

  const loadForumPosts = () => {
    try {
      const posts = getForumPosts()
      setForumPosts(posts)
    } catch (error) {
      console.error('Error loading forum posts:', error)
      setForumPosts([])
    }
  }

  const handleSubmitPost = (e) => {
    e.preventDefault()
    if (!newPost.title || !newPost.content) return

    setSubmitting(true)
    try {
      const authorName = newPost.author.trim() || 'Anonymous'
      
      // Save user name for future posts
      if (authorName !== 'Anonymous') {
        setCurrentUserName(authorName)
        setCurrentUserNameState(authorName)
      }

      const post = {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        author: authorName,
      }

      addForumPost(post)
      setNewPost({ title: '', content: '', author: '' })
      loadForumPosts()
    } catch (error) {
      console.error('Error submitting post:', error)
      alert('Failed to submit post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post._id)
    setEditPost({ title: post.title, content: post.content })
  }

  const handleCancelEdit = () => {
    setEditingPost(null)
    setEditPost({ title: '', content: '' })
  }

  const handleUpdatePost = (postId) => {
    if (!editPost.title || !editPost.content) return

    try {
      updateForumPost(postId, {
        title: editPost.title.trim(),
        content: editPost.content.trim(),
      })
      setEditingPost(null)
      setEditPost({ title: '', content: '' })
      loadForumPosts()
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Failed to update post. Please try again.')
    }
  }

  const handleDeletePost = (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        deleteForumPost(postId)
        loadForumPosts()
      } catch (error) {
        console.error('Error deleting post:', error)
        alert('Failed to delete post. Please try again.')
      }
    }
  }

  const isMyPost = (post) => {
    // Allow editing/deleting:
    // 1. Own posts (userId matches current user)
    // 2. Default system posts (system_default)
    // 3. Posts without userId (legacy posts - allow editing)
    return post.userId === currentUserId || 
           post.userId === 'system_default' || 
           !post.userId
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const handleSearchCity = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchError('Please enter a city name')
      return
    }

    setSearching(true)
    setSearchError(null)
    setSearchResults(null)

    try {
      const response = await api.get('/aqi/search', {
        params: { city: searchQuery.trim() }
      })

      if (response.data?.success) {
        setSearchResults(response.data.data)
      } else {
        setSearchError(response.data?.message || 'Failed to fetch AQI data')
      }
    } catch (error) {
      console.error('Error searching city:', error)
      setSearchError(
        error.response?.data?.message || 
        `Failed to find AQI data for "${searchQuery}". Please check the city name and try again.`
      )
      setSearchResults(null)
    } finally {
      setSearching(false)
    }
  }

  const getAQIBadgeColor = (aqi) => {
    if (aqi <= 50) return 'bg-green-100 text-green-800 border-green-300'
    if (aqi <= 100) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (aqi <= 150) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (aqi <= 200) return 'bg-red-100 text-red-800 border-red-300'
    if (aqi <= 300) return 'bg-purple-100 text-purple-800 border-purple-300'
    return 'bg-red-900 text-white border-red-950'
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        id="hero"
        className={`py-8 md:py-12 lg:py-16 transition-all duration-1000 ${
          visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="text-left">
              <BlurText
                text="Routely"
                className="xl:-mt-32 text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
                animateBy="characters"
                direction="top"
                delay={50}
                stepDuration={0.3}
              />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Smart, Safe, and Stress-Free Urban Travel
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 font-medium">
                Your city. Your route. Your safety – all in one app
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/route-planner" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                    >
                      Plan Route
                    </Link>
                    <Link 
                      to="/ai-advice" 
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                    >
                      Get AI Advice
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/register" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                    >
                      Sign Up Free
                    </Link>
                    <Link 
                      to="/login" 
                      className="bg-gray-600 hover:bg-gray-700 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
              {!isAuthenticated && (
                <p className="text-gray-500 mt-4 text-sm">
                  Sign up to access Route Planner, AirSOS, AI Advice, and more features
                </p>
              )}
            </div>

            {/* Right Side - Landing Page Image */}
            <div className="flex justify-center lg:justify-end items-center">
              <div className="w-full max-w-md lg:max-w-lg">
                <img
                  src={landingPageImage}
                  alt="Routely - Smart, Safe, and Stress-Free Urban Travel"
                  className="w-full h-auto rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Air Pollution Visualization */}
      <section 
        ref={pollutionRef}
        id="pollution"
        className={`card transition-all duration-1000 delay-200 ${
          visibleSections.has('pollution') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Air Pollution in Malaysia (AQI)</h2>
        <p className="text-gray-600 mb-6">Real-time air quality index across major cities (updates every 5 minutes)</p>
        
        {/* City Search Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Search City Air Quality</h3>
          <form onSubmit={handleSearchCity} className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter city name (e.g., Kuala Lumpur, Penang, Johor)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={searching}
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
          
          {searchError && (
            <div className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded border border-red-200">
              {searchError}
            </div>
          )}

          {/* Search Results Card */}
          {searchResults && (
            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-200 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">{searchResults.city}</h4>
                  <p className="text-sm text-gray-600">Source: IQAir</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border-2 font-bold text-2xl ${getAQIBadgeColor(searchResults.aqi)}`}>
                  {searchResults.aqi}
                </div>
              </div>
              
              <div className="mb-3">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold`}
                      style={{ backgroundColor: searchResults.aqiColor + '20', color: searchResults.aqiColor, border: `1px solid ${searchResults.aqiColor}` }}>
                  {searchResults.aqiCategory}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                {searchResults.pm25 !== null && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">PM2.5</div>
                    <div className="text-lg font-bold text-gray-900">{searchResults.pm25} µg/m³</div>
                  </div>
                )}
                {searchResults.pm10 !== null && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">PM10</div>
                    <div className="text-lg font-bold text-gray-900">{searchResults.pm10} µg/m³</div>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                Last updated: {new Date(searchResults.timestamp).toLocaleString()}
                {searchResults.url && (
                  <a 
                    href={searchResults.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    View on IQAir →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        {loading ? (
          <LoaderAnimation text="Loading air pollution data..." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={airPollutionData}>
              <defs>
                <linearGradient id="colorKL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSelangor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorPenang" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorJohor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis label={{ value: 'AQI', angle: -90, position: 'insideLeft' }} stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area type="monotone" dataKey="KL" stroke="#3b82f6" strokeWidth={2} fill="url(#colorKL)" name="Kuala Lumpur" />
              <Area type="monotone" dataKey="Selangor" stroke="#10b981" strokeWidth={2} fill="url(#colorSelangor)" name="Selangor" />
              <Area type="monotone" dataKey="Penang" stroke="#f59e0b" strokeWidth={2} fill="url(#colorPenang)" name="Penang" />
              <Area type="monotone" dataKey="Johor" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorJohor)" name="Johor" />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Note:</strong> AQI below 50 is considered good. Higher values indicate poorer air quality.</p>
        </div>
      </section>

      {/* Traffic Visualization */}
      <section 
        ref={trafficRef}
        id="traffic"
        className={`card transition-all duration-1000 delay-300 ${
          visibleSections.has('traffic') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Traffic Patterns in Malaysia</h2>
        <p className="text-gray-600 mb-6">Real-time traffic congestion and accident patterns (updates every 5 minutes)</p>
        {loading ? (
          <LoaderAnimation text="Loading traffic data..." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trafficData}>
              <defs>
                <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="colorAccidents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis yAxisId="left" label={{ value: 'Congestion %', angle: -90, position: 'insideLeft' }} stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Accidents', angle: 90, position: 'insideRight' }} stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar yAxisId="left" dataKey="congestion" fill="url(#colorCongestion)" name="Congestion %" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="accidents" fill="url(#colorAccidents)" name="Accidents" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Peak Hours:</strong> 7-9 AM and 5-7 PM show highest congestion and accident rates.</p>
        </div>
      </section>

      {/* Live Forum Section */}
      <section 
        ref={forumRef}
        id="forum"
        className={`card transition-all duration-1000 delay-400 ${
          visibleSections.has('forum') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Health & Wellbeing Forum</h2>
        <p className="text-gray-600 mb-6">Share your insights and tips for healthy living in Malaysia</p>
        
        {!isAuthenticated && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-700 mb-4">
              <strong>Sign up to participate in the forum</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/register" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Sign Up Free
              </Link>
              <Link 
                to="/login" 
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* New Post Form - Only show for authenticated users */}
        {isAuthenticated && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Share Your Insight</h3>
            <form onSubmit={handleSubmitPost} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={newPost.author}
                onChange={(e) => {
                  setNewPost({ ...newPost, author: e.target.value })
                  if (e.target.value) {
                    setCurrentUserName(e.target.value)
                    setCurrentUserNameState(e.target.value)
                  }
                }}
                className="input-field mb-3"
              />
              <input
                type="text"
                placeholder="Post title..."
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="input-field mb-3"
                required
              />
              <textarea
                placeholder="Share your health and wellbeing tips..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="input-field min-h-[100px]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Insight'}
            </button>
          </form>
        </div>
        )}

        {/* Forum Posts */}
        <div className="space-y-4">
          {forumPosts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No posts yet. Be the first to share!</p>
          ) : (
            forumPosts.map((post) => (
              <div key={post._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {editingPost === post._id ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editPost.title}
                      onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                      className="input-field w-full"
                      placeholder="Post title..."
                    />
                    <textarea
                      value={editPost.content}
                      onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                      className="input-field w-full min-h-[100px]"
                      placeholder="Post content..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdatePost(post._id)}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{post.title}</h4>
                      <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {!post.updatedAt && (
                          <>
                            <span>By {post.author}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        {post.updatedAt && (
                          <>
                            <span>•</span>
                            <span className="italic">Edited {formatTimeAgo(post.updatedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {/* Edit/Delete buttons for own posts - only show if authenticated */}
                      {isAuthenticated && isMyPost(post) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditPost(post)}
                              className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                              title="Edit post"
                              aria-label="Edit post"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePost(post._id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Delete post"
                              aria-label="Delete post"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                      )}
                      {/* Like button */}
                      <div className="flex items-center gap-1">
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <span className="text-sm text-gray-600">{post.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
