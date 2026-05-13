-- ============================================================
-- Migración 002: Sincronización completa con Supabase
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de migration-001 (setup-supabase.sql)
-- ============================================================

-- ============================================================
-- Columnas faltantes en accessibility_settings
-- ============================================================

ALTER TABLE accessibility_settings
  ADD COLUMN IF NOT EXISTS use_dyslexic_font BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS micro_tasks_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS guided_breaks BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS focus_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS simplified_ui BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_frequency TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS accessibility_profile TEXT DEFAULT 'none';

-- ============================================================
-- Flag de onboarding en user_profiles
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- ============================================================
-- Tabla de gamificación (puntos, racha, minutos de estudio)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  points INTEGER DEFAULT 100,
  streak INTEGER DEFAULT 0,
  total_study_minutes INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Items de la mascota como JSONB en study_pet
-- ============================================================

ALTER TABLE study_pet
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- ============================================================
-- RLS para user_gamification
-- ============================================================

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su gamificación" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean su gamificación" ON user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios actualizan su gamificación" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);
