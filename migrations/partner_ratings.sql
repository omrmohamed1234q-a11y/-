-- Partner Ratings Table Migration
-- This table stores customer ratings and reviews for partners

CREATE TABLE IF NOT EXISTS partner_ratings (
  id TEXT PRIMARY KEY DEFAULT ('rating-' || substr(md5(random()::text), 1, 16)),
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one rating per user per order
  UNIQUE(user_id, order_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_ratings_partner ON partner_ratings(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_ratings_user ON partner_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_ratings_order ON partner_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_partner_ratings_created ON partner_ratings(created_at DESC);

-- Function to update partner average rating
CREATE OR REPLACE FUNCTION update_partner_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE partners
  SET 
    rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM partner_ratings
      WHERE partner_id = COALESCE(NEW.partner_id, OLD.partner_id)
    ),
    "reviewCount" = (
      SELECT COUNT(*)
      FROM partner_ratings
      WHERE partner_id = COALESCE(NEW.partner_id, OLD.partner_id)
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.partner_id, OLD.partner_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update partner rating on insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_partner_rating ON partner_ratings;
CREATE TRIGGER trigger_update_partner_rating
  AFTER INSERT OR UPDATE OR DELETE ON partner_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_rating();

-- Grant permissions (adjust as needed)
-- GRANT SELECT ON partner_ratings TO authenticated;
-- GRANT INSERT, UPDATE ON partner_ratings TO authenticated;
-- GRANT DELETE ON partner_ratings TO admin;
