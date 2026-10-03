// Bike Pantry Case Study Script

document.addEventListener('DOMContentLoaded', () => {
  // 1. Scroll Reveal Observer for bite-sized thought chunks (triggers later as you scroll)
  const revealElements = document.querySelectorAll('.reveal-chunk');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target); // Stay visible once revealed
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -120px 0px', /* Requires scrolling further into viewport */
    threshold: 0.15
  });

  revealElements.forEach(el => {
    // Reveal all elements in or near initial viewport promptly
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.1) {
      el.classList.add('is-revealed');
    } else {
      revealObserver.observe(el);
    }
  });

  // 2. Intersection Observer for Left Sidebar TOC highlighting
  const sections = document.querySelectorAll('main section, header.hero-header');
  const tocLinks = document.querySelectorAll('.side-toc .toc-link');

  const tocObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        let id = entry.target.getAttribute('id');
        // Overview and Context are part of the Bike Pantry section (#hero)
        if (id === 'overview' || id === 'context') {
          id = 'hero';
        }
        tocLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  });

  sections.forEach(section => tocObserver.observe(section));

  // Ensure top-of-page explicitly highlights Bike Pantry
  const updateTopActive = () => {
    if (window.scrollY < 200) {
      tocLinks.forEach(link => {
        if (link.getAttribute('href') === '#hero') {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  };
  window.addEventListener('scroll', updateTopActive, { passive: true });
  updateTopActive();

  // 3. Autoplay videos robustness check
  const autoplayVideos = document.querySelectorAll('video[autoplay]');
  autoplayVideos.forEach(vid => {
    vid.play().catch(e => {
      console.log('Video autoplay prevented, awaiting interaction:', e);
    });
  });

  // 4. Floating Navigation Scroll Collapse & Slow Logo Rotation
  const floatingNav = document.getElementById('floating-nav');
  const navLogoImg = document.getElementById('nav-logo-img');
  const navLogoBox = document.getElementById('nav-logo-box');

  // Return to top when on home, or navigate to home when on subpages
  if (navLogoBox) {
    navLogoBox.addEventListener('click', (e) => {
      const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
      if (isHome) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  let ticking = false;

  const updateNavOnScroll = () => {
    const currentScrollY = window.scrollY;

    // Collapse wings into the square when scrolled down past 60px
    if (floatingNav) {
      if (currentScrollY > 60) {
        floatingNav.classList.add('is-collapsed');
      } else {
        floatingNav.classList.remove('is-collapsed');
      }
    }

    // Rotate logo exactly one full 360 degrees across the entire page scroll
    if (navLogoImg) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = maxScroll > 0 ? Math.min(Math.max(currentScrollY / maxScroll, 0), 1) : 0;
      const rotationDeg = scrollProgress * 360;
      navLogoImg.style.transform = `rotate(${rotationDeg}deg)`;
    }

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateNavOnScroll);
      ticking = true;
    }
  }, { passive: true });

  // Initial call in case page is loaded scrolled down
  updateNavOnScroll();

  // 5. Subtle Bicycle Kitchen Confetti at bottom of case study
  const confettiCanvas = document.getElementById('confetti-canvas');
  let confettiTriggered = false;

  const triggerConfetti = () => {
    if (confettiTriggered || !confettiCanvas) return;
    confettiTriggered = true;

    const ctx = confettiCanvas.getContext('2d');
    const width = confettiCanvas.width = window.innerWidth;
    const height = confettiCanvas.height = window.innerHeight;

    // Authentic Bicycle Kitchen palette
    const colors = [
      '#40a09e', // Bicycle Kitchen Primary Teal
      '#7aebef', // Soft Cyan
      '#328280', // Deep Teal
      '#e55d5d', // Bicycle Kitchen Red
      '#ef6b6b'  // Soft Accent Red
    ];

    const particleCount = 42; // Subtle, graceful quantity
    const particles = [];

    // Launch from the bottom across the center portion of the screen
    for (let i = 0; i < particleCount; i++) {
      const x = width * 0.28 + Math.random() * (width * 0.44); // Center 44% of bottom
      const y = height + 10;
      const size = Math.random() * 5 + 6; // 6px to 11px
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Upward velocity with slight spread
      const angle = (Math.random() * 40 + 70) * (Math.PI / 180); // 70 to 110 degrees upward
      const speed = Math.random() * 8 + 12; // Initial upward launch speed
      const vx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1) * 0.7;
      const vy = -Math.sin(angle) * speed;

      particles.push({
        x,
        y,
        size,
        color,
        vx,
        vy,
        gravity: 0.36,
        friction: 0.985,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        tilt: Math.random() * 10,
        tiltSpeed: Math.random() * 0.1 + 0.05,
        opacity: 1,
        fadeSpeed: 0.007 + Math.random() * 0.005,
        isRound: Math.random() > 0.65
      });
    }

    let animId = null;

    const renderConfetti = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = 0;

      particles.forEach(p => {
        p.vx *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.tilt += p.tiltSpeed;

        // Fade after apex
        if (p.vy > 0) {
          p.opacity -= p.fadeSpeed;
        }

        if (p.opacity > 0 && p.y < height + 40) {
          alive++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;

          if (p.isRound) {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const w = p.size;
            const h = p.size * Math.cos(p.tilt);
            ctx.fillRect(-w / 2, -h / 2, w, Math.abs(h));
          }

          ctx.restore();
        }
      });

      if (alive > 0) {
        animId = requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, width, height);
        cancelAnimationFrame(animId);
      }
    };

    renderConfetti();
  };

  // Trigger when reaching the conclusion section at the bottom
  const conclusionSection = document.getElementById('conclusion');
  if (conclusionSection) {
    const bottomObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          triggerConfetti();
        }
      });
    }, {
      root: null,
      threshold: 0.35
    });
    bottomObserver.observe(conclusionSection);
  }

  // 6. Custom Morphing Cursor Controller (Circle in idle -> Pointed on click)
  const cursorWrapper = document.getElementById('custom-cursor');
  if (cursorWrapper) {
    document.documentElement.classList.add('has-custom-cursor');

    let mouseX = -100;
    let mouseY = -100;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorWrapper.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      if (!cursorWrapper.classList.contains('is-visible')) {
        cursorWrapper.classList.add('is-visible');
      }
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      cursorWrapper.classList.add('is-clicking');
    });

    window.addEventListener('mouseup', () => {
      cursorWrapper.classList.remove('is-clicking');
    });

    document.addEventListener('mouseleave', () => {
      cursorWrapper.classList.remove('is-visible');
    });

    document.addEventListener('mouseenter', () => {
      cursorWrapper.classList.add('is-visible');
    });

    window.addEventListener('blur', () => {
      cursorWrapper.classList.remove('is-clicking', 'is-visible');
    });
  }

  // 7. Align Homepage Bio directly underneath "Lexi Chua"
  const alignHomeBio = () => {
    const nameEl = document.querySelector('.name-gradient');
    const bioEl = document.querySelector('.home-bio');
    const heroEl = document.querySelector('.home-hero');
    if (nameEl && bioEl && heroEl) {
      const nameRect = nameEl.getBoundingClientRect();
      const heroRect = heroEl.getBoundingClientRect();
      const offset = nameRect.left - heroRect.left;
      if (offset > 0) {
        bioEl.style.paddingLeft = `${Math.round(offset)}px`;
      }
    }
  };

  alignHomeBio();
  window.addEventListener('resize', alignHomeBio, { passive: true });
  window.addEventListener('load', alignHomeBio);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(alignHomeBio);
  }

  // 8. Play Page Category Tag Switcher
  const playTags = document.querySelectorAll('.play-tag');
  const playSections = document.querySelectorAll('.play-section');

  if (playTags.length > 0 && playSections.length > 0) {
    const switchPlayTab = (targetId) => {
      playTags.forEach(tag => {
        if (tag.dataset.target === targetId) {
          tag.classList.add('active');
        } else {
          tag.classList.remove('active');
        }
      });

      playSections.forEach(sec => {
        if (sec.id === `${targetId}-section`) {
          sec.classList.add('play-section-active');
        } else {
          sec.classList.remove('play-section-active');
        }
      });
    };

    playTags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        const target = tag.dataset.target;
        switchPlayTab(target);
        if (history.pushState) {
          history.pushState(null, null, `#${target}`);
        }
      });
    });

    // Check URL hash on page load (e.g. #illustration, #graphic-design, #games, #music)
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById(`${initialHash}-section`)) {
      switchPlayTab(initialHash);
    }
  }
});
