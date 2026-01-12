-- Monetization & Access Control Tables
-- Tier 1: Free (1 interview)
-- Tier 2: Interview Set ($199 one-time or company-shared link)
-- Tier 3: Subscription ($499/month unlimited)

-- Payment subscriptions table - $499/month subscribers (distinct from existing 'subscriptions' table)
CREATE TABLE IF NOT EXISTS payment_subscriptions (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  plan_type VARCHAR(50) NOT NULL DEFAULT 'monthly',
  amount_cents INTEGER NOT NULL DEFAULT 49900,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User entitlements - tracks what tier each user has
CREATE TABLE IF NOT EXISTS user_entitlements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'set_access', 'subscriber')),
  free_interviews_remaining INTEGER NOT NULL DEFAULT 1,
  payment_subscription_id VARCHAR(100) REFERENCES payment_subscriptions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Interview sets - groupings of interview types for a role/JD
CREATE TABLE IF NOT EXISTS interview_sets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  role_archetype_id VARCHAR(100),
  company_id VARCHAR(100) REFERENCES companies(id),
  job_description TEXT,
  interview_types JSONB NOT NULL DEFAULT '[]',
  price_cents INTEGER NOT NULL DEFAULT 19900,
  owner_user_id INTEGER REFERENCES users(id),
  owner_company_id VARCHAR(100),
  visibility VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'company_shared')),
  share_token VARCHAR(100) UNIQUE,
  share_token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Interview set purchases - $199 one-time purchases
CREATE TABLE IF NOT EXISTS interview_set_purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_set_id INTEGER NOT NULL REFERENCES interview_sets(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  amount_cents INTEGER NOT NULL DEFAULT 19900,
  status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  purchased_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, interview_set_id)
);

-- Company share links - for companies sharing interview sets with candidates
CREATE TABLE IF NOT EXISTS company_share_links (
  id SERIAL PRIMARY KEY,
  interview_set_id INTEGER NOT NULL REFERENCES interview_sets(id) ON DELETE CASCADE,
  share_token VARCHAR(100) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  company_email VARCHAR(255),
  description TEXT,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Company share link access - tracks which users accessed via share link
CREATE TABLE IF NOT EXISTS company_share_link_access (
  id SERIAL PRIMARY KEY,
  share_link_id INTEGER NOT NULL REFERENCES company_share_links(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_set_id INTEGER NOT NULL REFERENCES interview_sets(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(share_link_id, user_id)
);

-- Interview usage tracking - counts interviews used
CREATE TABLE IF NOT EXISTS interview_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_set_id INTEGER REFERENCES interview_sets(id),
  session_id INTEGER,
  interview_type VARCHAR(100),
  access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('free', 'purchased', 'company_shared', 'subscription')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON user_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_user_id ON payment_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_stripe_id ON payment_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_interview_sets_share_token ON interview_sets(share_token);
CREATE INDEX IF NOT EXISTS idx_interview_set_purchases_user ON interview_set_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_company_share_links_token ON company_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_interview_usage_user ON interview_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_usage_set ON interview_usage(interview_set_id);

-- Initialize entitlements for existing users (give them 1 free interview)
INSERT INTO user_entitlements (user_id, tier, free_interviews_remaining)
SELECT id, 'free', 1 FROM users
WHERE id NOT IN (SELECT user_id FROM user_entitlements)
ON CONFLICT (user_id) DO NOTHING;
