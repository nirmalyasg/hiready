-- SEO Pages System Migration
-- Created: 2026-01-12
-- Purpose: Store generated SEO content for interview preparation pages

-- SEO Pages - Master table for all SEO page types
CREATE TABLE IF NOT EXISTS seo_pages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('pillar', 'role_prep', 'company_prep', 'company_role', 'skill_practice')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  h1 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Reference IDs (nullable depending on page type)
  role_archetype_id VARCHAR REFERENCES role_archetypes(id) ON DELETE SET NULL,
  company_id VARCHAR REFERENCES companies(id) ON DELETE SET NULL,
  skill_category TEXT,
  
  -- SEO metadata
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  json_ld JSONB,
  
  -- Content management
  last_generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  refresh_due_at TIMESTAMPTZ,
  generation_version INTEGER DEFAULT 1,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  practice_starts INTEGER DEFAULT 0,
  avg_time_on_page_sec INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO Page Content Sections - Stores individual H2 sections for each page
CREATE TABLE IF NOT EXISTS seo_page_sections (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  seo_page_id VARCHAR NOT NULL REFERENCES seo_pages(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  heading_type TEXT NOT NULL DEFAULT 'h2' CHECK (heading_type IN ('h2', 'h3')),
  heading TEXT NOT NULL,
  content TEXT NOT NULL,
  source_table TEXT,
  source_data JSONB,
  is_cta BOOLEAN DEFAULT FALSE,
  cta_type TEXT CHECK (cta_type IN ('practice_start', 'explore_roles', 'explore_companies', 'mock_interview')),
  cta_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO Internal Links - Tracks cross-page linking for topical authority
CREATE TABLE IF NOT EXISTS seo_internal_links (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id VARCHAR NOT NULL REFERENCES seo_pages(id) ON DELETE CASCADE,
  target_page_id VARCHAR NOT NULL REFERENCES seo_pages(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  link_context TEXT,
  link_type TEXT NOT NULL CHECK (link_type IN ('related', 'parent', 'child', 'cta', 'breadcrumb')),
  position_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_page_id, target_page_id)
);

-- SEO Generation Queue - For batch content generation
CREATE TABLE IF NOT EXISTS seo_generation_queue (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  reference_id VARCHAR,
  reference_data JSONB,
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  seo_page_id VARCHAR REFERENCES seo_pages(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO Page Analytics Events
CREATE TABLE IF NOT EXISTS seo_analytics_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  seo_page_id VARCHAR REFERENCES seo_pages(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'practice_start', 'cta_click', 'time_on_page', 'bounce')),
  event_data JSONB,
  user_id VARCHAR REFERENCES auth_users(id) ON DELETE SET NULL,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seo_pages_page_type ON seo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_status ON seo_pages(status);
CREATE INDEX IF NOT EXISTS idx_seo_pages_role ON seo_pages(role_archetype_id);
CREATE INDEX IF NOT EXISTS idx_seo_pages_company ON seo_pages(company_id);
CREATE INDEX IF NOT EXISTS idx_seo_page_sections_page ON seo_page_sections(seo_page_id);
CREATE INDEX IF NOT EXISTS idx_seo_internal_links_source ON seo_internal_links(source_page_id);
CREATE INDEX IF NOT EXISTS idx_seo_internal_links_target ON seo_internal_links(target_page_id);
CREATE INDEX IF NOT EXISTS idx_seo_generation_queue_status ON seo_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_page ON seo_analytics_events(seo_page_id);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_type ON seo_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_seo_analytics_created ON seo_analytics_events(created_at);
