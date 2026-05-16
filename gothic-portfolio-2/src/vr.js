// ============================================================
// vr.js  —  WebXR VR setup (Optional - removed error popups)
// ============================================================

import * as THREE from 'three';
import { scene, renderer, camera } from './scene.js';
import { interactiveObjects } from './loader.js';

// Check if VR is actually supported
let vrSupported = false;

if ('xr' in navigator) {
  navigator.xr.isSessionSupported('immersive-vr').then(supported => {
    vrSupported = supported;
    const vrBtn = document.getElementById('btn-vr');
    if (vrBtn) {
      if (!supported) {
        vrBtn.style.display = 'none';
        console.log('VR not supported on this device');
      } else {
        vrBtn.style.display = 'inline-block';
        // Import VRButton dynamically only if supported
        import('three/addons/webxr/VRButton.js').then(module => {
          const VRButton = module.VRButton;
          const vrBtnElem = VRButton.createButton(renderer);
          vrBtnElem.id = 'btn-vr-internal';
          vrBtnElem.style.display = 'none';
          document.body.appendChild(vrBtnElem);
          
          vrBtn.addEventListener('click', () => vrBtnElem.click());
        });
      }
    }
  });
} else {
  const vrBtn = document.getElementById('btn-vr');
  if (vrBtn) vrBtn.style.display = 'none';
}

// Placeholder exports
export function initVR() {
  // VR initialization handled above
}

export function updateVR() {
  // VR update handled by Three.js
}