import { useState } from 'react'
import { CommunityPostItem } from '../lib/supabase'

interface CommunityPostProps {
  post: CommunityPostItem
  index: number
}

const formatTimeAgo = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CommunityPost: React.FC<CommunityPostProps> = ({ post, index }) => {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes_count ?? 0)
  const [showComments, setShowComments] = useState(false)

  const username = post.profiles?.username ?? 'anonymous'
  const avatarUrl = post.profiles?.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
  const timeAgo = post.created_at ? formatTimeAgo(post.created_at) : ''

  const handleLike = () => {
    if (liked) {
      setLikeCount(prev => prev - 1)
    } else {
      setLikeCount(prev => prev + 1)
    }
    setLiked(!liked)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-400 bg-green-400/10'
      case 'Intermediate':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'Advanced':
        return 'text-red-400 bg-red-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

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
        
        {/* Difficulty Badge */}
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(post.difficulty ?? '')}`}>
          {post.difficulty}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={avatarUrl}
            alt={username}
            className="w-8 h-8 rounded-full bg-dark-lighter"
          />
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
        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
          {post.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(post.tags ?? []).map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-dark rounded-md text-xs text-primary">
              #{tag}
            </span>
          ))}
        </div>

        {/* Cost */}
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Est. cost: <strong className="text-white">{post.estimated_cost ?? 'N/A'}</strong></span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-dark-lighter">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <svg 
              className="w-5 h-5" 
              fill={liked ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm">{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">{post.comments_count ?? 0}</span>
          </button>

          <button className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          <button className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Comments Section (Expandable) */}
      {showComments && (
        <div className="px-5 pb-5 border-t border-dark-lighter">
          <div className="pt-4 space-y-3">
            <div className="flex gap-3">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1"
                alt="commenter"
                className="w-7 h-7 rounded-full bg-dark-lighter flex-shrink-0"
              />
              <div className="bg-dark rounded-xl px-3 py-2 flex-1">
                <span className="text-primary text-xs font-medium">@tech_fan</span>
                <p className="text-gray-300 text-sm">Amazing project! How long did it take you to build?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user2"
                alt="commenter"
                className="w-7 h-7 rounded-full bg-dark-lighter flex-shrink-0"
              />
              <div className="bg-dark rounded-xl px-3 py-2 flex-1">
                <span className="text-primary text-xs font-medium">@maker_pro</span>
                <p className="text-gray-300 text-sm">Great work! Would love to see the wiring diagram.</p>
              </div>
            </div>
            {/* Add Comment Input */}
            <div className="flex gap-3 mt-3">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=me"
                alt="you"
                className="w-7 h-7 rounded-full bg-dark-lighter flex-shrink-0"
              />
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-dark border border-dark-lighter rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommunityPost
