import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://gmjcqjzvdavafticeqgc.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNxanp2ZGF2YWZ0aWNlcWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTI2MTQsImV4cCI6MjA4NTY4ODYxNH0.aHa-4GX6S592zKBzjZ022UHswROZxAh_uVHvvqtS0Y4'
)

// Auth helper functions
export const signUpWithEmail = async (email: string, password: string, username: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export const signInWithGithub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export const verifyOTP = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// =============================================
// PROJECT HISTORY TYPES
// =============================================

export interface ProjectHistoryItem {
  id?: string
  user_id?: string
  prompt: string
  title: string
  description?: string
  image_url?: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  estimated_cost?: string
  estimated_time?: string
  tags?: string[]
  instructions?: any[]
  components?: any[]
  code_blocks?: any[]
  buy_links?: any[]
  is_favorite?: boolean
  created_at?: string
  updated_at?: string
}

// =============================================
// PROJECT HISTORY FUNCTIONS
// =============================================

// Save a project to history
export const saveProjectToHistory = async (project: ProjectHistoryItem) => {
  const user = await getCurrentUser()
  if (!user) {
    return { data: null, error: new Error('User not authenticated') }
  }

  const { data, error } = await supabase
    .from('project_history')
    .insert({
      ...project,
      user_id: user.id
    })
    .select()
    .single()

  return { data, error }
}

// Get user's project history
export const getProjectHistory = async (limit = 50, offset = 0) => {
  const user = await getCurrentUser()
  if (!user) {
    return { data: null, error: new Error('User not authenticated') }
  }

  const { data, error } = await supabase
    .from('project_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

// Get a single project from history
export const getProjectFromHistory = async (projectId: string) => {
  const { data, error } = await supabase
    .from('project_history')
    .select('*')
    .eq('id', projectId)
    .single()

  return { data, error }
}

// Update a project in history (e.g., toggle favorite)
export const updateProjectHistory = async (projectId: string, updates: Partial<ProjectHistoryItem>) => {
  const user = await getCurrentUser()
  if (!user) {
    return { data: null, error: new Error('User not authenticated') }
  }

  const { data, error } = await supabase
    .from('project_history')
    .update(updates)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select()
    .single()

  return { data, error }
}

// Delete a project from history
export const deleteProjectFromHistory = async (projectId: string) => {
  const user = await getCurrentUser()
  if (!user) {
    return { data: null, error: new Error('User not authenticated') }
  }

  const { error } = await supabase
    .from('project_history')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  return { error }
}

// Toggle favorite status
export const toggleProjectFavorite = async (projectId: string, isFavorite: boolean) => {
  return updateProjectHistory(projectId, { is_favorite: isFavorite })
}

// Get favorite projects
export const getFavoriteProjects = async () => {
  const user = await getCurrentUser()
  if (!user) {
    return { data: null, error: new Error('User not authenticated') }
  }

  const { data, error } = await supabase
    .from('project_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_favorite', true)
    .order('created_at', { ascending: false })

  return { data, error }
}

// =============================================
// IMAGE UPLOAD FUNCTIONS
// =============================================

// Upload project image to storage
export const uploadProjectImage = async (file: File, projectId?: string) => {
  const user = await getCurrentUser()
  if (!user) {
    return { data: null, error: new Error('User not authenticated') }
  }

  // Create unique file path: user_id/timestamp_filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}_${projectId || 'temp'}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('project-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    return { data: null, error }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('project-images')
    .getPublicUrl(data.path)

  return { data: { path: data.path, publicUrl }, error: null }
}

// Delete project image from storage
export const deleteProjectImage = async (imagePath: string) => {
  const { error } = await supabase.storage
    .from('project-images')
    .remove([imagePath])

  return { error }
}

// Get public URL for an image
export const getImagePublicUrl = (imagePath: string) => {
  const { data: { publicUrl } } = supabase.storage
    .from('project-images')
    .getPublicUrl(imagePath)

  return publicUrl
}