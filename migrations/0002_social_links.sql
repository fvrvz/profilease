-- Migration: Add social_links column to profiles table
ALTER TABLE profiles ADD COLUMN social_links TEXT;
