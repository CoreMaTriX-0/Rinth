-- =============================================
-- RINTH - COMMUNITY SETUP (Run this in Supabase SQL Editor)
-- Creates: profiles, community_posts tables + RLS policies
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- 2. AUTO-CREATE PROFILE WHEN A USER SIGNS UP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _username TEXT;
BEGIN
    -- Use username from metadata if set, else derive from email
    _username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::TEXT, 1, 4)
    );

    -- Ensure username is unique by appending suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) LOOP
        _username := _username || '_' || FLOOR(RANDOM() * 1000)::TEXT;
    END LOOP;

    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        _username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 3. BACKFILL PROFILES FOR EXISTING USERS
-- =============================================

DO $$
DECLARE
    u RECORD;
    _username TEXT;
    _attempt INT;
BEGIN
    FOR u IN
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.profiles pr ON pr.id = au.id
        WHERE pr.id IS NULL
    LOOP
        _username := COALESCE(
            u.raw_user_meta_data->>'username',
            SPLIT_PART(u.email, '@', 1) || '_' || SUBSTRING(u.id::TEXT, 1, 4)
        );
        _attempt := 0;

        -- Make username unique if it already exists
        WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) LOOP
            _attempt := _attempt + 1;
            _username := COALESCE(
                u.raw_user_meta_data->>'username',
                SPLIT_PART(u.email, '@', 1) || '_' || SUBSTRING(u.id::TEXT, 1, 4)
            ) || '_' || _attempt;
        END LOOP;

        INSERT INTO public.profiles (id, username, full_name, avatar_url)
        VALUES (
            u.id,
            _username,
            COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
            u.raw_user_meta_data->>'avatar_url'
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END;
$$;

-- =============================================
-- 4. COMMUNITY_POSTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID,

    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    estimated_cost TEXT,
    tags TEXT[] DEFAULT '{}',

    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON public.community_posts USING GIN(tags);

-- =============================================
-- 5. UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. ROW LEVEL SECURITY
-- =============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Community Posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community posts are viewable by everyone" ON public.community_posts;
CREATE POLICY "Community posts are viewable by everyone"
    ON public.community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create community posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create community posts"
    ON public.community_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own community posts" ON public.community_posts;
CREATE POLICY "Users can update own community posts"
    ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own community posts" ON public.community_posts;
CREATE POLICY "Users can delete own community posts"
    ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 7. POST_LIKES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Post likes viewable by everyone" ON public.post_likes;
CREATE POLICY "Post likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Trigger: keep likes_count in sync
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_likes_count_trigger ON public.post_likes;
CREATE TRIGGER post_likes_count_trigger
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- =============================================
-- 8. POST_SAVES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.post_saves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_saves_post_id ON public.post_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user_id ON public.post_saves(user_id);

ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own saves" ON public.post_saves;
CREATE POLICY "Users can view own saves" ON public.post_saves FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can save posts" ON public.post_saves;
CREATE POLICY "Users can save posts" ON public.post_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unsave posts" ON public.post_saves;
CREATE POLICY "Users can unsave posts" ON public.post_saves FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 9. POST_COMMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments viewable by everyone" ON public.post_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can add comments" ON public.post_comments;
CREATE POLICY "Users can add comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Trigger: keep comments_count in sync
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_comments_count_trigger ON public.post_comments;
CREATE TRIGGER post_comments_count_trigger
    AFTER INSERT OR DELETE ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- =============================================
-- Done! Tables created with RLS enabled.
-- =============================================

-- =============================================
-- 10. ENABLE REALTIME
-- Required for live updates in the app
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
