-- ============================================================
-- VeriSkill — Migration 002: Extend skill_type constraint
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Drop the old restrictive constraint
ALTER TABLE public.skill_results
  DROP CONSTRAINT IF EXISTS skill_results_skill_type_check;

-- Add updated constraint with all planned skill types
ALTER TABLE public.skill_results
  ADD CONSTRAINT skill_results_skill_type_check
  CHECK (skill_type IN ('dsa', 'webdev', 'sql', 'ml', 'devops'));
