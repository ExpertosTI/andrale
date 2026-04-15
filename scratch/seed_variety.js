const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'data', 'wedding.db'));

const weddings = [
    {
        slug: 'boda-playa',
        title: 'Sofía & Marco',
        theme: 'beach-sunset',
        content: {
            hero: { quote: "El mar como testigo de nuestro sí.", verses: "Bajo el sol del Caribe, unimos nuestros destinos.", date: "24 Julio 2026" },
            reception: { title: "Fiesta frente al Mar", place: "Club de Playa Coral", time: "17:30", address: "Playa Bávaro, Punta Cana" },
            dressCode: { title: "Día de Sol", style: "Guayabera / Cóctel de Playa", warning: "No se requiere calzado formal", kids: "Los niños son bienvenidos" },
            gifts: { title: "Lluvia de Sobres", message: "Lo más importante es vuestra presencia...", accounts: [{ bank: "BanReservas", account: "987-654-3210", holder: "Sofía & Marco" }] }
        }
    },
    {
        slug: 'boda-bosque',
        title: 'Elena & Daniel',
        theme: 'forest-ethereal',
        content: {
            hero: { quote: "Donde el musgo crece y el amor florece.", verses: "Bajo la cúpula de los pinos antiguos.", date: "12 Octubre 2026" },
            reception: { title: "Cena en el Claro", place: "Refugio del Roble", time: "16:00", address: "Valle de Constanza, RD" },
            dressCode: { title: "Bosque Chic", style: "Formal con zapatos cómodos", warning: "Llevar abrigo ligero", kids: "Solo adultos" },
            gifts: { title: "Mesa Real", message: "Preferimos vuestro abrazo, pero si queréis sumar a nuestro hogar...", accounts: [{ bank: "BHD León", account: "010-22345-00", holder: "Elena & Daniel" }] }
        }
    },
    {
        slug: 'boda-real',
        title: 'S.M. Isabel & Fernando',
        theme: 'gold-royal',
        content: {
            hero: { quote: "Unión de Reinos y Almas.", verses: "Por decreto del corazón y destino.", date: "02 Enero 2027" },
            reception: { title: "Banquete Real", place: "Salón de Embajadores", time: "20:00", address: "Casa de los Vitrales, Zona Colonial" },
            dressCode: { title: "Gala Rigurosa", style: "Black Tie / Smoking", warning: "Traje de gala", kids: "Noche de adultos" },
            gifts: { title: "Donaciones Beneficencia", message: "En lugar de regalos, agradeceríamos una donación a...", accounts: [{ bank: "Banco Central", account: "001-001-001", holder: "Fundación Amor" }] }
        }
    }
];

const stmt = db.prepare('INSERT OR REPLACE INTO weddings (user_id, slug, title, content, theme_id) VALUES (?, ?, ?, ?, ?)');
weddings.forEach(w => {
    stmt.run(1, w.slug, w.title, JSON.stringify(w.content), w.theme);
});

console.log("✅ 3 Variety Demos seeded: /v/boda-playa, /v/boda-bosque, /v/boda-real");
