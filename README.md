# Karan — Notes & Exploratory Research (Academic Portfolio)

A minimalist, high-performance academic research notebook and interactive reader view, powered by **Hono**, **Supabase**, and Vanilla Web Technologies.

---

## 📁 Project Architecture

```
Portfolio/
├── public/                 # Static assets served directly to the browser
│   ├── index.html          # Public landing page & Google Docs outline reader
│   ├── dashboard.html      # Admin CMS dashboard (PIN protected)
│   ├── script.js           # Frontend runtime logic & API integration
│   ├── style.css           # Custom styles & typography
│   ├── avatar.jpg          # Pencil-sketch portrait badge
│   ├── og-image.jpg        # Open Graph preview card (1200x630)
│   └── og-preview.jpg      # Open Graph image asset
│
├── src/                    # Backend server source code
│   ├── db/
│   │   ├── content.json    # Local fallback JSON data store
│   │   └── schema.json     # JSON schema specification
│   ├── server.js           # Hono web server & REST API endpoints
│   └── supabase.js         # Supabase PostgreSQL client singleton
│
├── database/               # Database migrations & schemas
│   └── supabase_schema.sql # PostgreSQL DDL, tables, and seed dataset
│
├── docs/                   # Developer documentation & API contracts
│   └── api_schema_documentation.md # API endpoints & JSON payloads
│
├── .env.local / .env       # Environment variables (Supabase keys)
├── .gitignore              # Git ignore rules
├── package.json            # Node.js dependencies and scripts
├── render.yaml             # Render deployment configuration
└── README.md               # Project documentation
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` (or `.env.local`):
```env
PORT=3000
ADMIN_PIN=1107
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Run Locally
```bash
# Start production server
npm start

# Or run in watch mode
npm run dev
```

Server runs on: [http://localhost:3000](http://localhost:3000)

---

## 🔒 CMS Dashboard

- **URL:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Default PIN:** `1107`
- **Features:**
  - Create, edit, and delete research notes.
  - Rich formatting toolbar (LaTeX Math `$f(x)$` and `$$\sum$$`, Academic Callout Cards, Theorem Boxes, Tables, Python code blocks).
  - Keyboard shortcuts (`Cmd+B`, `Cmd+I`, `Cmd+M`, `Cmd+K`, `Cmd+Shift+A`...).
  - Live KaTeX & HTML preview.
  - Profile, hero, and about paragraph settings.
  - JSON backup and sync.

---

## 🌐 API Endpoints

- `GET /health` — Service and database health check.
- `GET /api/portfolio` — Complete aggregated portfolio data.
- `GET /api/notes` — All research notes metadata.
- `GET /api/notes/:id` — Single research note with outline sections.
- `POST /api/notes` — Create new research note *(protected)*.
- `PUT /api/notes/:id` — Update research note *(protected)*.
- `DELETE /api/notes/:id` — Delete note *(protected)*.
- `PUT /api/meta` — Update author & branding metadata *(protected)*.
- `PUT /api/hero` — Update hero section *(protected)*.
- `PUT /api/about` — Update about paragraphs *(protected)*.

---

## ☁️ Deployment (Render)

This repository includes a [`render.yaml`](./render.yaml) Blueprint:
1. Connect repository on [Render](https://render.com).
2. Set environment variables `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. Deploy!
