-- =============================================
-- COMMUNITY POSTS RLS POLICIES
-- Run this in your Supabase SQL Editor if you did
-- not run the full schema.sql during setup.
-- =============================================

-- Enable Row Level Security on the table
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Drop policies if they already exist (safe to re-run)
DROP POLICY IF EXISTS "Community posts are viewable by everyone" ON public.community_posts;
DROP POLICY IF EXISTS "Authenticated users can create community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update own community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own community posts" ON public.community_posts;

-- Allow anyone (logged in or not) to read all community posts
CREATE POLICY "Community posts are viewable by everyone"
    ON public.community_posts FOR SELECT
    USING (true);

-- Allow authenticated users to insert their own posts
CREATE POLICY "Authenticated users can create community posts"
    ON public.community_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to edit their own posts
CREATE POLICY "Users can update own community posts"
    ON public.community_posts FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own community posts"
    ON public.community_posts FOR DELETE
    USING (auth.uid() = user_id);
