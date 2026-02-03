import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [_isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...')
        
        // Check if there's a hash fragment (OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        console.log('Hash params:', Object.fromEntries(hashParams))
        console.log('Access token present:', !!accessToken)
        
        // Wait a moment for Supabase to process the auth
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Session data:', session)
        console.log('Session error:', sessionError)
        
        if (sessionError) {
          throw sessionError
        }
        
        if (session && session.user) {
          console.log('User authenticated:', session.user.email)
          // Successfully authenticated, redirect to home
          setIsProcessing(false)
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 500)
        } else {
          console.log('No session found after callback')
          throw new Error('Authentication completed but no session was created')
        }
      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError(err.message || 'Authentication failed')
        setIsProcessing(false)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl text-white font-bold mb-2">Authentication Failed</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-gray-500 text-sm">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="text-center">
        <div className="loader mx-auto mb-6" />
        <h2 className="text-xl text-white mb-2">Completing sign in...</h2>
        <p className="text-gray-500">Please wait while we verify your authentication.</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
