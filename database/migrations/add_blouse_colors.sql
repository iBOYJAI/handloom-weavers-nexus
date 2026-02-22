-- Migration: Add blouse_colors field to sarees table
-- This allows weavers to set specific blouse colors for their sarees
-- Users can only select from weaver-set colors, not any color

ALTER TABLE sarees 
ADD COLUMN blouse_colors JSON NULL 
COMMENT 'Array of blouse color codes set by weaver (e.g., ["#C0392B", "#800000", "#FFD700"])';

-- Update existing sarees with default blouse colors if needed
UPDATE sarees 
SET blouse_colors = JSON_ARRAY('#C0392B', '#800000', '#FFD700', '#0000FF', '#008000')
WHERE blouse_colors IS NULL;

