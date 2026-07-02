/* Shared page behaviors: theme init, version pill, custom cursor,
   magnetic hovers, scroll reveals. Imported by every page entry. */
import { initTheme } from './theme.js';

export const canHover = matchMedia('(hover: hover)').matches;

export function initCommon() {
  initTheme();

  document.querySelectorAll('.ver-pill').forEach((el) => { el.textContent = __BUILD_VERSION__; });

  /* reveal on scroll */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealer.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal-up, .reveal-line').forEach((el) => revealer.observe(el));

  /* custom cursor: the brand arrow, steering toward travel direction */
  const cursor = document.getElementById('wcursor');
  if (cursor && canHover) {
    const arrow = cursor.querySelector('.wcursor__arrow');
    const BASE = -130; // the drawn arrow points up-left at ~-130° in screen coords
    let cx = 0, cy = 0, tx = 0, ty = 0;
    let rot = 0, rotTarget = 0, lastMove = 0;

    window.addEventListener('pointermove', (e) => {
      const dx = e.clientX - tx;
      const dy = e.clientY - ty;
      tx = e.clientX; ty = e.clientY;
      if (Math.hypot(dx, dy) > 3) {
        rotTarget = (Math.atan2(dy, dx) * 180) / Math.PI - BASE;
        lastMove = performance.now();
      }
    });

    (function follow() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      // idle: the arrow relaxes back upright
      if (performance.now() - lastMove > 700) {
        rotTarget = ((rotTarget + 540) % 360) - 180;
        rotTarget *= 0.92;
      }
      // steer along the shortest angular path
      const d = ((rotTarget - rot + 540) % 360) - 180;
      rot += d * 0.14;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      arrow.style.transform = `rotate(${rot}deg)`;
      requestAnimationFrame(follow);
    })();

    document.querySelectorAll('a, button, [data-service]').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
    });
  }

  /* magnetic elements */
  if (canHover) document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}
