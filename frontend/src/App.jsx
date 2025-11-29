import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RoutePlanner from './pages/RoutePlanner'
import AirSOS from './pages/AirSOS'
import AIAdvice from './pages/AIAdvice'
import GuardianConnect from './pages/GuardianConnect'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/route-planner" element={<RoutePlanner />} />
          <Route path="/air-sos" element={<AirSOS />} />
          <Route path="/ai-advice" element={<AIAdvice />} />
          <Route path="/guardian-connect" element={<GuardianConnect />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

