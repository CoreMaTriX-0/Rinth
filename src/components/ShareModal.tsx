import { useState } from 'react'
import { shareProjectToCommunity, CommunityPostItem } from '../lib/supabase'
import { EngineeringProject } from '../services/types'

interface ShareModalProps {
  onClose: () => void
  onShared?: (newPost: CommunityPostItem) => void
  projectData?: EngineeringProject | null
}

const ShareModal: React.FC<ShareModalProps> = ({ onClose, onShared, projectData }) => {
  const [formData, setFormData] = useState({
    projectTitle: projectData?.title ?? '',
    description: projectData?.description ?? '',
    tags: projectData?.tags?.join(', ') ?? '',
    difficulty: projectData?.difficulty ?? 'Beginner',
    cost: projectData?.estimatedCost ?? '',
    imageUrl: projectData?.imageUrl ?? ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const { data, error } = await shareProjectToCommunity({
      title: formData.projectTitle,
      description: formData.description,
      image_url: formData.imageUrl || null,
      difficulty: formData.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
      estimated_cost: formData.cost || undefined,
      tags: tagsArray,
    })

    setIsSubmitting(false)

    if (error) {
      setSubmitError(error.message || 'Failed to share project. Please try again.')
      return
    }

    setSubmitted(true)
    if (data && onShared) {
      onShared(data as CommunityPostItem)
    } else {
      setTimeout(() => onClose(), 2000)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-dark-light border border-dark-lighter rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-dark-light border-b border-dark-lighter px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Share Your Project</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Project Shared!</h3>
            <p className="text-gray-400">Your project has been shared with the community.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Project Title */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Project Title *
              </label>
              <input
                type="text"
                name="projectTitle"
                value={formData.projectTitle}
                onChange={handleChange}
                required
                placeholder="e.g., Smart Plant Watering System"
                className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Tell us about your project, what it does, and how you built it..."
                className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Project Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/your-project-image.jpg"
                className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <p className="text-gray-500 text-xs mt-1">Paste a link to your project photo</p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Arduino, Robotics, IoT (comma separated)"
                className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Difficulty & Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Estimated Cost
                </label>
                <input
                  type="text"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="$50"
                  className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-dark font-bold py-3 rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Share Project
                </>
              )}
            </button>
            {submitError && (
              <p className="text-red-400 text-sm text-center mt-2">{submitError}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default ShareModal
