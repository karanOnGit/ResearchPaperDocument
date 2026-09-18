# Karan — Notes & Exploratory Research (Academic Portfolio)

A minimalist, high-performance academic research notebook and interactive reader view, powered by **Hono**, **SQLite** (`better-sqlite3`), and Vanilla Web Technologies.

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
│   │   ├── database.js     # Embedded SQLite connection, schema & query layer
│   │   ├── seed.js         # Standalone database seed / reset script
│   │   ├── content.json    # Local JSON data snapshot & backup store
│   │   └── schema.json     # JSON schema specification
│   └── server.js           # Hono web server & REST API endpoints
│
├── database/               # Local database files & migrations
│   ├── schema.sql          # SQLite table DDL, indexes, and relations
│   └── portfolio.db        # Embedded local SQLite database (~4-50 KB)
│
├── docs/                   # Developer documentation & API contracts
│   └── api_schema_documentation.md # API endpoints & JSON payloads
│
├── .env.local / .env       # Environment variables (optional PORT, ADMIN_PIN)
├── .gitignore              # Git ignore rules (ignores *.db and OS files)
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

### 2. Configure Environment (Optional)
Create `.env` (or `.env.local`):
```env
PORT=3000
ADMIN_PIN=1107
# DATABASE_PATH=./database/portfolio.db  # (Optional, defaults to ./database/portfolio.db)
```

> **Note:** No external database servers or cloud accounts required! The SQLite database is created and auto-seeded automatically on first startup.

### 3. Seed / Reset Database (Optional)
To manually seed or reset the SQLite database from `content.json`:
```bash
npm run db:seed
```

### 4. Run Locally
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
  - Embedded SQLite real-time status and JSON sync.

---

## 🌐 API Endpoints

- `GET /health` — Service and SQLite database health check.
- `GET /api/portfolio` — Complete aggregated portfolio data from SQLite.
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
2. Deploy directly without requiring external database setup!
