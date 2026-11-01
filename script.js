(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 1. CUSTOM CURSOR ---------- */
  if (isFinePointer && !prefersReduced) {
    const cursor = document.getElementById('cursor');
    const hoverTargets = document.querySelectorAll('[data-hover], a, button');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX, curY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    });

    function tick() {
      curX += (mouseX - curX) * 0.2;
      curY += (mouseY - curY) * 0.2;
      cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    tick();
  } else {
    document.body.style.cursor = 'auto';
  }

  /* ---------- 2. SCROLL REVEAL (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 3. MOBILE NAV ---------- */
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      mobileToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });
    navLinks.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileToggle.textContent = '☰';
      })
    );
  }

  /* ---------- 4. ABOUT CARD — 3D TILT + SPOTLIGHT ---------- */
  const aboutCard = document.getElementById('aboutCard');
  if (aboutCard && isFinePointer && !prefersReduced) {
    const onMove = (e) => {
      const r = aboutCard.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const px = x / r.width - 0.5;
      const py = y / r.height - 0.5;

      aboutCard.style.setProperty('--rx', `${-py * 16}deg`);
      aboutCard.style.setProperty('--ry', `${px * 16}deg`);
      aboutCard.style.setProperty('--sx', `${x}px`);
      aboutCard.style.setProperty('--sy', `${y}px`);
    };
    aboutCard.addEventListener('mousemove', onMove);
    aboutCard.addEventListener('mouseenter', () => aboutCard.classList.add('is-hovered'));
    aboutCard.addEventListener('mouseleave', () => {
      aboutCard.classList.remove('is-hovered');
      aboutCard.style.setProperty('--rx', '0deg');
      aboutCard.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- 5. MULTIPLE SCROLLSTACKS ---------- */
  function initScrollStack(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stackCards = Array.from(container.querySelectorAll('.stack-card'));
    let initialTops = [];
    let rafId = null;

    function measure() {
      initialTops = stackCards.map((card) => {
        const rect = card.getBoundingClientRect();
        return rect.top + window.scrollY;
      });
    }

    function update() {
      if (!stackCards.length) return;
      const scrollTop = window.scrollY;
      const vh = window.innerHeight;
      const stackPos = vh * 0.15;
      const stackOffset = 28;

      let topIdx = -1;
      stackCards.forEach((card, i) => {
        const trigger = initialTops[i] - stackPos - stackOffset * i;
        if (scrollTop >= trigger) topIdx = i;
      });

      stackCards.forEach((card, i) => {
        const trigger = initialTops[i] - stackPos - stackOffset * i;
        const isPinned = scrollTop >= trigger;

        if (isPinned) {
          const translateY = scrollTop - initialTops[i] + stackPos + stackOffset * i;
          const depth = Math.max(0, topIdx - i);
          const scale = Math.max(0.82, 1 - depth * 0.04);
          card.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
        } else {
          card.style.transform = 'translate3d(0, 0, 0) scale(1)';
        }
      });
    }

    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        update();
        rafId = null;
      });
    }

    measure();
    update();
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      update();
    });
    window.addEventListener('load', () => {
      measure();
      update();
    });
  }

  initScrollStack('projectStack');
  initScrollStack('certStack');

  /* ---------- 6. TIMELINE PROGRESS ---------- */
  function initTimeline(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const progressBar = section.querySelector('.timeline-progress');
    if (!progressBar) return;

    function updateTimeline() {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = vh + rect.height;
      const scrolled = vh - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const eased = Math.max(0, Math.min(1, (progress - 0.1) / 0.75));
      progressBar.style.height = `${eased * 100}%`;
    }

    let rafId = null;
    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateTimeline();
        rafId = null;
      });
    }

    updateTimeline();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateTimeline);
  }

  initTimeline('awards');
  initTimeline('scouting');
  initTimeline('volunteering');

  /* ---------- 7. FOOTER YEAR ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 8. SMOOTH ANCHOR ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
})();