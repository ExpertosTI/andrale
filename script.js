/* ========================================================
   WEDDING INVITATION — SCRIPT PRINCIPAL
   Andreína & Alejandro — 16 Mayo 2026
   ======================================================== */

// ─── CANVAS & PARTICLES ────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const progressBar = document.getElementById('scroll-progress');
const motionScrubVideo = document.getElementById('motion-scrub-video');
const heroLogoImg = document.getElementById('hero-logo-img');
const sections = document.querySelectorAll('.section');

let particles = [];
let targetScroll = 0;
let currentScroll = 0;
let experienceStarted = true; // immediate

// ─── PRELOADER & VIDEO BLOB ──────────────────────────────────────────────────
const preloader = document.getElementById('preloader');
const loaderProgress = document.getElementById('loader-progress');
const loaderText = document.getElementById('loader-text');

/**
 * Advanced Asset Loading: Fetching video as Blob to prevent
 * range-request blocking and cancellations in high-scrub environments.
 */
async function loadVideoAsBlob() {
    const videoUrl = 'assets/rosas-fondo.mp4';
    try {
        const response = await fetch(videoUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');
        
        let receivedLength = 0;
        let chunks = [];
        
        while(true) {
            const {done, value} = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedLength += value.length;
            
            // Update UI
            if (contentLength && loaderProgress) {
                const percent = Math.round((receivedLength / contentLength) * 100);
                loaderProgress.style.width = `${percent}%`;
                if (loaderText) loaderText.innerText = `RECOLECTANDO PÉTALOS... ${percent}%`;
            }
        }

        const blob = new Blob(chunks);
        const objectUrl = URL.createObjectURL(blob);
        
        if (motionScrubVideo) {
            motionScrubVideo.src = objectUrl;
            // Wait for metadata/first frame
            motionScrubVideo.addEventListener('loadeddata', () => {
                if (loaderText) loaderText.innerText = "¡TODO LISTO!";
                setTimeout(revealInvitation, 800);
            }, { once: true });
        }
    } catch (error) {
        console.error('Video load failed:', error);
        // Fallback for direct loading if fetch fails
        if (motionScrubVideo) {
            motionScrubVideo.src = videoUrl;
            setTimeout(revealInvitation, 1000);
        }
    }
}

function revealInvitation() {
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            // Start micro-animations
            document.body.classList.remove('loading');
        }, 800);
    }
}

// Start loading process
if (preloader) {
    loadVideoAsBlob();
}

// ─── CANVAS RESIZE ────────────────────────────────────────────────────────
const resizeCanvas = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
window.addEventListener('resize', resizeCanvas, { passive: true });
resizeCanvas();

// ─── PETAL PARTICLES ─────────────────────────────────────────────────────
const petalImages = [new Image(), new Image(), new Image()];
petalImages[0].src = 'assets/Recurso 7.png';
petalImages[1].src = 'assets/Recurso 2.png';
petalImages[2].src = 'assets/Recurso 1.png';

class Particle {
    constructor(isBurst = false) { 
        this.isBurst = isBurst;
        this.reset(true); 
    }

    reset(initial = false) {
        this.x = Math.random() * (canvas ? canvas.width : 400);
        this.y = initial
            ? Math.random() * (canvas ? canvas.height : 800)
            : -60;
        this.img = petalImages[Math.floor(Math.random() * petalImages.length)];
        this.size = Math.random() * 18 + 8;
        if (Math.random() > 0.85) this.size *= 1.4;
        this.depth = Math.random() * 0.7 + 0.3;
        this.opacity = Math.random() * 0.5 + 0.15;
        if (this.isBurst) {
            this.opacity = Math.random() * 0.4 + 0.6; // Brighter burst particles
            // Spawn them slightly below to float up or above
        }
        this.offsetY = Math.random() * 50 - 25;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = Math.random() * 1.2 + 0.4;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.04;
    }

    update() {
        const scrollDelta = targetScroll - currentScroll;
        const scrollVelocity = Math.abs(scrollDelta);
        const flutter = Math.sin(Date.now() * 0.0015 + this.offsetY) * 1.0;
        this.x += (flutter + this.vx) * (1 + scrollVelocity * 0.08 * this.depth);
        this.y -= scrollDelta * 0.012 * this.depth;
        this.y += (0.5 * this.depth + this.vy);
        this.angle += this.spin * (1 + scrollVelocity * 0.05);

        if (this.isBurst) {
            this.opacity -= 0.015; // Smooth fade out
            if (this.opacity <= 0) this.dead = true;
        }

        if (this.y > canvas.height + 80) this.y = -80;
        if (this.y < -80) this.y = canvas.height + 80;
        if (this.x < -80) this.x = canvas.width + 80;
        if (this.x > canvas.width + 80) this.x = -80;
    }

    draw() {
        if (!ctx || !this.img.complete || this.img.naturalWidth === 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

const initParticles = () => {
    particles = [];
    const count = window.innerWidth < 600 ? 100 : 180;
    for (let i = 0; i < count; i++) particles.push(new Particle());
};

// ─── IMMERSIVE TEXT ──────────────────────────────────────────────────────
const prepareImmersiveText = () => {
    document.querySelectorAll('[data-immersive-text]').forEach(element => {
        if (element.dataset.textPrepared === 'true') return;
        const tokens = element.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        let charIdx = 0;
        tokens.forEach(token => {
            if (!token) return;
            if (/^\s+$/.test(token)) {
                fragment.appendChild(document.createTextNode(token));
                return;
            }
            const word = document.createElement('span');
            word.className = 'text-word';
            [...token].forEach(char => {
                const span = document.createElement('span');
                span.className = 'text-char';
                span.textContent = char;
                span.style.setProperty('--char-index', charIdx++);
                word.appendChild(span);
            });
            fragment.appendChild(word);
        });
        element.textContent = '';
        element.appendChild(fragment);
        element.dataset.textPrepared = 'true';
    });
};

// ─── COUNTDOWN ───────────────────────────────────────────────────────────
const targetDate = new Date('2026-05-16T16:00:00').getTime();
const updateCountdown = () => {
    const dist = targetDate - Date.now();
    if (dist < 0) return;
    const d = document.getElementById('cd-days');
    const h = document.getElementById('cd-hours');
    const m = document.getElementById('cd-mins');
    const s = document.getElementById('cd-secs');
    if (d) d.innerText = Math.floor(dist / 86400000).toString().padStart(2, '0');
    if (h) h.innerText = Math.floor((dist % 86400000) / 3600000).toString().padStart(2, '0');
    if (m) m.innerText = Math.floor((dist % 3600000) / 60000).toString().padStart(2, '0');
    if (s) s.innerText = Math.floor((dist % 60000) / 1000).toString().padStart(2, '0');
};
setInterval(updateCountdown, 1000);
updateCountdown();

// ─── MAIN ANIMATE LOOP ───────────────────────────────────────────────────
const animate = () => {
    let scrollDeltaValue = targetScroll - currentScroll;
    currentScroll += scrollDeltaValue * 0.1;

    // Burst particles on fast scroll
    let velocity = Math.abs(scrollDeltaValue);
    if (velocity > 15 && particles.length < 350 && Math.random() > 0.4) {
        let p = new Particle(true); // isBurst = true
        p.y = scrollDeltaValue > 0 ? (canvas ? canvas.height + 20 : 800) : -20;
        particles.push(p);
    }
    // Clean dead particles
    particles = particles.filter(p => !p.dead);

    // Define virtual height for fixed sections scrolljacking bounds
    if (!window.scrollAreaSetup) {
        const main = document.getElementById('main-content');
        if (main) {
            main.style.height = `${100 + (sections.length * 130)}vh`;
        }
        window.scrollAreaSetup = true;
    }

    // Draw particles
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
    }

    const vh = window.innerHeight;
    const scrollMax = Math.max(1, document.documentElement.scrollHeight - vh);

    // ── Progress bar
    if (progressBar) {
        progressBar.style.width = `${Math.min(100, (currentScroll / scrollMax) * 100)}%`;
    }

    // ── Video scrub
    if (motionScrubVideo && motionScrubVideo.readyState >= 1) {
        motionScrubVideo.style.opacity = 1;
        const ratio = currentScroll / scrollMax;
        const t = ratio * (motionScrubVideo.duration - 0.05);
        
        // Only update if difference is meaningful to prevent flickering
        if (Math.abs(motionScrubVideo.currentTime - t) > 0.016) {
            motionScrubVideo.currentTime = t;
        }
        motionScrubVideo.style.transform = `translate(-50%, -50%) translateZ(0) scale(${1 + ratio * 0.08})`;
    }

    // ── Scroll hint
    const scrollHint = document.getElementById('initial-scroll-prompt');
    if (scrollHint) {
        scrollHint.style.opacity = currentScroll > 40 ? '0' : '1';
    }

    // ── HERO LOGO: fades to ZERO by 45% of vh scroll
    const whiteLogoOpacity = Math.max(0, 1 - (currentScroll / (vh * 0.45)));
    const logoScale   = 0.88 + whiteLogoOpacity * 0.12; // 0.88 → 1.0
    
    if (heroLogoImg) {
        heroLogoImg.style.opacity   = whiteLogoOpacity;
        heroLogoImg.style.transform = `scale(${logoScale})`;
    }
    
    // ── HERO VERSE: bell curve, fully gone by 95% of vh scroll
    //   starts at 10% → peaks at 50% → ends at 95%
    const vS = vh * 0.10, vE = vh * 0.95;
    let verseOpacity = 0;
    if (currentScroll >= vS && currentScroll <= vE) {
        verseOpacity = Math.sin(((currentScroll - vS) / (vE - vS)) * Math.PI);
    }

    const heroOverlay = document.getElementById('hero-overlay');
    const sep   = document.getElementById('hero-separator');
    const verse = document.getElementById('data-hero-verse');
    const book  = document.getElementById('data-hero-verse-book');
    const date  = document.getElementById('data-hero-date');

    const heroVisible = whiteLogoOpacity > 0 || verseOpacity > 0.01;
    if (heroOverlay) heroOverlay.classList.toggle('is-visible', heroVisible);

    if (sep)   sep.style.opacity   = verseOpacity;
    if (date)  date.style.opacity  = verseOpacity;
    if (book)  book.style.opacity  = verseOpacity;

    // Verse text: use is-visible class so text-chars reveal via CSS
    if (verse) {
        if (verseOpacity > 0.05) {
            verse.classList.add('is-visible');
            verse.style.opacity = verseOpacity;
        } else {
            verse.classList.remove('is-visible');
            verse.style.opacity = '0';
        }
    }

    // ── SECTIONS: scale in from center, scale out when leaving
    // Hero is completely gone at scroll = vh * 0.95
    // Sections should only activate AFTER hero elements have disappeared
    const heroAllGone = currentScroll > vh * 0.92;

    sections.forEach((sec, index) => {
        // Hero verse finishes completely around 0.95vh. Leave a gap.
        const heroClearBuffer = vh * 1.1; 
        const start = heroClearBuffer + (index * vh * 1.3);
        const end = start + vh * 1.15; // Active window length

        let shouldActivate = currentScroll > start && currentScroll < end;

        if (shouldActivate) {
            if (!sec.classList.contains('active')) {
                sec.classList.add('active', 'is-active');
                // Stagger children reveals
                sec.querySelectorAll('.fade-in-text').forEach((el, i) => {
                    setTimeout(() => el.classList.add('is-visible'), i * 90 + 100);
                });
                sec.querySelectorAll('[data-immersive-text]').forEach(el => {
                    setTimeout(() => el.classList.add('is-visible'), 200);
                });
            }
        } else {
            // Exit: section scrolled outside view (up or down)
            if (sec.classList.contains('active')) {
                sec.classList.remove('active', 'is-active');
                sec.querySelectorAll('.fade-in-text').forEach(el => el.classList.remove('is-visible'));
                sec.querySelectorAll('[data-immersive-text]').forEach(el => el.classList.remove('is-visible'));
            }
        }
    });

    requestAnimationFrame(animate);
};

// ─── SCROLL LISTENER ─────────────────────────────────────────────────────
window.addEventListener('scroll', () => { targetScroll = window.scrollY; }, { passive: true });

// ─── CLIPBOARD / TOAST ───────────────────────────────────────────────────
window.copyToClipboard = (text, bankName) => {
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.innerText = `✓ Copiado: ${bankName}`;
        toast.classList.add('is-active');
        setTimeout(() => toast.classList.remove('is-active'), 2500);
    });
};

// ─── RSVP MODAL ─────────────────────────────────────────────────────────
window.openRsvpModal = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    const modal = document.getElementById('rsvp-modal');
    if (modal) {
        modal.classList.add('is-open');
        if (window.lucide) window.lucide.createIcons();
    }
};

window.closeRsvpModal = () => {
    const modal = document.getElementById('rsvp-modal');
    if (modal) modal.classList.remove('is-open');
};

window.submitRsvp = () => {
    const nameEl    = document.getElementById('rsvp-name');
    const guestsEl  = document.getElementById('rsvp-guests');
    const messageEl = document.getElementById('rsvp-message');

    if (!nameEl || !nameEl.value.trim()) {
        nameEl.style.borderColor = 'var(--accent-gold)';
        nameEl.focus();
        return;
    }

    const name    = nameEl.value.trim();
    const guests  = guestsEl ? (guestsEl.value || 1) : 1;
    const message = messageEl ? messageEl.value.trim() : '';

    const WA_NUMBER = '18495127494';
    const text = `¡Hola! Confirmo mi asistencia a la boda ✨%0A%0A*Nombre:* ${name}%0A*Acompañantes:* ${guests}${message ? `%0A*Mensaje:* ${message}` : ''}`;

    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, '_blank');

    const formWrap  = document.getElementById('rsvp-form-wrap');
    const successEl = document.getElementById('rsvp-success');
    if (formWrap)  formWrap.style.display  = 'none';
    if (successEl) successEl.style.display = 'block';
    if (window.lucide) window.lucide.createIcons();
};

// ─── BOOT ────────────────────────────────────────────────────────────────
initParticles();
animate();
