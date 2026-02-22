-- Migration 004: Update weaver_stories with Title and Description

ALTER TABLE weaver_stories
ADD COLUMN IF NOT EXISTS title VARCHAR(255) AFTER weaver_id,
ADD COLUMN IF NOT EXISTS description TEXT AFTER caption,
ADD COLUMN IF NOT EXISTS media_paths TEXT,
ADD COLUMN IF NOT EXISTS media_types TEXT;

-- Map existing caption to title if title is empty (for existing stories)
UPDATE weaver_stories SET title = caption WHERE title IS NULL OR title = '';

-- If description is empty, use caption as well (for existing stories)
UPDATE weaver_stories SET description = caption WHERE description IS NULL OR description = '';
