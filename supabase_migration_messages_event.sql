-- Add event and payload columns to messages table
-- Run this in your Supabase SQL Editor

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS event TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB;

-- Optional: index for querying by event type
CREATE INDEX IF NOT EXISTS idx_messages_event ON messages (event) WHERE event IS NOT NULL;
