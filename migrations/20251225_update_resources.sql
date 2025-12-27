-- Migration: Update Resources Table for Videos, Articles, and Playlists
-- Description: Adds 'urls' array, 'content' text, and type constraints to the resources table.

-- 1. Add new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='urls') THEN
        ALTER TABLE resources ADD COLUMN urls TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='content') THEN
        ALTER TABLE resources ADD COLUMN content TEXT;
    END IF;
END $$;

-- 2. Add check constraint for resource types
-- First, remove existing constraint if any (to allow updates)
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_type_check;

-- Add the new constraint
ALTER TABLE resources ADD CONSTRAINT resources_type_check 
CHECK (type IN ('video', 'article', 'playlist'));

-- 3. Data Migration (Optional/Safety)
-- If there are existing URLs in the 'url' column, you might want to seed the 'urls' array
-- UPDATE resources SET urls = ARRAY[url] WHERE url IS NOT NULL AND (urls IS NULL OR cardinality(urls) = 0);

-- 4. Update existing records to valid types if necessary
-- UPDATE resources SET type = 'article' WHERE type NOT IN ('video', 'article', 'playlist');

COMMENT ON COLUMN resources.urls IS 'Multiple URLs for videos and playlists';
COMMENT ON COLUMN resources.content IS 'Rich text content for articles (TipTap editor)';
