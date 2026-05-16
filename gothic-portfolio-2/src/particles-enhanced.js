// ============================================================
// particles-enhanced.js  —  Weather Effects + Floating Embers
// ============================================================

import * as THREE from 'three';
import { scene, camera } from './scene.js';

// ── Weather Settings ─────────────────────────────────────────
let currentWeather = 'embers';
let weatherSystem = null;
let weatherParticles = null;
let emberParticles = null;

// ── Floating Embers (EVERYWHERE in the scene) ────────────────
const EMBER_COUNT = 800; // More particles for full coverage
let emberVelocities = [];

// ── Scene boundaries (large area)
const SCENE_SIZE = 45; // Much larger area
const SCENE_HEIGHT = 12;

export function initEnhancedParticles() {
    createEmberSystem();
    createWeatherSystem('embers');
}

// ── Floating Embers - EVERYWHERE ─────────────────────────────
function createEmberSystem() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(EMBER_COUNT * 3);
    const colors = new Float32Array(EMBER_COUNT * 3);
    
    emberVelocities = [];
    
    for (let i = 0; i < EMBER_COUNT; i++) {
        // Spread embers across the ENTIRE scene
        positions[i*3] = (Math.random() - 0.5) * SCENE_SIZE;
        positions[i*3+1] = Math.random() * SCENE_HEIGHT;
        positions[i*3+2] = (Math.random() - 0.5) * SCENE_SIZE;
        
        // Colors: warm orange, gold, red, purple
        const colorType = Math.random();
        if (colorType < 0.5) {
            // Orange/gold
            colors[i*3] = 1.0;
            colors[i*3+1] = 0.5 + Math.random() * 0.4;
            colors[i*3+2] = 0.1 + Math.random() * 0.2;
        } else if (colorType < 0.75) {
            // Red/magenta
            colors[i*3] = 1.0;
            colors[i*3+1] = 0.2 + Math.random() * 0.3;
            colors[i*3+2] = 0.3 + Math.random() * 0.3;
        } else {
            // Purple magical ember
            colors[i*3] = 0.7 + Math.random() * 0.3;
            colors[i*3+1] = 0.3 + Math.random() * 0.3;
            colors[i*3+2] = 1.0;
        }
        
        emberVelocities.push({
            x: (Math.random() - 0.5) * 0.015,
            y: 0.008 + Math.random() * 0.02,
            z: (Math.random() - 0.5) * 0.015,
            life: Math.random(),
            speed: 0.5 + Math.random() * 0.8,
            floatOffset: Math.random() * Math.PI * 2
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const emberMaterial = new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    emberParticles = new THREE.Points(geometry, emberMaterial);
    scene.add(emberParticles);
}

// ── Weather System (EVERYWHERE) ──────────────────────────────
function createWeatherSystem(type) {
    // Remove old weather
    if (weatherParticles) {
        scene.remove(weatherParticles);
    }
    
    let count = 0;
    let color, size;
    
    switch(type) {
        case 'rain':
            count = 3000; // More rain particles
            color = new THREE.Color(0x88aaff);
            size = 0.04;
            break;
        case 'snow':
            count = 2000;
            color = new THREE.Color(0xccddff);
            size = 0.08;
            break;
        case 'ash':
            count = 2500;
            color = new THREE.Color(0x886666);
            size = 0.06;
            break;
        default:
            return;
    }
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        // Spread weather particles across the ENTIRE scene
        positions[i*3] = (Math.random() - 0.5) * SCENE_SIZE;
        positions[i*3+1] = Math.random() * SCENE_HEIGHT;
        positions[i*3+2] = (Math.random() - 0.5) * SCENE_SIZE;
        
        if (type === 'rain') {
            velocities[i*3] = (Math.random() - 0.5) * 0.03;
            velocities[i*3+1] = -0.18 - Math.random() * 0.12;
            velocities[i*3+2] = (Math.random() - 0.5) * 0.03;
        } else if (type === 'snow') {
            velocities[i*3] = (Math.random() - 0.5) * 0.015;
            velocities[i*3+1] = -0.04 - Math.random() * 0.05;
            velocities[i*3+2] = (Math.random() - 0.5) * 0.015;
        } else if (type === 'ash') {
            velocities[i*3] = (Math.random() - 0.5) * 0.012;
            velocities[i*3+1] = -0.025 - Math.random() * 0.04;
            velocities[i*3+2] = (Math.random() - 0.5) * 0.012;
        }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData = { velocities };
    
    const material = new THREE.PointsMaterial({
        color: color,
        size: size,
        transparent: true,
        opacity: 0.6,
        blending: type === 'rain' ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false
    });
    
    weatherParticles = new THREE.Points(geometry, material);
    scene.add(weatherParticles);
}

// ── Switch Weather ───────────────────────────────────────────
export function setWeather(type) {
    currentWeather = type;
    if (type === 'embers') {
        if (weatherParticles) {
            scene.remove(weatherParticles);
            weatherParticles = null;
        }
    } else {
        createWeatherSystem(type);
    }
    
    // Update UI button
    const weatherBtn = document.getElementById('btn-weather');
    if (weatherBtn) {
        const icons = { embers: '🔥', rain: '🌧', snow: '❄️', ash: '💨' };
        weatherBtn.innerHTML = `${icons[type] || '🌤'} Weather`;
    }
    
    console.log(`🌤 Weather changed to: ${type}`);
}

// ── Update Particles (EVERYWHERE) ────────────────────────────
export function updateEnhancedParticles(time) {
    // Update Floating Embers - EVERYWHERE
    if (emberParticles) {
        const positions = emberParticles.geometry.attributes.position.array;
        
        for (let i = 0; i < EMBER_COUNT; i++) {
            // Update position
            positions[i*3] += emberVelocities[i].x;
            positions[i*3+1] += emberVelocities[i].y;
            positions[i*3+2] += emberVelocities[i].z;
            
            // Add gentle floating oscillation
            positions[i*3] += Math.sin(time * 0.5 + emberVelocities[i].floatOffset) * 0.002;
            positions[i*3+2] += Math.cos(time * 0.4 + emberVelocities[i].floatOffset) * 0.002;
            
            // RESET when outside scene bounds - with random position ANYWHERE
            if (positions[i*3+1] > SCENE_HEIGHT || 
                positions[i*3+1] < 0 ||
                Math.abs(positions[i*3]) > SCENE_SIZE / 1.5 || 
                Math.abs(positions[i*3+2]) > SCENE_SIZE / 1.5) {
                
                // Respawn at a RANDOM location anywhere in the scene
                positions[i*3] = (Math.random() - 0.5) * SCENE_SIZE;
                positions[i*3+1] = 0.2 + Math.random() * 1;
                positions[i*3+2] = (Math.random() - 0.5) * SCENE_SIZE;
                
                // Random horizontal velocity
                emberVelocities[i].x = (Math.random() - 0.5) * 0.018;
                emberVelocities[i].z = (Math.random() - 0.5) * 0.018;
                emberVelocities[i].y = 0.008 + Math.random() * 0.025;
            }
        }
        
        emberParticles.geometry.attributes.position.needsUpdate = true;
        
        // Animate ember material opacity (collective flicker)
        const globalFlicker = 0.6 + Math.sin(time * 12) * 0.25;
        emberParticles.material.opacity = 0.7 + Math.sin(time * 15) * 0.15;
        emberParticles.material.size = 0.055 + Math.sin(time * 20) * 0.01;
    }
    
    // Update Weather Particles - EVERYWHERE
    if (weatherParticles) {
        const positions = weatherParticles.geometry.attributes.position.array;
        const velocities = weatherParticles.geometry.userData.velocities;
        const count = positions.length / 3;
        
        for (let i = 0; i < count; i++) {
            positions[i*3] += velocities[i*3];
            positions[i*3+1] += velocities[i*3+1];
            positions[i*3+2] += velocities[i*3+2];
            
            // RESET when outside bounds - respawn ANYWHERE in scene
            if (positions[i*3+1] < -1 || positions[i*3+1] > SCENE_HEIGHT + 2 ||
                Math.abs(positions[i*3]) > SCENE_SIZE / 1.3 || 
                Math.abs(positions[i*3+2]) > SCENE_SIZE / 1.3) {
                
                // Respawn at random location
                positions[i*3] = (Math.random() - 0.5) * SCENE_SIZE;
                positions[i*3+1] = SCENE_HEIGHT - 2 + Math.random() * 4;
                positions[i*3+2] = (Math.random() - 0.5) * SCENE_SIZE;
                
                // Randomize horizontal drift slightly for variety
                if (velocities[i*3]) {
                    velocities[i*3] = (Math.random() - 0.5) * 0.025;
                    velocities[i*3+2] = (Math.random() - 0.5) * 0.025;
                }
            }
        }
        
        weatherParticles.geometry.attributes.position.needsUpdate = true;
    }
}

// ── Get scene size for camera fitting ────────────────────────
export function getSceneBounds() {
    return { size: SCENE_SIZE, height: SCENE_HEIGHT };
}