import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import PromptInput from '../components/PromptInput'
import { supabase } from '../lib/supabase'

const PromptPage: React.FC = () => {
  const [user, setUser] = useState<any>(null)
  const [_isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check current auth state
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setIsLoading(false)
      console.log('Current user on home page:', session?.user?.email || 'Not logged in')
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      console.log('Auth state changed:', session?.user?.email || 'Logged out')
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Header user={user} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span className="text-primary text-sm font-medium">Powered by Gemini AI</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Build Your <span className="gradient-text">Gadget</span> Ideas
          </h1>
          
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Describe your robotics, electronics, or DIY project idea and get instant 
            AI-generated instructions, components list, code, and shopping links.
          </p>
        </div>

        {/* Prompt Input */}
        <PromptInput />

        {/* Community CTA */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link 
            to="/community" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Explore <strong className="text-primary">1,200+</strong> community projects</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-600 text-sm border-t border-dark-lighter">
        <p>© 2026 <span className="text-primary font-semibold">Rinth</span>. Built for makers.</p>
      </footer>
    </div>
  )
}

export default PromptPage
