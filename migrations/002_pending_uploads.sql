-- Add pending_uploads table for print service
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pending_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  print_options JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pending_uploads_user_id ON pending_uploads(user_id);
CREATE INDEX idx_pending_uploads_status ON pending_uploads(status);
CREATE INDEX idx_pending_uploads_created_at ON pending_uploads(created_at DESC);

CREATE TRIGGER update_pending_uploads_updated_at BEFORE UPDATE ON pending_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE pending_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own uploads"
  ON pending_uploads FOR ALL
  USING (user_id = auth.uid());
