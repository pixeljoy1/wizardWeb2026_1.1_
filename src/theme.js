/* Theme engine: system/light/dark mode + accent ("foreground theme").
   Persisted in localStorage; broadcasts `wiz:theme` so WebGL scenes
   can re-tint live. A tiny inline script in each page <head> pre-sets
   data-mode/data-accent before first paint to avoid a flash. */

export const ACCENTS = {
  teal:    { accent: '#1bb3df', hot: '#0d8fb5', hue: 194 },
  violet:  { accent: '#a78bfa', hot: '#7c5cff', hue: 258 },
  amber:   { accent: '#f5a524', hot: '#d97706', hue: 38 },
  emerald: { accent: '#34d399', hot: '#059669', hue: 158 },
};

const systemDark = matchMedia('(prefers-color-scheme: dark)');

export function themeState() {
  const mode = localStorage.getItem('wiz-mode') || 'system';
  const accent = localStorage.getItem('wiz-accent') || 'teal';
  const dark = mode === 'dark' || (mode === 'system' && systemDark.matches);
  return { mode, accent, dark, colors: ACCENTS[accent] || ACCENTS.teal };
}

function apply() {
  const s = themeState();
  const root = document.documentElement;
  root.dataset.mode = s.dark ? 'dark' : 'light';
  root.dataset.accent = s.accent;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.dark ? '#0a0e12' : '#f6f9fb');
  syncControls(s);
  window.dispatchEvent(new CustomEvent('wiz:theme', { detail: s }));
}

function set(key, val) {
  localStorage.setItem(key, val);
  apply();
}

function syncControls(s) {
  document.querySelectorAll('[data-set="mode"] button').forEach((b) =>
    b.classList.toggle('is-on', b.dataset.val === s.mode));
  document.querySelectorAll('[data-set="accent"] button').forEach((b) =>
    b.classList.toggle('is-on', b.dataset.val === s.accent));
}

export function initTheme() {
  systemDark.addEventListener('change', () => {
    if ((localStorage.getItem('wiz-mode') || 'system') === 'system') apply();
  });

  const btn = document.getElementById('settingsBtn');
  const panel = document.getElementById('settingsPanel');
  if (btn && panel) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('is-open');
    });
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target)) panel.classList.remove('is-open');
    });
    panel.querySelectorAll('[data-set="mode"] button').forEach((b) =>
      b.addEventListener('click', () => set('wiz-mode', b.dataset.val)));
    panel.querySelectorAll('[data-set="accent"] button').forEach((b) =>
      b.addEventListener('click', () => set('wiz-accent', b.dataset.val)));
  }
  apply();
}
