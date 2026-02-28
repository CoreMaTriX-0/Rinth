import { useState, useEffect } from 'react'
import Header from '../components/Header'
import ApiKeySettings from '../components/ApiKeySettings'
import { supabase } from '../lib/supabase'

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check current auth state
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-dark">
      <Header showBack user={user} />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-500">Learn about free Gemini access via Puter.js</p>
          </div>

          <div className="space-y-6 animate-slide-up">
            <ApiKeySettings />

            {/* Additional settings sections can be added here */}
            <div className="bg-dark-light rounded-2xl border border-dark-lighter p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">About Rinth</h3>
                  <p className="text-gray-500 text-sm">AI-powered hardware project builder</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-400">
                <p>
                  Rinth uses Google's Gemini AI to generate detailed hardware project plans,
                  including components, instructions, and code.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-gray-500">Version:</span>
                  <span className="text-white font-mono">1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
