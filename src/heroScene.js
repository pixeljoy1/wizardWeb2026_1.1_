/* Hero construct: the Wizard arrow mark, assembled from particles.
   Pixel positions and shades are sampled from the brand's own arrow
   graphic (assets/arrow.png). Particles swirl in from a nebula, form
   the mark, breathe, repel from the pointer, and disperse on scroll.
   The previous nebula scene lives on in scene.js (footer/404/portfolio)
   and can be re-mounted here as a revert. */
import * as THREE from 'three';
import { themeState } from './theme.js';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uForm;
  uniform vec2 uMouseW;
  uniform float uScroll;
  attribute vec3 aHome;
  attribute vec3 aSwirl;
  attribute float aScale;
  attribute float aPhase;
  attribute float aShade;
  attribute float aForm;
  varying float vAlpha;
  varying float vShade;

  void main() {
    float t = uTime;

    // drifting nebula position
    vec3 sw = aSwirl;
    sw.x += sin(t * 0.22 + aPhase) * 1.3;
    sw.y += cos(t * 0.18 + aPhase * 1.4) * 0.9;
    sw.z += sin(t * 0.15 + aPhase * 0.7) * 0.6;

    // formation position with a gentle breath
    vec3 home = aHome;
    home.x += sin(t * 0.9 + aPhase) * 0.04;
    home.y += cos(t * 1.1 + aPhase) * 0.04;
    home.z += sin(t * 0.6 + aPhase) * 0.1;

    vec3 p = mix(sw, home, uForm * aForm);

    // pointer repulsion on the formation plane
    vec2 d = p.xy - uMouseW;
    float dist = length(d);
    float push = smoothstep(1.7, 0.0, dist);
    if (dist > 0.0001) p.xy += normalize(d) * push * 1.0;

    // scroll disperse + rise
    p.y += uScroll * 3.2 * (0.5 + aScale * 0.5);
    p.x += uScroll * (aPhase - 3.14) * 0.4;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * 42.0 / -mv.z;
    vAlpha = (0.45 + 0.55 * aScale) * mix(0.5, 1.0, aForm * uForm);
    vShade = aShade;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColInk;
  uniform vec3 uColAccent;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vShade;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.06, d);
    vec3 col = mix(uColAccent, uColInk, vShade);
    gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
  }
`;

/* Sample opaque pixels of the arrow graphic into world-space targets.
   Shade 1 = dark pixels (the ink arrow), 0 = light pixels (the white
   arrow), so each half of the mark keeps its two-tone identity. */
function sampleImage(img, maxPoints = 6500) {
  const W = 200;
  const H = Math.round((img.height / img.width) * W);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  const pts = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 110) continue;
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      pts.push({ x, y, shade: lum < 0.45 ? 1 : 0 }); // charcoal ~0.33, brand teal ~0.57
    }
  }
  // thin uniformly to the particle budget
  const keep = Math.min(1, maxPoints / pts.length);
  const world = [];
  const SCALE = 7.2 / W; // arrow spans ~7.2 world units
  for (const p of pts) {
    if (Math.random() > keep) continue;
    world.push({
      x: (p.x - W / 2) * SCALE,
      y: (H / 2 - p.y) * SCALE,
      z: (Math.random() - 0.5) * 0.35,
      shade: p.shade,
    });
  }
  return world;
}

export function mountHeroScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
  camera.position.set(0, 0, 9);

  const uniforms = {
    uTime: { value: 0 },
    uForm: { value: 0 },
    uScroll: { value: 0 },
    uMouseW: { value: new THREE.Vector2(99, 99) },
    uColInk: { value: new THREE.Color('#17222c') },
    uColAccent: { value: new THREE.Color('#1bb3df') },
    uOpacity: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  let points = null;

  function buildGeometry(targets) {
    const AMBIENT = 900;
    const total = targets.length + AMBIENT;
    const home = new Float32Array(total * 3);
    const swirl = new Float32Array(total * 3);
    const scl = new Float32Array(total);
    const phs = new Float32Array(total);
    const shd = new Float32Array(total);
    const frm = new Float32Array(total);

    for (let i = 0; i < total; i++) {
      const isFormation = i < targets.length;
      // nebula start / ambient drift positions
      const r = Math.pow(Math.random(), 0.6) * 10;
      const a = Math.random() * Math.PI * 2;
      swirl[i * 3] = Math.cos(a) * r;
      swirl[i * 3 + 1] = (Math.random() - 0.5) * 6;
      swirl[i * 3 + 2] = Math.sin(a) * r * 0.5 - 2;

      if (isFormation) {
        const t = targets[i];
        home[i * 3] = t.x;
        home[i * 3 + 1] = t.y;
        home[i * 3 + 2] = t.z;
        shd[i] = t.shade;
        frm[i] = 1;
        scl[i] = 0.35 + Math.random() * 0.5;
      } else {
        shd[i] = 0; // ambient stays accent-coloured
        frm[i] = 0;
        scl[i] = 0.2 + Math.random() * 0.45;
      }
      phs[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(home, 3)); // unused, keeps three happy
    geo.setAttribute('aHome', new THREE.BufferAttribute(home, 3));
    geo.setAttribute('aSwirl', new THREE.BufferAttribute(swirl, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phs, 1));
    geo.setAttribute('aShade', new THREE.BufferAttribute(shd, 1));
    geo.setAttribute('aForm', new THREE.BufferAttribute(frm, 1));
    points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);
    layout();
  }

  const img = new Image();
  img.onload = () => buildGeometry(sampleImage(img));
  img.onerror = () => {
    // graphic unavailable: fall back to a pure nebula so the hero never goes empty
    const targets = [];
    for (let i = 0; i < 4000; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.5) * 4;
      targets.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.6, z: (Math.random() - 0.5) * 2, shade: Math.random() < 0.4 ? 1 : 0 });
    }
    buildGeometry(targets);
  };
  img.src = `${import.meta.env.BASE_URL}assets/arrow.png`;

  // --- theme tinting ---
  function tint() {
    const { dark, colors } = themeState();
    if (dark) {
      mat.blending = THREE.AdditiveBlending;
      uniforms.uColInk.value.set('#e9f1f6');
      uniforms.uColAccent.value.set(colors.accent);
      uniforms.uOpacity.value = 1.0;
    } else {
      mat.blending = THREE.NormalBlending;
      uniforms.uColInk.value.set('#2a3742');
      uniforms.uColAccent.value.set(colors.hot);
      uniforms.uOpacity.value = 0.92;
    }
    mat.needsUpdate = true;
  }
  tint();
  window.addEventListener('wiz:theme', tint);

  // --- responsive layout: fit / place the mark ---
  function layout() {
    if (!points) return;
    const visH = 2 * Math.tan((55 * Math.PI) / 360) * 9;
    const visW = visH * camera.aspect;
    const s = Math.min(1.15, (visW * 0.72) / 7.2);
    points.scale.setScalar(s);
    if (camera.aspect > 1.05) {
      points.position.set(visW * 0.16, 0.4, 0); // desktop: right of the headline
    } else {
      points.position.set(0, visH * 0.16, 0);   // mobile: above the headline
    }
  }

  // --- pointer, projected onto the formation plane (z = 0) ---
  const target = { mx: 0, my: 0, scroll: 0 };
  const eased = { mx: 0, my: 0, scroll: 0 };
  const ndc = new THREE.Vector3();

  window.addEventListener('pointermove', (e) => {
    target.mx = (e.clientX / window.innerWidth - 0.5) * 2;
    target.my = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let running = true;
  let formTarget = 0;
  setTimeout(() => { formTarget = 1; }, 500); // beat of nebula before assembly

  new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 }).observe(canvas);

  function tick() {
    requestAnimationFrame(tick);
    if (!running) return;
    const t = clock.getElapsedTime();

    eased.mx += (target.mx - eased.mx) * 0.05;
    eased.my += (target.my - eased.my) * 0.05;
    eased.scroll += (target.scroll - eased.scroll) * 0.06;

    // scrolling melts the mark back into the nebula
    const form = formTarget * (1 - Math.min(eased.scroll, 1) * 0.9);
    uniforms.uForm.value += (form - uniforms.uForm.value) * 0.03;

    uniforms.uTime.value = t;
    uniforms.uScroll.value = eased.scroll;

    // unproject pointer to world coords on z=0, in formation-local space
    if (points) {
      ndc.set(eased.mx, eased.my, 0.5).unproject(camera);
      const dir = ndc.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      const wx = camera.position.x + dir.x * dist;
      const wy = camera.position.y + dir.y * dist;
      uniforms.uMouseW.value.set(
        (wx - points.position.x) / points.scale.x,
        (wy - points.position.y) / points.scale.y
      );
      points.rotation.y = eased.mx * 0.12;
      points.rotation.x = -eased.my * 0.08;
    }

    camera.position.x = eased.mx * 0.35;
    camera.position.y = eased.my * 0.25;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  tick();

  return {
    setScroll(v) { target.scroll = v; },
  };
}
