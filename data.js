const weddingData = {
    hero: {
        names: "Andreína & Alejandro",
        date: "16 Mayo 2026",
        verse: "\"Mejores son dos que uno... Porque si cayeren, el uno levantará a su compañero.\"",
        verse_book: "Eclesiastés 4:9-10"
    },
    reception: {
        title: "Boda Civil",
        place: "Plaza Roja",
        level: "Segundo Nivel",
        time: "4:00 PM",
        address: "Autopista de San Isidro, Plaza Roja Segundo Nivel, Santo Domingo Este",
        map_google: "https://www.google.com/maps/search/?api=1&query=18.496412,-69.797211",
        map_waze: "https://ul.waze.com/ul?ll=18.496412,-69.797211&navigate=yes",
        map_apple: "maps://?q=18.496412,-69.797211"
    },
    dress_code: {
        title: "Código de Vestimenta",
        style: "Formal",
        warning: "",
        no_kids: ""
    },
    gifts: {
        title: "Regalos",
        message: "Su presencia es lo más importante para nosotros. Si desea hacernos algún obsequio puede que de esta forma sea más cómodo.",
        accounts: [
            { bank: "Popular", number: "815442256", type: "Ahorros", holder: "Andreína Cuevas" },
            { bank: "Banreservas", number: "9608198982", type: "Ahorros", holder: "Alejandro Paula" }
        ],
        holder_name: "",
        holder_id: "",
        closing_message: "Esperamos que puedan celebrar con nosotros nuestra unión, el amor incondicional y el compromiso."
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };

    setHtml('data-hero-names', weddingData.hero.names);
    setText('data-hero-verse', weddingData.hero.verse);
    setText('data-hero-verse-book', weddingData.hero.verse_book);
    setText('data-hero-date', weddingData.hero.date);

    setText('data-reception-title', weddingData.reception.title);
    const placeText = weddingData.reception.level
        ? `${weddingData.reception.place} - ${weddingData.reception.level}`
        : weddingData.reception.place;
    setText('data-reception-place', placeText);
    setText('data-reception-time', weddingData.reception.time);
    setText('data-reception-address', weddingData.reception.address);

    setText('data-dress-title', weddingData.dress_code.title);
    setText('data-dress-style', weddingData.dress_code.style);

    setText('data-gifts-title', weddingData.gifts.title);
    setText('data-gifts-message', weddingData.gifts.message);
    
    const accountsContainer = document.getElementById('data-gifts-accounts');
    if (accountsContainer) {
        accountsContainer.innerHTML = '';
        weddingData.gifts.accounts.forEach(acc => {
            const displayText = acc.holder ? `${acc.bank} - ${acc.type} (${acc.holder})` : acc.bank;
            accountsContainer.innerHTML += `
                <div class="account-item" onclick="copyToClipboard('${acc.number}', '${acc.bank}')">
                    <div class="bank-wrap"><span class="bank">${displayText}</span></div>
                    <span class="acc-num">${acc.number}</span>
                    <i data-lucide="copy" class="icon-copy"></i>
                </div>
            `;
        });
        if (window.lucide) window.lucide.createIcons();
    }

    setText('data-closing-message', weddingData.gifts.closing_message);

    if (typeof prepareImmersiveText === 'function') {
        prepareImmersiveText();
    }
});
