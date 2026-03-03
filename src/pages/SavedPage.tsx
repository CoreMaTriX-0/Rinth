import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import {
  supabase,
  getSavedPosts,
  togglePostSave,
  saveProjectToHistory,
  CommunityPostItem,
} from '../lib/supabase'
import { GeminiService } from '../services/geminiService'

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'Intermediate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'Advanced': return 'text-red-400 bg-red-400/10 border-red-400/20'
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
  }
}

interface PostCardState {
  modifyPrompt: string
  isGenerating: boolean
  success: boolean
  error: string | null
  unsaving: boolean
}

const SavedPage: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<CommunityPostItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cardStates, setCardStates] = useState<Record<string, PostCardState>>({})

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/login')
        return
      }
      setUser(session.user)
      loadSaved()
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login')
      } else if (session?.user) {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const loadSaved = async () => {
    setIsLoading(true)
    const { data, error } = await getSavedPosts()
    if (!error && data) {
      setPosts(data)
      const states: Record<string, PostCardState> = {}
      data.forEach(p => {
        if (p.id) {
          states[p.id] = { modifyPrompt: '', isGenerating: false, success: false, error: null, unsaving: false }
        }
      })
      setCardStates(states)
    }
    setIsLoading(false)
  }

  const updateCardState = (postId: string, updates: Partial<PostCardState>) => {
    setCardStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], ...updates },
    }))
  }

  const handleUnsave = async (postId: string) => {
    updateCardState(postId, { unsaving: true })
    const { error } = await togglePostSave(postId)
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId))
    } else {
      updateCardState(postId, { unsaving: false })
    }
  }

  const handleModify = async (post: CommunityPostItem) => {
    if (!post.id) return
    const state = cardStates[post.id]
    if (!state?.modifyPrompt.trim()) return

    updateCardState(post.id, { isGenerating: true, error: null, success: false })

    try {
      const service = await GeminiService.getInstance()

      // Build an enriched prompt that gives the AI full context of the original project
      const contextPrompt = [
        `I have a saved project called "${post.title}".`,
        post.description ? `Description: ${post.description}` : '',
        post.difficulty ? `Difficulty: ${post.difficulty}` : '',
        post.estimated_cost ? `Estimated cost: ${post.estimated_cost}` : '',
        (post.tags ?? []).length > 0 ? `Tags: ${post.tags!.join(', ')}` : '',
        `Now modify this project with the following changes: ${state.modifyPrompt}`,
      ]
        .filter(Boolean)
        .join('\n')

      const project = await service.generateProjectPlan(contextPrompt)

      // Save to history as a new project
      await saveProjectToHistory({
        prompt: state.modifyPrompt,
        title: project.title,
        description: project.description,
        difficulty: project.difficulty,
        estimated_time: project.estimatedTime,
        estimated_cost: project.estimatedCost,
        tags: project.tags,
        components: project.components,
        instructions: project.instructions,
        code_blocks: project.code ? [project.code] : [],
        image_url: post.image_url ?? undefined,
        source_community_post_id: post.id,
      })

      updateCardState(post.id, { isGenerating: false, success: true, modifyPrompt: '' })

      // Reset success banner after 4 seconds
      setTimeout(() => updateCardState(post.id!, { success: false }), 4000)
    } catch (err: any) {
      updateCardState(post.id, {
        isGenerating: false,
        error: err?.message ?? 'Failed to generate modified project. Please try again.',
      })
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-dark">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-24">
        {/* Page Header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Saved Projects</h1>
          </div>
          <p className="text-gray-400 ml-13">
            Community projects you've saved. Remix any of them with a prompt to generate a modified version saved to your history.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-24">
            <div className="loader" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-dark-light border border-dark-lighter flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No saved projects yet</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
              Browse community projects and tap the bookmark icon to save them here.
            </p>
            <Link
              to="/community"
              className="inline-flex items-center gap-2 bg-primary text-dark px-6 py-3 rounded-xl font-semibold hover:bg-primary-light transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Explore Community
            </Link>
          </div>
        )}

        {/* Posts grid */}
        {!isLoading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {posts.map((post, index) => {
              const state = post.id ? cardStates[post.id] : null
              const username = post.profiles?.username ?? 'anonymous'
              const avatarUrl =
                post.profiles?.avatar_url ??
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`

              return (
                <div
                  key={post.id}
                  className="bg-dark-light rounded-2xl border border-dark-lighter overflow-hidden flex flex-col animate-fade-in hover:border-primary/30 transition-all"
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        post.image_url ??
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${post.title}`
                      }
                      alt={post.title}
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-light via-transparent to-transparent" />
                    {post.difficulty && (
                      <span
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(post.difficulty)}`}
                      >
                        {post.difficulty}
                      </span>
                    )}
                    {/* Unsave button */}
                    <button
                      onClick={() => post.id && handleUnsave(post.id)}
                      disabled={state?.unsaving}
                      title="Remove from saved"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-dark/80 backdrop-blur-sm flex items-center justify-center text-primary hover:bg-dark hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    {/* Author */}
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={avatarUrl}
                        alt={username}
                        className="w-7 h-7 rounded-full bg-dark-lighter"
                      />
                      <span className="text-gray-400 text-xs">@{username}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-bold text-lg mb-2 leading-snug">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{post.description}</p>

                    {/* Tags */}
                    {(post.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(post.tags ?? []).slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-dark rounded-md text-xs text-primary"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cost */}
                    {post.estimated_cost && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-4">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Est. cost: <strong className="text-white">{post.estimated_cost}</strong>
                      </div>
                    )}

                    {/* Spacer pushes modify area to bottom */}
                    <div className="flex-1" />

                    {/* Success banner */}
                    {state?.success && (
                      <div className="mb-3 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Modified project saved to your{' '}
                        <Link to="/history" className="underline font-medium hover:text-green-300">
                          History
                        </Link>
                        !
                      </div>
                    )}

                    {/* Error banner */}
                    {state?.error && (
                      <div className="mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        {state.error}
                      </div>
                    )}

                    {/* Remix / Modify section */}
                    <div className="mt-3 pt-4 border-t border-dark-lighter">
                      <p className="text-gray-500 text-xs mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Remix with AI — changes save to your History
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={state?.modifyPrompt ?? ''}
                          onChange={e =>
                            post.id &&
                            updateCardState(post.id, {
                              modifyPrompt: e.target.value,
                              error: null,
                            })
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleModify(post)
                          }}
                          placeholder="e.g. use Raspberry Pi instead…"
                          disabled={state?.isGenerating}
                          className="flex-1 min-w-0 bg-dark border border-dark-lighter rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 disabled:opacity-50 transition-colors"
                        />
                        <button
                          onClick={() => handleModify(post)}
                          disabled={
                            state?.isGenerating || !state?.modifyPrompt.trim()
                          }
                          className="bg-primary text-dark px-3 py-2 rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
                        >
                          {state?.isGenerating ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              Generating
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Remix
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default SavedPage
