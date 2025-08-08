// script.js — Chikult interactions and micro-animations
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  injectStyles();               // inject minimal CSS for ripple animation
  smoothAnchorScroll();         // smooth scroll with header offset + focus management
  headerShadow();               // add subtle header shadow on scroll
  shrinkHeaderOnScroll();       // make header smaller on scroll
  revealOnScroll(reduceMotion); // fade-in sections when they enter viewport
  parallaxHero(reduceMotion);   // gentle parallax on hero content
  rippleButtons(reduceMotion);  // click ripple on buttons
  cardTiltEffects(reduceMotion);// 3D tilt on farm cards
  enhanceForms();               // toast on forms without action
});

/* Inject minimal CSS (ripple animation only) */
function injectStyles() {
  const css = `
    .ripple {
      position: absolute; border-radius: 50%;
      transform: scale(0); pointer-events: none; opacity: 0.6;
      background: rgba(255,255,255,0.6); animation: ripple 600ms linear;
      mix-blend-mode: screen;
    }
    @keyframes ripple { to { transform: scale(4); opacity: 0; } }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

/* Smooth scrolling for internal links with header offset + focus */
function smoothAnchorScroll() {
  const header = document.querySelector('.header');
  const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;

      // Only handle same-page hash links
      if (location.pathname !== link.pathname || location.hostname !== link.hostname) return;

      e.preventDefault();

      const headerHeight = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;

      if (reduce) {
        window.scrollTo(0, top);
      } else {
        window.scrollTo({ top, behavior: 'smooth' });
      }

      // Update URL hash without full jump
      history.pushState(null, '', id);

      // Manage focus for accessibility (non-focusable sections)
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}

/* Add subtle shadow to header on scroll (inline style for compatibility) */
function headerShadow() {
  const header = document.querySelector('.header');
  if (!header) return;
  const apply = () => {
    header.style.boxShadow = (window.scrollY > 6)
      ? '0 8px 24px rgba(0,0,0,0.10)'
      : '0 2px 6px rgba(0, 0, 0, 0.1)';
  };
  apply();
  window.addEventListener('scroll', throttle(apply, 50), { passive: true });
}

/* Shrink header on scroll */
function shrinkHeaderOnScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  const apply = () => {
    header.classList.toggle('shrink', window.scrollY > 50);
  };
  apply();
  window.addEventListener('scroll', throttle(apply, 50), { passive: true });
}

/* Reveal sections on scroll (simple opacity reveal) */
function revealOnScroll(reduceMotion) {
  const sections = document.querySelectorAll('main section');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    sections.forEach(s => (s.style.opacity = '1'));
    return;
  }
  sections.forEach(s => {
    s.style.opacity = '0';
    s.style.transition = 'opacity 500ms ease';
    s.style.willChange = 'opacity';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  sections.forEach(s => io.observe(s));
}

/* Gentle parallax on hero content using requestAnimationFrame */
function parallaxHero(reduceMotion) {
  if (reduceMotion) return;
  const hero = document.getElementById('hero');
  if (!hero) return;
  const inner = hero.querySelector('.container');
  if (!inner) return;

  inner.style.willChange = 'transform';

  let ticking = false;
  const update = () => {
    const y = window.scrollY * 0.15;
    inner.style.transform = `translateY(${Math.min(30, y)}px)`;
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* Ripple effect on buttons (with dynamic contrast) */
function rippleButtons(reduceMotion) {
  const buttons = document.querySelectorAll('.btn, button');
  buttons.forEach(btn => {
    const currentPosition = getComputedStyle(btn).position;
    if (currentPosition === 'static') btn.style.position = 'relative';
    btn.style.overflow = 'hidden';

    btn.addEventListener('click', (e) => {
      if (reduceMotion) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      // Choose ripple color based on button background luminance
      const bg = getComputedStyle(btn).backgroundColor;
      const isDark = colorIsDark(bg);
      ripple.style.background = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.2)';

      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

function colorIsDark(cssColor) {
  const m = cssColor && cssColor.match(/\d+/g);
  if (!m) return false;
  const [r, g, b] = m.map(Number);
  // Perceptual luminance (sRGB approximation)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 140;
}

/* Card tilt hover effect (gentle) */
function cardTiltEffects(reduceMotion) {
  if (reduceMotion) return;
  if (matchMedia && matchMedia('(pointer: coarse)').matches) return;

  const cards = document.querySelectorAll('.farm-card');
  const maxTilt = 6; // degrees

  cards.forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.style.transition = 'transform 120ms ease';
    card.style.willChange = 'transform';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   // 0..1
      const y = (e.clientY - rect.top) / rect.height;   // 0..1
      const rotY = (x - 0.5) * (maxTilt * 2);
      const rotX = (0.5 - y) * (maxTilt * 2);
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 220ms cubic-bezier(.22,.61,.36,1)';
      card.style.transform = 'none';
      setTimeout(() => (card.style.transition = 'transform 120ms ease'), 240);
    });
  });
}

/* Forms: show toast for forms without external action; otherwise let them submit */
function enhanceForms() {
  const forms = document.querySelectorAll('form');

  // Ensure toast element exists
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  // Make sure toast can be shown even if CSS sets display: none
  styleToastBase(toast);

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const hasAction = !!form.getAttribute('action');
      // Intercept only forms without action (avoid breaking external submit like FormSubmit)
      if (!hasAction) {
        e.preventDefault();
        const title = form.closest('section')?.querySelector('h2')?.textContent || 'Tak';
        showToast(`${title}: Modtaget! Vi kontakter dig snarest.`);
        form.reset();
        form.style.transform = 'none';
      }
    });
  });

  // Toast queue
  const queue = [];
  let active = false;

  function showToast(message, duration = 2200) {
    queue.push({ message, duration });
    if (!active) next();
  }

  function next() {
    const item = queue.shift();
    if (!item) { active = false; return; }
    active = true;

    toast.textContent = item.message;
    // Ensure visible and animate in
    toast.style.display = 'block';
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, -6px)';
    });

    setTimeout(() => {
      // Animate out
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 0)';
      setTimeout(() => {
        // Keep display block to avoid layout jumps; opacity handles visibility
        next();
      }, 200);
    }, item.duration);
  }

  function styleToastBase(el) {
    // Base visual styles (overrides CSS display: none)
    el.style.position = 'fixed';
    el.style.bottom = '16px';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, 0)';
    el.style.background = 'var(--primary-color, #006666)';
    el.style.color = '#fff';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    el.style.transition = 'opacity .25s ease, transform .25s ease';
    el.style.zIndex = '1000';
    el.style.display = 'block';
  }
}

/* Utility: throttle for scroll handlers */
function throttle(fn, wait) {
  let last = 0, timer = null;
  return function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}