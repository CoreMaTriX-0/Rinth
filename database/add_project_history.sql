-- =============================================
-- PROJECT HISTORY MIGRATION
-- Run this in your Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. CREATE PROJECT HISTORY TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.project_history (
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

-- =============================================
-- 2. CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_project_history_user_id ON public.project_history(user_id);
CREATE INDEX IF NOT EXISTS idx_project_history_created_at ON public.project_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_history_is_favorite ON public.project_history(is_favorite);

-- =============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.project_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE RLS POLICIES
-- =============================================

-- Drop policies if they already exist
DROP POLICY IF EXISTS "Users can view own project history" ON public.project_history;
DROP POLICY IF EXISTS "Users can create own project history" ON public.project_history;
DROP POLICY IF EXISTS "Users can update own project history" ON public.project_history;
DROP POLICY IF EXISTS "Users can delete own project history" ON public.project_history;

-- Create policies
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

-- =============================================
-- 5. CREATE UPDATED_AT FUNCTION (if not exists)
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. CREATE UPDATED_AT TRIGGER
-- =============================================

DROP TRIGGER IF EXISTS update_project_history_updated_at ON public.project_history;

CREATE TRIGGER update_project_history_updated_at 
    BEFORE UPDATE ON public.project_history
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. CREATE STORAGE BUCKET FOR PROJECT IMAGES
-- =============================================

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-images',
    'project-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 8. STORAGE POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own project images" ON storage.objects;

-- Create new policies
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
-- MIGRATION COMPLETE!
-- =============================================

-- Verify the table was created
SELECT 'project_history table created successfully!' as status;
SELECT COUNT(*) as row_count FROM public.project_history;

-- Verify the storage bucket was created
SELECT 'project-images bucket created successfully!' as status;
SELECT * FROM storage.buckets WHERE id = 'project-images';
