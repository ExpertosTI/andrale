const canvas = document.getElementById('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const progressBar = document.getElementById('scroll-progress');

const sections = document.querySelectorAll('.section');
const rootStyle = document.documentElement.style;

const bgVideo = document.getElementById('bg-video');
const introVideoScrub = document.getElementById('intro-scrub-video');
const introVideoWrap = document.getElementById('intro-video-wrap');
const entranceOverlay = document.getElementById('entrance-overlay');

let particles = [];
const particleCount = 450; // High-density premium Gold Dust
let introTypingStarted = false;
let experienceStarted = false;

if (!canvas || !ctx) {
    console.warn('Canvas or Context not found. Particles disabled.');
}

const resizeCanvas = () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        // Gold Dust: Tiny, shimmering glints
        this.size = Math.random() * 1.8 + 0.4; 
        this.depth = Math.random() * 0.9 + 0.1;
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * (canvas.height + 100) : -20;
        
        this.vx = (Math.random() * 0.12 - 0.06) * this.depth;
        this.vy = (Math.random() * 0.35 + 0.1) * this.depth;
        
        this.baseOpacity = Math.random() * 0.45 + 0.15;
        this.opacity = this.baseOpacity;
        this.shimmerSpeed = Math.random() * 0.12 + 0.04;
        this.shimmerPhase = Math.random() * Math.PI * 2;
        this.color = Math.random() > 0.5 ? '#fcf6ba' : '#d4af37'; // Lighter and darker gold
    }

    update() {
        this.y += this.vy;
        this.x += this.vx;

        // Premium Shimmer: Rapid flickering
        this.shimmerPhase += this.shimmerSpeed;
        this.opacity = this.baseOpacity + Math.sin(this.shimmerPhase) * 0.25;

        if (this.y > canvas.height + 20) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const opacity = Math.max(0, this.opacity);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = opacity;
        
        // Draw tiny spark
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Optional lens-flare like glint for larger particles
        if (this.size > 1.4) {
             ctx.fillStyle = '#fff';
             ctx.globalAlpha = opacity * 0.6;
             ctx.fillRect(-this.size * 2, -0.5, this.size * 4, 1);
             ctx.fillRect(-0.5, -this.size * 2, 1, this.size * 4);
        }

        ctx.restore();
    }
}

const initParticles = () => {
    particles = [];
    for (let i = 0; i < particleCount; i += 1) {
        particles.push(new Particle());
    }
};

const animateParticles = () => {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => {
        particle.update();
        particle.draw();
    });
    requestAnimationFrame(animateParticles);
};

const syncProgress = () => {
    if (!experienceStarted) return;

    const scroll = window.scrollY;
    const vh = window.innerHeight;
    const scrollMax = document.documentElement.scrollHeight - vh;
    
    // 1. Progress Bar
    if (progressBar) {
        const progress = scrollMax > 0 ? (scroll / scrollMax) * 100 : 0;
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    // 2. Dual Video Scrubbing
    // Intro Scrubbing: Controlled in the first 1.2 Viewports (Hero area)
    const introZone = vh * 1.5;
    if (scroll < introZone) {
        if (introVideoScrub && !isNaN(introVideoScrub.duration)) {
            const introRatio = scroll / introZone;
            introVideoScrub.currentTime = introRatio * (introVideoScrub.duration - 0.1);
            introVideoScrub.classList.add('is-visible');
        }
        if (bgVideo) bgVideo.classList.remove('is-visible');
    } else {
        // Main Background Scrubbing: Rest of the page
        if (bgVideo && !isNaN(bgVideo.duration)) {
            const bgRatio = (scroll - introZone) / (scrollMax - introZone);
            bgVideo.currentTime = bgRatio * (bgVideo.duration - 0.1);
            bgVideo.classList.add('is-visible');
        }
        if (introVideoScrub) introVideoScrub.classList.remove('is-visible');
    }

    // 3. Reveal Logic (Sections)
    sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const vCenter = vh / 2;
        const dist = (center - vCenter) / (vh * 0.7);
        const absDist = Math.abs(dist);
        
        if (absDist < 1.2) {
            const opacity = Math.max(0, 1 - Math.pow(absDist, 1.8));
            const scale = 0.92 + (0.08 * opacity);
            const translateY = dist * 50;
            
            section.style.opacity = opacity;
            section.style.transform = `scale(${scale}) translateY(${translateY}px)`;
            section.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';
            
            if (opacity > 0.5) setSectionTextState(section, true);
            else if (opacity < 0.1) setSectionTextState(section, false);
        } else {
            section.style.opacity = '0';
        }
    });

    rootStyle.setProperty('--scroll-ratio', scroll / vh);
};

const prepareImmersiveText = () => {
    document.querySelectorAll('[data-immersive-text]').forEach((element) => {
        if (element.dataset.textPrepared === 'true') return;
        const tokens = element.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        let charIndex = 0;
        tokens.forEach((token) => {
            if (!token) return;
            if (/^\s+$/.test(token)) { fragment.appendChild(document.createTextNode(token)); return; }
            const word = document.createElement('span'); word.className = 'text-word';
            [...token].forEach((char) => {
                const span = document.createElement('span');
                span.className = 'text-char'; span.textContent = char;
                span.style.setProperty('--char-index', charIndex);
                span.style.setProperty('--char-shift', Math.random().toFixed(3));
                span.style.setProperty('--char-rise', Math.random().toFixed(3));
                span.style.setProperty('--char-spin', Math.random().toFixed(3));
                word.appendChild(span); charIndex += 1;
            });
            fragment.appendChild(word);
        });
        element.textContent = ''; element.appendChild(fragment);
        element.classList.add('immersive-text');
        element.dataset.textPrepared = 'true';
    });
};

const setSectionTextState = (section, isVisible) => {
    section.querySelectorAll('[data-immersive-text]').forEach((target) => {
        target.classList.toggle('is-visible', isVisible);
    });
};

const playIntroTyping = () => {
    if (introTypingStarted) return;
    introTypingStarted = true;
    const targets = document.querySelectorAll('[data-immersive-text="intro"]');
    let delay = 200;
    targets.forEach((target, tidx) => {
        const chars = target.querySelectorAll('.text-char');
        chars.forEach((char, cidx) => {
            setTimeout(() => char.classList.add('is-on'), delay + (cidx * 30));
        });
        delay += (chars.length * 30) + 400;
        setTimeout(() => target.classList.add('is-visible'), delay);
    });
};

const startExperience = () => {
    if (experienceStarted) return;
    experienceStarted = true;

    entranceOverlay.classList.add('is-hidden');
    // Instant Unlock: Don't let the user feel "stuck" for 1.5s
    document.body.classList.remove('locked');
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';

    // Transition Intro Wrap away
    if (introVideoWrap) {
        introVideoWrap.classList.add('is-active');
        setTimeout(() => {
            introVideoWrap.style.opacity = '0';
            setTimeout(() => introVideoWrap.style.display = 'none', 1600);
        }, 800);
    }
    
    playIntroTyping();
    syncProgress();
};

entranceOverlay.addEventListener('click', startExperience);
entranceOverlay.addEventListener('touchstart', startExperience, { passive: true });

initParticles();
animateParticles();
prepareImmersiveText();
syncProgress();

window.addEventListener('scroll', syncProgress, { passive: true });
window.addEventListener('resize', () => { resizeCanvas(); syncProgress(); });

const updateCountdown = () => {
    const weddingDate = new Date('June 21, 2026 20:00:00').getTime();
    const now = new Date().getTime();
    const distance = Math.max(0, weddingDate - now);
    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    const ids = ['days', 'hours', 'minutes', 'seconds'];
    [d, h, m, s].forEach((val, i) => {
        const el = document.getElementById(ids[i]);
        if (el) el.innerText = val.toString().padStart(2, '0');
    });
};
setInterval(updateCountdown, 1000);
updateCountdown();

window.copyToClipboard = (text, bankName) => {
    navigator.clipboard.writeText(text)
        .then(() => {
            const toast = document.getElementById('toast');
            if (!toast) return;
            toast.innerText = `Copiado: Cuenta ${bankName}`;
            toast.classList.add('is-active');
            setTimeout(() => toast.classList.remove('is-active'), 2500);
        });
};
