-- ============================================================
-- Fix 1: correct trigger for post_comments → comments_count
-- The original trigger fired on `comments` (wrong table) with
-- `community_post_id` (wrong column). This creates the real one.
-- ============================================================

CREATE OR REPLACE FUNCTION increment_community_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts
        SET comments_count = COALESCE(comments_count, 0) + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts
        SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS post_comments_counter ON public.post_comments;

CREATE TRIGGER post_comments_counter
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION increment_community_post_comments_count();

-- Back-fill counts for any existing comments
UPDATE public.community_posts cp
SET comments_count = (
    SELECT COUNT(*) FROM public.post_comments pc WHERE pc.post_id = cp.id
);

-- ============================================================
-- Fix 2: add source_community_post_id to project_history
-- Tracks which community post a history entry was remixed from.
-- ============================================================

ALTER TABLE public.project_history
ADD COLUMN IF NOT EXISTS source_community_post_id UUID REFERENCES public.community_posts(id) ON DELETE SET NULL;
