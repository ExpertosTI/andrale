const canvas = document.getElementById('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const progressBar = document.getElementById('scroll-progress');

const sections = document.querySelectorAll('.section');
const rootStyle = document.documentElement.style;
const envelopeGate = document.getElementById('envelope-gate');
const envelopeTouch = document.getElementById('envelope-touch');
const immersiveTextTargets = document.querySelectorAll('[data-immersive-text]');

const bgVideo = document.getElementById('bg-video');
const introVideoWrap = document.getElementById('intro-video-wrap');
const introVideo = document.getElementById('intro-video');
const entranceOverlay = document.getElementById('entrance-overlay');

let particles = [];
const particleCount = 45; // Fewer, larger particles for gooey effect
let animationTick = 0;
let introTextPlayed = false;
let introTypingStarted = false;

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
        this.size = Math.random() * 18 + 12; // Much larger for gooey look
        this.depth = Math.random() * 0.7 + 0.3;
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : -50;
        this.speedX = (Math.random() * 0.4 - 0.2) * this.depth;
        this.speedY = (Math.random() * 0.6 + 0.3) * this.depth; // Viscous flow
        this.opacity = Math.random() * 0.4 + 0.1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() * 0.2 - 0.1) * this.depth;
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height + 50 || this.x < -100 || this.x > canvas.width + 100) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        // Polished amber/gold slime color
        ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
        
        ctx.beginPath();
        // Liquid blob shape
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

const animateParticles = () => {
    if (!ctx || !canvas) return;
    animationTick += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => {
        particle.update(animationTick);
        particle.draw();
    });
    requestAnimationFrame(animateParticles);
};

const syncProgress = () => {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    rootStyle.setProperty('--scroll-ratio', `${Math.min(1, Math.max(0, progress / 100))}`);
};



const prepareImmersiveText = () => {
    immersiveTextTargets.forEach((element) => {
        if (element.dataset.textPrepared === 'true') return;

        const tokens = element.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        let charIndex = 0;

        tokens.forEach((token) => {
            if (!token) return;
            if (/^\s+$/.test(token)) {
                fragment.appendChild(document.createTextNode(token));
                return;
            }

            const word = document.createElement('span');
            word.className = 'text-word';

            [...token].forEach((char) => {
                const span = document.createElement('span');
                span.className = 'text-char';
                span.textContent = char;
                span.style.setProperty('--char-index', charIndex);
                span.style.setProperty('--char-shift', Math.random().toFixed(3));
                span.style.setProperty('--char-rise', Math.random().toFixed(3));
                span.style.setProperty('--char-spin', Math.random().toFixed(3));
                word.appendChild(span);
                charIndex += 1;
            });

            fragment.appendChild(word);
        });

        element.textContent = '';
        element.appendChild(fragment);
        element.classList.add('immersive-text');
        if (element.dataset.immersiveText === 'intro') {
            element.classList.add('is-typing');
        }
        element.dataset.textPrepared = 'true';
    });
};

const setSectionTextState = (section, isVisible) => {
    const targets = section.querySelectorAll('[data-immersive-text]');
    targets.forEach((target) => {
        if (target.dataset.immersiveText === 'intro' && !introTextPlayed) {
            return;
        }
        target.classList.toggle('is-visible', isVisible);
        target.classList.toggle('is-exiting', !isVisible);
    });
};

const playIntroTyping = () => {
    if (introTypingStarted) return;

    introTypingStarted = true;
    const introTargets = [...document.querySelectorAll('[data-immersive-text="intro"]')];
    let accumulatedDelay = 140;

    introTargets.forEach((target, targetIndex) => {
        const chars = [...target.querySelectorAll('.text-char')];
        target.classList.remove('is-visible', 'is-exiting');
        target.classList.add('is-typing');

        chars.forEach((char, index) => {
            window.setTimeout(() => {
                char.classList.add('is-on');
            }, accumulatedDelay + (index * 28));
        });

        const settleDelay = accumulatedDelay + (chars.length * 28) + 260 + (targetIndex * 40);
        window.setTimeout(() => {
            target.classList.remove('is-typing');
            target.classList.add('is-visible');
        }, settleDelay);

        accumulatedDelay = settleDelay - 80;
    });

    window.setTimeout(() => {
        introTextPlayed = true;
        const hero = document.getElementById('hero');
        if (hero) {
            setSectionTextState(hero, true);
        }
        document.body.classList.add('intro-complete');
    }, accumulatedDelay + 240);
};

const initReveal = () => {
    // We use a more fluid scroll-based approach instead of simple IntersectionObserver
    const handleScrollReveal = () => {
        const vHeight = window.innerHeight;
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const vCenter = vHeight / 2;
            
            // Normalized distance from center (-1 to 1)
            const dist = (center - vCenter) / (vHeight * 0.6);
            const absDist = Math.abs(dist);
            
            if (absDist < 1.2) {
                const opacity = Math.max(0, 1 - Math.pow(absDist, 1.5));
                const scale = 0.9 + (0.1 * opacity);
                const translateY = dist * 40;
                
                section.style.opacity = opacity;
                section.style.transform = `scale(${scale}) translateY(${translateY}px)`;
                section.style.pointerEvents = opacity > 0.3 ? 'auto' : 'none';
                
                // Trigger inner text animations
                if (opacity > 0.5) {
                    setSectionTextState(section, true);
                } else if (opacity < 0.1) {
                    setSectionTextState(section, false);
                }
            } else {
                section.style.opacity = '0';
            }
        });
    };

    window.addEventListener('scroll', handleScrollReveal, { passive: true });
    handleScrollReveal(); // Initial run
};



const initDepthMotion = () => {
    const updateDepth = (xRatio, yRatio) => {
        rootStyle.setProperty('--depth-x', `${xRatio * 20}px`);
        rootStyle.setProperty('--depth-y', `${yRatio * 20}px`);
    };

    window.addEventListener('pointermove', (event) => {
        const xRatio = (event.clientX / window.innerWidth - 0.5) * 2;
        const yRatio = (event.clientY / window.innerHeight - 0.5) * 2;
        updateDepth(xRatio, yRatio);
    });

    window.addEventListener('scroll', () => {
        const yRatio = Math.sin(window.scrollY * 0.0011) * 0.4;
        updateDepth(0, yRatio);
        scrubVideo();
    }, { passive: true });
};

const scrubVideo = () => {
    if (!bgVideo || isNaN(bgVideo.duration)) return;
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollMax <= 0) return;
    
    const scrollPos = window.scrollY;
    const scrollRatio = Math.max(0, Math.min(1, scrollPos / scrollMax));
    
    // Smooth scrubbing using seek
    // We pause the video when we're in "scroll control" mode
    if (!bgVideo.paused) bgVideo.pause();
    bgVideo.currentTime = scrollRatio * bgVideo.duration;
};



const initCinematicEntrance = () => {
    if (!entranceOverlay || !introVideo || !introVideoWrap) {
        document.body.classList.remove('locked');
        playIntroTyping();
        return;
    }

    let opened = false;
    document.body.classList.add('locked');
    const scrollProgress = document.getElementById('scroll-progress');
    if (scrollProgress) scrollProgress.classList.add('is-hidden');

    const unlockExperience = () => {
        document.body.classList.remove('locked');
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        if (scrollProgress) scrollProgress.classList.remove('is-hidden');
        
        // Final hide of intro wrap
        if (introVideoWrap) {
            introVideoWrap.style.transition = 'opacity 1.5s ease';
            introVideoWrap.style.opacity = '0';
            setTimeout(() => {
                introVideoWrap.classList.remove('is-active');
                introVideoWrap.style.display = 'none';
            }, 1600);
        }

        playIntroTyping();
    };

    const startExperience = () => {
        if (opened) return;
        opened = true;

        // Step 1: Hide Overlay with a professional scale/fade
        entranceOverlay.style.transition = 'opacity 1.8s cubic-bezier(0.16, 1, 0.3, 1), transform 2.2s cubic-bezier(0.16, 1, 0.3, 1)';
        entranceOverlay.classList.add('is-hidden');

        // Backup unlock
        const safetyTimeout = setTimeout(() => {
            if (introVideoWrap.classList.contains('is-active')) {
                unlockExperience();
            }
        }, 12000);

        // Step 2: Play Intro Video
        introVideoWrap.classList.add('is-active');
        introVideo.play().catch(e => {
            console.warn("Video play failed:", e);
            unlockExperience();
        });
        
        let earlyRevealTriggered = false;
        introVideo.ontimeupdate = () => {
            if (!earlyRevealTriggered && introVideo.duration > 0 && 
                introVideo.currentTime >= (introVideo.duration - 4.2)) {
                earlyRevealTriggered = true;
                unlockExperience();
                syncProgress();
            }
        };

        introVideo.onended = () => {
            clearTimeout(safetyTimeout);
            if (!earlyRevealTriggered) {
                unlockExperience();
                syncProgress();
            }
        };
    };

    entranceOverlay.addEventListener('click', startExperience);
    entranceOverlay.addEventListener('touchstart', startExperience, { passive: true });
};

const initDressCodeRotation = () => {
    const dressContainer = document.querySelector('.dress-code-icons');
    if (!dressContainer) return;
    setInterval(() => {
        dressContainer.classList.toggle('is-swapped');
    }, 3800);
};

const cards = document.querySelectorAll('[data-tilt]');
cards.forEach((card) => {
    card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 23;
        const rotateY = (centerX - x) / 23;
        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
});

prepareImmersiveText();
initParticles();
animateParticles();
initReveal();
initDepthMotion();
initCinematicEntrance();
initDressCodeRotation();
syncProgress();

window.addEventListener('scroll', syncProgress, { passive: true });
window.addEventListener('resize', syncProgress);

const firstSection = document.querySelector('.section');
if (firstSection) {
    firstSection.classList.add('active');
    setSectionTextState(firstSection, true);

}

const weddingDate = new Date('June 21, 2026 20:00:00').getTime();
const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = weddingDate - now;
    const safeDistance = Math.max(0, distance);
    const days = Math.floor(safeDistance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((safeDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((safeDistance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((safeDistance % (1000 * 60)) / 1000);

    const d = document.getElementById('days');
    const h = document.getElementById('hours');
    const m = document.getElementById('minutes');
    const s = document.getElementById('seconds');

    if (d) d.innerText = days.toString().padStart(2, '0');
    if (h) h.innerText = hours.toString().padStart(2, '0');
    if (m) m.innerText = minutes.toString().padStart(2, '0');
    if (s) s.innerText = seconds.toString().padStart(2, '0');
};

setInterval(updateCountdown, 1000);
updateCountdown();

const toast = document.getElementById('toast');
const showToast = (message) => {
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('is-active');
    setTimeout(() => toast.classList.remove('is-active'), 2500);
};

window.copyToClipboard = (text, bankName) => {
    navigator.clipboard.writeText(text)
        .then(() => showToast(`Copiado: Cuenta ${bankName}`))
        .catch(() => showToast('Error al copiar'));
};
