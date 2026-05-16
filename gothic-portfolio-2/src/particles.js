// ============================================================
// particles.js  —  Purple atmospheric particles
// ============================================================

import * as THREE from 'three';
import { scene } from './scene.js';

const COUNT = 1200;
let particles = null;
const velocities = new Float32Array(COUNT * 3);

export function buildParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  
  for (let i = 0; i < COUNT; i++) {
    // Spread particles throughout the scene
    positions[i*3]   = (Math.random() - 0.5) * 28;
    positions[i*3+1] = Math.random() * 10;
    positions[i*3+2] = (Math.random() - 0.5) * 28;
    
    // Gentle upward drift with some horizontal movement
    velocities[i*3]   = (Math.random() - 0.5) * 0.006;
    velocities[i*3+1] = 0.004 + Math.random() * 0.008;
    velocities[i*3+2] = (Math.random() - 0.5) * 0.006;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  // Purple particles with varying shades
  const colors = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    // Shades of purple: from light lavender to deep violet
    const purpleVariation = Math.random();
    let r, g, b;
    
    if (purpleVariation < 0.33) {
      // Light lavender
      r = 0.7 + Math.random() * 0.2;
      g = 0.5 + Math.random() * 0.2;
      b = 0.9 + Math.random() * 0.1;
    } else if (purpleVariation < 0.66) {
      // Medium purple
      r = 0.5 + Math.random() * 0.2;
      g = 0.3 + Math.random() * 0.2;
      b = 0.7 + Math.random() * 0.2;
    } else {
      // Deep violet
      r = 0.3 + Math.random() * 0.2;
      g = 0.2 + Math.random() * 0.2;
      b = 0.6 + Math.random() * 0.2;
    }
    
    colors[i*3] = r;
    colors[i*3+1] = g;
    colors[i*3+2] = b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // Custom shader for glowing purple particles
  const vertexShader = `
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = (0.08 + sin(position.x * 8.0) * 0.02) * (300.0 / ( - mvPosition.z ));
      gl_PointSize = clamp(gl_PointSize, 2.5, 14.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  
  const fragmentShader = `
    uniform float time;
    varying vec3 vColor;
    void main() {
      vec2 coord = gl_PointCoord;
      float dist = length(coord - vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = (1.0 - dist * 1.3) * 0.8;
      float twinkle = 0.7 + sin(coord.x * 15.0 + time * 5.0) * 0.3;
      vec3 finalColor = vColor + vec3(0.2, 0.1, 0.3) * twinkle;
      gl_FragColor = vec4(finalColor, alpha * 0.7);
    }
  `;
  
  const uniforms = { time: { value: 0 } };
  
  particles = new THREE.Points(
    geometry,
    new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  
  scene.add(particles);
}

export function updateParticles() {
  if (!particles) return;
  
  const time = performance.now() * 0.002;
  particles.material.uniforms.time.value = time;
  
  const positions = particles.geometry.attributes.position.array;
  
  for (let i = 0; i < COUNT; i++) {
    positions[i*3]   += velocities[i*3];
    positions[i*3+1] += velocities[i*3+1];
    positions[i*3+2] += velocities[i*3+2];
    
    // Reset particles that float too high
    if (positions[i*3+1] > 9.5) {
      positions[i*3]   = (Math.random() - 0.5) * 26;
      positions[i*3+1] = 0;
      positions[i*3+2] = (Math.random() - 0.5) * 26;
    }
    
    // Wrap around horizontally (infinite feel)
    if (Math.abs(positions[i*3]) > 14) positions[i*3] *= -0.9;
    if (Math.abs(positions[i*3+2]) > 14) positions[i*3+2] *= -0.9;
  }
  
  particles.geometry.attributes.position.needsUpdate = true;
}