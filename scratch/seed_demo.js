const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'wedding.db'));

const demoContent = {
    "hero": { 
        "quote": "El amor es el puente entre dos corazones.", 
        "verses": "Hoy comenzamos una nueva historia, escrita con la tinta de nuestra complicidad.", 
        "date": "24 de Diciembre, 2026" 
    },
    "reception": { 
        "title": "Nuestra Unión", 
        "place": "Jardines del Alcázar", 
        "time": "17:30", 
        "address": "Calle Las Damas, Santo Domingo", 
        "map_google": "https://maps.google.com", 
    },
    "dressCode": { 
        "title": "Dress Code", 
        "style": "Semi-Formal", 
        "warning": "Zapatos cómodos para jardín", 
        "kids": "Niños bienvenidos" 
    },
    "gifts": { 
        "title": "Sobre de Regalo", 
        "message": "Vuestra presencia es lo más importante. Si deseáis hacernos un presente...", 
        "accounts": [{ "bank": "Banco Demo", "account": "12345678", "type": "Corriente", "holder": "SeCasan Demo" }] 
    },
    "closing": { "message": "¡Nos vemos pronto!" },
    "config": { "whatsapp": "1000000000", "theme": "roses-premium" }
};

try {
    // Ensure User 1 exists
    db.prepare("INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(1, 'demo@secasan.app', 'demo');
    
    // Insert demo wedding
    const stmt = db.prepare('INSERT OR REPLACE INTO weddings (user_id, slug, title, content, theme_id, status) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(1, 'demo-boda', 'Boda Demo Premium', JSON.stringify(demoContent), 'roses-premium', 'published');
    
    console.log('✅ Demo wedding seeded at /v/demo-boda');
} catch (e) {
    console.error('❌ Error seeding demo:', e.message);
} finally {
    db.close();
}
