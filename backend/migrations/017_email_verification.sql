-- Migration 017: Add email verification column to users table
-- Adds is_verified boolean column, defaults to false for new signups.
-- Backfills all existing users to is_verified = true so they aren't locked out.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- Backfill: all existing users are considered verified
UPDATE public.users SET is_verified = true WHERE is_verified = false;
