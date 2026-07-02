import { mountScene } from './scene.js';
import { initCommon } from './common.js';

initCommon();

const canvas = document.getElementById('pfCanvas');
if (canvas) mountScene(canvas, { density: 0.6, sigil: true });

/* ============ Category filters ============ */
const buttons = document.querySelectorAll('.filters button');
const cards = document.querySelectorAll('.pf-card');
buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    buttons.forEach((b) => b.classList.toggle('is-on', b === btn));
    const cat = btn.dataset.filter;
    cards.forEach((card) => {
      card.classList.toggle('is-hidden', cat !== 'all' && card.dataset.cat !== cat);
    });
  });
});

/* ============ Stat counters ============ */
const counter = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    counter.unobserve(e.target);
    const end = +e.target.dataset.count;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / 1600, 1);
      e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach((el) => counter.observe(el));

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
