// ============================================================
// interaction.js  —  Fixed color cycling for ALL objects
// ============================================================

import * as THREE from 'three';
import { camera, controls } from './scene.js';
import { interactiveObjects, objectDataMap, CLICKABLE_DEFS, heartbeatGlow, changeColor } from './loader.js';

const panel      = document.getElementById('panel');
const panelIcon  = document.getElementById('panel-icon');
const panelTitle = document.getElementById('panel-title');
const panelBody  = document.getElementById('panel-body');
const panelClose = document.getElementById('panel-close');
const panelPrev  = document.getElementById('panel-prev');
const panelNext  = document.getElementById('panel-next');
const tooltip    = document.getElementById('tooltip');

const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

let hoveredMesh  = null;
let selectedMesh = null;
let tabIndex     = 0;
let isDragging   = false;
let mouseDownPos = { x: 0, y: 0 };
let panelOpenIdx = 0;

const savedState = new Map();
const objectColorIndex = new Map();

function toNDC(cx, cy) {
  mouse.x = (cx / window.innerWidth) * 2 - 1;
  mouse.y = -(cy / window.innerHeight) * 2 + 1;
}

function getHit() {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactiveObjects, true);
  return hits.length > 0 ? hits[0] : null;
}

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
    mesh.material.emissive.set(0xaa88ff);
    mesh.material.emissiveIntensity = 0.9;
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

// FIXED: Cycle color for ANY object - each click changes color
function cycleColor(mesh) {
  if (!mesh?.material?.color) return;
  
  const def = objectDataMap.get(mesh.uuid);
  if (!def || !def.colors || def.colors.length === 0) {
    // Fallback colors if no custom palette
    const fallbackColors = [0x8b5cf6, 0xa855f7, 0xd946ef, 0xc084fc, 0xe879f9];
    let idx = objectColorIndex.get(mesh.uuid) ?? -1;
    const nextIdx = (idx + 1) % fallbackColors.length;
    objectColorIndex.set(mesh.uuid, nextIdx);
    changeColor(mesh, fallbackColors[nextIdx], 400);
    return;
  }
  
  let idx = objectColorIndex.get(mesh.uuid) ?? -1;
  const nextIdx = (idx + 1) % def.colors.length;
  objectColorIndex.set(mesh.uuid, nextIdx);
  
  console.log(`🎨 Changing ${def.label} color to index ${nextIdx} (${def.colors[nextIdx].toString(16)})`);
  changeColor(mesh, def.colors[nextIdx], 450);
}

function pulse(mesh) {
  if (!mesh) return;
  const orig = mesh.scale.clone();
  const t0 = performance.now();
  (function go(now) {
    const t = Math.min((now - t0) / 350, 1);
    const s = 1 + Math.sin(t * Math.PI) * 0.1;
    mesh.scale.set(orig.x * s, orig.y * s, orig.z * s);
    if (t < 1) requestAnimationFrame(go);
    else mesh.scale.copy(orig);
  })(performance.now());
}

function focusOn(mesh) {
  const wp = new THREE.Vector3();
  mesh.getWorldPosition(wp);
  
  const fromTarget = controls.target.clone();
  const fromCam    = camera.position.clone();
  const offset = fromCam.clone().sub(fromTarget);
  const newTarget = wp.clone();
  const newCam = newTarget.clone().add(offset);
  
  const t0 = performance.now();
  (function pan(now) {
    const t    = Math.min((now - t0) / 700, 1);
    const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    controls.target.lerpVectors(fromTarget, newTarget, ease);
    camera.position.lerpVectors(fromCam, newCam, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(pan);
  })(performance.now());
}

export function resetCamera() {
  const fromTarget = controls.target.clone();
  const fromCam    = camera.position.clone();
  const goalTarget = new THREE.Vector3(0, 1.2, 0);
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

const ICONS = { 'About Me':'🕯','My Skills':'⚗','My Projects':'📖','Contact':'✉' };

function showPanel(def, mesh) {
  panelOpenIdx = CLICKABLE_DEFS.findIndex(d => d.name === def.name);
  panelIcon.textContent  = def.icon ?? ICONS[def.title] ?? '✦';
  panelTitle.textContent = def.title;
  
  const lines = def.text.map(l => `<p>${l}</p>`).join('');
  const swatches = (def.colors || [0x8b5cf6, 0xa855f7, 0xd946ef]).map(c =>
    `<div class="swatch" style="background:#${c.toString(16).padStart(6,'0')}" 
          onclick="window.__sc('${c.toString(16).padStart(6,'0')}')"></div>`
  ).join('');
  
  panelBody.innerHTML = lines + `<div class="swatch-row">${swatches}</div>`;
  
  window.__sc = (hex) => {
    if (selectedMesh?.material?.color) {
      changeColor(selectedMesh, parseInt(hex, 16), 300);
    }
  };
  panel.classList.remove('hidden');
}

function hidePanel() { panel.classList.add('hidden'); }

function navigate(dir) {
  panelOpenIdx = (panelOpenIdx + dir + CLICKABLE_DEFS.length) % CLICKABLE_DEFS.length;
  const def  = CLICKABLE_DEFS[panelOpenIdx];
  const mesh = interactiveObjects.find(m => m.userData?.name === def.name);
  if (mesh) selectMesh(mesh);
  else {
    panelIcon.textContent = def.icon ?? '✦';
    panelTitle.textContent = def.title;
    panelBody.innerHTML = def.text.map(l=>`<p>${l}</p>`).join('') +
      `<div class="swatch-row">${(def.colors || []).map(c => 
        `<div class="swatch" style="background:#${c.toString(16).padStart(6,'0')}"></div>`
      ).join('')}</div>`;
  }
}

// FIXED: Select mesh with ALL effects (heartbeat + color + pulse)
function selectMesh(mesh) {
  if (selectedMesh && selectedMesh !== mesh) unhighlight(selectedMesh);
  selectedMesh = mesh;
  highlight(mesh);
  pulse(mesh);
  heartbeatGlow(mesh);      // Heartbeat effect
  cycleColor(mesh);         // Color change on click
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