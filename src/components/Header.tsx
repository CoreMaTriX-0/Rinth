import { Link } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import { useState } from 'react'

interface HeaderProps {
  showBack?: boolean
  user?: any
}

const Header: React.FC<HeaderProps> = ({ showBack = false, user = null }) => {
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const getUserDisplayName = () => {
    if (user?.user_metadata?.username) {
      return user.user_metadata.username
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark/90 backdrop-blur-md border-b border-dark-lighter">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <Link 
              to="/" 
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </Link>
          )}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-dark" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Rinth
            </h1>
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/community" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Community
          </Link>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors text-sm">
            About
          </a>
          
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-primary text-dark px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary-light transition-colors flex items-center gap-2"
              >
                <div className="w-6 h-6 bg-dark/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{getUserDisplayName()[0].toUpperCase()}</span>
                </div>
                {getUserDisplayName()}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-light border border-dark-lighter rounded-lg shadow-xl py-2">
                  <div className="px-4 py-2 border-b border-dark-lighter">
                    <p className="text-white font-medium text-sm">{getUserDisplayName()}</p>
                    <p className="text-gray-400 text-xs truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-dark-lighter transition-colors text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-primary text-dark px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary-light transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
