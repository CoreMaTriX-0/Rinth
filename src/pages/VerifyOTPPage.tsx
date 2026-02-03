import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const VerifyOTPPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (!email) {
      navigate('/signup')
      return
    }

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, navigate])

  const handleResend = async () => {
    if (!canResend) return

    setIsLoading(true)
    setError('')
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error

      setCanResend(false)
      setResendCountdown(60)
      setResendSuccess(true)

      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Left Side - Heading */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-light flex-col justify-center px-12">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-dark" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Rinth</h1>
        </Link>
        
        <div className="animate-fade-in">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Verify Your<br />Email Address
          </h2>
          <p className="text-base text-gray-400 mb-6 leading-relaxed">
            We've sent a verification link to your email. Click the link to activate your account and start building amazing projects.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Secure account verification</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>One-click activation</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Get started in minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-6 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in my-auto">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-dark" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Rinth</h1>
          </Link>

          {/* Mobile Header */}
          <div className="text-center lg:text-left mb-4 lg:hidden">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Check Your Email</h2>
            <p className="text-sm text-gray-400">
              Sent to <span className="text-primary font-medium">{email}</span>
            </p>
          </div>

          {/* Desktop Header - Hidden on Mobile */}
          <div className="hidden lg:block text-left mb-6">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Check Your Email</h2>
            <p className="text-sm text-gray-400">
              We sent a verification link to<br />
              <span className="text-primary font-medium">{email}</span>
            </p>
          </div>

        {/* Main Card */}
        <div className="bg-dark-light rounded-xl border border-dark-lighter p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 text-xs">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {resendSuccess && (
            <div className="mb-4 bg-green-500/10 border border-green-500/50 rounded-lg px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-400 text-xs">Verification email resent successfully!</span>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-bold text-xs">1</span>
              </div>
              <div>
                <h3 className="text-white text-sm font-medium mb-0.5">Open your email inbox</h3>
                <p className="text-gray-400 text-xs">Check the email address you provided during signup</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-bold text-xs">2</span>
              </div>
              <div>
                <h3 className="text-white text-sm font-medium mb-0.5">Find the verification email</h3>
                <p className="text-gray-400 text-xs">Look for an email from Rinth with subject "Confirm your email"</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-bold text-xs">3</span>
              </div>
              <div>
                <h3 className="text-white text-sm font-medium mb-0.5">Click the verification link</h3>
                <p className="text-gray-400 text-xs">Click on the "Verify Email" button in the email to complete your registration</p>
              </div>
            </div>
          </div>

          {/* Resend Button */}
          <div className="text-center mb-4">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="w-full bg-primary text-dark text-sm font-bold py-2 rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resend Verification Email
                  </>
                )}
              </button>
            ) : (
              <p className="text-gray-500 text-xs">
                Resend email in <span className="text-primary font-medium">{resendCountdown}s</span>
              </p>
            )}
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t border-dark-lighter">
            <div className="space-y-1 text-xs text-gray-400 text-center">
              <p>
                <strong className="text-white">Didn't receive the email?</strong>
              </p>
              <p>• Check your spam or junk folder</p>
              <p>• Make sure you entered the correct email address</p>
              <p>• Wait a few minutes and check again</p>
              <p className="mt-2">
                Need help?{' '}
                <Link to="/signup" className="text-primary hover:text-primary-light font-medium">
                  Try signing up again
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <Link 
          to="/login" 
          className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors mt-3"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Login
        </Link>
        </div>
      </div>
    </div>
  )
}

export default VerifyOTPPage
