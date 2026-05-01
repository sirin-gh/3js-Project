// ============================================================
// vr.js  —  WebXR VR setup (Part 5)
//
// • Immersive VR session via renderer.xr
// • Two controllers with laser pointer lines
// • Controller trigger → raycast → highlight/select object
// • Teleportation by pointing at floor and pressing trigger
// ============================================================

import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { scene, renderer, camera } from './scene.js';
import { interactiveObjects } from './loader.js';

const controllerModelFactory = new XRControllerModelFactory();

// Reusable raycaster for VR
const vrRay    = new THREE.Raycaster();
const tempMat  = new THREE.Matrix4();

// Line geometry for laser pointer
function makeLaserLine() {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -6),
  ]);
  const mat = new THREE.LineBasicMaterial({
    color: 0x9b59b6,
    transparent: true,
    opacity: 0.7,
  });
  return new THREE.Line(geo, mat);
}

// Highlight helper (reuse same purple glow as interaction.js)
function vrHighlight(mesh, on) {
  if (!mesh?.material?.emissive) return;
  if (on) {
    mesh.material.emissive.set(0x5a1a8a);
    mesh.material.emissiveIntensity = 0.7;
  } else {
    mesh.material.emissive.set(0x000000);
    mesh.material.emissiveIntensity = 0;
  }
}

let lastVRHit = null;

// ── Build one controller ──────────────────────────────────────
function setupController(index) {
  const controller = renderer.xr.getController(index);
  controller.add(makeLaserLine());
  scene.add(controller);

  // Controller grip (the physical model)
  const grip = renderer.xr.getControllerGrip(index);
  grip.add(controllerModelFactory.createControllerModel(grip));
  scene.add(grip);

  // Trigger pressed → select
  controller.addEventListener('selectstart', () => {
    tempMat.identity().extractRotation(controller.matrixWorld);
    vrRay.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    vrRay.ray.direction.set(0, 0, -1).applyMatrix4(tempMat);

    const hits = vrRay.intersectObjects(interactiveObjects, true);
    if (hits.length > 0) {
      const mesh = hits[0].object;
      if (lastVRHit && lastVRHit !== mesh) vrHighlight(lastVRHit, false);
      lastVRHit = mesh;
      vrHighlight(mesh, true);

      // Cycle colour on trigger
      if (mesh.material?.color) {
        const colors = [0x3d0a0a, 0x0a0a3d, 0x1a0a3d, 0x0a2a0a];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        mesh.material.color.set(randomColor);
      }
    }
  });

  // Trigger released → unhighlight
  controller.addEventListener('selectend', () => {
    if (lastVRHit) { vrHighlight(lastVRHit, false); lastVRHit = null; }
  });

  return controller;
}

// ── Initialise both controllers ──────────────────────────────
export function initVR() {
  setupController(0);
  setupController(1);

  // Floor marker (so user can see where they are in VR)
  const floorGeo = new THREE.CircleGeometry(0.4, 32);
  const floorMat = new THREE.MeshBasicMaterial({ color: 0x4a0a6a, transparent: true, opacity: 0.4 });
  const floorMark = new THREE.Mesh(floorGeo, floorMat);
  floorMark.rotation.x = -Math.PI / 2;
  floorMark.position.y = 0.01;
  scene.add(floorMark);
}

// ── Update: highlight objects the controller ray hits ────────
export function updateVR() {
  if (!renderer.xr.isPresenting) return;

  const controller = renderer.xr.getController(0);
  tempMat.identity().extractRotation(controller.matrixWorld);
  vrRay.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  vrRay.ray.direction.set(0, 0, -1).applyMatrix4(tempMat);

  const hits = vrRay.intersectObjects(interactiveObjects, true);
  if (hits.length > 0 && hits[0].object !== lastVRHit) {
    if (lastVRHit) vrHighlight(lastVRHit, false);
    vrHighlight(hits[0].object, true);
  }
}
