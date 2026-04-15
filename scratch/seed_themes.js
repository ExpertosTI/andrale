const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'data', 'wedding.db'));

const themeList = [
    { id: 'roses-premium', name: 'Rosas Premium', thumb: '/assets/roses_thumb.png' },
    { id: 'silk-modern', name: 'Seda Moderna', thumb: '/assets/silk_thumb.png' },
    { id: 'gold-royal', name: 'Oro Real', thumb: '/assets/gold_thumb.png' },
    { id: 'beach-sunset', name: 'Atardecer Playa', thumb: 'https://images.unsplash.com/photo-1544124499-58912cbddaa3?auto=format&fit=crop&w=300&q=80' },
    { id: 'forest-ethereal', name: 'Bosque Etéreo', thumb: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=300&q=80' },
    { id: 'urban-loft', name: 'Loft Urbano', thumb: 'https://images.unsplash.com/photo-1522158634188-fb366113b28b?auto=format&fit=crop&w=300&q=80' },
    { id: 'vintage-wine', name: 'Vintage Rose', thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80' },
    { id: 'boho-chic', name: 'Boho Chic', thumb: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=300&q=80' },
    { id: 'midnight-star', name: 'Noche de Estrellas', thumb: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=300&q=80' }
];

// Append variations to reach 27
const variations = [
    'Arctic Pearl', 'Desert Bloom', 'Mansion Gala', 'Vineyard Love', 'Garden Party', 
    'Minimal Zen', 'High Sky', 'Emerald Coast', 'Castle Romance', 'Retro Glam',
    'Sailing Love', 'Autumn Embers', 'Spring Rebirth', 'Industrial Chic', 'Mountain Summit',
    'Velvet Night', 'Sapphire Lake', 'Diamond Stardust'
];

variations.forEach((name, i) => {
    themeList.push({
        id: `theme-var-${i}`,
        name: name,
        thumb: `https://picsum.photos/seed/wedding${i}/300/200`
    });
});

db.exec(`CREATE TABLE IF NOT EXISTS themes (id TEXT PRIMARY KEY, name TEXT NOT NULL, thumbnail TEXT, asset_url TEXT, config JSON DEFAULT '{}', is_premium INTEGER DEFAULT 1)`);

const stmt = db.prepare('INSERT OR REPLACE INTO themes (id, name, thumbnail) VALUES (?, ?, ?)');
themeList.forEach(t => stmt.run(t.id, t.name, t.thumb));

console.log(`✅ Marketplace expanded: ${themeList.length} themes available in the database.`);
