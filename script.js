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
const particleCount = 450; 
let experienceStarted = false;
let targetScroll = 0;
let currentScroll = 0;

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
        this.size = Math.random() * 1.5 + 0.4; 
        this.depth = Math.random() * 0.9 + 0.1;
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * (canvas.height + 100) : -20;
        
        this.vx = (Math.random() * 0.1 - 0.05) * this.depth;
        this.vy = (Math.random() * 0.3 + 0.1) * this.depth;
        
        this.baseOpacity = Math.random() * 0.4 + 0.15;
        this.opacity = this.baseOpacity;
        this.shimmerSpeed = Math.random() * 0.1 + 0.04;
        this.shimmerPhase = Math.random() * Math.PI * 2;
        this.color = Math.random() > 0.6 ? '#fcf6ba' : '#d4af37'; 
    }

    update() {
        this.y += this.vy;
        this.x += this.vx;
        this.shimmerPhase += this.shimmerSpeed;
        this.opacity = this.baseOpacity + Math.sin(this.shimmerPhase) * 0.2;

        if (this.y > canvas.height + 20) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const initParticles = () => {
    particles = [];
    for (let i = 0; i < particleCount; i += 1) {
        particles.push(new Particle());
    }
};

const animate = () => {
    if (!ctx || !canvas) return;
    
    // Smooth Scroll Interpolation (Easing)
    currentScroll += (targetScroll - currentScroll) * 0.1;
    
    // 1. Draw Particles
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => { p.update(); p.draw(); });

    // 2. Cinematic Video Scrubbing
    if (experienceStarted) {
        const vh = window.innerHeight;
        const scrollMax = document.documentElement.scrollHeight - vh;
        
        // Progress Bar update (Smooth)
        if (progressBar) {
            const progress = (currentScroll / scrollMax) * 100;
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        // DUAL TIMELINE SCRUBBING
        const introZone = vh * 1.5;
        
        if (currentScroll < introZone) {
            // Hero Intro Scrubbing
            if (introVideoScrub && !isNaN(introVideoScrub.duration)) {
                const ratio = currentScroll / introZone;
                introVideoScrub.currentTime = ratio * (introVideoScrub.duration - 0.05);
                introVideoScrub.classList.add('is-visible');
            }
            if (bgVideo) bgVideo.classList.remove('is-visible');
        } else {
            // Main Content Scrubbing
            if (bgVideo && !isNaN(bgVideo.duration)) {
                const bgRatio = (currentScroll - introZone) / (scrollMax - introZone);
                bgVideo.currentTime = bgRatio * (bgVideo.duration - 0.05);
                bgVideo.classList.add('is-visible');
            }
            if (introVideoScrub) introVideoScrub.classList.remove('is-visible');
        }

        // 3. Section Reveal State
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const dist = (center - vh / 2) / (vh * 0.7);
            const absDist = Math.abs(dist);
            
            if (absDist < 1.2) {
                const opacity = Math.max(0, 1 - Math.pow(absDist, 1.8));
                const scale = 0.94 + (0.06 * opacity);
                section.style.opacity = opacity;
                section.style.transform = `scale(${scale}) translateY(${dist * 40}px)`;
                section.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';
                section.querySelectorAll('[data-immersive-text]').forEach(t => t.classList.toggle('is-visible', opacity > 0.5));
            } else {
                section.style.opacity = '0';
            }
        });
    }

    requestAnimationFrame(animate);
};

const prepareImmersiveText = () => {
    document.querySelectorAll('[data-immersive-text]').forEach((element) => {
        if (element.dataset.textPrepared === 'true') return;
        const tokens = element.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        let charIdx = 0;
        tokens.forEach((token) => {
            if (!token) return;
            if (/^\s+$/.test(token)) { fragment.appendChild(document.createTextNode(token)); return; }
            const word = document.createElement('span'); word.className = 'text-word';
            [...token].forEach((char) => {
                const span = document.createElement('span'); span.className = 'text-char';
                span.textContent = char; span.style.setProperty('--char-index', charIdx++);
                word.appendChild(span);
            });
            fragment.appendChild(word);
        });
        element.textContent = ''; element.appendChild(fragment);
        element.dataset.textPrepared = 'true';
    });
};

const playIntroTyping = () => {
    document.querySelectorAll('[data-immersive-text="intro"]').forEach((target, tidx) => {
        const chars = target.querySelectorAll('.text-char');
        chars.forEach((char, cidx) => {
            setTimeout(() => char.classList.add('is-on'), (tidx * 800) + (cidx * 35));
        });
        setTimeout(() => target.classList.add('is-visible'), (tidx * 800) + (chars.length * 35) + 300);
    });
};

const startExperience = () => {
    if (experienceStarted) return;
    experienceStarted = true;

    entranceOverlay.classList.add('is-hidden');
    document.body.classList.remove('locked');
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    
    // Kickstart videos (pre-loading)
    if (introVideoScrub) introVideoScrub.load();
    if (bgVideo) bgVideo.load();

    if (introVideoWrap) {
        introVideoWrap.classList.add('is-active');
        setTimeout(() => {
            introVideoWrap.style.opacity = '0';
            setTimeout(() => introVideoWrap.style.display = 'none', 1600);
        }, 1000);
    }
    
    playIntroTyping();
};

entranceOverlay.addEventListener('click', startExperience);
entranceOverlay.addEventListener('touchstart', startExperience, { passive: true });

window.addEventListener('scroll', () => { targetScroll = window.scrollY; }, { passive: true });

initParticles();
animate();
prepareImmersiveText();

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
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.innerText = `Copiado: Cuenta ${bankName}`;
            toast.classList.add('is-active');
            setTimeout(() => toast.classList.remove('is-active'), 2500);
        }
    });
};
