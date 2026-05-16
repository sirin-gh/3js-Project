// ============================================================
// loader.js  —  GLTFLoader + Game Dev Portfolio
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { scene, camera, controls,
         candleLight, candleLight2,
         moonLight, fillLight } from './scene.js';

// ── Clickable object definitions - GAME DEV PORTFOLIO ─────────
export const CLICKABLE_DEFS = [
  {
    name:  'tripo_node_2cf33df9-a53a-4f7e-9751-6a0509557146',
    label: 'Game Developer',
    title: 'About Me',
    icon:  '🎮',
    colors: [0x3a86ff, 0x8338ec, 0xf4066a, 0xff006e, 0xfb5607],
    text: [
      '🎮 Passionate Game Developer with experience in Unity, Three.js, and full-stack development',
      '🕹️ Creating immersive gameplay systems, AI behaviors, and interactive 3D experiences',
      '⚡ Skilled in C#, Luau, TypeScript, Python, and Java',
      '🌟 Focused on modular systems, optimization, and player engagement',
    ],
  },
  {
    name:  'hat1_clothing_0',
    label: 'Game Dev Skills',
    title: 'Technical Skills',
    icon:  '⚙️',
    colors: [0x3a86ff, 0x8338ec, 0xf4066a, 0xffbe0b, 0xfb5607],
    text: [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🎮 GAME DEVELOPMENT',
      '• Engines: Unity (C#), Roblox (Luau)',
      '• 3D Art: Blender (Modeling, Animation), Three.js',
      '• AI: Behavior Trees, FOV Systems, NavMesh',
      '• VR: Physics-based interaction, XR Toolkit',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '💻 FULL-STACK & SYSTEMS',
      '• Languages: Python, Java, PHP, TypeScript, C#',
      '• Web/Cloud: Angular, Firebase, HTML5/CSS3',
      '• Databases: MySQL, SQL Plus, Relational Design',
      '• Tools: Git, Trello (Agile), REST APIs, Gizmo Debugger',
    ],
  },
  {
    name:  'Object_88',
    label: 'Game Projects',
    title: 'Featured Projects',
    icon:  '🏆',
    colors: [0x3a86ff, 0x8338ec, 0xf4066a, 0xffbe0b, 0x52b788],
    text: [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🧠 MODULAR AI BEHAVIOR TREE | Unity (C#)',
      '• Developed a custom Behavior Tree (Selector/Sequence) for complex NPC decision-making',
      '• Engineered a FOV system using Raycasts and Dot Products for realistic detection',
      '• Integrated NavMesh for pathfinding and built a custom Gizmo debugger for vision cones',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🥽 VR ESCAPE ROOM | Unity & Blender',
      '• Programmed a physics-based inventory system and interactive VR object-pickup logic',
      '• Modeled/animated assets in Blender, optimizing topology for real-time performance',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🏙️ 3D URBAN VISUALIZATION | Angular & Three.js',
      '• Built an interactive 3D city viewer with real-time Firebase data synchronization',
      '• Implemented dynamic building highlighting and data-driven UI overlays',
    ],
  },
  {
    name:  'Object_2',
    label: 'Contact',
    title: 'Get In Touch',
    icon:  '📫',
    colors: [0x3a86ff, 0x8338ec, 0xf4066a, 0xffbe0b, 0x52b788],
    text: [
      '📧 Email: gamedev@portfolio.com',
      '🐙 GitHub: github.com/gamedevportfolio',
      '💼 LinkedIn: linkedin.com/in/gamedevportfolio',
      '🎮 Itch.io: gamedev.itch.io',
      '',
      '✨ Open for game dev and interactive 3D opportunities',
      '🚀 Let\'s build something amazing together!',
    ],
  },
];

export const interactiveObjects = [];
export const objectDataMap      = new Map();
export const glowMeshes = [];

const fillBar  = document.getElementById('loading-fill');
const loadText = document.getElementById('loading-text');

// ── GLTFLoader setup ─────────────────────────────────────────
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// ── Apply glow to meshes ─────────────────────────────────────
export function applyGlow(mesh, color = 0x3a86ff, intensity = 0.7) {
  if (!mesh?.material) return;
  if (!mesh.userData.originalMaterial) {
    mesh.userData.originalMaterial = mesh.material.clone();
  }
  mesh.material = mesh.material.clone();
  mesh.material.emissive = new THREE.Color(color);
  mesh.material.emissiveIntensity = intensity;
  glowMeshes.push({ mesh, baseIntensity: intensity, baseColor: color, isCharacter: false });
}

// ── Heartbeat animation for clicked objects ───────────────────
export function heartbeatGlow(mesh) {
  if (!mesh?.material) return;
  
  const originalIntensity = mesh.material.emissiveIntensity || 0.5;
  const startTime = performance.now();
  const duration = 550;
  
  function animateHeartbeat(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    
    let intensity;
    if (t < 0.15) {
      intensity = originalIntensity + 1.5 * (t / 0.15);
    } else if (t < 0.35) {
      intensity = originalIntensity + 1.5 * (1 - (t - 0.15) / 0.2);
    } else if (t < 0.5) {
      intensity = originalIntensity + 0.8 * ((t - 0.35) / 0.15);
    } else if (t < 0.65) {
      intensity = originalIntensity + 0.8 * (1 - (t - 0.5) / 0.15);
    } else {
      intensity = originalIntensity;
    }
    
    mesh.material.emissiveIntensity = intensity;
    
    if (t < 1) {
      requestAnimationFrame(animateHeartbeat);
    } else {
      mesh.material.emissiveIntensity = originalIntensity;
    }
  }
  
  requestAnimationFrame(animateHeartbeat);
}

// ── Smooth color change ───────────────────────────────────────
export function changeColor(mesh, newColor, duration = 400) {
  if (!mesh?.material?.color) return;
  
  const fromColor = mesh.material.color.clone();
  const toColor = new THREE.Color(newColor);
  const startTime = performance.now();
  
  function animateColor(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    mesh.material.color.lerpColors(fromColor, toColor, eased);
    
    if (t < 1) {
      requestAnimationFrame(animateColor);
    }
  }
  
  requestAnimationFrame(animateColor);
}

// ── Make clickable objects glow properly ──────────────────────
function setupClickableGlow(obj, def) {
  obj.traverse(child => {
    if (child.isMesh && child.material) {
      if (!child.userData.originalColor && child.material.color) {
        child.userData.originalColor = child.material.color.clone();
      }
      
      child.material = child.material.clone();
      child.material.emissive = new THREE.Color(0x3a86ff);
      child.material.emissiveIntensity = 0.4;
      glowMeshes.push({ 
        mesh: child, 
        baseIntensity: 0.4, 
        isCharacter: def.title === 'About Me',
        objectDef: def
      });
    }
  });
}

// ── Auto-fit camera ──────────────────────────────────────────
function fitCamera(root) {
  const box    = new THREE.Box3().setFromObject(root);
  const size   = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  
  const fov  = camera.fov * (Math.PI / 180);
  const dist = (maxDim / 2) / Math.tan(fov / 2) * 1.25;
  
  camera.position.set(
    centre.x + dist * 0.6,
    centre.y + dist * 0.45,
    centre.z + dist * 0.6
  );
  camera.near = maxDim * 0.0005;
  camera.far  = maxDim * 5;
  camera.updateProjectionMatrix();
  
  controls.target.copy(centre);
  controls.minDistance = maxDim * 0.08;
  controls.maxDistance = maxDim * 3.5;
  controls.update();
  
  const L = maxDim;
  moonLight.position.set(centre.x + L * 0.7, centre.y + L * 0.6, centre.z + L * 0.7);
  fillLight.position.set(centre.x - L * 0.5, centre.y + L * 0.4, centre.z - L * 0.5);
  candleLight.position.set(centre.x - 0.8, centre.y + 0.8, centre.z);
  candleLight2.position.set(centre.x + 1.5, centre.y + 0.8, centre.z + 1.2);
  
  return { centre, maxDim };
}

// ── Load scene.glb ────────────────────────────────────────────
export function loadScene(onReady) {
  gltfLoader.load(
    './models/scene.glb',
    
    (gltf) => {
      const root = gltf.scene;
      
      root.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow    = true;
          obj.receiveShadow = true;
        }
      });
      
      scene.add(root);
      const { centre, maxDim } = fitCamera(root);
      
      // Apply glows to candles and crystals
      root.traverse(obj => {
        if (!obj.isMesh) return;
        const n = obj.name.toLowerCase();
        
        if (n.includes('candle') || n.includes('flame') || n.includes('torch')) {
          applyGlow(obj, 0xff8844, 1.0);
        } else if (n.includes('crystal') || n.includes('gem') || n.includes('orb')) {
          applyGlow(obj, 0x3a86ff, 0.8);
        } else if (n.includes('book') || n.includes('scroll')) {
          applyGlow(obj, 0xccaa66, 0.5);
        }
      });
      
      // Tag clickable objects
      let found = 0;
      for (const def of CLICKABLE_DEFS) {
        const obj = root.getObjectByName(def.name);
        if (obj) {
          found++;
          console.log(`✅ Found clickable: "${def.name}" (${def.title})`);
          
          setupClickableGlow(obj, def);
          
          obj.traverse(child => {
            if (child.isMesh) {
              child.userData = { ...def };
              if (!interactiveObjects.includes(child)) {
                interactiveObjects.push(child);
                objectDataMap.set(child.uuid, def);
              }
            }
          });
        } else {
          console.warn(`⚠ NOT FOUND: "${def.name}" - check spelling in your GLB file`);
        }
      }
      console.log(`✅ Tagged ${found}/${CLICKABLE_DEFS.length} clickable objects`);
      
      console.group('📦 All objects in scene:');
      root.traverse(o => { if (o.name) console.log(`  - "${o.name}"`); });
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
        if (fillBar) fillBar.style.width = `${pct}%`;
        if (loadText) loadText.textContent = `Loading scene... ${pct}%`;
      }
    },
    
    (err) => {
      console.error('❌ GLB load failed:', err);
      if (loadText) {
        loadText.textContent = '⚠ scene.glb not found — place your model in public/models/';
        loadText.style.color = '#ff6666';
      }
    }
  );
}