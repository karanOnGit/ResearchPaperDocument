import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { supabase } from './supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-secret-pin']
}));

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

// Local database state from content.json
let localData = null;
const CONTENT_PATH = existsSync(join(ROOT_DIR, 'src/db/content.json'))
  ? join(ROOT_DIR, 'src/db/content.json')
  : join(ROOT_DIR, 'content.json');

const SCHEMA_PATH = existsSync(join(ROOT_DIR, 'src/db/schema.json'))
  ? join(ROOT_DIR, 'src/db/schema.json')
  : join(ROOT_DIR, 'schema.json');

function loadLocalData() {
  try {
    if (existsSync(CONTENT_PATH)) {
      const raw = readFileSync(CONTENT_PATH, 'utf-8');
      localData = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading fallback content.json:', err);
  }
}
loadLocalData();

function saveLocalData() {
  try {
    writeFileSync(CONTENT_PATH, JSON.stringify(localData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving content.json:', err);
  }
}

// Secret PIN Auth Verification
const SECRET_PIN = process.env.ADMIN_PIN || '1107';

function verifyAdmin(c) {
  const pinHeader = c.req.header('x-secret-pin');
  const authHeader = c.req.header('Authorization');
  return pinHeader === SECRET_PIN || authHeader === `Bearer ${SECRET_PIN}`;
}

// ==========================================
// Dashboard & HTML Route
// ==========================================
const DASHBOARD_PATH = existsSync(join(ROOT_DIR, 'public/dashboard.html'))
  ? './public/dashboard.html'
  : './dashboard.html';

app.get('/dashboard', serveStatic({ path: DASHBOARD_PATH }));

// ==========================================
// API Endpoints
// ==========================================

// 1. Health Check
app.get('/health', async (c) => {
  let supabaseConnected = false;
  let supabaseWriteable = false;
  if (supabase) {
    try {
      const { error } = await supabase.from('notes').select('id').limit(1);
      supabaseConnected = !error;
    } catch {
      supabaseConnected = false;
    }
  }

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'academic-portfolio-backend',
    database: {
      provider: 'supabase',
      connected: supabaseConnected,
      url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    }
  });
});

// 2. Secret PIN Verification: POST /api/verify-pin
app.post('/api/verify-pin', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { pin } = body;

  if (pin === SECRET_PIN) {
    return c.json({
      status: 'success',
      authenticated: true,
      token: SECRET_PIN,
      message: 'Access granted'
    });
  }

  return c.json({
    status: 'error',
    authenticated: false,
    message: 'Invalid secret PIN'
  }, 401);
});

// 3. Full Portfolio Bundle: GET /api/portfolio
app.get('/api/portfolio', async (c) => {
  // Always load latest local data first
  loadLocalData();

  if (supabase) {
    try {
      const [metaRes, heroRes, aboutRes, notesRes] = await Promise.all([
        supabase.from('portfolio_meta').select('*').limit(1).maybeSingle(),
        supabase.from('portfolio_hero').select('*').limit(1).maybeSingle(),
        supabase.from('portfolio_about').select('*').limit(1).maybeSingle(),
        supabase.from('notes').select(`
          id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published, sort_order,
          sections:note_sections(id:section_anchor_id, title, content, sort_order)
        `).order('sort_order', { ascending: true })
      ]);

      if (notesRes.data && notesRes.data.length > 0) {
        const notes = notesRes.data.map(n => ({
          id: n.id,
          slug: n.slug,
          type: n.type,
          date: n.date,
          formattedDate: n.formatted_date,
          readTime: n.read_time,
          tags: n.tags || [],
          title: n.title,
          summary: n.summary,
          subtitle: n.subtitle,
          published: n.published !== false,
          sections: (n.sections || []).sort((a, b) => a.sort_order - b.sort_order)
        }));

        return c.json({
          status: 'success',
          source: 'supabase',
          data: {
            meta: metaRes.data ? {
              authorName: metaRes.data.author_name,
              logoText: metaRes.data.logo_text,
              avatarUrl: metaRes.data.avatar_url,
              pageTitle: metaRes.data.page_title,
              metaDescription: metaRes.data.meta_description,
              copyrightYear: metaRes.data.copyright_year,
              socialLinks: metaRes.data.social_links
            } : localData?.meta,
            hero: heroRes.data ? {
              heading: heroRes.data.heading,
              bioHighlight: heroRes.data.bio_highlight,
              bioIntro: heroRes.data.bio_intro,
              moreAboutText: heroRes.data.more_about_text,
              moreAboutAnchor: heroRes.data.more_about_anchor
            } : localData?.hero,
            about: aboutRes.data ? {
              sectionLabel: aboutRes.data.section_label,
              paragraphs: aboutRes.data.paragraphs
            } : localData?.about,
            notes
          }
        });
      }
    } catch (err) {
      console.warn('Supabase query fallback:', err.message);
    }
  }

  return c.json({
    status: 'success',
    source: 'local_cache',
    data: localData
  });
});

// 4. Notes List: GET /api/notes
app.get('/api/notes', async (c) => {
  loadLocalData();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, slug, type, date, formatted_date, read_time, tags, title, summary, published, sort_order')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted = data.map(n => ({
          id: n.id,
          slug: n.slug,
          type: n.type,
          date: n.date,
          formattedDate: n.formatted_date,
          readTime: n.read_time,
          tags: n.tags || [],
          title: n.title,
          summary: n.summary,
          published: n.published !== false
        }));
        return c.json({ status: 'success', source: 'supabase', count: formatted.length, data: formatted });
      }
    } catch (e) {
      console.warn('Supabase notes error:', e);
    }
  }

  const summaries = (localData?.notes || []).map(({ sections, ...summary }) => summary);
  return c.json({ status: 'success', source: 'local_cache', count: summaries.length, data: summaries });
});

// 5. Single Note: GET /api/notes/:id
app.get('/api/notes/:id', async (c) => {
  loadLocalData();
  const idOrSlug = c.req.param('id');

  if (supabase) {
    try {
      const { data: note, error } = await supabase
        .from('notes')
        .select(`
          id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published,
          sections:note_sections(id:section_anchor_id, title, content, sort_order)
        `)
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .maybeSingle();

      if (!error && note) {
        return c.json({
          status: 'success',
          source: 'supabase',
          data: {
            id: note.id,
            slug: note.slug,
            type: note.type,
            date: note.date,
            formattedDate: note.formatted_date,
            readTime: note.read_time,
            tags: note.tags || [],
            title: note.title,
            summary: note.summary,
            subtitle: note.subtitle,
            published: note.published !== false,
            sections: (note.sections || []).sort((a, b) => a.sort_order - b.sort_order)
          }
        });
      }
    } catch (e) {
      console.warn('Supabase single note fetch error:', e);
    }
  }

  const fallbackNote = localData?.notes?.find(n => n.id === idOrSlug || n.slug === idOrSlug);
  if (fallbackNote) {
    return c.json({ status: 'success', source: 'local_cache', data: fallbackNote });
  }

  return c.json({ status: 'error', message: `Note '${idOrSlug}' not found` }, 404);
});

// ==========================================
// Mutation Endpoints (Protected by Secret PIN)
// ==========================================

// Create Note: POST /api/notes
app.post('/api/notes', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const note = await c.req.json();
  if (!note.id || !note.title) {
    return c.json({ status: 'error', message: 'Note id and title are required' }, 400);
  }

  // Update local content.json first
  loadLocalData();
  if (!localData.notes) localData.notes = [];
  const existingIdx = localData.notes.findIndex(n => n.id === note.id);
  if (existingIdx >= 0) {
    localData.notes[existingIdx] = note;
  } else {
    localData.notes.push(note);
  }
  saveLocalData();

  let supabaseStatus = 'skipped';
  let supabaseError = null;

  if (supabase) {
    try {
      const { error: upsertErr } = await supabase.from('notes').upsert({
        id: note.id,
        slug: note.slug || note.id,
        type: note.type || 'NOTE',
        date: note.date || new Date().toISOString().split('T')[0],
        formatted_date: note.formattedDate || note.date,
        read_time: note.readTime || '15 min',
        tags: note.tags || [],
        title: note.title,
        summary: note.summary || '',
        subtitle: note.subtitle || '',
        published: note.published !== false,
        sort_order: note.sort_order || 0
      });

      if (upsertErr) {
        supabaseStatus = 'error';
        supabaseError = upsertErr.message;
      } else {
        supabaseStatus = 'synced';
        if (Array.isArray(note.sections)) {
          await supabase.from('note_sections').delete().eq('note_id', note.id);
          const sectionsToInsert = note.sections.map((sec, idx) => ({
            note_id: note.id,
            section_anchor_id: sec.id,
            title: sec.title,
            content: sec.content,
            sort_order: idx + 1
          }));
          if (sectionsToInsert.length > 0) {
            await supabase.from('note_sections').insert(sectionsToInsert);
          }
        }
      }
    } catch (e) {
      supabaseStatus = 'error';
      supabaseError = e.message;
    }
  }

  return c.json({
    status: 'success',
    message: 'Note created successfully',
    supabase: { status: supabaseStatus, error: supabaseError },
    data: note
  });
});

// Update Note: PUT /api/notes/:id
app.put('/api/notes/:id', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const updatedData = await c.req.json();

  // 1. Update local cache immediately
  loadLocalData();
  if (localData?.notes) {
    const idx = localData.notes.findIndex(n => n.id === id);
    if (idx >= 0) {
      localData.notes[idx] = { ...localData.notes[idx], ...updatedData, id };
      saveLocalData();
    } else {
      localData.notes.push({ ...updatedData, id });
      saveLocalData();
    }
  }

  let supabaseStatus = 'skipped';
  let supabaseError = null;

  // 2. Sync to Supabase
  if (supabase) {
    try {
      const { error: noteUpdateErr } = await supabase.from('notes').upsert({
        id,
        slug: updatedData.slug || id,
        type: updatedData.type || 'NOTE',
        date: updatedData.date,
        formatted_date: updatedData.formattedDate || updatedData.date,
        read_time: updatedData.readTime || '15 min',
        tags: updatedData.tags || [],
        title: updatedData.title,
        summary: updatedData.summary || '',
        subtitle: updatedData.subtitle || '',
        published: updatedData.published !== false
      });

      if (noteUpdateErr) {
        supabaseStatus = 'error';
        supabaseError = noteUpdateErr.message;
        console.warn('Supabase update note RLS / error:', noteUpdateErr);
      } else {
        supabaseStatus = 'synced';
        if (Array.isArray(updatedData.sections)) {
          await supabase.from('note_sections').delete().eq('note_id', id);
          const sectionsToInsert = updatedData.sections.map((sec, idx) => ({
            note_id: id,
            section_anchor_id: sec.id,
            title: sec.title,
            content: sec.content,
            sort_order: idx + 1
          }));
          if (sectionsToInsert.length > 0) {
            await supabase.from('note_sections').insert(sectionsToInsert);
          }
        }
      }
    } catch (e) {
      supabaseStatus = 'error';
      supabaseError = e.message;
    }
  }

  return c.json({
    status: 'success',
    message: 'Note updated successfully',
    supabase: { status: supabaseStatus, error: supabaseError }
  });
});

// Delete Note: DELETE /api/notes/:id
app.delete('/api/notes/:id', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const id = c.req.param('id');

  loadLocalData();
  if (localData?.notes) {
    localData.notes = localData.notes.filter(n => n.id !== id);
    saveLocalData();
  }

  if (supabase) {
    try {
      await supabase.from('notes').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete note error:', e);
    }
  }

  return c.json({ status: 'success', message: `Note '${id}' deleted successfully` });
});

// Update Metadata: PUT /api/meta
app.put('/api/meta', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const meta = await c.req.json();
  loadLocalData();
  localData.meta = { ...localData.meta, ...meta };
  saveLocalData();

  if (supabase) {
    try {
      await supabase.from('portfolio_meta').upsert({
        id: 'main',
        author_name: meta.authorName,
        logo_text: meta.logoText,
        avatar_url: meta.avatarUrl,
        page_title: meta.pageTitle,
        meta_description: meta.metaDescription,
        copyright_year: meta.copyrightYear,
        social_links: meta.socialLinks || []
      });
    } catch (e) {
      console.warn('Supabase update meta error:', e);
    }
  }

  return c.json({ status: 'success', message: 'Metadata updated successfully', data: localData.meta });
});

// Update Hero: PUT /api/hero
app.put('/api/hero', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const hero = await c.req.json();
  loadLocalData();
  localData.hero = { ...localData.hero, ...hero };
  saveLocalData();

  if (supabase) {
    try {
      await supabase.from('portfolio_hero').upsert({
        id: 'main',
        heading: hero.heading,
        bio_highlight: hero.bioHighlight,
        bio_intro: hero.bioIntro,
        more_about_text: hero.moreAboutText,
        more_about_anchor: hero.moreAboutAnchor
      });
    } catch (e) {
      console.warn('Supabase update hero error:', e);
    }
  }

  return c.json({ status: 'success', message: 'Hero updated successfully', data: localData.hero });
});

// Update About: PUT /api/about
app.put('/api/about', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const about = await c.req.json();
  loadLocalData();
  localData.about = { ...localData.about, ...about };
  saveLocalData();

  if (supabase) {
    try {
      await supabase.from('portfolio_about').upsert({
        id: 'main',
        section_label: about.sectionLabel,
        paragraphs: about.paragraphs
      });
    } catch (e) {
      console.warn('Supabase update about error:', e);
    }
  }

  return c.json({ status: 'success', message: 'About updated successfully', data: localData.about });
});

// JSON Schema endpoint: GET /api/schema
app.get('/api/schema', (c) => {
  try {
    const schemaRaw = readFileSync(SCHEMA_PATH, 'utf-8');
    return c.json(JSON.parse(schemaRaw));
  } catch (err) {
    return c.json({ status: 'error', message: 'Schema unavailable' }, 500);
  }
});

// ==========================================
// Static File Serving
// ==========================================
const STATIC_ROOT = existsSync(join(ROOT_DIR, 'public')) ? './public' : './';
app.use('/*', serveStatic({ root: STATIC_ROOT }));

// 404 Fallback
app.notFound((c) => {
  return c.json({ status: 'error', message: 'Endpoint not found', path: c.req.path }, 404);
});

// Error Handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ status: 'error', message: 'Internal server error', error: err.message }, 500);
});

// Start Server
const port = Number(process.env.PORT) || 3000;
console.log(`🚀 Hono & Supabase backend server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
