// ============================================================
// main.js  —  Entry point + animation loop (Enhanced)
// ============================================================

import * as THREE from 'three';
import './style.css';

import { scene, camera, renderer, controls, composer,
         candleLight, candleLight2, ambientLight, moonLight, 
         fillLight, rimLight, updatePostProcessing,
         toggleBloom, toggleAfterimage, toggleVignette } from './scene.js';
import { loadScene, glowMeshes } from './loader.js';
import './interaction.js';
import { initEnhancedParticles, updateEnhancedParticles, setWeather } from './particles-enhanced.js';

// ── Sound ─────────────────────────────────────────────────────
const listener = new THREE.AudioListener();
camera.add(listener);
const bgSound = new THREE.Audio(listener);
let soundOn = false;

new THREE.AudioLoader().load('./sounds/moon.mp3',
    buf => {
        bgSound.setBuffer(buf);
        bgSound.setLoop(true);
        bgSound.setVolume(0.35);
        console.log('✅ Audio loaded');
    },
    undefined,
    (err) => console.error('Audio error:', err)
);

window.toggleSound = () => {
    soundOn = !soundOn;
    if (soundOn) {
        if (bgSound.buffer) bgSound.play();
    } else {
        if (bgSound.isPlaying) bgSound.stop();
    }
    document.getElementById('btn-sound').textContent = soundOn ? '♪ ON' : '♪ Sound';
};

// ── Day / Night ───────────────────────────────────────────────
let isNight = true;

window.toggleDayNight = () => {
    isNight = !isNight;
    const t0 = performance.now();
    const dur = 1200;

    const fromBg = scene.background.clone();
    const fromFog = scene.fog.color.clone();
    const toBg = new THREE.Color(isNight ? 0x0a0a1a : 0x2a1a3a);
    const toFog = new THREE.Color(isNight ? 0x0a0a1a : 0x2a1a3a);

    const fromAmb = ambientLight.intensity;
    const toAmb = isNight ? 1.0 : 2.2;
    const fromMoon = moonLight.intensity;
    const toMoon = isNight ? 4.0 : 6.5;

    (function step(now) {
        const t = Math.min((now - t0) / dur, 1);
        scene.background.lerpColors(fromBg, toBg, t);
        scene.fog.color.lerpColors(fromFog, toFog, t);
        ambientLight.intensity = THREE.MathUtils.lerp(fromAmb, toAmb, t);
        moonLight.intensity = THREE.MathUtils.lerp(fromMoon, toMoon, t);
        if (t < 1) requestAnimationFrame(step);
    })(performance.now());

    document.getElementById('btn-night').textContent = isNight ? '☀ Day' : '🌙 Night';
};

// ── Weather Control ───────────────────────────────────────────
let weatherIndex = 0;
const weathers = ['embers', 'rain', 'snow', 'ash'];

window.toggleWeather = () => {
    weatherIndex = (weatherIndex + 1) % weathers.length;
    setWeather(weathers[weatherIndex]);
};

// ── Initialize Enhanced Particles ────────────────────────────
initEnhancedParticles();

// ── Load GLB ──────────────────────────────────────────────────
loadScene();

// ── Animation Loop ────────────────────────────────────────────
const clock = new THREE.Clock();
let postTime = 0;

renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    postTime += 0.016; // For post-processing effects
    
    // Candle flicker
    const f = Math.sin(t * 6.2) * 0.6 + Math.sin(t * 3.8) * 0.4 + Math.sin(t * 12.5) * 0.25;
    candleLight.intensity = 2.8 + f * 0.35;
    candleLight2.intensity = 2.2 + Math.sin(t * 5.2 + 1.3) * 0.25;
    
    // Subtle candle position drift
    candleLight.position.x += (Math.sin(t * 1.8) * 0.012 - candleLight.position.x * 0.006);
    candleLight.position.z += (Math.cos(t * 1.5) * 0.012 - candleLight.position.z * 0.006);
    
    // Update glow meshes
    for (const g of glowMeshes) {
        if (!g.mesh?.material) continue;
        if (g.isCharacter) {
            const heartbeat = Math.sin(t * 5.0) * 0.15 + Math.sin(t * 2.5) * 0.1;
            g.mesh.material.emissiveIntensity = Math.max(0.3, g.baseIntensity + heartbeat);
        } else {
            g.mesh.material.emissiveIntensity = g.baseIntensity + Math.sin(t * 2.5 + g.baseIntensity) * 0.2;
        }
    }
    
    // Update enhanced particles (embers + weather)
    updateEnhancedParticles(t);
    
    // Update post-processing effects
    updatePostProcessing(postTime);
    
    controls.update();
    composer.render();
});

// ── Add Controls to UI ───────────────────────────────────────
// This will be added in the HTML