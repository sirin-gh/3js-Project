// ============================================================
// particles.js  —  Floating dust/ash (Part 3: continuous animation)
// ============================================================

import * as THREE from 'three';
import { scene } from './scene.js';

const COUNT = 250;
let particles = null;
const velocities = new Float32Array(COUNT * 3);

export function buildParticles() {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 24;
    pos[i*3+1] = Math.random() * 10;
    pos[i*3+2] = (Math.random() - 0.5) * 24;

    velocities[i*3]   = (Math.random() - 0.5) * 0.003;
    velocities[i*3+1] = 0.002 + Math.random() * 0.004;
    velocities[i*3+2] = (Math.random() - 0.5) * 0.003;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  particles = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x9966aa,
    size: 0.06,
    transparent: true,
    opacity: 1,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));

  scene.add(particles);
}

export function updateParticles() {
  if (!particles) return;
  const pos = particles.geometry.attributes.position.array;
  for (let i = 0; i < COUNT; i++) {
    pos[i*3]   += velocities[i*3];
    pos[i*3+1] += velocities[i*3+1];
    pos[i*3+2] += velocities[i*3+2];
    if (pos[i*3+1] > 10) {
      pos[i*3]   = (Math.random() - 0.5) * 24;
      pos[i*3+1] = 0;
      pos[i*3+2] = (Math.random() - 0.5) * 24;
    }
  }
  particles.geometry.attributes.position.needsUpdate = true;
}
