-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('comment_reply', 'market_resolved')),
  
  -- Display content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT NOT NULL,
  
  -- Reference data
  market_slug VARCHAR(255),
  comment_id INTEGER,
  from_user_address VARCHAR(42),
  
  -- State
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT notifications_user_address_idx CHECK (user_address = LOWER(user_address)),
  CONSTRAINT notifications_from_user_address_idx CHECK (from_user_address IS NULL OR from_user_address = LOWER(from_user_address))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_address ON notifications(user_address);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_address, is_read) WHERE is_read = FALSE;
