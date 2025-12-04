import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RoutePlanner from './pages/RoutePlanner'
import AirSOS from './pages/AirSOS'
import AIAdvice from './pages/AIAdvice'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Leaderboard from './pages/Leaderboard'
import Achievements from './pages/Achievements'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/route-planner"
                  element={
                    <ProtectedRoute>
                      <RoutePlanner />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/air-sos"
                  element={
                    <ProtectedRoute>
                      <AirSOS />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-advice"
                  element={
                    <ProtectedRoute>
                      <AIAdvice />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/achievements"
                  element={
                    <ProtectedRoute>
                      <Achievements />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  )
}

export default App

