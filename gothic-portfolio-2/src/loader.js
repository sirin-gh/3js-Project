// ============================================================
// loader.js  —  GLTFLoader + auto-fit camera + glow objects
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { scene, camera, controls,
         candleLight, candleLight2,
         moonLight, fillLight } from './scene.js';

// ── Clickable object definitions ─────────────────────────────
export const CLICKABLE_DEFS = [
  {
    name:  'tripo_node_2cf33df9-a53a-4f7e-9751-6a0509557146',
    label: 'The Character',
    title: 'About Me',
    icon:  '🕯',
    text: [
      'A developer who dwells between light and shadow.',
      'Passionate about creative coding, Three.js, and building immersive web experiences.',
      'Welcome to my gothic portfolio.',
    ],
  },
  {
    name:  'hat1_clothing_0',
    label: 'The Hat',
    title: 'My Skills',
    icon:  '⚗',
    text: [
      '✦ Three.js · WebGL · GLSL Shaders',
      '✦ AR.js · MindAR · WebXR',
      '✦ React · TypeScript · Vite · Node.js',
      '✦ Blender · 3D Modelling · GLTF Pipeline',
    ],
  },
  {
    name:  'Object_88',
    label: 'Ancient Relic',
    title: 'My Projects',
    icon:  '📖',
    text: [
      '✦ Gothic Portfolio — Three.js + WebXR interactive scene',
      '✦ Shadow Engine — WebGL shader experiments',
      '✦ Midnight API — Node.js REST backend',
      '✦ Abyss UI — Dark-mode component library',
    ],
  },
  {
    name:  'Object_2',
    label: 'The Artifact',
    title: 'Contact',
    icon:  '✉',
    text: [
      'Reach out if you dare...',
      'email@portfolio.com',
      'github.com/yourusername',
      'linkedin.com/in/yourusername',
    ],
  },
];

export const interactiveObjects = [];
export const objectDataMap      = new Map();

// Track meshes that get special glow so we can animate them
export const glowMeshes = [];

const fillBar  = document.getElementById('loading-fill');
const loadText = document.getElementById('loading-text');

// ── GLTFLoader setup ─────────────────────────────────────────
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// ── Apply purple/gold glow emissive to a mesh ─────────────────
function applyGlow(mesh, color = 0x9b59b6, intensity = 1.2) {
  if (!mesh?.material) return;
  // Clone material so we don't affect other objects sharing it
  mesh.material = mesh.material.clone();
  mesh.material.emissive = new THREE.Color(color);
  mesh.material.emissiveIntensity = intensity;
  glowMeshes.push({ mesh, baseIntensity: intensity });
}

// ── Boost character material brightness ───────────────────────
function boostCharacter(obj) {
  obj.traverse(child => {
    if (!child.isMesh || !child.material) return;
    child.material = child.material.clone();

    // Make sure it's not too dark
    if (child.material.color) {
      const col = child.material.color;
      // Brighten dark materials by scaling HSL lightness
      const hsl = {};
      col.getHSL(hsl);
      if (hsl.l < 0.25) {
        col.setHSL(hsl.h, hsl.s, Math.max(hsl.l * 3, 0.3));
      }
    }

    // Add a soft purple emissive glow so character stands out
    child.material.emissive = new THREE.Color(0x3d1a5a);
    child.material.emissiveIntensity = 0.8;
    glowMeshes.push({ mesh: child, baseIntensity: 0.8, isCharacter: true });
  });

  // Add a dedicated point light right on the character
  const charLight = new THREE.PointLight(0xcc88ff, 3.0, 999);
  charLight.name = 'charLight';
  scene.add(charLight);

  // Position it at the character's world position
  const wp = new THREE.Vector3();
  obj.getWorldPosition(wp);
  charLight.position.set(wp.x, wp.y + 2, wp.z + 1);
  console.log(`Character light placed at ${wp.x.toFixed(1)}, ${wp.y.toFixed(1)}, ${wp.z.toFixed(1)}`);
}

// ── Auto-fit camera to scene bounding box ────────────────────
function fitCamera(root) {
  const box    = new THREE.Box3().setFromObject(root);
  const size   = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  console.log(`Scene bbox: ${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)}`);
  console.log(`Centre: (${centre.x.toFixed(1)}, ${centre.y.toFixed(1)}, ${centre.z.toFixed(1)})`);
  console.log(`Max dim: ${maxDim.toFixed(1)}`);

  // Pull camera back enough to see the WHOLE scene
  const fov  = camera.fov * (Math.PI / 180);
  const dist = (maxDim / 2) / Math.tan(fov / 2) * 1.2; //  padding

  // Isometric-ish angle: upper right front
  camera.position.set(
    centre.x + dist * 0.6,
    centre.y + dist * 0.5,
    centre.z + dist * 0.6
  );
  camera.near = maxDim * 0.0005;
  camera.far  = maxDim * 5;
  camera.updateProjectionMatrix();

  controls.target.copy(centre);
  // Keep minDistance large enough to see full scene
  controls.minDistance = maxDim * 0.05;
  controls.maxDistance = maxDim * 5;
  controls.update();

  // Scale lights to scene size
  const L = maxDim;
  moonLight.position.set(centre.x + L, centre.y + L * 1.5, centre.z + L);
  moonLight.shadow.camera.left   = -L * 2;
  moonLight.shadow.camera.right  =  L * 2;
  moonLight.shadow.camera.top    =  L * 2;
  moonLight.shadow.camera.bottom = -L * 2;
  moonLight.shadow.camera.far    =  L * 6;
  moonLight.shadow.camera.updateProjectionMatrix();

  fillLight.position.set(centre.x - L, centre.y + L, centre.z - L);

  // Place candle lights inside the room
  candleLight.position.set(centre.x - L * 0.2, centre.y + L * 0.2, centre.z - L * 0.2);
  candleLight.distance  = L * 4;
  candleLight2.position.set(centre.x + L * 0.2, centre.y + L * 0.2, centre.z + L * 0.2);
  candleLight2.distance = L * 4;

  return { centre, maxDim };
}

// ── Load scene.glb ────────────────────────────────────────────
export function loadScene(onReady) {
  gltfLoader.load(
    './models/scene.glb',

    (gltf) => {
      const root = gltf.scene;

      // Enable shadows on all meshes
      root.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow    = true;
          obj.receiveShadow = true;
        }
      });

      scene.add(root);

      // Auto-fit camera to scene
      const { centre, maxDim } = fitCamera(root);

      // ── Apply glow to specific objects ───────────────────
      // Candles — golden glow
      const candleKeywords = ['candle', 'flame', 'torch', 'lamp'];
      // Crystal / potion — purple/green glow
      const crystalKeywords = ['crystal', 'potion', 'gem', 'orb', 'prism'];
      // Scroll / book — soft amber glow
      const scrollKeywords = ['scroll', 'book', 'paper'];

      root.traverse(obj => {
        if (!obj.isMesh) return;
        const n = obj.name.toLowerCase();

        if (candleKeywords.some(k => n.includes(k))) {
          applyGlow(obj, 0xff9900, 2.5);   // orange-gold
        } else if (crystalKeywords.some(k => n.includes(k))) {
          applyGlow(obj, 0x9b59b6, 2.0);   // purple
        } else if (scrollKeywords.some(k => n.includes(k))) {
          applyGlow(obj, 0xb8860b, 1.2);   // dark gold
        }
      });

      // ── Boost character visibility ────────────────────────
      const charObj = root.getObjectByName(
        'tripo_node_2cf33df9-a53a-4f7e-9751-6a0509557146'
      );
      if (charObj) {
        boostCharacter(charObj);
        console.log('✓ Character boosted');
      } else {
        console.warn('⚠ Character object not found for boost');
      }

      // ── Tag clickable objects ─────────────────────────────
      let found = 0;
      for (const def of CLICKABLE_DEFS) {
        const obj = root.getObjectByName(def.name);
        if (obj) {
          found++;
          console.log(`✓ Clickable: "${def.name}"`);
          obj.traverse(child => {
            if (child.isMesh) {
              child.userData = { ...def };
              if (!interactiveObjects.includes(child)) {
                interactiveObjects.push(child);
                objectDataMap.set(child.uuid, def);
              }
            }
          });
          if (obj.isMesh && !interactiveObjects.includes(obj)) {
            obj.userData = { ...def };
            interactiveObjects.push(obj);
            objectDataMap.set(obj.uuid, def);
          }
        } else {
          console.warn(`⚠ Not found: "${def.name}"`);
        }
      }
      console.log(`Tagged ${found}/${CLICKABLE_DEFS.length} clickable objects`);

      // Log all names for debugging
      console.group('All scene objects:');
      root.traverse(o => { if (o.name) console.log(`${o.type}: "${o.name}"`); });
      console.groupEnd();

      if (fillBar) fillBar.style.width = '100%';
      setTimeout(() => {
        const el = document.getElementById('loading');
        if (el) { el.classList.add('fade-out'); setTimeout(() => el.remove(), 900); }
      }, 400);

      if (onReady) onReady(root, { centre, maxDim });
    },

    (xhr) => {
      if (xhr.lengthComputable) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        if (fillBar)  fillBar.style.width  = `${pct}%`;
        if (loadText) loadText.textContent = `Loading scene... ${pct}%`;
      }
    },

    (err) => {
      console.error('GLB load failed:', err);
      if (loadText) {
        loadText.textContent = '⚠ scene.glb not found — see README';
        loadText.style.color = '#ff6666';
      }
      setTimeout(() => {
        const el = document.getElementById('loading');
        if (el) { el.classList.add('fade-out'); setTimeout(() => el.remove(), 900); }
      }, 1500);
    }
  ); 

  
} 


