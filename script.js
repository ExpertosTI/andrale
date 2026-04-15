// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initPetals();
    initScrollAnimations();
    initCountdown();
    initRSVP();
    initProgressiveVideos();
});

// Progressive Loader
function initLoader() {
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    const loaderBar = document.getElementById('loader-bar');
    
    // Simulate progressive loading
    setTimeout(() => { if(loaderBar) loaderBar.style.width = '30%'; }, 200);
    setTimeout(() => { if(loaderBar) loaderBar.style.width = '60%'; }, 600);
    setTimeout(() => { if(loaderBar) loaderBar.style.width = '90%'; }, 1000);
    
    setTimeout(() => {
        if(loaderBar) loaderBar.style.width = '100%';
        if(loaderText) loaderText.classList.add('visible');
    }, 1400);
    
    setTimeout(() => {
        if(loader) loader.classList.add('hidden');
        revealHeroElements();
    }, 2200);
}

// Reveal lettering after load
function revealHeroElements() {
    const lettering = document.getElementById('lettering-main');
    if (lettering) {
        lettering.classList.add('visible');
        lettering.style.opacity = '1';
        lettering.style.transform = 'scale(1) translateY(0)';
    }
}

// Falling Petals with Scroll Influence
function initPetals() {
    const canvas = document.getElementById('petals-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const petalColors = [
        'rgba(255, 182, 193, 0.9)',
        'rgba(255, 192, 203, 0.85)',
        'rgba(255, 218, 185, 0.8)',
        'rgba(255, 228, 196, 0.75)',
        'rgba(250, 235, 215, 0.85)',
        'rgba(255, 240, 245, 0.9)',
        'rgba(255, 228, 225, 0.85)',
        'rgba(255, 250, 250, 0.8)'
    ];
    
    const sparkleColors = [
        'rgba(255, 215, 0, 0.95)',
        'rgba(255, 223, 186, 0.85)',
        'rgba(255, 255, 255, 1)',
        'rgba(255, 236, 139, 0.9)'
    ];
    
    class Petal {
        constructor(type = 'petal') {
            this.type = type;
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * (width + 200) - 100;
            this.y = -50 - Math.random() * 100;
            
            if (this.type === 'petal') {
                this.size = Math.random() * 15 + 10;
                this.speedY = Math.random() * 1.5 + 0.8;
                this.speedX = Math.random() * 1.2 - 0.6;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.04;
                this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
                this.opacity = Math.random() * 0.3 + 0.7;
                this.sway = Math.random() * 0.03 + 0.015;
                this.swayOffset = Math.random() * Math.PI * 2;
            } else {
                this.size = Math.random() * 4 + 2;
                this.speedY = Math.random() * 2 + 1.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
                this.opacity = Math.random() * 0.4 + 0.6;
                this.pulse = Math.random() * Math.PI * 2;
                this.pulseSpeed = Math.random() * 0.05 + 0.02;
            }
        }
        
        update(scrollSpeed = 0) {
            if (this.type === 'petal') {
                this.y += this.speedY + scrollSpeed * 0.8;
                this.x += Math.sin(this.y * this.sway + this.swayOffset) * 1.5 + this.speedX;
                this.rotation += this.rotationSpeed + scrollSpeed * 0.02;
            } else {
                this.y += this.speedY + scrollSpeed * 0.5;
                this.x += this.speedX;
                this.pulse += this.pulseSpeed;
                this.opacity = 0.6 + Math.sin(this.pulse) * 0.35;
            }
            
            if (this.y > height + 50) {
                this.reset();
            }
            
            if (this.x < -100) this.x = width + 100;
            if (this.x > width + 100) this.x = -100;
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            
            if (this.type === 'petal') {
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                const w = this.size;
                const h = this.size * 1.6;
                
                const gradient = ctx.createLinearGradient(0, -h/2, 0, h/2);
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
                
                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.moveTo(0, -h/2);
                ctx.bezierCurveTo(w/2, -h/3, w/2, h/4, 0, h/2);
                ctx.bezierCurveTo(-w/2, h/4, -w/2, -h/3, 0, -h/2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.ellipse(-w/4, -h/4, w/6, h/8, -0.3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.translate(this.x, this.y);
                const s = this.size;
                
                ctx.beginPath();
                ctx.fillStyle = this.color;
                for (let i = 0; i < 4; i++) {
                    ctx.lineTo(Math.cos((i * Math.PI) / 2) * s, Math.sin((i * Math.PI) / 2) * s);
                    ctx.lineTo(Math.cos((i * Math.PI) / 2 + Math.PI/4) * s * 0.3, Math.sin((i * Math.PI) / 2 + Math.PI/4) * s * 0.3);
                }
                ctx.closePath();
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(0, 0, s * 2, 0, Math.PI * 2);
                ctx.fillStyle = this.color.replace(/0\.9[0-5]/, '0.25');
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    const isMobile = window.innerWidth < 768;
    const petalCount = isMobile ? 35 : 70;
    const sparkleCount = isMobile ? 12 : 25;
    const petals = [];
    
    for (let i = 0; i < petalCount; i++) {
        const petal = new Petal('petal');
        petal.y = Math.random() * height;
        petals.push(petal);
    }
    
    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = new Petal('sparkle');
        sparkle.y = Math.random() * height;
        petals.push(sparkle);
    }
    
    let animationId;
    let isActive = true;
    let scrollSpeed = 0;
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const delta = Math.abs(currentScrollY - lastScrollY);
        scrollSpeed = Math.min(delta * 0.15, 15);
        lastScrollY = currentScrollY;
    }, { passive: true });
    
    function animate() {
        if (!isActive) return;
        
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'screen';
        
        petals.forEach(p => {
            p.update(scrollSpeed);
            p.draw();
        });
        
        ctx.globalCompositeOperation = 'source-over';
        
        scrollSpeed *= 0.95;
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            isActive = false;
            cancelAnimationFrame(animationId);
        } else {
            isActive = true;
            animate();
        }
    });
}

// Scroll Animations
function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    
    // Verse appears after slight scroll
    gsap.fromTo('#hero-verse', 
        { opacity: 0, y: 30 },
        {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: '20% top',
                scrub: 1
            }
        }
    );
    
    // Date appears
    gsap.fromTo('#hero-date',
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '#hero',
                start: '15% top',
                end: '35% top',
                scrub: 1
            }
        }
    );
    
    // Photo 1 fades out as you scroll
    gsap.to('#hero-photo-1', {
        opacity: 0,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
            trigger: '#hero',
            start: '30% top',
            end: '70% top',
            scrub: 1
        }
    });
    
    // Photo 2 fades in and stays
    gsap.to('#hero-photo-2', {
        opacity: 1,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
            trigger: '#hero',
            start: '40% top',
            end: '90% top',
            scrub: 1
        }
    });
    
    // Elements fade out as you leave hero section
    gsap.to(['#lettering-main', '#hero-verse', '#hero-date'], {
        opacity: 0,
        y: -50,
        ease: 'power2.in',
        scrollTrigger: {
            trigger: '#hero',
            start: '70% top',
            end: 'bottom top',
            scrub: 1
        }
    });
    
    // Video scroll scrubbing
    const video = document.getElementById('bg-video');
    const videoBg = document.getElementById('video-bg');
    
    if (video) {
        video.addEventListener('loadedmetadata', () => {
            video.pause();
        });
        
        gsap.to(video, {
            currentTime: video.duration || 1,
            ease: 'none',
            scrollTrigger: {
                trigger: '#info',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.5,
                onEnter: () => { videoBg.classList.add('visible'); },
                onLeave: () => { videoBg.classList.remove('visible'); },
                onEnterBack: () => { videoBg.classList.add('visible'); },
                onLeaveBack: () => { videoBg.classList.remove('visible'); }
            }
        });
    }
    
    // Cards reveal
    gsap.utils.toArray('.card').forEach((card) => {
        gsap.from(card, {
            y: 60,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    });
    
    // Section headers
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: header,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    });
}

// Countdown
function initCountdown() {
    const targetDate = new Date('2026-05-16T16:00:00');
    
    function update() {
        const now = new Date();
        const diff = targetDate - now;
        
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            
            const d = document.getElementById('cd-days');
            const h = document.getElementById('cd-hours');
            const m = document.getElementById('cd-mins');
            const s = document.getElementById('cd-secs');
            
            if(d) d.textContent = String(days).padStart(2, '0');
            if(h) h.textContent = String(hours).padStart(2, '0');
            if(m) m.textContent = String(mins).padStart(2, '0');
            if(s) s.textContent = String(secs).padStart(2, '0');
        }
    }
    
    update();
    setInterval(update, 1000);
}

// Modal
function openModal() {
    const modal = document.getElementById('rsvp-modal');
    if (modal) modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('rsvp-modal');
    if (modal) modal.classList.remove('active');
}

// RSVP Form
function initRSVP() {
    const form = document.getElementById('rsvp-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('rsvp-name').value,
            guests: document.getElementById('rsvp-guests').value,
            phone: document.getElementById('rsvp-phone').value,
            wishes: document.getElementById('rsvp-wishes').value,
            date: new Date().toISOString()
        };
        
        try {
            const response = await fetch('/api/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                showToast('¡Confirmación enviada!');
                closeModal();
                form.reset();
                
                setTimeout(() => {
                    const message = `¡Hola! 👰🤵\n\nSoy *${data.name}* y confirmo mi asistencia a la boda de Andreína y Alejandro.\n\n🗓️ Sábado 16 de mayo 2026\n👥 Cantidad: ${data.guests} persona(s)${data.wishes ? '\n💬 ' + data.wishes : ''}\n\n¡Nos vemos! 🎉`;
                    if (confirm('¿Deseas enviar la confirmación también por WhatsApp?')) {
                        window.open(`https://wa.me/18498154422?text=${encodeURIComponent(message)}`, '_blank');
                    }
                }, 500);
            } else {
                showToast('Error al enviar. Intenta de nuevo.');
            }
        } catch (error) {
            console.error('RSVP Error:', error);
            showToast('Error de conexión. Intenta más tarde.');
        }
    });
    
    const rsvpModal = document.getElementById('rsvp-modal');
    if (rsvpModal) {
        rsvpModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });
    }
}

// WhatsApp Quick Contact
function openWhatsApp(person, phone) {
    const message = `Hola ${person}, tengo una pregunta sobre la boda de Andreína y Alejandro 🎉`;
    window.open(`https://wa.me/1${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('¡Número copiado!');
    });
}

// Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Progressive Video Optimization (Pescaderia Altamar Logic)
function initProgressiveVideos() {
    const videos = document.querySelectorAll('video[data-src-hq]');
    
    videos.forEach(video => {
        const hqSrc = video.getAttribute('data-src-hq');
        if (!hqSrc) return;
        
        // Use Fetch to pre-load HQ blob
        fetch(hqSrc)
            .then(response => response.blob())
            .then(blob => {
                const hqUrl = URL.createObjectURL(blob);
                const currentTime = video.currentTime;
                const isPaused = video.paused;
                
                // Track transition start
                video.classList.add('video-swapping');
                
                // Swap source
                video.src = hqUrl;
                video.currentTime = currentTime;
                
                if (!isPaused) {
                    video.play().catch(e => console.warn("Auto-play blocked after swap", e));
                }
                
                video.oncanplaythrough = () => {
                    video.classList.remove('video-swapping');
                };
            })
            .catch(error => console.error("Error loading HQ video:", hqSrc, error));
    });
}
