// ============================================================
// main.js  —  Entry point + animation loop
// ============================================================

import * as THREE from 'three';
import './style.css';

import { scene, camera, renderer, controls, composer,
         candleLight, candleLight2, ambientLight, moonLight } from './scene.js';
import { loadScene, glowMeshes } from './loader.js';
import './interaction.js';
import { initVR, updateVR }         from './vr.js';
import { buildParticles, updateParticles } from './particles.js';

// ── Sound ─────────────────────────────────────────────────────
const listener = new THREE.AudioListener();
camera.add(listener);
const bgSound = new THREE.Audio(listener);
let soundOn = false;

new THREE.AudioLoader().load('./sounds/gothic_ambient.mp3',
  buf => { bgSound.setBuffer(buf); bgSound.setLoop(true); bgSound.setVolume(0.25); },
  undefined, () => {}
);

window.toggleSound = () => {
  soundOn = !soundOn;
  if (soundOn) { if (bgSound.buffer) bgSound.play(); }
  else { if (bgSound.isPlaying) bgSound.stop(); }
  document.getElementById('btn-sound').textContent = soundOn ? '♪ ON' : '♪ Sound';
};

// ── Day / Night ───────────────────────────────────────────────
let isNight = true;

window.toggleDayNight = () => {
  isNight = !isNight;
  const t0 = performance.now();
  const dur = 1200;

  const fromBg  = scene.background.clone();
  const fromFog = scene.fog.color.clone();
  const toBg    = new THREE.Color(isNight ? 0x08050f : 0x1a1228);
  const toFog   = new THREE.Color(isNight ? 0x08050f : 0x1a1228);

  const fromAmb  = ambientLight.intensity;
  const toAmb    = isNight ? 3.5 : 6.0;
  const fromMoon = moonLight.intensity;
  const toMoon   = isNight ? 4.0 : 7.0;

  (function step(now) {
    const t = Math.min((now - t0) / dur, 1);
    scene.background.lerpColors(fromBg, toBg, t);
    scene.fog.color.lerpColors(fromFog, toFog, t);
    ambientLight.intensity = THREE.MathUtils.lerp(fromAmb, toAmb, t);
    moonLight.intensity    = THREE.MathUtils.lerp(fromMoon, toMoon, t);
    if (t < 1) requestAnimationFrame(step);
  })(performance.now());

  document.getElementById('btn-night').textContent = isNight ? '☀ Day' : '🌙 Night';
};

// ── VR + Particles ────────────────────────────────────────────
initVR();
buildParticles();

// ── Load GLB ──────────────────────────────────────────────────
loadScene();

// ── Animation loop ────────────────────────────────────────────
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();

  // Candle flicker — organic multi-frequency noise
  const f = Math.sin(t * 7.1) * 0.7
          + Math.sin(t * 4.3) * 0.4
          + Math.sin(t * 13.7) * 0.2;
  candleLight.intensity  = 2.5 + f * 0.3;
candleLight2.intensity = 2.0 + Math.sin(t * 5.9 + 1.3) * 0.2;

  // Subtle candle position drift — makes shadows dance
  candleLight.position.x += (Math.sin(t * 2.1) * 0.02 - candleLight.position.x * 0.01);
  candleLight.position.z += (Math.cos(t * 1.7) * 0.02 - candleLight.position.z * 0.01);

  // Animate glow meshes — pulse emissive intensity
  for (const g of glowMeshes) {
    if (!g.mesh?.material) continue;
    if (g.isCharacter) {
      // Character: gentle breathing pulse
      g.mesh.material.emissiveIntensity =
        g.baseIntensity + Math.sin(t * 1.5) * 0.3;
    } else {
      // Other glowing objects: faster flicker
      g.mesh.material.emissiveIntensity =
        g.baseIntensity + Math.sin(t * 4.0 + g.baseIntensity) * 0.4;
    }
  }

  updateParticles();
  updateVR();
  controls.update();
  composer.render();
});
