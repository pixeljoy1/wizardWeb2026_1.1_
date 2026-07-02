/* Hero construct v3: the brand symbol rebuilt in true 3D.
   An extruded teal arrow (the logo silhouette), a charcoal circuit
   line with spherical joint nodes and a ring terminal, the pixel
   trail as tumbling cubes, and orbiting sparks, all floating on
   spring-smooth motion with mouse tilt and scroll drift.
   Previous hero scenes are kept for revert: scene.js (nebula),
   heroScene.js (particle arrow). */
import * as THREE from 'three';
import { themeState } from './theme.js';

function easeOutBack(p) {
  const s = 1.35;
  return 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
}

export function mountHeroMark(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
  camera.position.set(0, 0, 9);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x556677, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x1bb3df, 12, 30);
  rim.position.set(-4, -2, 4);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  const mats = {
    arrow: new THREE.MeshStandardMaterial({ color: '#1bb3df', roughness: 0.32, metalness: 0.15 }),
    ink: new THREE.MeshStandardMaterial({ color: '#404041', roughness: 0.45, metalness: 0.1 }),
    spark: new THREE.MeshStandardMaterial({ color: '#1bb3df', roughness: 0.3, metalness: 0.2 }),
  };

  /* --- the arrow, extruded from the logo silhouette --- */
  const PTS = [[7, 5], [29, 15.5], [19.5, 18.5], [24.5, 30], [18.5, 32.5], [14, 20.5], [7, 27]];
  const shape = new THREE.Shape();
  PTS.forEach(([px, py], i) => {
    const x = (px - 18) / 5.6;
    const y = (18.75 - py) / 5.6;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  });
  shape.closePath();
  const arrowGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.75, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3,
  });
  arrowGeo.center();
  const arrow = new THREE.Mesh(arrowGeo, mats.arrow);
  arrow.rotation.z = 0.5; // aim the head upward, like the mark
  group.add(arrow);

  /* --- circuit line with joint nodes, rising behind the arrow --- */
  const JOINTS = [
    new THREE.Vector3(-3.3, -2.5, -0.5),
    new THREE.Vector3(-2.1, -1.0, -0.3),
    new THREE.Vector3(-3.0, 0.6, -0.4),
    new THREE.Vector3(-1.6, 2.1, -0.2),
  ];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < JOINTS.length - 1; i++) {
    const a = JOINTS[i], b = JOINTS[i + 1];
    const dir = b.clone().sub(a);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, dir.length(), 12), mats.ink);
    seg.position.copy(a).add(dir.clone().multiplyScalar(0.5));
    seg.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    group.add(seg);
  }
  JOINTS.forEach((p, i) => {
    if (i === JOINTS.length - 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.09, 12, 28), mats.ink);
      ring.position.copy(p);
      group.add(ring);
    } else {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), mats.ink);
      node.position.copy(p);
      group.add(node);
    }
  });

  /* --- the pixel trail: tumbling cubes near the base --- */
  const cubes = [];
  for (let i = 0; i < 6; i++) {
    const s = 0.16 + Math.random() * 0.2;
    const cube = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), i % 2 ? mats.spark : mats.ink);
    cube.position.set(-3.6 + Math.random() * 1.3, -3.4 + Math.random() * 1.1, -0.4 + Math.random() * 0.9);
    cube.userData = { base: cube.position.y, phase: Math.random() * Math.PI * 2, spin: 0.3 + Math.random() * 0.6 };
    cubes.push(cube);
    group.add(cube);
  }

  /* --- orbiting sparks --- */
  const sparks = [];
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.1 + i * 0.03, 14, 14), mats.spark);
    sp.userData = { r: 3.1 + i * 0.55, speed: 0.5 - i * 0.13, phase: (i * Math.PI * 2) / 3, tilt: 0.35 + i * 0.2 };
    sparks.push(sp);
    group.add(sp);
  }

  /* --- faint depth particles --- */
  const N = 320;
  const ppos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    ppos[i * 3] = (Math.random() - 0.5) * 22;
    ppos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    ppos[i * 3 + 2] = -3 - Math.random() * 8;
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const pmat = new THREE.PointsMaterial({ color: '#1bb3df', size: 0.05, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(pgeo, pmat));

  /* --- theme tinting --- */
  function tint() {
    const { dark, colors } = themeState();
    mats.arrow.color.set(dark ? colors.accent : colors.hot);
    mats.spark.color.set(dark ? colors.accent : colors.hot);
    mats.ink.color.set(dark ? '#cfdbe4' : '#404041');
    mats.arrow.emissive.set(dark ? colors.hot : '#000000');
    mats.arrow.emissiveIntensity = dark ? 0.25 : 0;
    rim.color.set(colors.accent);
    pmat.color.set(dark ? colors.accent : colors.hot);
    pmat.opacity = dark ? 0.55 : 0.4;
  }
  tint();
  window.addEventListener('wiz:theme', tint);

  /* --- layout / interaction --- */
  const target = { mx: 0, my: 0, scroll: 0 };
  const eased = { mx: 0, my: 0, scroll: 0 };

  window.addEventListener('pointermove', (e) => {
    target.mx = (e.clientX / window.innerWidth - 0.5) * 2;
    target.my = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  let baseScale = 1;
  function layout() {
    const visH = 2 * Math.tan((55 * Math.PI) / 360) * 9;
    const visW = visH * camera.aspect;
    baseScale = Math.min(1.05, (visW * 0.62) / 8);
    if (camera.aspect > 1.05) {
      group.position.set(visW * 0.2, 0.2, 0);
    } else {
      baseScale *= 0.85;
      group.position.set(0.3, visH * 0.18, 0);
    }
  }

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
  new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { threshold: 0 }).observe(canvas);

  function tick() {
    requestAnimationFrame(tick);
    if (!running) return;
    const t = clock.getElapsedTime();

    eased.mx += (target.mx - eased.mx) * 0.045;
    eased.my += (target.my - eased.my) * 0.045;
    eased.scroll += (target.scroll - eased.scroll) * 0.06;

    // springy entrance, then a soft breathing scale
    const intro = easeOutBack(Math.min(t / 1.4, 1));
    const breathe = 1 + Math.sin(t * 0.9) * 0.012;
    group.scale.setScalar(baseScale * intro * breathe);

    // float + mouse tilt + scroll drift
    group.rotation.y = Math.sin(t * 0.35) * 0.16 + eased.mx * 0.4 + eased.scroll * 0.6;
    group.rotation.x = Math.sin(t * 0.27) * 0.06 - eased.my * 0.22;
    group.position.y += ((Math.sin(t * 0.8) * 0.18 + eased.scroll * 3.0) - (group.position.y - groupBaseY())) * 0.08;

    // the arrow itself sways a touch out of phase
    arrow.rotation.z = 0.5 + Math.sin(t * 0.6) * 0.05;
    arrow.position.y = Math.sin(t * 1.1) * 0.08;

    // pixels tumble, sparks orbit
    cubes.forEach((c) => {
      c.position.y = c.userData.base + Math.sin(t * 1.2 + c.userData.phase) * 0.14;
      c.rotation.x = t * c.userData.spin;
      c.rotation.y = t * c.userData.spin * 0.8;
    });
    sparks.forEach((s) => {
      const a = t * s.userData.speed + s.userData.phase;
      s.position.set(
        Math.cos(a) * s.userData.r,
        Math.sin(a) * s.userData.r * s.userData.tilt,
        Math.sin(a * 0.9) * 1.4
      );
    });

    camera.position.x = eased.mx * 0.3;
    camera.position.y = eased.my * 0.2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  // group bobs around its layout anchor
  let anchorY = group.position.y;
  function groupBaseY() { return anchorY; }
  const relayout = () => { layout(); anchorY = group.position.y; };
  window.addEventListener('resize', relayout);
  relayout();

  tick();

  return {
    setScroll(v) { target.scroll = v; },
  };
}
