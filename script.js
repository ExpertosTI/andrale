const canvas = document.getElementById('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const progressBar = document.getElementById('scroll-progress');

console.log('[LOG] Script initialized');

const sections = document.querySelectorAll('.section');
const rootStyle = document.documentElement.style;

const bgVideo = document.getElementById('bg-video');
const introVideoScrub = document.getElementById('intro-scrub-video');
const introVideoWrap = document.getElementById('intro-video-wrap');
const entranceOverlay = document.getElementById('entrance-overlay');

let particles = [];
const particleCount = 800; // Intensely dense gold dust for strong 'life' effect
let experienceStarted = false;
let targetScroll = 0;
let currentScroll = 0;

// LOGGING SYSTEM
const logger = (msg) => {
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
    console.log(`[INVITATION-LOG] [${timestamp}] ${msg}`);
};

// Pre-load monitoring
if (introVideoScrub) {
    introVideoScrub.addEventListener('loadstart', () => logger('Intro Video: Load Started'));
    introVideoScrub.addEventListener('loadedmetadata', () => logger(`Intro Video: Metadata Loaded (Duration: ${introVideoScrub.duration}s)`));
    introVideoScrub.addEventListener('canplaythrough', () => logger('Intro Video: Can Play Through (Ready)'));
}

if (bgVideo) {
    bgVideo.addEventListener('loadstart', () => logger('BG Video: Load Started'));
    bgVideo.addEventListener('loadedmetadata', () => logger(`BG Video: Metadata Loaded (Duration: ${bgVideo.duration}s)`));
    bgVideo.addEventListener('canplaythrough', () => logger('BG Video: Can Play Through (Ready)'));
}

window.addEventListener('load', () => logger('Window fully loaded (All assets ready)'));

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
        // Dust: Many small particles
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : (targetScroll > currentScroll ? canvas.height + 20 : -20);
        
        this.size = Math.random() * 1.5 + 0.5; // Smaller size for dust
        this.depth = Math.random() * 0.8 + 0.2;
        this.baseOpacity = Math.random() * 0.4 + 0.1;
        
        // Motion: light and fluid
        this.offsetY = Math.random() * 50 - 25;
        this.offsetX = Math.random() * 20 - 10;
        this.vx = (Math.random() - 0.5) * 0.15;
        this.vy = (Math.random() - 0.5) * 0.15;
        
        this.shimmerPhase = Math.random() * Math.PI * 2;
        this.color = Math.random() > 0.5 ? '#fcf6ba' : '#d4af37';
    }

    update() {
        // FLUID DUST FLOW: Particles follow scroll with slight lag
        const scrollDelta = targetScroll - currentScroll;
        
        // Fluid horizontal drifting
        this.x += Math.sin(currentScroll * 0.005 + this.offsetY) * 0.3 + this.vx;
        
        // Vertical viscous drag from scroll
        this.y -= scrollDelta * 0.015 * this.depth; 
        
        // Intrinsic slow float
        this.y -= 0.1 * this.depth + this.vy;

        this.shimmerPhase += 0.05;
        this.opacity = this.baseOpacity + Math.sin(this.shimmerPhase) * 0.25;

        // Wrap around smoothly
        if (this.y < -50) this.y = canvas.height + 50;
        if (this.y > canvas.height + 50) this.y = -50;
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.opacity);
        
        // Draw crisp circular dust
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const initParticles = () => {
    particles = [];
    // Dense dust, extremely high count for active life
    const count = window.innerWidth < 600 ? 550 : particleCount;
    for (let i = 0; i < count; i += 1) {
        particles.push(new Particle());
    }
};

const animate = () => {
    if (!ctx || !canvas) return;
    
    // Smooth Scroll fluid interpolation
    currentScroll += (targetScroll - currentScroll) * 0.08;
    
    // Draw Particles
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => { p.update(); p.draw(); });

    if (experienceStarted) {
        const vh = window.innerHeight;
        const scrollMax = document.documentElement.scrollHeight - vh;
        
        if (progressBar) {
            const progress = (currentScroll / scrollMax) * 100;
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        const introZone = vh * 1.4; // Slightly longer scroll for intro
        
        if (currentScroll < introZone) {
            if (introVideoScrub && !isNaN(introVideoScrub.duration)) {
                // Ensure bgVideo is hidden during intro seal
                if (bgVideo && bgVideo.classList.contains('is-visible')) bgVideo.classList.remove('is-visible');

                const ratio = Math.max(0, currentScroll / introZone);
                introVideoScrub.currentTime = ratio * (introVideoScrub.duration - 0.05);
                introVideoScrub.classList.add('is-visible');

                // Fixed Hero Overlay Logic: Appears between 60% and 130% of the introZone scroll
                const hero = document.getElementById('hero-overlay');
                if (hero) {
                    if (ratio > 0.6 && ratio < 1.3) {
                        hero.classList.add('is-visible');
                        hero.querySelectorAll('[data-immersive-text]').forEach(t => t.classList.add('is-visible'));
                        hero.querySelectorAll('.fade-in-text').forEach(t => t.classList.add('is-visible'));
                    } else {
                        hero.classList.remove('is-visible');
                        hero.querySelectorAll('[data-immersive-text]').forEach(t => t.classList.remove('is-visible'));
                        hero.querySelectorAll('.fade-in-text').forEach(t => t.classList.remove('is-visible'));
                    }
                }
            }
        } else {
            // Beyond introZone, show looping BG particles
            if (bgVideo) bgVideo.classList.add('is-visible');
            if (introVideoScrub) introVideoScrub.classList.remove('is-visible');
            
            // Ensure Hero is hidden
            const hero = document.getElementById('hero-overlay');
            if (hero) {
                hero.classList.remove('is-visible');
                hero.querySelectorAll('.is-visible').forEach(t => t.classList.remove('is-visible'));
            }
        }

        // Hide scroll prompt once user starts scrolling
        const scrollPrompt = document.getElementById('initial-scroll-prompt');
        if (scrollPrompt) {
            if (currentScroll > 50) scrollPrompt.classList.add('is-hidden');
            else scrollPrompt.classList.remove('is-hidden');
        }

        // Section Reveal logic (details, rules, gifts)
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const dist = (center - vh / 2) / (vh * 0.75);
            const absDist = Math.abs(dist);
            
            if (absDist < 1.3) {
                const opacity = Math.max(0, 1 - Math.pow(absDist, 1.8));
                const scale = 0.94 + (0.06 * opacity);
                section.style.opacity = opacity;
                section.style.transform = `scale(${scale}) translateY(${dist * 40}px)`;
                section.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';
                
                // Reveal immersive and standard fade-in texts inside section
                section.querySelectorAll('[data-immersive-text]').forEach(t => t.classList.toggle('is-visible', opacity > 0.5));
                section.querySelectorAll('.fade-in-text').forEach(t => t.classList.toggle('is-visible', opacity > 0.6));
            } else {
                section.style.opacity = '0';
                section.querySelectorAll('.fade-in-text').forEach(t => t.classList.remove('is-visible'));
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

// Immediate start mode
experienceStarted = true;
document.body.classList.add('is-scrolling');

window.addEventListener('scroll', () => { targetScroll = window.scrollY; }, { passive: true });

initParticles();
animate();

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

