import { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import LoaderAnimation from '../components/LoaderAnimation'

const AIAdvice = () => {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Sample questions to help users
  const sampleQuestions = [
    {
      question: "Which route is safer for a jog at 7 AM?",
      icon: "🏃",
      category: "Safety"
    },
    {
      question: "Which areas have the cleanest air this week?",
      icon: "🌿",
      category: "Air Quality"
    },
    {
      question: "What's the best time to avoid traffic congestion?",
      icon: "🚗",
      category: "Traffic"
    },
    {
      question: "How can I find safe walking routes at night?",
      icon: "🌙",
      category: "Safety"
    },
    {
      question: "Where are the safest parks in Kuala Lumpur?",
      icon: "🌳",
      category: "Locations"
    },
    {
      question: "What are the healthiest routes for cycling?",
      icon: "🚴",
      category: "Health"
    },
  ]

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    const userMessage = query.trim()
    setQuery('')
    setError(null)

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newUserMessage])

    setLoading(true)

    try {
      // Use longer timeout for AI requests (60 seconds)
      const response = await api.post('/ai/chat', {
        query: userMessage,
      }, {
        timeout: 60000, // 60 seconds for AI requests
      })

      if (response.data.success) {
        const aiMessage = {
          role: 'assistant',
          content: response.data.data.response,
          timestamp: new Date().toISOString(),
          fallback: response.data.data.fallback || false,
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        throw new Error(response.data.message || 'Failed to get AI response')
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      let errorMessage = 'Failed to get AI response. Please try again.'
      
      // Handle different error types with helpful messages
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Request timed out. The AI is taking too long to respond. Please try again with a shorter question.'
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
        errorMessage = `🔴 Network Error: Cannot connect to backend server at ${apiUrl}\n\nPlease check:\n• Backend server is running (cd backend && npm run dev)\n• Server is accessible at ${apiUrl}\n• Check your network connection\n\nSee AI_ADVICE_TROUBLESHOOTING.md for detailed help.`
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. The /api/ai/chat route may not be registered. Please check the backend server configuration.'
      } else if (error.response?.status === 500) {
        errorMessage = error.response?.data?.message || 'Server error occurred. Please check:\n\n• If the Gemini API key is configured in backend/.env\n• Backend server logs for more details'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      
      const errorMsg = {
        role: 'error',
        content: errorMessage,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleSampleQuestion = (question) => {
    setQuery(question)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setMessages([])
      setError(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">AI Advice & Support</h1>
                <p className="text-blue-50 text-sm md:text-base">Powered by Google Gemini AI</p>
              </div>
            </div>
            <p className="text-blue-100 text-base md:text-lg max-w-2xl">
              Get intelligent answers about routes, air quality, safety, and travel planning in Malaysia
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sample Questions Sidebar - Only show when no messages */}
        {messages.length === 0 && (
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-900">Quick Start</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Try asking about:</p>
              <div className="space-y-2">
                {sampleQuestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleQuestion(item.question)}
                    className="w-full text-left p-3 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-teal-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium leading-relaxed group-hover:text-blue-700 transition-colors">
                          {item.question}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-0.5 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className={`${messages.length === 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="card p-0 overflow-hidden shadow-xl border border-gray-200">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Assistant</h2>
                  <p className="text-xs text-blue-100">Online • Ready to help</p>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Chat
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="h-[600px] overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="bg-gradient-to-br from-blue-100 to-teal-100 rounded-full p-6 mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">How can I help you today?</h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    Ask me anything about route planning, air quality, traffic conditions, safety tips, or travel advice for Malaysia.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>AI Assistant is ready</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`flex-shrink-0 ${
                        message.role === 'user' ? 'order-2' : 'order-1'
                      }`}>
                        {message.role === 'user' ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-6 h-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={`flex-1 ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          {message.fallback && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded">
                                Offline Mode
                              </span>
                            </>
                          )}
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl px-5 py-4 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ml-auto max-w-[85%]'
                              : message.role === 'error'
                              ? 'bg-red-50 text-red-800 border-2 border-red-200 max-w-[85%]'
                              : 'bg-white text-gray-900 border border-gray-200 max-w-[85%]'
                          }`}
                        >
                          <div className={`text-sm md:text-base leading-relaxed ${
                            message.role === 'error' ? 'whitespace-pre-wrap' : 'whitespace-pre-wrap'
                          }`}>
                            {message.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading Indicator */}
                  {loading && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-700">AI Assistant</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">Typing...</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm max-w-[85%]">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-4">
              {error && (
                <div className="mb-3 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="whitespace-pre-wrap">{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                    placeholder="Ask about routes, air quality, safety, or travel advice..."
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                    rows="1"
                    disabled={loading}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                    {query.length > 0 && `${query.length} chars`}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Send</span>
                    </>
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Powered by Google Gemini AI • Automatic fallback available • Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAdvice
