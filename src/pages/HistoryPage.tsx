import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { supabase, getProjectHistory, deleteProjectFromHistory, toggleProjectFavorite, ProjectHistoryItem } from '../lib/supabase'

const HistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<ProjectHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/login')
        return
      }
      setUser(session.user)
      loadHistory()
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

  const loadHistory = async () => {
    setIsLoading(true)
    const { data, error } = await getProjectHistory()
    if (error) {
      console.error('Error loading history:', error)
    } else {
      setProjects(data || [])
    }
    setIsLoading(false)
  }

  const handleDelete = async (projectId: string) => {
    const { error } = await deleteProjectFromHistory(projectId)
    if (!error) {
      setProjects(projects.filter(p => p.id !== projectId))
      setDeleteConfirm(null)
    }
  }

  const handleToggleFavorite = async (projectId: string, currentStatus: boolean) => {
    const { error } = await toggleProjectFavorite(projectId, !currentStatus)
    if (!error) {
      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, is_favorite: !currentStatus } : p
      ))
    }
  }

  const filteredProjects = filter === 'favorites' 
    ? projects.filter(p => p.is_favorite) 
    : projects

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
            <p className="text-gray-400">Your previously generated projects</p>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-dark'
                  : 'bg-dark-light text-gray-400 hover:text-white'
              }`}
            >
              All Projects
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'favorites'
                  ? 'bg-primary text-dark'
                  : 'bg-dark-light text-gray-400 hover:text-white'
              }`}
            >
              ⭐ Favorites
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="loader"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📂</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {filter === 'favorites' ? 'No favorite projects yet' : 'No projects yet'}
            </h2>
            <p className="text-gray-400 mb-6">
              {filter === 'favorites' 
                ? 'Star your favorite projects to see them here'
                : 'Generate your first project to get started'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-dark px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Project
            </Link>
          </div>
        )}

        {/* Project Grid */}
        {!isLoading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-dark-light rounded-xl overflow-hidden border border-dark-lighter hover:border-primary/50 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative aspect-video bg-dark-lighter overflow-hidden">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                      🔧
                    </div>
                  )}
                  
                  {/* Community remix badge */}
                  {project.source_community_post_id && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-dark/80 backdrop-blur-sm border border-primary/30 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      From Community
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={() => handleToggleFavorite(project.id!, project.is_favorite || false)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-dark/80 flex items-center justify-center hover:bg-dark transition-colors"
                  >
                    {project.is_favorite ? (
                      <span className="text-yellow-400 text-xl">⭐</span>
                    ) : (
                      <span className="text-gray-400 text-xl hover:text-yellow-400">☆</span>
                    )}
                  </button>

                  {/* Difficulty Badge */}
                  {project.difficulty && (
                    <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                      project.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                      project.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {project.difficulty}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
                    {project.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {project.description || project.prompt}
                  </p>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-dark rounded text-xs text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{project.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-500 mb-4">
                    {formatDate(project.created_at!)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/response?historyId=${project.id}`}
                      className="flex-1 text-center bg-primary text-dark py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
                    >
                      View Project
                    </Link>
                    
                    {deleteConfirm === project.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(project.id!)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-2 bg-dark text-gray-400 rounded-lg text-sm hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(project.id!)}
                        className="px-3 py-2 bg-dark text-gray-400 rounded-lg hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default HistoryPage
