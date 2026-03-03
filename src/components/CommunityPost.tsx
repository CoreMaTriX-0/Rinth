import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommunityPostItem,
  PostComment,
  checkPostLiked,
  togglePostLike,
  checkPostSaved,
  togglePostSave,
  getPostComments,
  addPostComment,
} from '../lib/supabase'

interface CommunityPostProps {
  post: CommunityPostItem
  index: number
  user: any
}

const formatTimeAgo = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'text-green-400 bg-green-400/10'
    case 'Intermediate': return 'text-yellow-400 bg-yellow-400/10'
    case 'Advanced': return 'text-red-400 bg-red-400/10'
    default: return 'text-gray-400 bg-gray-400/10'
  }
}

const CommunityPost: React.FC<CommunityPostProps> = ({ post, index, user }) => {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes_count ?? 0)
  const [saved, setSaved] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentCount, setCommentCount] = useState(post.comments_count ?? 0)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)

  const username = post.profiles?.username ?? 'anonymous'
  const avatarUrl = post.profiles?.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  const timeAgo = post.created_at ? formatTimeAgo(post.created_at) : ''

  // Load liked/saved state for the current user
  useEffect(() => {
    if (!user || !post.id) return
    checkPostLiked(post.id).then(setLiked)
    checkPostSaved(post.id).then(setSaved)
  }, [user, post.id])

  // Load comments when section is opened
  useEffect(() => {
    if (!showComments || !post.id) return
    setLoadingComments(true)
    getPostComments(post.id).then(({ data }) => {
      setComments(data ?? [])
      setLoadingComments(false)
    })
  }, [showComments, post.id])

  const handleLike = async () => {
    if (!user) { navigate('/login'); return }
    if (likeLoading || !post.id) return
    setLikeLoading(true)
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1)
    const { error } = await togglePostLike(post.id)
    if (error) {
      setLiked(wasLiked)
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1)
    }
    setLikeLoading(false)
  }

  const handleSave = async () => {
    if (!user) { navigate('/login'); return }
    if (!post.id) return
    const wasSaved = saved
    setSaved(!wasSaved)
    const { error } = await togglePostSave(post.id)
    if (error) setSaved(wasSaved)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    const content = commentText.trim()
    if (!content || !post.id) return
    setSubmittingComment(true)
    const { data, error } = await addPostComment(post.id, content)
    if (!error && data) {
      setComments(prev => [...prev, data])
      setCommentCount(prev => prev + 1)
      setCommentText('')
    }
    setSubmittingComment(false)
  }

  const myAvatar = user
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=guest`

  return (
    <div
      className="bg-dark-light rounded-2xl border border-dark-lighter overflow-hidden hover:border-primary/30 transition-all group animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={post.image_url ?? `https://api.dicebear.com/7.x/shapes/svg?seed=${post.title}`}
          alt={post.title}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-light via-transparent to-transparent" />
        {post.difficulty && (
          <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(post.difficulty)}`}>
            {post.difficulty}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <img src={avatarUrl} alt={username} className="w-8 h-8 rounded-full bg-dark-lighter" />
          <div className="flex-1">
            <span className="text-white text-sm font-medium">@{username}</span>
            <span className="text-gray-600 text-xs ml-2">• {timeAgo}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{post.description}</p>

        {/* Tags */}
        {(post.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(post.tags ?? []).map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-dark rounded-md text-xs text-primary">#{tag}</span>
            ))}
          </div>
        )}

        {/* Cost */}
        {post.estimated_cost && (
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Est. cost: <strong className="text-white">{post.estimated_cost}</strong></span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-dark-lighter">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-2 transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm">{likeCount}</span>
          </button>

          {/* Comments toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 transition-colors ${showComments ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">{commentCount}</span>
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 transition-colors ${saved ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
          >
            <svg className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          {/* Share */}
          <button
            onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/community`)}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-5 pb-5 border-t border-dark-lighter">
          <div className="pt-4 space-y-3">
            {loadingComments ? (
              <p className="text-gray-500 text-sm text-center py-2">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-2">No comments yet. Be the first!</p>
            ) : (
              comments.map(comment => {
                const cUsername = comment.profiles?.username ?? 'anonymous'
                const cAvatar = comment.profiles?.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${cUsername}`
                return (
                  <div key={comment.id} className="flex gap-3">
                    <img src={cAvatar} alt={cUsername} className="w-7 h-7 rounded-full bg-dark-lighter flex-shrink-0" />
                    <div className="bg-dark rounded-xl px-3 py-2 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-primary text-xs font-medium">@{cUsername}</span>
                        <span className="text-gray-600 text-xs">{formatTimeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{comment.content}</p>
                    </div>
                  </div>
                )
              })
            )}

            {/* Add Comment */}
            <form onSubmit={handleSubmitComment} className="flex gap-2 mt-3">
              <img src={myAvatar} alt="you" className="w-7 h-7 rounded-full bg-dark-lighter flex-shrink-0 mt-1" />
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
                disabled={!user || submittingComment}
                className="flex-1 bg-dark border border-dark-lighter rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || !commentText.trim() || submittingComment}
                className="bg-primary text-dark px-3 py-2 rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {submittingComment ? '...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommunityPost