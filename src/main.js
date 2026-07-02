import { mountScene } from './scene.js';
import { initCommon } from './common.js';

initCommon();

/* ============ Preloader ============ */
const preloader = document.getElementById('preloader');
const preCount = document.getElementById('preCount');
let loaded = 0;
const loadTimer = setInterval(() => {
  loaded = Math.min(100, loaded + Math.ceil(Math.random() * 18));
  preCount.textContent = loaded;
  if (loaded >= 100) {
    clearInterval(loadTimer);
    setTimeout(() => {
      preloader.classList.add('is-done');
      document.body.classList.add('is-loaded');
    }, 250);
  }
}, 90);

/* ============ Hero letter split ============ */
document.querySelectorAll('[data-split]').forEach((el) => {
  const target = el.querySelector('em') || el;
  const chars = [...target.textContent];
  target.textContent = '';
  chars.forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = c === ' ' ? ' ' : c;
    s.style.transitionDelay = `${0.4 + i * 0.045}s`;
    target.appendChild(s);
  });
});

/* ============ WebGL scenes ============ */
/* Hero runs the original nebula. The particle-arrow construct is kept in
   heroScene.js; to bring it back: mountHeroScene(heroCanvas) */
const heroCanvas = document.getElementById('heroCanvas');
const heroScene = heroCanvas ? mountScene(heroCanvas, { density: 1, sigil: true }) : null;
const footCanvas = document.getElementById('footCanvas');
if (footCanvas) mountScene(footCanvas, { density: 0.45, sigil: false });

/* ============ Scroll: progress bar + hero parallax ============ */
const progress = document.getElementById('progress');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  progress.style.width = `${p * 100}%`;
  if (heroScene) heroScene.setScroll(Math.min(window.scrollY / window.innerHeight, 1.5));
}, { passive: true });

/* ============ Manifesto word-scrub ============ */
const scrub = document.querySelector('[data-scrub]');
if (scrub) {
  // wrap words, keeping <em> intact
  const wrapWords = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((tok) => {
          if (/^\s+$/.test(tok) || tok === '') { frag.appendChild(document.createTextNode(tok)); return; }
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = tok;
          frag.appendChild(s);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        wrapWords(child);
      }
    });
  };
  wrapWords(scrub);
  const words = scrub.querySelectorAll('.w');
  window.addEventListener('scroll', () => {
    const r = scrub.getBoundingClientRect();
    const prog = Math.min(Math.max((window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.3), 0), 1);
    const lit = Math.floor(prog * words.length);
    words.forEach((w, i) => w.classList.toggle('is-lit', i <= lit));
  }, { passive: true });
}

/* ============ Stat counters ============ */
const counter = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    counter.unobserve(e.target);
    const end = +e.target.dataset.count;
    const t0 = performance.now();
    const dur = 1600;
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach((el) => counter.observe(el));

/* ============ Marquees (auto-scroll + drag/swipe with momentum) ============ */
document.querySelectorAll('.marquee__track').forEach((track) => {
  track.innerHTML += track.innerHTML; // duplicate for seamless loop
  const wrap = track.parentElement;
  const speed = +track.dataset.speed || 1;
  let x = 0;          // position in % of track width
  let vel = 0;        // fling momentum, %/frame
  let auto = 1;       // auto-scroll factor, eases back in after a gesture
  let dragging = false;
  let lastX = 0;

  wrap.style.touchAction = 'pan-y'; // horizontal gestures are ours, vertical scroll stays native
  wrap.style.cursor = 'grab';

  wrap.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    vel = 0;
    auto = 0; // finger down: marquee pauses
    wrap.style.cursor = 'grabbing';
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dpct = ((e.clientX - lastX) / track.offsetWidth) * 100;
    lastX = e.clientX;
    x += dpct;
    vel = dpct;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    wrap.style.cursor = 'grab';
  };
  wrap.addEventListener('pointerup', release);
  wrap.addEventListener('pointercancel', release);

  (function move() {
    if (!dragging) {
      x += vel;             // fling carries on...
      vel *= 0.94;          // ...and decays
      auto = Math.min(1, auto + 0.008); // auto-scroll fades back in
      x -= 0.045 * speed * auto;
    }
    while (x <= -50) x += 50;
    while (x > 0) x -= 50;
    track.style.transform = `translateX(${x}%)`;
    requestAnimationFrame(move);
  })();
});

/* ============ Service detail panels ============ */
document.querySelectorAll('[data-service]').forEach((row) => {
  const detail = row.querySelector('.service__detail');
  if (!detail) return;
  const toggle = () => {
    const open = row.classList.toggle('is-open');
    row.setAttribute('aria-expanded', open);
    detail.style.maxHeight = open ? `${detail.scrollHeight}px` : '0';
    document.querySelectorAll('.service.is-open').forEach((other) => {
      if (other !== row) {
        other.classList.remove('is-open');
        other.setAttribute('aria-expanded', 'false');
        other.querySelector('.service__detail').style.maxHeight = '0';
      }
    });
  };
  row.addEventListener('click', (e) => {
    if (e.target.closest('.service__cta')) return; // let the CTA link navigate
    toggle();
  });
  row.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

/* ============ Accordion ============ */
document.querySelectorAll('.acc-item').forEach((item) => {
  item.querySelector('.acc-item__head').addEventListener('click', () => {
    const body = item.querySelector('.acc-item__body');
    const open = item.classList.toggle('is-open');
    body.style.maxHeight = open ? `${body.scrollHeight}px` : '0';
    document.querySelectorAll('.acc-item.is-open').forEach((other) => {
      if (other !== item) {
        other.classList.remove('is-open');
        other.querySelector('.acc-item__body').style.maxHeight = '0';
      }
    });
  });
});

/* ============ Testimonial carousel (snap scroll + drag/swipe) ============ */
const voicesSlider = document.getElementById('voices');
if (voicesSlider) {
  const voices = [...voicesSlider.querySelectorAll('.voice')];
  const count = document.getElementById('voiceCount');
  let idx = 0;
  let lastTouch = 0; // pause auto-advance after any interaction

  const sync = () => {
    idx = Math.round(voicesSlider.scrollLeft / voicesSlider.clientWidth);
    idx = Math.max(0, Math.min(voices.length - 1, idx));
    voices.forEach((v, k) => v.classList.toggle('is-active', k === idx));
    count.textContent = `${idx + 1} / ${voices.length}`;
  };
  voicesSlider.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  sync();

  const goTo = (i) => {
    const n = (i + voices.length) % voices.length;
    voicesSlider.scrollTo({ left: n * voicesSlider.clientWidth, behavior: 'smooth' });
  };
  document.getElementById('voicePrev').addEventListener('click', () => { lastTouch = Date.now(); goTo(idx - 1); });
  document.getElementById('voiceNext').addEventListener('click', () => { lastTouch = Date.now(); goTo(idx + 1); });

  // mouse drag scrubbing (touch swipes natively); snap pauses during the drag
  let dragging = false, startX = 0, startLeft = 0;
  voicesSlider.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') { lastTouch = Date.now(); return; }
    dragging = true;
    startX = e.clientX;
    startLeft = voicesSlider.scrollLeft;
    lastTouch = Date.now();
    voicesSlider.style.scrollSnapType = 'none';
    voicesSlider.style.cursor = 'grabbing';
    voicesSlider.setPointerCapture(e.pointerId);
  });
  voicesSlider.addEventListener('pointermove', (e) => {
    if (dragging) voicesSlider.scrollLeft = startLeft - (e.clientX - startX);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    voicesSlider.style.cursor = 'grab';
    voicesSlider.style.scrollSnapType = '';
    goTo(Math.round(voicesSlider.scrollLeft / voicesSlider.clientWidth));
  };
  voicesSlider.addEventListener('pointerup', endDrag);
  voicesSlider.addEventListener('pointercancel', endDrag);

  setInterval(() => {
    if (Date.now() - lastTouch > 9000) goTo(idx + 1);
  }, 7000);

  window.addEventListener('resize', () => goTo(idx));
}

/* ============ Case card tilt (pointer devices only) ============ */
if (matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

/* ============ Team carousel ============ */
const teamTrack = document.getElementById('teamTrack');
if (teamTrack) {
  const cards = [...teamTrack.querySelectorAll('.tcard')];

  // cards swell toward the viewport centre and recede at the edges
  const focus = () => {
    const center = teamTrack.scrollLeft + teamTrack.clientWidth / 2;
    cards.forEach((c) => {
      const cc = c.offsetLeft + c.offsetWidth / 2;
      const f = Math.max(0, 1 - Math.abs(cc - center) / (teamTrack.clientWidth * 0.85));
      c.style.transform = `scale(${0.9 + 0.1 * f}) translateY(${(1 - f) * 12}px)`;
      c.style.opacity = 0.55 + 0.45 * f;
    });
  };
  teamTrack.addEventListener('scroll', () => requestAnimationFrame(focus), { passive: true });
  window.addEventListener('resize', focus);
  focus();

  const step = () => cards[0].offsetWidth + 26;
  document.getElementById('teamPrev').addEventListener('click', () => teamTrack.scrollBy({ left: -step(), behavior: 'smooth' }));
  document.getElementById('teamNext').addEventListener('click', () => teamTrack.scrollBy({ left: step(), behavior: 'smooth' }));

  /* ---- member modal: open on card tap, close on X / Esc / backdrop ---- */
  const modal = document.getElementById('teamModal');
  const mImg = document.getElementById('modalImg');
  const mName = document.getElementById('modalName');
  const mRole = document.getElementById('modalRole');
  const mBio = document.getElementById('modalBio');
  const closeBtn = document.getElementById('modalClose');

  const open = (card) => {
    // reuse the card thumbnail's resolved URL; data-img paths aren't base-rewritten by Vite
    const thumb = card.querySelector('img');
    mImg.src = thumb.currentSrc || thumb.src;
    mImg.alt = card.dataset.name;
    mName.textContent = card.dataset.name;
    mRole.innerHTML = card.dataset.role;
    mBio.textContent = card.dataset.bio;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };
  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  cards.forEach((card) => {
    // a drag across the carousel shouldn't fire the modal
    let downX = 0;
    card.addEventListener('pointerdown', (e) => { downX = e.clientX; });
    card.addEventListener('click', (e) => {
      if (Math.abs(e.clientX - downX) < 8) open(card);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
    });
  });
  closeBtn.addEventListener('click', close);
  document.getElementById('modalBackdrop').addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}

/* ============ Mobile menu ============ */
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
if (burger) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    menu.classList.toggle('is-open');
  });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    menu.classList.remove('is-open');
  }));
}
