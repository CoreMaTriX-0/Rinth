-- =============================================
-- Rinth Database Schema
-- PostgreSQL / Supabase Database Setup
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE
-- Extends Supabase auth.users
-- =============================================

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Create index on username for faster lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- =============================================
-- 2. PROJECTS TABLE
-- Stores AI-generated projects
-- =============================================

CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    estimated_cost TEXT,
    estimated_time TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- AI-generated content
    instructions JSONB, -- Array of instruction steps
    components JSONB,   -- Array of component objects
    code_blocks JSONB,  -- Array of code block objects
    buy_links JSONB,    -- Array of buy link objects
    
    -- Metadata
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_difficulty ON public.projects(difficulty);
CREATE INDEX idx_projects_is_public ON public.projects(is_public);
CREATE INDEX idx_projects_tags ON public.projects USING GIN(tags);

-- =============================================
-- 3. COMMUNITY_POSTS TABLE
-- User-shared projects in community
-- =============================================

CREATE TABLE public.community_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    estimated_cost TEXT,
    tags TEXT[] DEFAULT '{}',
    
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_tags ON public.community_posts USING GIN(tags);

-- =============================================
-- 4. COMMENTS TABLE
-- Comments on projects and community posts
-- =============================================

CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    community_post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure comment is linked to either a project or community post
    CONSTRAINT comment_target CHECK (
        (project_id IS NOT NULL AND community_post_id IS NULL) OR
        (project_id IS NULL AND community_post_id IS NOT NULL)
    )
);

-- Create indexes
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_project_id ON public.comments(project_id);
CREATE INDEX idx_comments_community_post_id ON public.comments(community_post_id);
CREATE INDEX idx_comments_parent_comment_id ON public.comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- =============================================
-- 5. LIKES TABLE
-- Tracks user likes on various entities
-- =============================================

CREATE TABLE public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    community_post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure like is linked to exactly one entity
    CONSTRAINT like_target CHECK (
        (project_id IS NOT NULL AND community_post_id IS NULL AND comment_id IS NULL) OR
        (project_id IS NULL AND community_post_id IS NOT NULL AND comment_id IS NULL) OR
        (project_id IS NULL AND community_post_id IS NULL AND comment_id IS NOT NULL)
    ),
    
    -- Prevent duplicate likes
    CONSTRAINT unique_project_like UNIQUE NULLS NOT DISTINCT (user_id, project_id),
    CONSTRAINT unique_post_like UNIQUE NULLS NOT DISTINCT (user_id, community_post_id),
    CONSTRAINT unique_comment_like UNIQUE NULLS NOT DISTINCT (user_id, comment_id)
);

-- Create indexes
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_project_id ON public.likes(project_id);
CREATE INDEX idx_likes_community_post_id ON public.likes(community_post_id);
CREATE INDEX idx_likes_comment_id ON public.likes(comment_id);

-- =============================================
-- 6. SAVES TABLE
-- Bookmarked/saved projects
-- =============================================

CREATE TABLE public.saves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    community_post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure save is linked to exactly one entity
    CONSTRAINT save_target CHECK (
        (project_id IS NOT NULL AND community_post_id IS NULL) OR
        (project_id IS NULL AND community_post_id IS NOT NULL)
    ),
    
    -- Prevent duplicate saves
    CONSTRAINT unique_project_save UNIQUE NULLS NOT DISTINCT (user_id, project_id),
    CONSTRAINT unique_post_save UNIQUE NULLS NOT DISTINCT (user_id, community_post_id)
);

-- Create indexes
CREATE INDEX idx_saves_user_id ON public.saves(user_id);
CREATE INDEX idx_saves_project_id ON public.saves(project_id);
CREATE INDEX idx_saves_community_post_id ON public.saves(community_post_id);

-- =============================================
-- 7. FOLLOWERS TABLE
-- User following system
-- =============================================

CREATE TABLE public.followers (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes
CREATE INDEX idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX idx_followers_following_id ON public.followers(following_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGERS FOR COUNTER UPDATES
-- =============================================

-- Trigger to update likes_count on projects
CREATE OR REPLACE FUNCTION update_project_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.projects 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.project_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.projects 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.project_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_likes_counter AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW WHEN (NEW.project_id IS NOT NULL OR OLD.project_id IS NOT NULL)
    EXECUTE FUNCTION update_project_likes_count();

-- Trigger to update comments_count on projects
CREATE OR REPLACE FUNCTION update_project_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.projects 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.project_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.projects 
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.project_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_comments_counter AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW WHEN (NEW.project_id IS NOT NULL OR OLD.project_id IS NOT NULL)
    EXECUTE FUNCTION update_project_comments_count();

-- Similar triggers for community_posts
CREATE OR REPLACE FUNCTION update_community_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.community_post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.community_post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_post_likes_counter AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW WHEN (NEW.community_post_id IS NOT NULL OR OLD.community_post_id IS NOT NULL)
    EXECUTE FUNCTION update_community_post_likes_count();

CREATE OR REPLACE FUNCTION update_community_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.community_post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts 
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.community_post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_post_comments_counter AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW WHEN (NEW.community_post_id IS NOT NULL OR OLD.community_post_id IS NOT NULL)
    EXECUTE FUNCTION update_community_post_comments_count();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- PROJECTS POLICIES
CREATE POLICY "Public projects are viewable by everyone" 
    ON public.projects FOR SELECT 
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create projects" 
    ON public.projects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
    ON public.projects FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
    ON public.projects FOR DELETE 
    USING (auth.uid() = user_id);

-- COMMUNITY POSTS POLICIES
CREATE POLICY "Community posts are viewable by everyone" 
    ON public.community_posts FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create community posts" 
    ON public.community_posts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own community posts" 
    ON public.community_posts FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own community posts" 
    ON public.community_posts FOR DELETE 
    USING (auth.uid() = user_id);

-- COMMENTS POLICIES
CREATE POLICY "Comments are viewable by everyone" 
    ON public.comments FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create comments" 
    ON public.comments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
    ON public.comments FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
    ON public.comments FOR DELETE 
    USING (auth.uid() = user_id);

-- LIKES POLICIES
CREATE POLICY "Likes are viewable by everyone" 
    ON public.likes FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create likes" 
    ON public.likes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" 
    ON public.likes FOR DELETE 
    USING (auth.uid() = user_id);

-- SAVES POLICIES
CREATE POLICY "Users can view own saves" 
    ON public.saves FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create saves" 
    ON public.saves FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saves" 
    ON public.saves FOR DELETE 
    USING (auth.uid() = user_id);

-- FOLLOWERS POLICIES
CREATE POLICY "Followers are viewable by everyone" 
    ON public.followers FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can follow others" 
    ON public.followers FOR INSERT 
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" 
    ON public.followers FOR DELETE 
    USING (auth.uid() = follower_id);

-- =============================================
-- FUNCTION TO CREATE PROFILE ON SIGNUP
-- =============================================

-- =============================================
-- 8. PROJECT HISTORY TABLE
-- Stores user's generated project history with images
-- =============================================

CREATE TABLE public.project_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    estimated_cost TEXT,
    estimated_time TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- AI-generated content stored as JSON
    instructions JSONB,
    components JSONB,
    code_blocks JSONB,
    buy_links JSONB,
    
    -- Metadata
    is_favorite BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for project history
CREATE INDEX idx_project_history_user_id ON public.project_history(user_id);
CREATE INDEX idx_project_history_created_at ON public.project_history(created_at DESC);
CREATE INDEX idx_project_history_is_favorite ON public.project_history(is_favorite);

-- Enable RLS for project history
ALTER TABLE public.project_history ENABLE ROW LEVEL SECURITY;

-- PROJECT HISTORY POLICIES
CREATE POLICY "Users can view own project history" 
    ON public.project_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project history" 
    ON public.project_history FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project history" 
    ON public.project_history FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project history" 
    ON public.project_history FOR DELETE 
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_project_history_updated_at BEFORE UPDATE ON public.project_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STORAGE BUCKET FOR PROJECT IMAGES
-- Run this in Supabase SQL Editor
-- =============================================

-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-images',
    'project-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for project images
CREATE POLICY "Anyone can view project images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'project-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own project images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'project-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own project images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'project-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FUNCTION TO UPDATE EMAIL VERIFICATION STATUS
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_email_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.profiles 
        SET email_verified = true 
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update email verification status
CREATE TRIGGER on_email_verified
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_email_verified();

-- =============================================
-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Note: Uncomment the following to add sample data

/*
-- Insert sample profile (replace with actual user ID after signup)
INSERT INTO public.profiles (id, username, full_name, bio) VALUES
    ('00000000-0000-0000-0000-000000000001', 'maker_john', 'John Smith', 'Robotics enthusiast');

-- Insert sample project
INSERT INTO public.projects (user_id, title, description, prompt, difficulty, estimated_cost) VALUES
    ('00000000-0000-0000-0000-000000000001', 
     'Line Following Robot', 
     'A simple robot that follows a black line using IR sensors',
     'Build a line following robot',
     'Beginner',
     '$30-40');
*/

-- =============================================
-- END OF SCHEMA
-- =============================================
