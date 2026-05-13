-- ============================================================
-- Migración 003: Columna de tipografía para dislexia
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

ALTER TABLE accessibility_settings
  ADD COLUMN IF NOT EXISTS dyslexia_font TEXT DEFAULT 'opendyslexic';
