import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import CampaignCreate from './pages/CampaignCreate'
import CampaignValidate from './pages/CampaignValidate'
import CampaignTracker from './pages/CampaignTracker'
import CampaignAnalytics from './pages/CampaignAnalytics'
import TeamCapacity from './pages/TeamCapacity'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaigns/new" element={<CampaignCreate />} />
          <Route path="/campaigns/:id/validate" element={<CampaignValidate />} />
          <Route path="/campaigns/:id/tracker" element={<CampaignTracker />} />
          <Route path="/campaigns/:id/analytics" element={<CampaignAnalytics />} />
          <Route path="/team" element={<TeamCapacity />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App