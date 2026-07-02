import { mountScene } from './scene.js';
import { mountHeroScene } from './heroScene.js';
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
/* Hero runs the particle-arrow construct (heroScene.js). To revert to
   the original nebula: mountScene(heroCanvas, { density: 1, sigil: true }) */
const heroCanvas = document.getElementById('heroCanvas');
const heroScene = heroCanvas ? mountHeroScene(heroCanvas) : null;
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

/* ============ Marquees ============ */
document.querySelectorAll('.marquee__track').forEach((track) => {
  track.innerHTML += track.innerHTML; // duplicate for seamless loop
  const speed = +track.dataset.speed || 1;
  let x = 0;
  (function move() {
    x -= 0.045 * speed;
    if (x <= -50) x += 50;
    if (x > 0) x -= 50;
    track.style.transform = `translateX(${x}%)`;
    requestAnimationFrame(move);
  })();
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

/* ============ Testimonial slider ============ */
const voices = [...document.querySelectorAll('.voice')];
if (voices.length) {
  let idx = 0;
  const count = document.getElementById('voiceCount');
  const show = (i) => {
    idx = (i + voices.length) % voices.length;
    voices.forEach((v, k) => v.classList.toggle('is-active', k === idx));
    count.textContent = `${idx + 1} / ${voices.length}`;
  };
  document.getElementById('voicePrev').addEventListener('click', () => show(idx - 1));
  document.getElementById('voiceNext').addEventListener('click', () => show(idx + 1));
  setInterval(() => show(idx + 1), 7000);
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
