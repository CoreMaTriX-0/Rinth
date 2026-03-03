import { useState, useEffect } from 'react'
import {
  shareProjectToCommunity,
  getProjectHistory,
  getUserCommunityPosts,
  CommunityPostItem,
  ProjectHistoryItem,
} from '../lib/supabase'

interface ShareModalProps {
  onClose: () => void
  onShared?: (newPost: CommunityPostItem) => void
}

const getDifficultyColor = (d?: string) => {
  switch (d) {
    case 'Beginner': return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'Intermediate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'Advanced': return 'text-red-400 bg-red-400/10 border-red-400/20'
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
  }
}

const ShareModal: React.FC<ShareModalProps> = ({ onClose, onShared }) => {
  // step: 'pick' | 'form' | 'done'
  const [step, setStep] = useState<'pick' | 'form' | 'done'>('pick')

  // Picker state
  const [projects, setProjects] = useState<ProjectHistoryItem[]>([])
  const [sharedProjectIds, setSharedProjectIds] = useState<Set<string>>(new Set())
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [selected, setSelected] = useState<ProjectHistoryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    tags: '',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    cost: '',
    imageUrl: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoadingProjects(true)
      const [historyResult, sharedResult] = await Promise.all([
        getProjectHistory(100),
        getUserCommunityPosts(),
      ])
      if (historyResult.data) setProjects(historyResult.data)
      if (sharedResult.data) {
        const ids = (sharedResult.data as any[])
          .map((p: any) => p.project_id as string | null)
          .filter(Boolean) as string[]
        setSharedProjectIds(new Set(ids))
      }
      setLoadingProjects(false)
    }
    load()
  }, [])

  const handleSelect = (project: ProjectHistoryItem) => {
    setSelected(project)
    setFormData({
      projectTitle: project.title ?? '',
      description: project.description ?? '',
      tags: (project.tags ?? []).join(', '),
      difficulty: project.difficulty ?? 'Beginner',
      cost: project.estimated_cost ?? '',
      imageUrl: project.image_url ?? '',
    })
    setStep('form')
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

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
      difficulty: formData.difficulty,
      estimated_cost: formData.cost || undefined,
      tags: tagsArray,
      project_id: selected?.id,
    })

    setIsSubmitting(false)

    if (error) {
      setSubmitError(error.message || 'Failed to share project. Please try again.')
      return
    }

    setStep('done')
    if (data && onShared) onShared(data as CommunityPostItem)
  }

  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase()
    return (
      !q ||
      p.title?.toLowerCase().includes(q) ||
      (p.tags ?? []).some(t => t.toLowerCase().includes(q))
    )
  })

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-dark-light border border-dark-lighter rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-fade-in shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-lighter flex-shrink-0">
          <div className="flex items-center gap-3">
            {step === 'form' && (
              <button
                onClick={() => setStep('pick')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-bold text-white">
              {step === 'pick' ? 'Share Your Project' : step === 'form' ? 'Edit & Share' : 'Shared!'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="flex items-center gap-2 px-6 pt-4 pb-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'pick' ? 'text-primary' : 'text-gray-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${step === 'form' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-primary bg-primary/10 text-primary'}`}>
                {step === 'form' ? '✓' : '1'}
              </div>
              Pick project
            </div>
            <div className="flex-1 h-px bg-dark-lighter" />
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'form' ? 'text-primary' : 'text-gray-600'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${step === 'form' ? 'border-primary bg-primary/10 text-primary' : 'border-dark-lighter text-gray-600'}`}>
                2
              </div>
              Review & share
            </div>
          </div>
        )}

        {/* ── STEP 1: PICK ── */}
        {step === 'pick' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-6 py-3 flex-shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search your projects…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-dark border border-dark-lighter rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2.5">
              {loadingProjects ? (
                <div className="flex justify-center py-12">
                  <div className="loader" />
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">
                    {projects.length === 0
                      ? 'No projects yet. Generate one first!'
                      : 'No projects match your search.'}
                  </p>
                </div>
              ) : (
                filteredProjects.map(project => {
                  const alreadyShared = !!project.id && sharedProjectIds.has(project.id)
                  return (
                    <button
                      key={project.id}
                      onClick={() => !alreadyShared && handleSelect(project)}
                      disabled={alreadyShared}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all group ${
                        alreadyShared
                          ? 'border-dark-lighter opacity-50 cursor-not-allowed bg-dark/20'
                          : 'border-dark-lighter hover:border-primary/50 hover:bg-dark/60 cursor-pointer bg-dark/20'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-dark-lighter">
                        {project.image_url
                          ? <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl text-gray-600">🔧</div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-white text-sm font-semibold truncate">{project.title}</span>
                          {project.difficulty && (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs border flex-shrink-0 ${getDifficultyColor(project.difficulty)}`}>
                              {project.difficulty}
                            </span>
                          )}
                          {alreadyShared && (
                            <span className="px-1.5 py-0.5 rounded-full text-xs bg-primary/10 border border-primary/20 text-primary flex items-center gap-1 flex-shrink-0">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Already shared
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs line-clamp-1">{project.description}</p>
                        <p className="text-gray-600 text-xs mt-0.5">{formatDate(project.created_at)}</p>
                      </div>

                      {!alreadyShared && (
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-primary transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: FORM ── */}
        {step === 'form' && selected && (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Selected project preview */}
              <div className="flex items-center gap-3 p-3 bg-dark/50 border border-dark-lighter rounded-xl">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-dark-lighter">
                  {selected.image_url
                    ? <img src={selected.image_url} alt={selected.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-lg text-gray-600">🔧</div>
                  }
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sharing from Your Projects</p>
                  <p className="text-white text-sm font-medium">{selected.title}</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Project Title *</label>
                <input type="text" name="projectTitle" value={formData.projectTitle}
                  onChange={handleChange} required placeholder="e.g., Smart Plant Watering System"
                  className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Description *</label>
                <textarea name="description" value={formData.description}
                  onChange={handleChange} required rows={3}
                  placeholder="Tell the community about your project…"
                  className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors resize-none text-sm"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Project Image URL</label>
                <input type="url" name="imageUrl" value={formData.imageUrl}
                  onChange={handleChange} placeholder="https://example.com/image.jpg"
                  className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Tags</label>
                <input type="text" name="tags" value={formData.tags}
                  onChange={handleChange} placeholder="Arduino, Robotics, IoT (comma separated)"
                  className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                />
              </div>

              {/* Difficulty & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">Difficulty</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange}
                    className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 transition-colors text-sm">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1.5">Estimated Cost</label>
                  <input type="text" name="cost" value={formData.cost} onChange={handleChange}
                    placeholder="$50"
                    className="w-full bg-dark border border-dark-lighter rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                  />
                </div>
              </div>

              {submitError && (
                <p className="text-red-400 text-sm text-center">{submitError}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-dark-lighter flex-shrink-0">
              <button type="submit" disabled={isSubmitting}
                className="w-full bg-primary text-dark font-bold py-3 rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                    Sharing…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Share to Community
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: DONE ── */}
        {step === 'done' && (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Project Shared!</h3>
            <p className="text-gray-400 mb-6">Your project is now live in the community.</p>
            <button onClick={onClose}
              className="bg-primary text-dark px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-light transition-colors text-sm">
              View Community
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShareModal
