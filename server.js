const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.WEDDING_PORT || 3001;
const ADMIN_KEY = process.env.WEDDING_ADMIN_KEY || (() => { console.warn('[WARN] WEDDING_ADMIN_KEY not set in environment!'); return 'CHANGE_ME_NOW'; })();

// Rate limiting for admin endpoints
let adminAttempts = new Map();
function adminRateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  const attempts = (adminAttempts.get(ip) || []).filter(t => t > now - window);
  if (attempts.length >= maxAttempts) {
    return res.status(429).json({ error: 'Demasiados intentos. Espere 15 minutos.' });
  }
  attempts.push(now);
  adminAttempts.set(ip, attempts);
  next();
}

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// SQLite Database
const db = new Database(path.join(dataDir, 'wedding.db'));
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS rsvp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        message TEXT DEFAULT '',
        guests INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        meta TEXT DEFAULT '{}',
        ip TEXT DEFAULT '',
        user_agent TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
`);

// Middleware
app.use(express.json());

// Only serve public-safe static files (not server.js, package.json, data/, etc.)
const publicDir = path.join(__dirname);
app.use(express.static(publicDir, {
    extensions: ['html'],
    index: 'index.html',
    dotfiles: 'deny',
    setHeaders: (res, filePath) => {
      // Block access to sensitive files
      const blocked = /\.(js|json|db|sqlite)$/i;
      const basename = path.basename(filePath);
      if (basename === 'server.js' || basename === 'package.json' || basename === 'package-lock.json') {
        res.status(403).end();
      }
    }
}));

// Track page view on first load
app.use((req, res, next) => {
    if (req.path === '/' && req.method === 'GET') {
        try {
            const stmt = db.prepare('INSERT INTO events (type, meta, ip, user_agent) VALUES (?, ?, ?, ?)');
            stmt.run('page_view', '{}', req.ip, req.get('user-agent') || '');
        } catch (e) { /* silent */ }
    }
    next();
});

// ========== API ROUTES ==========

// RSVP Submit
app.post('/api/rsvp', (req, res) => {
    try {
        const { name, message, guests } = req.body;
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const stmt = db.prepare('INSERT INTO rsvp (name, message, guests) VALUES (?, ?, ?)');
        stmt.run(name.trim(), (message || '').trim(), guests || 1);

        // Also track as event
        const evtStmt = db.prepare('INSERT INTO events (type, meta, ip, user_agent) VALUES (?, ?, ?, ?)');
        evtStmt.run('rsvp_confirm', JSON.stringify({ name: name.trim() }), req.ip, req.get('user-agent') || '');

        res.json({ success: true, message: '¡Confirmado!' });
    } catch (e) {
        console.error('RSVP error:', e);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Event Tracking (fire-and-forget from frontend)
app.post('/api/track', (req, res) => {
    try {
        const { type, meta } = req.body;
        if (!type) return res.status(400).json({ error: 'type required' });
        const stmt = db.prepare('INSERT INTO events (type, meta, ip, user_agent) VALUES (?, ?, ?, ?)');
        stmt.run(type, JSON.stringify(meta || {}), req.ip, req.get('user-agent') || '');
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// Stats API (protected with rate limiting)
app.get('/api/stats', adminRateLimit, (req, res) => {
    if (req.query.key !== ADMIN_KEY) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    try {
        const rsvps = db.prepare('SELECT * FROM rsvp ORDER BY created_at DESC').all();
        const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 500').all();
        
        // Aggregates
        const totalViews = db.prepare("SELECT COUNT(*) as count FROM events WHERE type = 'page_view'").get().count;
        const totalRsvps = db.prepare("SELECT COUNT(*) as count FROM rsvp").get().count;
        const totalGuests = db.prepare("SELECT COALESCE(SUM(guests), 0) as count FROM rsvp").get().count;
        const copyCounts = db.prepare("SELECT json_extract(meta, '$.bank') as bank, COUNT(*) as count FROM events WHERE type = 'copy_account' GROUP BY bank ORDER BY count DESC").all();
        const mapClicks = db.prepare("SELECT COUNT(*) as count FROM events WHERE type = 'open_map'").get().count;

        res.json({
            summary: { totalViews, totalRsvps, totalGuests, mapClicks, copyCounts },
            rsvps,
            events
        });
    } catch (e) {
        console.error('Stats error:', e);
        res.status(500).json({ error: 'Error interno' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`💒 Wedding server running on port ${PORT}`);
    console.log(`⏰ Current Server Time: ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}`);
    console.log(`🌐 System Local Time: ${new Date().toLocaleString()}`);
});
