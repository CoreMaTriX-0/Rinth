import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GeminiService } from '../services/geminiService'
import { EngineeringProject } from '../services/types'

const PromptInput: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Get GeminiService instance (uses Puter.js for free AI access)
      const geminiService = await GeminiService.getInstance()
      
      // Generate project plan using Gemini API
      const projectPlan = await geminiService.generateProjectPlan(prompt)
      
      // Generate project image (only if title exists)
      const imageUrl = projectPlan?.title 
        ? await geminiService.generateProjectImage(projectPlan.title)
        : undefined
      
      // Find buying links (only if components exist)
      const buyingLinks = projectPlan?.components 
        ? await geminiService.findBuyingLinks(projectPlan.components)
        : []
      
      // Combine all data
      const fullProject: EngineeringProject = {
        ...projectPlan,
        imageUrl,
        buyingLinks
      }
      
      // Navigate to response page with the project data
      navigate('/response', { state: { prompt, project: fullProject } })
    } catch (err) {
      console.error('Error generating project:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate project. Please try again.')
      setIsLoading(false)
    }
  }

  const suggestions = [
    "Build a line-following robot",
    "Create an Arduino weather station",
    "Design a smart home automation system",
    "Make a gesture-controlled car"
  ]

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative bg-dark-light rounded-2xl border border-dark-lighter hover:border-primary/50 transition-colors">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your gadget project idea..."
            className="w-full bg-transparent text-white placeholder-gray-500 px-6 py-5 pr-16 resize-none focus:outline-none min-h-[120px] text-lg"
            rows={3}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="absolute right-4 bottom-4 w-12 h-12 bg-primary rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-light transition-all hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Suggestions */}
      <div className="mt-8">
        <p className="text-gray-500 text-sm mb-4 text-center">Try these ideas</p>
        <div className="flex flex-wrap justify-center gap-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setPrompt(suggestion)}
              className="px-4 py-2 bg-dark-light border border-dark-lighter rounded-full text-sm text-gray-400 hover:text-white hover:border-primary/50 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PromptInput
