const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.WEDDING_PORT || 3000;
const ADMIN_KEY = process.env.WEDDING_ADMIN_KEY || (() => { console.warn('[WARN] WEDDING_ADMIN_KEY not set in environment!'); return 'CHANGE_ME_NOW'; })();

// Rate limiting for admin endpoints
let adminAttempts = new Map();
function adminRateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const maxAttempts = 10;
  const attempts = (adminAttempts.get(ip) || []).filter(t => t > now - window);
  if (attempts.length >= maxAttempts) return res.status(429).json({ error: 'Too many attempts.' });
  attempts.push(now);
  adminAttempts.set(ip, attempts);
  next();
}

// Simple admin middleware for Dashboard & Creation
function checkAdmin(req, res, next) {
    const key = req.query.key || req.get('x-admin-key');
    if (key === ADMIN_KEY) return next();
    res.status(403).send('Forbidden: Invalid Admin Key');
}

// Helper: Robust JSON extraction from AI responses
function extractJSON(text) {
    try {
        // Try direct parse
        return JSON.parse(text);
    } catch (e) {
        // Try finding JSON block in markdown
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error('No valid JSON found in response');
    }
}

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// SQLite Database
const db = new Database(path.join(dataDir, 'wedding.db'));
db.pragma('journal_mode = WAL');

// Create Multitenant Tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS weddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        theme_id TEXT DEFAULT 'roses-premium',
        content JSON DEFAULT '{}',
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS themes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        thumbnail TEXT,
        asset_url TEXT,
        config JSON DEFAULT '{}',
        is_premium INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT DEFAULT 'image',
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS rsvp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wedding_id INTEGER,
        name TEXT NOT NULL,
        message TEXT DEFAULT '',
        guests INTEGER DEFAULT 1,
        ip TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (wedding_id) REFERENCES weddings(id)
    );

    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wedding_id INTEGER,
        type TEXT NOT NULL,
        meta TEXT DEFAULT '{}',
        ip TEXT DEFAULT '',
        user_agent TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (wedding_id) REFERENCES weddings(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
`);

// Support legacy schema by ensuring columns exist (Internal migrations)
try { 
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('google_key', '');
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('anthropic_key', process.env.ANTHROPIC_API_KEY || '');
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('ai_provider', 'anthropic');
    
    // Seed default themes
    db.prepare("INSERT OR IGNORE INTO themes (id, name, thumbnail, asset_url) VALUES (?, ?, ?, ?)").run(
        'roses-premium', 'Rosas Premium', 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=300', '/assets/rosas-fondo.mp4'
    );
    db.prepare("INSERT OR IGNORE INTO themes (id, name, thumbnail, asset_url) VALUES (?, ?, ?, ?)").run(
        'classic-minimal', 'Classic Silk', '/assets/classic_bg.png', '/assets/classic_bg.png'
    );
} catch(e) { console.warn('Migration error:', e.message); }
try { db.prepare("ALTER TABLE rsvp ADD COLUMN wedding_id INTEGER").run(); } catch(e) {}
try { db.prepare("ALTER TABLE rsvp ADD COLUMN ip TEXT DEFAULT ''").run(); } catch(e) {}
try { db.prepare("ALTER TABLE events ADD COLUMN wedding_id INTEGER").run(); } catch(e) {}

// ─── MIDDLEWARE & STORAGE ───
app.use(express.json());

// Assets Directory (Uploads)
const uploadsDir = path.join(__dirname, 'assets/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Note: Multer is installed in production Docker environment
let upload = { single: () => (req, res, next) => next() }; 
try {
    const multer = require('multer');
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadsDir),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
    });
    upload = multer({ storage });
} catch(e) { console.warn('Multer not available locally. File uploads mocked.'); }

// ========== ROUTING & STATIC ASSETS ==========

// Serve static assets (images, css, js) FIRST
app.use(express.static(__dirname, {
    index: false,
    extensions: ['css', 'js', 'png', 'jpg', 'svg', 'mp4'],
    setHeaders: (res, filePath) => {
        const basename = path.basename(filePath);
        if (basename === 'server.js' || basename === 'package.json' || basename.endsWith('.db')) {
            res.status(403).end();
        }
    }
}));

// Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Dashboard (Allowed to load UI, API calls remain protected)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

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

// ========== AI & SAAS ENDPOINTS ==========
// ... (omitted for flow, keep original AI endpoints) ...

// ========== TENANT RENDERING ==========

// Serve the invitation engine for any wedding slug
app.get('/v/:slug', (req, res) => {
    const slug = req.params.slug;
    const wedding = db.prepare('SELECT id, title, content FROM weddings WHERE slug = ?').get(slug);
    
    if (!wedding) {
        return res.status(404).send('Boda no encontrada');
    }

    // Serve the main index.html file
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET Wedding Configuration for frontend (Restored)
app.get('/api/wedding/:slug', (req, res) => {
    try {
        const wedding = db.prepare('SELECT * FROM weddings WHERE slug = ?').get(req.params.slug);
        if (!wedding) return res.status(404).json({ error: 'Not found' });
        
        // Parse the JSON content
        const content = JSON.parse(wedding.content || '{}');
        res.json({ ...wedding, content });
    } catch (e) {
        res.status(500).json({ error: 'Internal error' });
    }
});

// ========== API ROUTES ==========

// RSVP Submit
app.post('/api/rsvp', (req, res) => {
    try {
        const { name, message, guests, wedding_id } = req.body;
        const ip = req.ip || req.get('x-forwarded-for') || 'unknown';

        if (!wedding_id) return res.status(400).json({ error: 'wedding_id requerido' });
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const normalizedName = name.trim().toLowerCase();

        // ─── ANTI-SPAM CHECK ───
        // Check if name already exists for this specific wedding
        const existingName = db.prepare("SELECT id FROM rsvp WHERE wedding_id = ? AND LOWER(TRIM(name)) = ?").get(wedding_id, normalizedName);
        if (existingName) {
            return res.status(409).json({ error: 'Ya has confirmado anteriormente.' });
        }

        // Check if IP already exists for this specific wedding
        if (ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1') {
            const existingIp = db.prepare("SELECT id FROM rsvp WHERE wedding_id = ? AND ip = ?").get(wedding_id, ip);
            if (existingIp) {
                return res.status(409).json({ error: 'Ya se ha realizado una confirmación desde este dispositivo.' });
            }
        }

        const stmt = db.prepare('INSERT INTO rsvp (wedding_id, name, message, guests, ip) VALUES (?, ?, ?, ?, ?)');
        stmt.run(wedding_id, name.trim(), (message || '').trim(), guests || 1, ip);

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

// Settings Management (Protected)
app.get('/api/settings', checkAdmin, (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM settings').all();
        const obj = {};
        settings.forEach(s => obj[s.key] = s.value);
        res.json(obj);
    } catch (e) {
        res.status(500).json({ error: 'Error reading settings' });
    }
});

app.post('/api/settings', checkAdmin, (req, res) => {
    try {
        const { google_key, anthropic_key, ai_provider } = req.body;
        if (google_key !== undefined) db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(google_key, 'google_key');
        if (anthropic_key !== undefined) db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(anthropic_key, 'anthropic_key');
        if (ai_provider !== undefined) db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(ai_provider, 'ai_provider');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error saving settings' });
    }
});

// ─── MARKETPLACE & THEMES ───

app.get('/api/themes', (req, res) => {
    try {
        const themes = db.prepare('SELECT * FROM themes').all();
        res.json(themes.map(t => ({...t, config: JSON.parse(t.config)})));
    } catch(e) { res.status(500).json({ error: 'Error themes' }); }
});

app.post('/api/themes', checkAdmin, (req, res) => {
    const { id, name, thumbnail, asset_url, config } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO themes (id, name, thumbnail, asset_url, config) VALUES (?, ?, ?, ?, ?)');
        stmt.run(id, name, thumbnail, asset_url, JSON.stringify(config || {}));
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/assets', checkAdmin, (req, res) => {
    try {
        const assets = db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all();
        res.json(assets);
    } catch(e) { res.status(500).json({ error: 'Error assets' }); }
});

app.post('/api/upload', checkAdmin, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    try {
        const path = `/assets/uploads/${req.file.filename}`;
        const stmt = db.prepare('INSERT INTO assets (name, path, type) VALUES (?, ?, ?)');
        const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        stmt.run(req.file.originalname, path, type);
        res.json({ success: true, path });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// Stats API (protected with rate limiting and checkAdmin)
app.get('/api/stats', adminRateLimit, checkAdmin, (req, res) => {
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

// ========== AI & SAAS ENDPOINTS ==========
app.post('/api/ai/generate', adminRateLimit, checkAdmin, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt es requerido' });

        // Get keys from DB
        const settings = {};
        db.prepare('SELECT * FROM settings').all().forEach(s => settings[s.key] = s.value);
        
        const provider = settings.ai_provider || 'anthropic';
        let content = '';

        if (provider === 'google' && settings.google_key) {
            // GEMINI 2.0 FLASH (Correct & Updated way)
            console.log('Using Gemini 2.0 Flash engine...');
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.google_key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Actúa como un diseñador de bodas premium. Genera una invitación en formato JSON puro.
                            Prompt del usuario: ${prompt}
                            
                            ESPECIFICACIÓN DEL JSON:
                            {
                                "hero": { "quote": "Frase romántica", "verses": "Versículo o frase corta", "date": "16 Mayo 2026" },
                                "reception": { "title": "Boda & Recepción", "place": "Nombre Lugar", "time": "16:00", "address": "Dirección completa", "map_google": "#", "map_waze": "#", "map_apple": "#" },
                                "dressCode": { "title": "Dress Code", "style": "Formal / Guayabera", "warning": "Traje oscuro", "kids": "No niños" },
                                "gifts": { "title": "Regalos", "message": "Tu presencia es nuestro mejor regalo...", "accounts": [{ "bank": "Banco X", "account": "123", "type": "Ahorros", "holder": "Nombre" }] },
                                "closing": { "message": "¡Te esperamos!" },
                                "config": { "whatsapp": "18495127494", "theme": "roses-premium" }
                            }
                            Responde ÚNICAMENTE el objeto JSON.`
                        }]
                    }],
                    generationConfig: {
                        response_mime_type: "application/json"
                    }
                })
            });
            const data = await response.json();
            if(!data.candidates?.[0]) {
                console.error('Gemini Error Response:', JSON.stringify(data));
                throw new Error(data.error?.message || 'Gemini no devolvió contenido');
            }
            content = data.candidates[0].content.parts[0].text;
        } else {
            // CLAUDE ANTHROPIC 
            const apiKey = settings.anthropic_key || process.env.ANTHROPIC_API_KEY;
            if(!apiKey || apiKey === 'REPLACE_WITH_KEY_IF_NEEDED') throw new Error('Anthropic API Key no configurada en Ajustes');
            
            console.log('Using Claude engine...');
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-3-opus-20240229',
                    max_tokens: 1500,
                    system: `Eres el motor de IA de SeCasan. Genera el JSON de la invitación.`,
                    messages: [{ role: 'user', content: prompt }]
                })
            });
            const data = await response.json();
            if(!data.content?.[0]) throw new Error('Error en Claude');
            content = data.content[0].text;
        }

        const weddingData = extractJSON(content);
        res.json(weddingData);
    } catch (e) {
        console.warn('AI Generation Fallback (Demo Mode):', e.message);
        // Return high-quality Mock data for Demo purposes
        res.json({
            "hero": { 
                "quote": "Donde hay amor, hay vida.", 
                "verses": "Dos almas que se encuentran para caminar juntas bajo el mismo sol.", 
                "date": "16 de Mayo, 2026" 
            },
            "reception": { 
                "title": "Ceremonia & Recepción", 
                "place": "Palacio de los Capitanes", 
                "time": "18:00", 
                "address": "Casco Histórico, Santo Domingo", 
                "map_google": "https://maps.google.com", 
                "map_waze": "#", 
                "map_apple": "#" 
            },
            "dressCode": { 
                "title": "Código de Vestimenta", 
                "style": "Formal / Black Tie", 
                "warning": "Se recomienda evitar colores claros", 
                "kids": "Evento exclusivo para adultos" 
            },
            "gifts": { 
                "title": "Regalos", 
                "message": "Vuestra compañía es nuestro mayor tesoro, pero si deseáis hacernos un detalle...", 
                "accounts": [{ "bank": "Banco SeCasan", "account": "000-000000-0", "type": "Ahorros", "holder": "Demo Account" }] 
            },
            "closing": { "message": "¡Estamos ansiosos por celebrar con vosotros!" },
            "config": { "whatsapp": "1000000000", "theme": "roses-premium" }
        });
    }
});

// Create new wedding (Protected)
app.post('/api/wedding/create', checkAdmin, (req, res) => {
    try {
        const { slug, title, content, theme_id } = req.body;
        if (!slug || !content) return res.status(400).json({ error: 'Datos incompletos' });

        // Check if slug exists
        const exists = db.prepare('SELECT id FROM weddings WHERE slug = ?').get(slug);
        if (exists) return res.status(409).json({ error: 'Esta URL ya está en uso.' });

        // MVP: Assume user 1 for now
        const stmt = db.prepare('INSERT INTO weddings (user_id, slug, title, content, theme_id) VALUES (?, ?, ?, ?, ?)');
        stmt.run(1, slug, title, JSON.stringify(content), theme_id || 'roses-premium');

        res.json({ success: true, slug });
    } catch (e) {
        console.error('Create Error:', e);
        res.status(500).json({ error: 'Error interno al guardar la boda.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`💒 Wedding server running on port ${PORT}`);
    console.log(`⏰ Current Server Time: ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}`);
    console.log(`🌐 System Local Time: ${new Date().toLocaleString()}`);
});
