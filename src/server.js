import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  getPortfolio,
  getNotes,
  getNoteByIdOrSlug,
  upsertNote,
  deleteNote,
  updateMeta,
  updateHero,
  updateAbout,
  getDatabaseHealth,
  getDatabaseSchema
} from './db/database.js';

dotenv.config();

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-secret-pin']
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

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

// 1. Health Check: GET /health
app.get('/health', async (c) => {
  const dbHealth = getDatabaseHealth();

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'academic-portfolio-backend',
    database: dbHealth
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
app.get('/api/portfolio', (c) => {
  const portfolio = getPortfolio();
  return c.json({
    status: 'success',
    source: 'sqlite',
    data: portfolio
  });
});

// 4. Notes List: GET /api/notes
app.get('/api/notes', (c) => {
  const notes = getNotes(false);
  return c.json({
    status: 'success',
    source: 'sqlite',
    count: notes.length,
    data: notes
  });
});

// 5. Single Note: GET /api/notes/:id
app.get('/api/notes/:id', (c) => {
  const idOrSlug = c.req.param('id');
  const note = getNoteByIdOrSlug(idOrSlug);

  if (note) {
    return c.json({
      status: 'success',
      source: 'sqlite',
      data: note
    });
  }

  return c.json({ status: 'error', message: `Note '${idOrSlug}' not found` }, 404);
});

// ==========================================
// Mutation Endpoints (Protected by Secret PIN)
// ==========================================

// Create Note: POST /api/notes
app.post('/api/notes', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const note = await c.req.json().catch(() => null);
  if (!note || !note.id || !note.title) {
    return c.json({ status: 'error', message: 'Note id and title are required' }, 400);
  }

  const savedNote = upsertNote(note);

  return c.json({
    status: 'success',
    message: 'Note created successfully',
    data: savedNote
  });
});

// Update Note: PUT /api/notes/:id
app.put('/api/notes/:id', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const updatedData = await c.req.json().catch(() => ({}));

  const savedNote = upsertNote({ ...updatedData, id });

  return c.json({
    status: 'success',
    message: 'Note updated successfully',
    data: savedNote
  });
});

// Delete Note: DELETE /api/notes/:id
app.delete('/api/notes/:id', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const deleted = deleteNote(id);

  if (deleted) {
    return c.json({ status: 'success', message: `Note '${id}' deleted successfully` });
  } else {
    return c.json({ status: 'error', message: `Note '${id}' not found` }, 404);
  }
});

// Update Metadata: PUT /api/meta
app.put('/api/meta', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const meta = await c.req.json().catch(() => ({}));
  const updated = updateMeta(meta);

  return c.json({
    status: 'success',
    message: 'Metadata updated successfully',
    data: updated
  });
});

// Update Hero: PUT /api/hero
app.put('/api/hero', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const hero = await c.req.json().catch(() => ({}));
  const updated = updateHero(hero);

  return c.json({
    status: 'success',
    message: 'Hero updated successfully',
    data: updated
  });
});

// Update About: PUT /api/about
app.put('/api/about', async (c) => {
  if (!verifyAdmin(c)) return c.json({ status: 'error', message: 'Unauthorized' }, 401);

  const about = await c.req.json().catch(() => ({}));
  const updated = updateAbout(about);

  return c.json({
    status: 'success',
    message: 'About updated successfully',
    data: updated
  });
});

// SQLite Database Schema endpoint: GET /api/schema
app.get('/api/schema', (c) => {
  const schema = getDatabaseSchema();
  return c.json(schema);
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
console.log(`🚀 Hono & SQLite backend server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
