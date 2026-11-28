-- Migration: Add city column to profiles for city + country display on profile & facility cards
ALTER TABLE profiles ADD COLUMN city TEXT DEFAULT '';
