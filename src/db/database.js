import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../..');

const DB_DIR = join(ROOT_DIR, 'database');
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_PATH || join(DB_DIR, 'portfolio.db');
const SCHEMA_FILE = join(DB_DIR, 'schema.sql');
const CONTENT_FILE = existsSync(join(ROOT_DIR, 'src/db/content.json'))
  ? join(ROOT_DIR, 'src/db/content.json')
  : join(ROOT_DIR, 'content.json');

// Initialize SQLite database instance
const db = new Database(DB_PATH);

// Configure pragmas for performance and data integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
function initSchema() {
  if (existsSync(SCHEMA_FILE)) {
    const schemaSql = readFileSync(SCHEMA_FILE, 'utf-8');
    db.exec(schemaSql);
  } else {
    // Embedded fallback schema if schema.sql is not found
    db.exec(`
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
      CREATE TABLE IF NOT EXISTS portfolio_hero (
        id TEXT PRIMARY KEY DEFAULT 'main',
        heading TEXT NOT NULL DEFAULT 'Notes and exploratory research.',
        bio_highlight TEXT NOT NULL DEFAULT 'Karan',
        bio_intro TEXT NOT NULL,
        more_about_text TEXT DEFAULT 'More about me.',
        more_about_anchor TEXT DEFAULT '#about'
      );
      CREATE TABLE IF NOT EXISTS portfolio_about (
        id TEXT PRIMARY KEY DEFAULT 'main',
        section_label TEXT DEFAULT 'About & Focus',
        paragraphs TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL DEFAULT 'NOTE',
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
      CREATE TABLE IF NOT EXISTS note_sections (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
        section_anchor_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_notes_slug ON notes(slug);
      CREATE INDEX IF NOT EXISTS idx_notes_sort ON notes(sort_order ASC, date DESC);
      CREATE INDEX IF NOT EXISTS idx_note_sections_note_id ON note_sections(note_id, sort_order ASC);
    `);
  }
}

initSchema();

// Auto-seed database from content.json if tables are empty
export function seedDatabase(data = null) {
  let content = data;
  if (!content && existsSync(CONTENT_FILE)) {
    try {
      const raw = readFileSync(CONTENT_FILE, 'utf-8');
      content = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read content.json for seeding:', err);
    }
  }

  if (!content) return false;

  const runSeed = db.transaction(() => {
    // 1. Meta
    if (content.meta) {
      const metaStmt = db.prepare(`
        INSERT INTO portfolio_meta (id, author_name, logo_text, avatar_url, page_title, meta_description, copyright_year, social_links)
        VALUES ('main', @authorName, @logoText, @avatarUrl, @pageTitle, @metaDescription, @copyrightYear, @socialLinks)
        ON CONFLICT(id) DO UPDATE SET
          author_name = excluded.author_name,
          logo_text = excluded.logo_text,
          avatar_url = excluded.avatar_url,
          page_title = excluded.page_title,
          meta_description = excluded.meta_description,
          copyright_year = excluded.copyright_year,
          social_links = excluded.social_links,
          updated_at = datetime('now')
      `);
      metaStmt.run({
        authorName: content.meta.authorName || 'Karan',
        logoText: content.meta.logoText || 'Karan',
        avatarUrl: content.meta.avatarUrl || 'avatar.jpg',
        pageTitle: content.meta.pageTitle || 'Karan — Notes & Exploratory Research',
        metaDescription: content.meta.metaDescription || '',
        copyrightYear: content.meta.copyrightYear || 2026,
        socialLinks: JSON.stringify(content.meta.socialLinks || [])
      });
    }

    // 2. Hero
    if (content.hero) {
      const heroStmt = db.prepare(`
        INSERT INTO portfolio_hero (id, heading, bio_highlight, bio_intro, more_about_text, more_about_anchor)
        VALUES ('main', @heading, @bioHighlight, @bioIntro, @moreAboutText, @moreAboutAnchor)
        ON CONFLICT(id) DO UPDATE SET
          heading = excluded.heading,
          bio_highlight = excluded.bio_highlight,
          bio_intro = excluded.bio_intro,
          more_about_text = excluded.more_about_text,
          more_about_anchor = excluded.more_about_anchor
      `);
      heroStmt.run({
        heading: content.hero.heading || 'Notes and exploratory research.',
        bioHighlight: content.hero.bioHighlight || 'Karan',
        bioIntro: content.hero.bioIntro || '',
        moreAboutText: content.hero.moreAboutText || 'More about me.',
        moreAboutAnchor: content.hero.moreAboutAnchor || '#about'
      });
    }

    // 3. About
    if (content.about) {
      const aboutStmt = db.prepare(`
        INSERT INTO portfolio_about (id, section_label, paragraphs)
        VALUES ('main', @sectionLabel, @paragraphs)
        ON CONFLICT(id) DO UPDATE SET
          section_label = excluded.section_label,
          paragraphs = excluded.paragraphs
      `);
      aboutStmt.run({
        sectionLabel: content.about.sectionLabel || 'About & Focus',
        paragraphs: JSON.stringify(content.about.paragraphs || [])
      });
    }

    // 4. Notes & Sections
    if (Array.isArray(content.notes)) {
      const noteStmt = db.prepare(`
        INSERT INTO notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
        VALUES (@id, @slug, @type, @date, @formatted_date, @read_time, @tags, @title, @summary, @subtitle, @published, @sort_order)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          type = excluded.type,
          date = excluded.date,
          formatted_date = excluded.formatted_date,
          read_time = excluded.read_time,
          tags = excluded.tags,
          title = excluded.title,
          summary = excluded.summary,
          subtitle = excluded.subtitle,
          published = excluded.published,
          sort_order = excluded.sort_order
      `);

      const deleteSectionsStmt = db.prepare(`DELETE FROM note_sections WHERE note_id = ?`);
      const insertSectionStmt = db.prepare(`
        INSERT INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
        VALUES (@id, @note_id, @section_anchor_id, @title, @content, @sort_order)
      `);

      content.notes.forEach((note, noteIdx) => {
        noteStmt.run({
          id: note.id,
          slug: note.slug || note.id,
          type: note.type || 'NOTE',
          date: note.date || new Date().toISOString().split('T')[0],
          formatted_date: note.formattedDate || note.date,
          read_time: note.readTime || '15 min',
          tags: JSON.stringify(note.tags || []),
          title: note.title,
          summary: note.summary || '',
          subtitle: note.subtitle || '',
          published: note.published !== false ? 1 : 0,
          sort_order: typeof note.sort_order === 'number' ? note.sort_order : noteIdx + 1
        });

        if (Array.isArray(note.sections)) {
          deleteSectionsStmt.run(note.id);
          note.sections.forEach((sec, secIdx) => {
            insertSectionStmt.run({
              id: crypto.randomUUID(),
              note_id: note.id,
              section_anchor_id: sec.id,
              title: sec.title,
              content: sec.content,
              sort_order: secIdx + 1
            });
          });
        }
      });
    }
  });

  runSeed();
  return true;
}

// Auto-seed if database has no notes
const notesCount = db.prepare('SELECT COUNT(*) as count FROM notes').get()?.count || 0;
if (notesCount === 0) {
  seedDatabase();
}

// ==========================================
// Query / CRUD Methods
// ==========================================

export function getPortfolio() {
  const metaRow = db.prepare("SELECT * FROM portfolio_meta WHERE id = 'main'").get();
  const heroRow = db.prepare("SELECT * FROM portfolio_hero WHERE id = 'main'").get();
  const aboutRow = db.prepare("SELECT * FROM portfolio_about WHERE id = 'main'").get();

  const notesRows = db.prepare(`
    SELECT * FROM notes 
    WHERE published = 1 
    ORDER BY sort_order ASC, date DESC
  `).all();

  const sectionsStmt = db.prepare(`
    SELECT section_anchor_id as id, title, content, sort_order 
    FROM note_sections 
    WHERE note_id = ? 
    ORDER BY sort_order ASC
  `);

  const notes = notesRows.map(n => {
    let tags = [];
    try {
      tags = typeof n.tags === 'string' ? JSON.parse(n.tags) : (n.tags || []);
    } catch {
      tags = [];
    }

    const sections = sectionsStmt.all(n.id);

    return {
      id: n.id,
      slug: n.slug,
      type: n.type,
      date: n.date,
      formattedDate: n.formatted_date,
      readTime: n.read_time,
      tags,
      title: n.title,
      summary: n.summary,
      subtitle: n.subtitle,
      published: Boolean(n.published),
      sort_order: n.sort_order,
      sections
    };
  });

  let meta = null;
  if (metaRow) {
    let socialLinks = [];
    try {
      socialLinks = typeof metaRow.social_links === 'string' ? JSON.parse(metaRow.social_links) : [];
    } catch {
      socialLinks = [];
    }
    meta = {
      authorName: metaRow.author_name,
      logoText: metaRow.logo_text,
      avatarUrl: metaRow.avatar_url,
      pageTitle: metaRow.page_title,
      metaDescription: metaRow.meta_description,
      copyrightYear: metaRow.copyright_year,
      socialLinks
    };
  }

  let hero = null;
  if (heroRow) {
    hero = {
      heading: heroRow.heading,
      bioHighlight: heroRow.bio_highlight,
      bioIntro: heroRow.bio_intro,
      moreAboutText: heroRow.more_about_text,
      moreAboutAnchor: heroRow.more_about_anchor
    };
  }

  let about = null;
  if (aboutRow) {
    let paragraphs = [];
    try {
      paragraphs = typeof aboutRow.paragraphs === 'string' ? JSON.parse(aboutRow.paragraphs) : [];
    } catch {
      paragraphs = [];
    }
    about = {
      sectionLabel: aboutRow.section_label,
      paragraphs
    };
  }

  return { meta, hero, about, notes };
}

export function getNotes(includeDrafts = false) {
  const query = includeDrafts 
    ? 'SELECT id, slug, type, date, formatted_date, read_time, tags, title, summary, published, sort_order FROM notes ORDER BY sort_order ASC, date DESC'
    : 'SELECT id, slug, type, date, formatted_date, read_time, tags, title, summary, published, sort_order FROM notes WHERE published = 1 ORDER BY sort_order ASC, date DESC';

  const rows = db.prepare(query).all();

  return rows.map(n => {
    let tags = [];
    try {
      tags = typeof n.tags === 'string' ? JSON.parse(n.tags) : (n.tags || []);
    } catch {
      tags = [];
    }

    return {
      id: n.id,
      slug: n.slug,
      type: n.type,
      date: n.date,
      formattedDate: n.formatted_date,
      readTime: n.read_time,
      tags,
      title: n.title,
      summary: n.summary,
      published: Boolean(n.published),
      sort_order: n.sort_order
    };
  });
}

export function getNoteByIdOrSlug(idOrSlug) {
  const row = db.prepare('SELECT * FROM notes WHERE id = ? OR slug = ?').get(idOrSlug, idOrSlug);
  if (!row) return null;

  let tags = [];
  try {
    tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []);
  } catch {
    tags = [];
  }

  const sections = db.prepare(`
    SELECT section_anchor_id as id, title, content, sort_order 
    FROM note_sections 
    WHERE note_id = ? 
    ORDER BY sort_order ASC
  `).all(row.id);

  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    date: row.date,
    formattedDate: row.formatted_date,
    readTime: row.read_time,
    tags,
    title: row.title,
    summary: row.summary,
    subtitle: row.subtitle,
    published: Boolean(row.published),
    sort_order: row.sort_order,
    sections
  };
}

export function upsertNote(note) {
  const txn = db.transaction(() => {
    const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(note.id);

    let existingTags = [];
    if (existing?.tags) {
      try {
        existingTags = typeof existing.tags === 'string' ? JSON.parse(existing.tags) : existing.tags;
      } catch {
        existingTags = [];
      }
    }

    const merged = {
      id: note.id,
      slug: note.slug ?? existing?.slug ?? note.id,
      type: note.type ?? existing?.type ?? 'NOTE',
      date: note.date ?? existing?.date ?? new Date().toISOString().split('T')[0],
      formatted_date: note.formattedDate ?? note.date ?? existing?.formatted_date ?? (new Date().toISOString().split('T')[0]),
      read_time: note.readTime ?? existing?.read_time ?? '15 min',
      tags: JSON.stringify(note.tags ?? existingTags ?? []),
      title: note.title ?? existing?.title ?? 'Untitled',
      summary: note.summary ?? existing?.summary ?? '',
      subtitle: note.subtitle ?? existing?.subtitle ?? '',
      published: note.published !== undefined ? (note.published ? 1 : 0) : (existing?.published ?? 1),
      sort_order: typeof note.sort_order === 'number' ? note.sort_order : (existing?.sort_order ?? 0)
    };

    const stmt = db.prepare(`
      INSERT INTO notes (id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order)
      VALUES (@id, @slug, @type, @date, @formatted_date, @read_time, @tags, @title, @summary, @subtitle, @published, @sort_order)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        type = excluded.type,
        date = excluded.date,
        formatted_date = excluded.formatted_date,
        read_time = excluded.read_time,
        tags = excluded.tags,
        title = excluded.title,
        summary = excluded.summary,
        subtitle = excluded.subtitle,
        published = excluded.published,
        sort_order = excluded.sort_order
    `);

    stmt.run(merged);

    if (Array.isArray(note.sections)) {
      db.prepare('DELETE FROM note_sections WHERE note_id = ?').run(note.id);
      const insertSec = db.prepare(`
        INSERT INTO note_sections (id, note_id, section_anchor_id, title, content, sort_order)
        VALUES (@id, @note_id, @section_anchor_id, @title, @content, @sort_order)
      `);

      note.sections.forEach((sec, idx) => {
        insertSec.run({
          id: crypto.randomUUID(),
          note_id: note.id,
          section_anchor_id: sec.id,
          title: sec.title,
          content: sec.content,
          sort_order: idx + 1
        });
      });
    }
  });

  txn();
  return getNoteByIdOrSlug(note.id);
}

export function deleteNote(id) {
  const info = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  return info.changes > 0;
}

export function updateMeta(meta) {
  const existing = db.prepare("SELECT * FROM portfolio_meta WHERE id = 'main'").get() || {};
  let currentLinks = [];
  try {
    currentLinks = typeof existing.social_links === 'string' ? JSON.parse(existing.social_links) : [];
  } catch {
    currentLinks = [];
  }

  const merged = {
    authorName: meta.authorName ?? existing.author_name ?? 'Karan',
    logoText: meta.logoText ?? existing.logo_text ?? 'Karan',
    avatarUrl: meta.avatarUrl ?? existing.avatar_url ?? 'avatar.jpg',
    pageTitle: meta.pageTitle ?? existing.page_title ?? 'Karan — Notes & Exploratory Research',
    metaDescription: meta.metaDescription ?? existing.meta_description ?? '',
    copyrightYear: meta.copyrightYear ?? existing.copyright_year ?? 2026,
    socialLinks: JSON.stringify(meta.socialLinks ?? currentLinks)
  };

  db.prepare(`
    INSERT INTO portfolio_meta (id, author_name, logo_text, avatar_url, page_title, meta_description, copyright_year, social_links)
    VALUES ('main', @authorName, @logoText, @avatarUrl, @pageTitle, @metaDescription, @copyrightYear, @socialLinks)
    ON CONFLICT(id) DO UPDATE SET
      author_name = excluded.author_name,
      logo_text = excluded.logo_text,
      avatar_url = excluded.avatar_url,
      page_title = excluded.page_title,
      meta_description = excluded.meta_description,
      copyright_year = excluded.copyright_year,
      social_links = excluded.social_links,
      updated_at = datetime('now')
  `).run(merged);

  return {
    ...merged,
    socialLinks: JSON.parse(merged.socialLinks)
  };
}

export function updateHero(hero) {
  const existing = db.prepare("SELECT * FROM portfolio_hero WHERE id = 'main'").get() || {};

  const merged = {
    heading: hero.heading ?? existing.heading ?? 'Notes and exploratory research.',
    bioHighlight: hero.bioHighlight ?? existing.bio_highlight ?? 'Karan',
    bioIntro: hero.bioIntro ?? existing.bio_intro ?? '',
    moreAboutText: hero.moreAboutText ?? existing.more_about_text ?? 'More about me.',
    moreAboutAnchor: hero.moreAboutAnchor ?? existing.more_about_anchor ?? '#about'
  };

  db.prepare(`
    INSERT INTO portfolio_hero (id, heading, bio_highlight, bio_intro, more_about_text, more_about_anchor)
    VALUES ('main', @heading, @bioHighlight, @bioIntro, @moreAboutText, @moreAboutAnchor)
    ON CONFLICT(id) DO UPDATE SET
      heading = excluded.heading,
      bio_highlight = excluded.bio_highlight,
      bio_intro = excluded.bio_intro,
      more_about_text = excluded.more_about_text,
      more_about_anchor = excluded.more_about_anchor
  `).run(merged);

  return merged;
}

export function updateAbout(about) {
  const existing = db.prepare("SELECT * FROM portfolio_about WHERE id = 'main'").get() || {};
  let currentParas = [];
  try {
    currentParas = typeof existing.paragraphs === 'string' ? JSON.parse(existing.paragraphs) : [];
  } catch {
    currentParas = [];
  }

  const merged = {
    sectionLabel: about.sectionLabel ?? existing.section_label ?? 'About & Focus',
    paragraphs: JSON.stringify(about.paragraphs ?? currentParas)
  };

  db.prepare(`
    INSERT INTO portfolio_about (id, section_label, paragraphs)
    VALUES ('main', @sectionLabel, @paragraphs)
    ON CONFLICT(id) DO UPDATE SET
      section_label = excluded.section_label,
      paragraphs = excluded.paragraphs
  `).run(merged);

  return {
    ...merged,
    paragraphs: JSON.parse(merged.paragraphs)
  };
}

export function getDatabaseHealth() {
  try {
    const test = db.prepare('SELECT 1 as alive').get();
    const stats = existsSync(DB_PATH) ? statSync(DB_PATH) : null;
    const notesCount = db.prepare('SELECT COUNT(*) as count FROM notes').get()?.count || 0;
    const sectionsCount = db.prepare('SELECT COUNT(*) as count FROM note_sections').get()?.count || 0;

    return {
      provider: 'sqlite',
      connected: test?.alive === 1,
      path: DB_PATH,
      sizeBytes: stats ? stats.size : 0,
      sizeKB: stats ? (stats.size / 1024).toFixed(2) + ' KB' : '0 KB',
      tables: {
        notes: notesCount,
        sections: sectionsCount
      }
    };
  } catch (err) {
    return {
      provider: 'sqlite',
      connected: false,
      error: err.message
    };
  }
}

export { db, DB_PATH };
