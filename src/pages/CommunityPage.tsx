import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import CommunityPost from '../components/CommunityPost'
import ShareModal from '../components/ShareModal'
import { supabase, getCommunityPosts, CommunityPostItem } from '../lib/supabase'

type FilterType = 'all' | 'trending' | 'newest' | 'beginner' | 'intermediate' | 'advanced'

const CommunityPage: React.FC = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<CommunityPostItem[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else {
        setUser(session?.user ?? null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoadingPosts(true)
      setFetchError(null)
      const { data, error } = await getCommunityPosts()
      if (error) {
        setFetchError('Failed to load community posts.')
      } else {
        setPosts(data ?? [])
      }
      setIsLoadingPosts(false)
    }
    fetchPosts()
  }, [])

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All Projects' },
    { id: 'trending', label: '🔥 Trending' },
    { id: 'newest', label: '✨ Newest' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ]

  const filteredPosts = posts.filter(post => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      post.title.toLowerCase().includes(q) ||
      post.description.toLowerCase().includes(q) ||
      (post.tags ?? []).some(tag => tag.toLowerCase().includes(q))

    if (!matchesSearch) return false

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    switch (filter) {
      case 'trending':
        return (post.likes_count ?? 0) > 20
      case 'newest':
        return post.created_at ? new Date(post.created_at).getTime() > sevenDaysAgo : false
      case 'beginner':
        return post.difficulty === 'Beginner'
      case 'intermediate':
        return post.difficulty === 'Intermediate'
      case 'advanced':
        return post.difficulty === 'Advanced'
      default:
        return true
    }
  })

  return (
    <div className="min-h-screen bg-dark">
      <Header user={user} />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-4xl font-bold text-white mb-3">
              Community <span className="gradient-text">Projects</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Explore amazing gadget projects built by our community. Get inspired, learn from others, and share your own creations!
            </p>
          </div>

          {/* Search and Share Button */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects, tags, or makers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-light border border-dark-lighter rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <button
              onClick={() => {
                if (!user) {
                  navigate('/login')
                  return
                }
                setShowShareModal(true)
              }}
              className="bg-primary text-dark font-semibold px-6 py-3 rounded-xl hover:bg-primary-light transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Share Your Project
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f.id
                    ? 'bg-primary text-dark'
                    : 'bg-dark-light border border-dark-lighter text-gray-400 hover:text-white hover:border-primary/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mb-8 text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span><strong className="text-white">{posts.length}</strong> projects shared</span>
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span><strong className="text-white">1.2k</strong> makers</span>
            </span>
          </div>

          {/* Posts Grid */}
          {isLoadingPosts ? (
            <div className="text-center py-20">
              <div className="loader mx-auto mb-4" />
              <p className="text-gray-500">Loading community projects...</p>
            </div>
          ) : fetchError ? (
            <div className="text-center py-16">
              <p className="text-red-400">{fetchError}</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, index) => (
                <CommunityPost key={post.id} post={post} index={index} user={user} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-dark-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">{posts.length === 0 ? 'No projects yet' : 'No projects found'}</h3>
              <p className="text-gray-500">{posts.length === 0 ? 'Be the first to share a project!' : 'Try adjusting your search or filters'}</p>
            </div>
          )}

          {/* Load More */}
          {filteredPosts.length > 0 && (
            <div className="text-center mt-10">
              <button className="bg-dark-light border border-dark-lighter text-white px-8 py-3 rounded-xl hover:border-primary/50 transition-colors">
                Load More Projects
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          onShared={(newPost) => {
            setPosts(prev => [newPost, ...prev])
            setShowShareModal(false)
          }}
        />
      )}
    </div>
  )
}

export default CommunityPage
