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

// Local database state from content.json
let localData = null;
const CONTENT_PATH = resolve('./content.json');

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

// Secret PIN Auth Verification middleware/helper
const SECRET_PIN = process.env.ADMIN_PIN || '1107';

function verifyAdmin(c) {
  const pinHeader = c.req.header('x-secret-pin');
  const authHeader = c.req.header('Authorization');
  return pinHeader === SECRET_PIN || authHeader === `Bearer ${SECRET_PIN}`;
}

// ==========================================
// Dashboard & HTML Route
// ==========================================
app.get('/dashboard', serveStatic({ path: './dashboard.html' }));

// ==========================================
// API Endpoints
// ==========================================

// 1. Health Check
app.get('/health', async (c) => {
  let supabaseConnected = false;
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
  if (supabase) {
    const { data } = await supabase
      .from('notes')
      .select('id, slug, type, date, formatted_date, read_time, tags, title, summary, published, sort_order')
      .order('sort_order', { ascending: true });

    if (data && data.length > 0) {
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
  }

  const summaries = (localData?.notes || []).map(({ sections, ...summary }) => summary);
  return c.json({ status: 'success', source: 'local_cache', count: summaries.length, data: summaries });
});

// 5. Single Note: GET /api/notes/:id
app.get('/api/notes/:id', async (c) => {
  const idOrSlug = c.req.param('id');

  if (supabase) {
    const { data: note } = await supabase
      .from('notes')
      .select(`
        id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, published,
        sections:note_sections(id:section_anchor_id, title, content, sort_order)
      `)
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .maybeSingle();

    if (note) {
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

  // Update Supabase if available
  if (supabase) {
    try {
      await supabase.from('notes').upsert({
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
    } catch (e) {
      console.warn('Supabase insert note error:', e);
    }
  }

  // Update local content.json
  if (!localData.notes) localData.notes = [];
  const existingIdx = localData.notes.findIndex(n => n.id === note.id);
  if (existingIdx >= 0) {
    localData.notes[existingIdx] = note;
  } else {
    localData.notes.push(note);
  }
  saveLocalData();

  return c.json({ status: 'success', message: 'Note created successfully', data: note });
});

// Update Note: PUT /api/notes/:id
app.put('/api/notes/:id', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const updatedData = await c.req.json();

  if (supabase) {
    try {
      await supabase.from('notes').update({
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
      }).eq('id', id);

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
    } catch (e) {
      console.warn('Supabase update note error:', e);
    }
  }

  if (localData?.notes) {
    const idx = localData.notes.findIndex(n => n.id === id);
    if (idx >= 0) {
      localData.notes[idx] = { ...localData.notes[idx], ...updatedData, id };
      saveLocalData();
    }
  }

  return c.json({ status: 'success', message: 'Note updated successfully' });
});

// Delete Note: DELETE /api/notes/:id
app.delete('/api/notes/:id', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const id = c.req.param('id');

  if (supabase) {
    try {
      await supabase.from('notes').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete note error:', e);
    }
  }

  if (localData?.notes) {
    localData.notes = localData.notes.filter(n => n.id !== id);
    saveLocalData();
  }

  return c.json({ status: 'success', message: `Note '${id}' deleted successfully` });
});

// Update Metadata: PUT /api/meta
app.put('/api/meta', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const meta = await c.req.json();
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

  localData.meta = { ...localData.meta, ...meta };
  saveLocalData();

  return c.json({ status: 'success', message: 'Metadata updated successfully', data: localData.meta });
});

// Update Hero: PUT /api/hero
app.put('/api/hero', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const hero = await c.req.json();
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

  localData.hero = { ...localData.hero, ...hero };
  saveLocalData();

  return c.json({ status: 'success', message: 'Hero updated successfully', data: localData.hero });
});

// Update About: PUT /api/about
app.put('/api/about', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const about = await c.req.json();
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

  localData.about = { ...localData.about, ...about };
  saveLocalData();

  return c.json({ status: 'success', message: 'About updated successfully', data: localData.about });
});

// JSON Schema endpoint: GET /api/schema
app.get('/api/schema', (c) => {
  try {
    const schemaRaw = readFileSync(resolve('./schema.json'), 'utf-8');
    return c.json(JSON.parse(schemaRaw));
  } catch (err) {
    return c.json({ status: 'error', message: 'Schema unavailable' }, 500);
  }
});

// ==========================================
// Static File Serving
// ==========================================
app.use('/*', serveStatic({ root: './' }));

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
