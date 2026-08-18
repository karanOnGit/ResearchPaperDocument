import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { supabase } from './supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Local fallback database from content.json
let localData = null;

function loadLocalData() {
  try {
    const filePath = resolve('./content.json');
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8');
      localData = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading fallback content.json:', err);
  }
}
loadLocalData();

// ==========================================
// API Endpoints with Supabase Integration
// ==========================================

// 1. Health Check & Supabase Status
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

// 2. Full Portfolio Bundle: GET /api/portfolio
app.get('/api/portfolio', async (c) => {
  if (supabase) {
    try {
      const [metaRes, heroRes, aboutRes, notesRes] = await Promise.all([
        supabase.from('portfolio_meta').select('*').limit(1).maybeSingle(),
        supabase.from('portfolio_hero').select('*').limit(1).maybeSingle(),
        supabase.from('portfolio_about').select('*').limit(1).maybeSingle(),
        supabase.from('notes').select(`
          id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle, sort_order,
          sections:note_sections(id:section_anchor_id, title, content, sort_order)
        `).eq('published', true).order('sort_order', { ascending: true })
      ]);

      if (notesRes.data && notesRes.data.length > 0) {
        // Format notes with sorted sections
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
      console.warn('Supabase query failed, falling back to local data:', err.message);
    }
  }

  // Fallback to local json data
  return c.json({
    status: 'success',
    source: 'local_cache',
    data: localData
  });
});

// 3. Metadata: GET /api/meta
app.get('/api/meta', async (c) => {
  if (supabase) {
    const { data } = await supabase.from('portfolio_meta').select('*').limit(1).maybeSingle();
    if (data) {
      return c.json({
        status: 'success',
        source: 'supabase',
        data: {
          authorName: data.author_name,
          logoText: data.logo_text,
          avatarUrl: data.avatar_url,
          pageTitle: data.page_title,
          metaDescription: data.meta_description,
          copyrightYear: data.copyright_year,
          socialLinks: data.social_links
        }
      });
    }
  }
  return c.json({ status: 'success', source: 'local_cache', data: localData?.meta });
});

// 4. Hero Section: GET /api/hero
app.get('/api/hero', async (c) => {
  if (supabase) {
    const { data } = await supabase.from('portfolio_hero').select('*').limit(1).maybeSingle();
    if (data) {
      return c.json({
        status: 'success',
        source: 'supabase',
        data: {
          heading: data.heading,
          bioHighlight: data.bio_highlight,
          bioIntro: data.bio_intro,
          moreAboutText: data.more_about_text,
          moreAboutAnchor: data.more_about_anchor
        }
      });
    }
  }
  return c.json({ status: 'success', source: 'local_cache', data: localData?.hero });
});

// 5. About Section: GET /api/about
app.get('/api/about', async (c) => {
  if (supabase) {
    const { data } = await supabase.from('portfolio_about').select('*').limit(1).maybeSingle();
    if (data) {
      return c.json({
        status: 'success',
        source: 'supabase',
        data: {
          sectionLabel: data.section_label,
          paragraphs: data.paragraphs
        }
      });
    }
  }
  return c.json({ status: 'success', source: 'local_cache', data: localData?.about });
});

// 6. Notes Summary List for Landing Page: GET /api/notes
app.get('/api/notes', async (c) => {
  if (supabase) {
    const { data, error } = await supabase
      .from('notes')
      .select('id, slug, type, date, formatted_date, read_time, tags, title, summary, sort_order')
      .eq('published', true)
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
        summary: n.summary
      }));
      return c.json({ status: 'success', source: 'supabase', count: formatted.length, data: formatted });
    }
  }

  const summaries = (localData?.notes || []).map(({ sections, ...summary }) => summary);
  return c.json({ status: 'success', source: 'local_cache', count: summaries.length, data: summaries });
});

// 7. Single Research Note with Full Google Docs Sections: GET /api/notes/:id
app.get('/api/notes/:id', async (c) => {
  const idOrSlug = c.req.param('id');

  if (supabase) {
    const { data: note } = await supabase
      .from('notes')
      .select(`
        id, slug, type, date, formatted_date, read_time, tags, title, summary, subtitle,
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

// 8. JSON Schema endpoint: GET /api/schema
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
