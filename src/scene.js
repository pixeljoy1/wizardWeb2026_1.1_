/* WebGL constructs: a particle nebula and a wireframe sigil, theme-aware
   (re-tints on `wiz:theme`) and tuned for clear visibility in both
   light and dark modes. Mounted by hero / footer / portfolio / 404. */
import * as THREE from 'three';
import { themeState } from './theme.js';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  attribute float aScale;
  attribute float aPhase;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float t = uTime * 0.35;

    // breathing wave through the field
    p.y += sin(p.x * 0.55 + t + aPhase) * 0.5;
    p.z += cos(p.x * 0.3 - t * 0.8 + aPhase) * 0.4;

    // gentle mouse repulsion in view space
    p.x += uMouse.x * 0.7 * aScale;
    p.y += uMouse.y * 0.5 * aScale;

    // scroll parallax
    p.y += uScroll * 2.2 * (0.4 + aScale * 0.6);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * 44.0 / -mv.z;
    vAlpha = smoothstep(20.0, 4.0, -mv.z) * (0.45 + 0.55 * aScale);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColorA, uColorB, glow);
    gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
  }
`;

export function mountScene(canvas, { density = 1, sigil = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
  camera.position.set(0, 0, 9);

  // --- particle nebula ---
  const COUNT = Math.floor(5200 * density);
  const pos = new Float32Array(COUNT * 3);
  const scl = new Float32Array(COUNT);
  const phs = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = Math.pow(Math.random(), 0.6) * 11;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.55 - 2;
    scl[i] = 0.25 + Math.random() * 0.75;
    phs[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phs, 1));

  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uColorA: { value: new THREE.Color('#1bb3df') },
    uColorB: { value: new THREE.Color('#eafaff') },
    uOpacity: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(geo, mat));

  // --- wireframe sigil (slow-turning icosahedron) ---
  let sigilMesh = null;
  if (sigil) {
    sigilMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.6, 1),
      new THREE.MeshBasicMaterial({ color: 0x1bb3df, wireframe: true, transparent: true, opacity: 0.22 })
    );
    sigilMesh.position.set(3.4, 0.4, 1.5);
    scene.add(sigilMesh);
  }

  // --- theme tinting ---
  function tint() {
    const { dark, colors } = themeState();
    if (dark) {
      // additive glow against near-black
      mat.blending = THREE.AdditiveBlending;
      uniforms.uColorA.value.set(colors.accent);
      uniforms.uColorB.value.set('#ffffff');
      uniforms.uOpacity.value = 1.0;
      if (sigilMesh) { sigilMesh.material.color.set(colors.accent); sigilMesh.material.opacity = 0.22; }
    } else {
      // solid ink against light background
      mat.blending = THREE.NormalBlending;
      uniforms.uColorA.value.set(colors.hot);
      uniforms.uColorB.value.set(colors.accent);
      uniforms.uOpacity.value = 0.85;
      if (sigilMesh) { sigilMesh.material.color.set(colors.hot); sigilMesh.material.opacity = 0.3; }
    }
    mat.needsUpdate = true;
  }
  tint();
  window.addEventListener('wiz:theme', tint);

  // --- interaction state (lerped) ---
  const target = { mx: 0, my: 0, scroll: 0 };
  const eased = { mx: 0, my: 0, scroll: 0 };

  window.addEventListener('pointermove', (e) => {
    target.mx = (e.clientX / window.innerWidth - 0.5) * 2;
    target.my = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let running = true;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 }).observe(canvas);

  function tick() {
    requestAnimationFrame(tick);
    if (!running) return;
    const t = clock.getElapsedTime();

    eased.mx += (target.mx - eased.mx) * 0.04;
    eased.my += (target.my - eased.my) * 0.04;
    eased.scroll += (target.scroll - eased.scroll) * 0.06;

    uniforms.uTime.value = t;
    uniforms.uMouse.value.set(eased.mx, eased.my);
    uniforms.uScroll.value = eased.scroll;

    camera.position.x = eased.mx * 0.5;
    camera.position.y = eased.my * 0.3;
    camera.lookAt(0, 0, 0);

    if (sigilMesh) {
      sigilMesh.rotation.x = t * 0.08;
      sigilMesh.rotation.y = t * 0.12 + eased.mx * 0.3;
    }
    renderer.render(scene, camera);
  }
  tick();

  return {
    setScroll(v) { target.scroll = v; },
  };
}
