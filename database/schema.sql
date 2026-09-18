-- =========================================================================
-- Academic Notebook Portfolio SQLite Schema
-- Lightweight, embedded database schema
-- =========================================================================

PRAGMA foreign_keys = ON;

-- 1. Metadata Table
CREATE TABLE IF NOT EXISTS portfolio_meta (
  id TEXT PRIMARY KEY DEFAULT 'main',
  author_name TEXT NOT NULL DEFAULT 'Karan',
  logo_text TEXT NOT NULL DEFAULT 'Karan',
  avatar_url TEXT DEFAULT 'avatar.jpg',
  page_title TEXT NOT NULL,
  meta_description TEXT,
  copyright_year INTEGER DEFAULT 2026,
  social_links TEXT DEFAULT '[]',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Hero Section Table
CREATE TABLE IF NOT EXISTS portfolio_hero (
  id TEXT PRIMARY KEY DEFAULT 'main',
  heading TEXT NOT NULL DEFAULT 'Notes and exploratory research.',
  bio_highlight TEXT NOT NULL DEFAULT 'Karan',
  bio_intro TEXT NOT NULL,
  more_about_text TEXT DEFAULT 'More about me.',
  more_about_anchor TEXT DEFAULT '#about'
);

-- 3. About Section Table
CREATE TABLE IF NOT EXISTS portfolio_about (
  id TEXT PRIMARY KEY DEFAULT 'main',
  section_label TEXT DEFAULT 'About & Focus',
  paragraphs TEXT NOT NULL
);

-- 4. Research Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'NOTE' CHECK (type IN ('ESSAY', 'NOTE', 'LOG', 'PAPER')),
  date TEXT NOT NULL,
  formatted_date TEXT NOT NULL,
  read_time TEXT NOT NULL DEFAULT '15 min',
  tags TEXT DEFAULT '[]',
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  subtitle TEXT,
  published INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. Note Subsections Table (For Google Docs Outline Reader)
CREATE TABLE IF NOT EXISTS note_sections (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  section_anchor_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_slug ON notes(slug);
CREATE INDEX IF NOT EXISTS idx_notes_sort ON notes(sort_order ASC, date DESC);
CREATE INDEX IF NOT EXISTS idx_note_sections_note_id ON note_sections(note_id, sort_order ASC);
