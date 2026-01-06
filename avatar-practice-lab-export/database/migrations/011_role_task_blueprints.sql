-- Role Task Blueprints Table
-- Stores task templates, expected signals, and probe trees for each role archetype
-- Created: 2026-01-06

CREATE TABLE IF NOT EXISTS role_task_blueprints (
  id SERIAL PRIMARY KEY,
  role_archetype_id VARCHAR NOT NULL REFERENCES role_archetypes(id) ON DELETE CASCADE,
  task_type VARCHAR NOT NULL,
  difficulty_band VARCHAR DEFAULT 'entry-mid',
  prompt_template TEXT NOT NULL,
  expected_signals_json JSONB DEFAULT '[]'::jsonb,
  probe_tree_json JSONB DEFAULT '[]'::jsonb,
  tags_json JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_task_blueprints_archetype ON role_task_blueprints(role_archetype_id);
CREATE INDEX IF NOT EXISTS idx_role_task_blueprints_task_type ON role_task_blueprints(task_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_task_blueprints_unique ON role_task_blueprints(role_archetype_id, task_type, difficulty_band);
