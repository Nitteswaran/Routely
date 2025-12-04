import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      console.log('Registering user with data:', { ...registerData, password: '***' })
      
      const response = await api.post('/auth/register', registerData)
      
      console.log('Registration response:', response.data)
      
      if (response.data.success) {
        // Store token
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        
        // Redirect to dashboard
        navigate('/dashboard')
      } else {
        setError(response.data.message || 'Registration failed')
      }
    } catch (err) {
      console.error('Registration error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      
      // Show more detailed error message
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message?.includes('CONNECTION_REFUSED')) {
        setError(
          'Cannot connect to backend server. Please make sure the backend server is running. ' +
          'Start it by running: cd backend && npm run dev'
        )
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message)
      } else if (err.response?.data?.error) {
        setError(typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : JSON.stringify(err.response.data.error))
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. The server might be slow or not responding.')
      } else if (err.message) {
        setError(`Error: ${err.message}`)
      } else {
        setError('Registration failed. Please check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Routely and start your journey
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <div className="font-semibold mb-1">Registration Error</div>
              <div>{error}</div>
              {error.includes('backend server') && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="font-semibold text-xs mb-1">Quick Fix:</p>
                  <ol className="text-xs list-decimal list-inside space-y-1">
                    <li>Open a terminal/command prompt</li>
                    <li>Navigate to the backend folder: <code className="bg-red-100 px-1 rounded">cd backend</code></li>
                    <li>Start the server: <code className="bg-red-100 px-1 rounded">npm run dev</code></li>
                    <li>Wait for "MongoDB Connected" and "Server started successfully" messages</li>
                    <li>Try registering again</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Confirm your password"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register

