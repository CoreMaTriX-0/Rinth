import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for OAuth errors returned in query params
        const urlParams = new URLSearchParams(window.location.search)
        const oauthError = urlParams.get('error')
        const oauthErrorDescription = urlParams.get('error_description')

        if (oauthError) {
          throw new Error(oauthErrorDescription || oauthError)
        }

        // PKCE flow (Supabase v2 default): GitHub returns ?code=... in query params
        const code = urlParams.get('code')

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
          if (data.session?.user) {
            navigate('/', { replace: true })
            return
          }
        }

        // Implicit flow fallback: check hash fragment for access_token
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashError = hashParams.get('error')
        if (hashError) {
          throw new Error(hashParams.get('error_description') || hashError)
        }

        // Final fallback: check if a session already exists
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          navigate('/', { replace: true })
        } else {
          throw new Error('Authentication completed but no session was created. Please try again.')
        }
      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError(err.message || 'Authentication failed')
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
