import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PromptPage from './pages/PromptPage'
import ResponsePage from './pages/ResponsePage'
import CommunityPage from './pages/CommunityPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import VerifyOTPPage from './pages/VerifyOTPPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import SavedPage from './pages/SavedPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PromptPage />} />
        <Route path="/response" element={<ResponsePage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyOTPPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </Router>
  )
}

export default App
