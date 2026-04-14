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
const baseParticleCount = window.innerWidth < 600 ? 550 : 800;
let targetParticleCount = baseParticleCount;
let experienceStarted = false;
let targetScroll = 0;
let currentScroll = 0;

let pointerX = -1000;
let pointerY = -1000;
window.addEventListener('mousemove', (e) => { pointerX = e.clientX; pointerY = e.clientY; }, { passive: true });
window.addEventListener('touchmove', (e) => { if (e.touches[0]) { pointerX = e.touches[0].clientX; pointerY = e.touches[0].clientY; } }, { passive: true });

// LOGGING SYSTEM
const logger = (msg) => {
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
    console.log(`[INVITATION-LOG] [${timestamp}] ${msg}`);
};

// PRELOADER SYSTEM
const preloader = document.getElementById('preloader');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');

let loadedAssets = 0;
const totalAssets = 2; // intro + bg videos

const updateLoadingProgress = () => {
    loadedAssets++;
    const progress = (loadedAssets / totalAssets) * 100;
    if (loadingBar) loadingBar.style.width = `${progress}%`;
    if (loadingText) loadingText.innerText = `Cargando activos... ${Math.round(progress)}%`;
    
    if (loadedAssets >= totalAssets) {
        setTimeout(() => {
            if (preloader) preloader.classList.add('hidden');
            experienceStarted = true;
            logger('Experience Started (All assets loaded)');
        }, 800);
    }
};

// LAYERED RENDERING: Fetch as Blob to guarantee 200 OK (no 206 partial content loops)
const loadOptimizedVideo = (videoEl, tinySrc, hqSrc) => {
    if (!videoEl) {
        updateLoadingProgress(); // Count as loaded if element doesn't exist
        return;
    }
    
    // Initial fetch for tiny video
    fetch(tinySrc)
        .then(response => response.blob())
        .then(blob => {
            const tinyUrl = URL.createObjectURL(blob);
            videoEl.src = tinyUrl;
            
            // For scrubbing videos, we want HQ as soon as possible
            fetch(hqSrc)
                .then(r => r.blob())
                .then(hqBlob => {
                    const hqUrl = URL.createObjectURL(hqBlob);
                    const currentTime = videoEl.currentTime;
                    videoEl.src = hqUrl;
                    videoEl.currentTime = currentTime;
                    updateLoadingProgress();
                    logger(`HQ video loaded: ${hqSrc}`);
                })
                .catch(e => {
                    updateLoadingProgress(); // Still proceed
                    logger(`Failed to load HQ: ${hqSrc}`);
                });
        })
        .catch(e => {
            updateLoadingProgress(); // Still proceed
            logger(`Failed to load tiny: ${tinySrc}`);
        });
};

if (introVideoScrub) {
    loadOptimizedVideo(introVideoScrub, 'assets/intro-scrub-tiny.mp4', 'assets/intro-scrub-hq.mp4');
} else {
    updateLoadingProgress();
}

if (bgVideo) {
    loadOptimizedVideo(bgVideo, 'assets/bg-tiny.mp4', 'assets/bg-hq.mp4');
} else {
    updateLoadingProgress();
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
        // Use a mix of gold and teal particles
        const rand = Math.random();
        if (rand > 0.7) this.color = '#2dd4bf'; // Teal
        else if (rand > 0.4) this.color = '#fcf6ba'; // Light gold
        else this.color = '#d4af37'; // Deep gold
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

        // Gravity pull towards user pointer
        if (pointerX > -500 && pointerY > -500) {
            const dx = pointerX - this.x;
            const dy = pointerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && dist > 5) {
                this.x += (dx / dist) * 1.8; 
                this.y += (dy / dist) * 1.8;
            }
        }

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
    const count = window.innerWidth < 600 ? 550 : baseParticleCount;
    for (let i = 0; i < count; i += 1) {
        particles.push(new Particle());
    }
};

const animate = () => {
    if (!ctx || !canvas) return;
    
    // Snappier fluid interpolation (0.1 instead of 0.08)
    currentScroll += (targetScroll - currentScroll) * 0.1;
    
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

        const introZone = vh * 1.5; // Adjusted intro zone for better pacing
        
        // VIDEO SCRUBBING OPTIMIZATION
        const updateVideoScrub = (video, ratio) => {
            if (!video || isNaN(video.duration)) return;
            const targetTime = ratio * (video.duration - 0.05);
            
            // Only update if difference > 0.033s (approx 1 frame at 30fps) to reduce GPU load
            if (Math.abs(video.currentTime - targetTime) > 0.033) {
                video.currentTime = targetTime;
            }

            // PARALLAX SCALE EFFECT (Pescaderia Style)
            // As we scroll, the video scales slightly to give depth
            const scale = 1 + (ratio * 0.05); 
            video.style.transform = `translate(-50%, -50%) translateZ(0) scale(${scale})`;
        };

        if (currentScroll < introZone) {
            if (introVideoScrub) {
                if (bgVideo && bgVideo.classList.contains('is-visible')) bgVideo.classList.remove('is-visible');

                const ratio = Math.max(0, currentScroll / introZone);
                updateVideoScrub(introVideoScrub, ratio);
                introVideoScrub.classList.add('is-visible');

                // Hero Overlay Logic
                const hero = document.getElementById('hero-overlay');
                if (hero) {
                    const heroOpacity = Math.max(0, Math.min(1, (ratio - 0.5) * 4)); // Fades in between 0.5 and 0.75 ratio
                    hero.style.opacity = heroOpacity;
                    hero.classList.toggle('is-visible', heroOpacity > 0);
                }
            }
        } else {
            if (bgVideo) {
                const bgScrollRange = scrollMax - introZone;
                const currentBgScroll = currentScroll - introZone;
                const bgRatio = Math.max(0, currentBgScroll / bgScrollRange);
                updateVideoScrub(bgVideo, bgRatio);
                bgVideo.classList.add('is-visible');
            }
            if (introVideoScrub) introVideoScrub.classList.remove('is-visible');
            
            const hero = document.getElementById('hero-overlay');
            if (hero) hero.style.opacity = 0;
        }

        // Section Reveal logic (Pescaderia Style: rising from depth)
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const viewCenter = vh / 2;
            const sectionCenter = rect.top + rect.height / 2;
            const distFromCenter = (sectionCenter - viewCenter) / vh;
            
            // Activate section when it's near the viewport
            if (rect.top < vh * 0.8 && rect.bottom > vh * 0.2) {
                section.classList.add('active');
                
                // Parallax/Depth effect based on distance from center
                const intensity = Math.min(1, Math.max(0, 1 - Math.abs(distFromCenter) * 1.2));
                const translateY = distFromCenter * 50;
                const scale = 0.95 + (0.05 * intensity);
                
                section.style.transform = `translateY(${translateY}px) scale(${scale})`;
                section.style.opacity = intensity;

                // Toggle visibility for children based on intensity
                const showChildren = intensity > 0.4;
                section.querySelectorAll('[data-immersive-text]').forEach(t => t.classList.toggle('is-visible', showChildren));
                section.querySelectorAll('.fade-in-text').forEach(t => t.classList.toggle('is-visible', showChildren));
            } else {
                section.classList.remove('active');
                section.style.opacity = 0;
                section.querySelectorAll('.is-visible').forEach(t => t.classList.remove('is-visible'));
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

// Countdown Logic
const targetDate = new Date('2026-05-16T16:00:00').getTime();
const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = targetDate - now;
    if (distance < 0) return;
    
    const d = document.getElementById('cd-days');
    const h = document.getElementById('cd-hours');
    const m = document.getElementById('cd-mins');
    const s = document.getElementById('cd-secs');

    if (d) d.innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
    if (h) h.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
    if (m) m.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    if (s) s.innerText = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
};
setInterval(updateCountdown, 1000);
updateCountdown();

// Immediate start mode
experienceStarted = true;
document.body.classList.add('is-scrolling');

window.addEventListener('scroll', () => { targetScroll = window.scrollY; }, { passive: true });

initParticles();
animate();

// ========== EVENT TRACKING ==========
const trackEvent = (type, meta = {}) => {
    fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, meta })
    }).catch(() => {}); // fire-and-forget
};

window.copyToClipboard = (text, bankName) => {
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    trackEvent('copy_account', { bank: bankName, number: text });
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.innerText = `Copiado: ${bankName}`;
            toast.classList.add('is-active');
            setTimeout(() => toast.classList.remove('is-active'), 2500);
        }
    });
};

// ========== RSVP MODAL ==========
window.openRsvpModal = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    trackEvent('rsvp_open');
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

window.submitRsvp = async () => {
    const nameEl = document.getElementById('rsvp-name');
    const guestsEl = document.getElementById('rsvp-guests');
    const messageEl = document.getElementById('rsvp-message');
    const submitBtn = document.getElementById('rsvp-submit');
    
    if (!nameEl || !nameEl.value.trim()) {
        nameEl.style.borderColor = '#e74c3c';
        nameEl.focus();
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = 'Enviando...';

    try {
        const res = await fetch('/api/rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: nameEl.value.trim(),
                guests: parseInt(guestsEl.value) || 1,
                message: (messageEl.value || '').trim()
            })
        });
        
        if (res.ok) {
            if (navigator.vibrate) navigator.vibrate([20, 50, 20, 50, 20]);
            document.getElementById('rsvp-form-wrap').style.display = 'none';
            document.getElementById('rsvp-success').style.display = 'block';
            if (window.lucide) window.lucide.createIcons();
            
            // Auto-close modal after 4s
            setTimeout(() => window.closeRsvpModal(), 4000);
        } else {
            throw new Error('Server error');
        }
    } catch (e) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Confirmar';
        alert('Error al confirmar. Intenta de nuevo.');
    }
};
