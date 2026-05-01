// ============================================================
// interaction.js  —  Hover, click, colour, camera, keyboard, touch
// ============================================================

import * as THREE from 'three';
import { camera, controls } from './scene.js';
import { interactiveObjects, objectDataMap, CLICKABLE_DEFS } from './loader.js';

// ── DOM ───────────────────────────────────────────────────────
const panel      = document.getElementById('panel');
const panelIcon  = document.getElementById('panel-icon');
const panelTitle = document.getElementById('panel-title');
const panelBody  = document.getElementById('panel-body');
const panelClose = document.getElementById('panel-close');
const panelPrev  = document.getElementById('panel-prev');
const panelNext  = document.getElementById('panel-next');
const tooltip    = document.getElementById('tooltip');

// ── Raycaster ─────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

// ── State ─────────────────────────────────────────────────────
let hoveredMesh  = null;
let selectedMesh = null;
let tabIndex     = 0;
let isDragging   = false;
let mouseDownPos = { x: 0, y: 0 };
let panelOpenIdx = 0;

const savedState = new Map();
const PALETTE    = [0x3d0a0a, 0x0a0a3d, 0x1a0a3d, 0x0a2a0a, 0x2a1a00, 0x3d0a2a, 0x1a1a1a];
const paletteIdx = new Map();

// ── NDC conversion ────────────────────────────────────────────
function toNDC(cx, cy) {
  mouse.x =  (cx / window.innerWidth)  * 2 - 1;
  mouse.y = -(cy / window.innerHeight) * 2 + 1;
}

// ── Raycast ───────────────────────────────────────────────────
function getHit() {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactiveObjects, true);
  return hits.length > 0 ? hits[0] : null;
}

// ── Save / restore material ───────────────────────────────────
function saveMat(mesh) {
  if (savedState.has(mesh.uuid) || !mesh.material) return;
  savedState.set(mesh.uuid, {
    emissive:  mesh.material.emissive  ? mesh.material.emissive.clone()  : new THREE.Color(0),
    emissiveI: mesh.material.emissiveIntensity ?? 0,
    color:     mesh.material.color     ? mesh.material.color.clone()     : new THREE.Color(0xffffff),
  });
}

function highlight(mesh) {
  if (!mesh?.material) return;
  saveMat(mesh);
  if (mesh.material.emissive) {
    mesh.material.emissive.set(0x7a2aaa);
    mesh.material.emissiveIntensity = 1.2;
  }
}

function unhighlight(mesh) {
  if (!mesh?.material) return;
  const s = savedState.get(mesh.uuid);
  if (!s) return;
  if (mesh.material.emissive) {
    mesh.material.emissive.copy(s.emissive);
    mesh.material.emissiveIntensity = s.emissiveI;
  }
}

// ── Colour cycle ──────────────────────────────────────────────
function cycleColor(mesh) {
  if (!mesh?.material?.color) return;
  const cur  = paletteIdx.get(mesh.uuid) ?? -1;
  const next = (cur + 1) % PALETTE.length;
  paletteIdx.set(mesh.uuid, next);
  const from = mesh.material.color.clone();
  const to   = new THREE.Color(PALETTE[next]);
  const t0   = performance.now();
  (function lerp(now) {
    const t = Math.min((now - t0) / 450, 1);
    mesh.material.color.lerpColors(from, to, t);
    if (t < 1) requestAnimationFrame(lerp);
  })(performance.now());
}

// ── Scale pulse ───────────────────────────────────────────────
function pulse(mesh) {
  if (!mesh) return;
  const orig = mesh.scale.clone();
  const t0   = performance.now();
  (function go(now) {
    const t = Math.min((now - t0) / 500, 1);
    const s = 1 + Math.sin(t * Math.PI) * 0.14;
    mesh.scale.set(orig.x * s, orig.y * s, orig.z * s);
    if (t < 1) requestAnimationFrame(go);
    else mesh.scale.copy(orig);
  })(performance.now());
}

// ── Camera focus — keeps context, does NOT zoom in ────────────
// Pans the view toward the clicked object while keeping the
// camera at the same distance (like Sketchfab's "focus" orbit)
function focusOn(mesh) {
  const wp = new THREE.Vector3();
  mesh.getWorldPosition(wp);

  // Current state
  const fromTarget = controls.target.clone();
  const fromCam    = camera.position.clone();

  // Keep the same relative offset from target → no zoom change
  const offset = fromCam.clone().sub(fromTarget); // camera offset vector

  // New target = object world position
  const newTarget = wp.clone();

  // New camera = new target + same offset (preserves distance & angle)
  const newCam = newTarget.clone().add(offset);

  const t0 = performance.now();
  (function pan(now) {
    const t    = Math.min((now - t0) / 900, 1);
    const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    controls.target.lerpVectors(fromTarget, newTarget, ease);
    camera.position.lerpVectors(fromCam, newCam, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(pan);
  })(performance.now());
}

// ── Reset camera to full-scene view ──────────────────────────
export function resetCamera() {
  const fromTarget = controls.target.clone();
  const fromCam    = camera.position.clone();
  const goalTarget = new THREE.Vector3(0, 0, 0);

  // Camera goes back to its saved initial distance
  const offset = fromCam.clone().sub(fromTarget);
  const goalCam = goalTarget.clone().add(offset);

  const t0 = performance.now();
  (function go(now) {
    const t    = Math.min((now - t0) / 900, 1);
    const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    controls.target.lerpVectors(fromTarget, goalTarget, ease);
    camera.position.lerpVectors(fromCam, goalCam, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(go);
  })(performance.now());
}

// ── Get def from mesh ─────────────────────────────────────────
function getDef(mesh) {
  if (objectDataMap.has(mesh.uuid)) return objectDataMap.get(mesh.uuid);
  let obj = mesh.parent;
  while (obj) {
    if (objectDataMap.has(obj.uuid)) return objectDataMap.get(obj.uuid);
    obj = obj.parent;
  }
  if (mesh.userData?.title) return mesh.userData;
  return null;
}

// ── Panel ─────────────────────────────────────────────────────
const ICONS = { 'About Me':'🕯','My Skills':'⚗','My Projects':'📖','Contact':'✉' };

function showPanel(def, mesh) {
  panelOpenIdx = CLICKABLE_DEFS.findIndex(d => d.name === def.name);
  panelIcon.textContent  = def.icon ?? ICONS[def.title] ?? '✦';
  panelTitle.textContent = def.title;

  const lines   = def.text.map(l => `<p>${l}</p>`).join('');
  const swColors = ['#8b0000','#4b0082','#006400','#b8960c','#2f4f4f','#800080','#1a1a2e'];
  const swatches = swColors.map(c =>
    `<div class="swatch" style="background:${c}" onclick="window.__sc('${c}')"></div>`
  ).join('');
  panelBody.innerHTML = lines + `<div class="swatch-row">${swatches}</div>`;

  window.__sc = (hex) => {
    if (selectedMesh?.material?.color) selectedMesh.material.color.set(hex);
  };
  panel.classList.remove('hidden');
}

function hidePanel() { panel.classList.add('hidden'); }

function navigate(dir) {
  panelOpenIdx = (panelOpenIdx + dir + CLICKABLE_DEFS.length) % CLICKABLE_DEFS.length;
  const def  = CLICKABLE_DEFS[panelOpenIdx];
  const mesh = interactiveObjects.find(m => m.userData?.name === def.name);
  if (mesh) selectMesh(mesh);
  else { panelIcon.textContent = def.icon ?? '✦'; panelTitle.textContent = def.title;
         panelBody.innerHTML = def.text.map(l=>`<p>${l}</p>`).join(''); }
}

// ── Select ────────────────────────────────────────────────────
function selectMesh(mesh) {
  if (selectedMesh && selectedMesh !== mesh) unhighlight(selectedMesh);
  selectedMesh = mesh;
  highlight(mesh);
  pulse(mesh);
  cycleColor(mesh);
  focusOn(mesh);
  const def = getDef(mesh);
  if (def) showPanel(def, mesh);
}

// ── Events ────────────────────────────────────────────────────
window.addEventListener('mousemove', (e) => {
  const dx = e.clientX - mouseDownPos.x;
  const dy = e.clientY - mouseDownPos.y;
  if (Math.sqrt(dx*dx + dy*dy) > 5) isDragging = true;

  toNDC(e.clientX, e.clientY);
  const hit   = getHit();
  const fresh = hit?.object ?? null;

  if (hoveredMesh && hoveredMesh !== fresh && hoveredMesh !== selectedMesh)
    unhighlight(hoveredMesh);
  hoveredMesh = fresh;

  if (hoveredMesh && hoveredMesh !== selectedMesh) {
    highlight(hoveredMesh);
    const def = getDef(hoveredMesh);
    if (def) {
      tooltip.textContent     = `✦  ${def.label}`;
      tooltip.style.left      = `${e.clientX + 18}px`;
      tooltip.style.top       = `${e.clientY - 12}px`;
      tooltip.style.transform = '';
      tooltip.classList.remove('hidden');
      document.body.style.cursor = 'pointer';
    }
  } else {
    tooltip.classList.add('hidden');
    document.body.style.cursor = 'default';
  }
});

window.addEventListener('mousedown', (e) => {
  isDragging   = false;
  mouseDownPos = { x: e.clientX, y: e.clientY };
});

window.addEventListener('click', (e) => {
  if (isDragging) return;
  toNDC(e.clientX, e.clientY);
  const hit = getHit();
  if (hit) {
    selectMesh(hit.object);
  } else {
    if (selectedMesh) { unhighlight(selectedMesh); selectedMesh = null; }
    hidePanel();
  }
});

window.addEventListener('dblclick', () => resetCamera());

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'Escape':
      hidePanel();
      if (selectedMesh) { unhighlight(selectedMesh); selectedMesh = null; }
      break;
    case 'Tab':
      e.preventDefault();
      if (selectedMesh) unhighlight(selectedMesh);
      tabIndex = (tabIndex + (e.shiftKey ? -1 : 1) + interactiveObjects.length) % interactiveObjects.length;
      const tgt = interactiveObjects[tabIndex];
      if (tgt) {
        highlight(tgt);
        focusOn(tgt);
        const def = getDef(tgt);
        if (def) {
          tooltip.textContent = `✦  ${def.label}  — press Enter`;
          tooltip.style.left = '50%'; tooltip.style.top = '70px';
          tooltip.style.transform = 'translateX(-50%)';
          tooltip.classList.remove('hidden');
        }
      }
      break;
    case 'Enter':
      if (interactiveObjects[tabIndex]) selectMesh(interactiveObjects[tabIndex]);
      break;
    case 'ArrowRight': case 'ArrowDown': navigate(1);  break;
    case 'ArrowLeft':  case 'ArrowUp':   navigate(-1); break;
  }
});

let touchT = 0;
window.addEventListener('touchstart', () => { touchT = Date.now(); }, { passive: true });
window.addEventListener('touchend', (e) => {
  if (Date.now() - touchT > 300) return;
  const t = e.changedTouches[0];
  toNDC(t.clientX, t.clientY);
  const hit = getHit();
  if (hit) selectMesh(hit.object); else hidePanel();
}, { passive: true });

panelClose.addEventListener('click', (e) => { e.stopPropagation(); hidePanel(); });
panelPrev.addEventListener('click',  (e) => { e.stopPropagation(); navigate(-1); });
panelNext.addEventListener('click',  (e) => { e.stopPropagation(); navigate(1); });

