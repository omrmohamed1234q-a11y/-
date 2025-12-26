-- Add delivery type fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'same_day',
ADD COLUMN IF NOT EXISTS reservation_days INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN products.delivery_type IS 'Delivery method: same_day or reservation';
COMMENT ON COLUMN products.reservation_days IS 'Number of days for reservation delivery (0 for same day)';
