// ============================================================
// scene.js  —  Lighting, camera, renderer, controls
// ============================================================

import * as THREE from 'three';
import { OrbitControls }   from 'three/addons/controls/OrbitControls.js';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { VRButton }        from 'three/addons/webxr/VRButton.js';

// ── Scene ────────────────────────────────────────────────────
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08050f);
scene.fog = new THREE.FogExp2(0x08050f, 0.004); // very light fog

// ── Camera — perspective, wide FOV ───────────────────────────
export const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  5000
);
camera.position.set(1, 1, 1);
camera.lookAt(0, 0, 0);

// ── Renderer ─────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;       // bright overall
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── LIGHTS ────────────────────────────────────────────────────

// 1. Strong ambient — lifts everything out of black
export const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// 2. Main directional from top-front (key light)
export const moonLight = new THREE.DirectionalLight(0xfff5e0, 4.0);
moonLight.position.set(1, 2, 1); // will be scaled in loader
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
scene.add(moonLight);

// 3. Fill from opposite side
export const fillLight = new THREE.DirectionalLight(0xaac0ff, 1);
fillLight.position.set(-1, 1, -1); // will be scaled in loader
scene.add(fillLight);

// 4. Warm candle glow — centre
export const candleLight = new THREE.PointLight(0xff9944, 2.5,  12);
candleLight.position.set(0, 2, 0);
scene.add(candleLight);

// 5. Second warm point light — other side of room
export const candleLight2 = new THREE.PointLight(0xff7722, 2.0,  10);
candleLight2.position.set(5, 2, 0);
scene.add(candleLight2);

// ── OrbitControls — full 360° like Sketchfab ─────────────────
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping    = true;
controls.dampingFactor    = 0.06;
controls.enablePan        = true;
controls.panSpeed         = 0.8;
controls.rotateSpeed      = 0.8;
controls.zoomSpeed        = 1.2;
controls.minDistance      = 0;       // can zoom all the way in
controls.maxDistance      = 99999;   // can zoom all the way out
// NO maxPolarAngle limit → full 360° vertical rotation like Sketchfab
controls.target.set(0, 0, 0);
controls.update();

// ── Post-processing: Bloom ────────────────────────────────────
export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
export const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3,   // strength  — was 0.8, now subtle
  0.4,   // radius
  0.6  
);
composer.addPass(bloomPass);

// ── WebXR / VR ───────────────────────────────────────────────
renderer.xr.enabled = true;
const vrBtn = VRButton.createButton(renderer);
vrBtn.id = 'btn-vr-internal';
document.getElementById('btn-vr').addEventListener('click', () => vrBtn.click());
document.body.appendChild(vrBtn);
vrBtn.style.display = 'none';

// ── Resize ────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
