const weddingData = {
    hero: {
        names: "Michelle y Mike",
        date: "21 Junio 2026",
        verse: "\"Mejores son dos que uno... Porque si cayeren, el uno levantará a su compañero.\"",
        verse_book: "Eclesiastés 4:9-10"
    },
    reception: {
        title: "Recepción",
        place: "Distric event venue",
        time: "8:00 PM",
        address: "Frank Felix Miranda No. 5 naco, Sto.Dgo",
        map_google: "https://www.google.com/maps/search/?api=1&query=Frank+Felix+Miranda+No.+5+naco+Santo+Domingo",
        map_waze: "https://ul.waze.com/ul?ll=18.4719,-69.9333&navigate=yes",
        map_apple: "maps://?q=Frank+Felix+Miranda+No.+5+naco+Santo+Domingo"
    },
    dress_code: {
        title: "Código de vestimenta",
        style: "Formal",
        warning: "A nuestros invitados le pedimos que eviten ir de color rojo.",
        no_kids: "No niños"
    },
    gifts: {
        title: "Regalos",
        message: "Su presencia es lo más importante para nosotros. Si desea hacernos algún obsequio puede que de esta forma sea más cómodo.",
        accounts: [
            { bank: "BHD", number: "23054590023" },
            { bank: "Popular", number: "843559659" },
            { bank: "Banreservas", number: "9607216343" }
        ],
        holder_name: "Michelle Domínguez",
        holder_id: "402-2449863-0",
        closing_message: "Esperamos que puedan celebrar con nosotros nuestra unión, el amor incondicional y el compromiso."
    }
};

// Auto-populate HTML if elements exist
document.addEventListener('DOMContentLoaded', () => {
    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };

    // Hero
    setHtml('data-hero-names', weddingData.hero.names);
    setHtml('data-hero-verse', `${weddingData.hero.verse}<br><span>${weddingData.hero.verse_book}</span>`);
    setText('data-hero-date', weddingData.hero.date);

    // Reception
    setText('data-reception-title', weddingData.reception.title);
    setText('data-reception-place', weddingData.reception.place);
    setText('data-reception-time', weddingData.reception.time);
    setText('data-reception-address', weddingData.reception.address);

    // Dress Code
    setText('data-dress-title', weddingData.dress_code.title);
    setText('data-dress-style', weddingData.dress_code.style);
    setText('data-dress-warning', weddingData.dress_code.warning);
    setText('data-dress-kids', weddingData.dress_code.no_kids);

    // Gifts
    setText('data-gifts-title', weddingData.gifts.title);
    setText('data-gifts-message', weddingData.gifts.message);
    
    const accountsContainer = document.getElementById('data-gifts-accounts');
    if (accountsContainer) {
        accountsContainer.innerHTML = '';
        weddingData.gifts.accounts.forEach(acc => {
            accountsContainer.innerHTML += `
                <div class="account-item" onclick="copyToClipboard('${acc.number}', '${acc.bank}')">
                    <div class="bank-wrap"><span class="bank">${acc.bank}</span></div>
                    <span class="acc-num">${acc.number}</span>
                    <i data-lucide="copy" class="icon-copy"></i>
                </div>
            `;
        });
        if (window.lucide) window.lucide.createIcons();
    }

    setHtml('data-gifts-holder', `<strong>${weddingData.gifts.holder_name}</strong><br>Cédula: ${weddingData.gifts.holder_id}`);
    setText('data-closing-message', weddingData.gifts.closing_message);
});
