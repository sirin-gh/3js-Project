// ============================================================
// scene.js  —  Enhanced Post-Processing Magic
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

// ── Scene ────────────────────────────────────────────────────
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.FogExp2(0x0a0a1a, 0.0025);

// ── Camera ───────────────────────────────────────────────────
export const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 5000);
camera.position.set(8, 6, 10);
camera.lookAt(0, 1, 0);

// ── Renderer ─────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ── LIGHTS (same as before) ──────────────────────────────────
export const ambientLight = new THREE.AmbientLight(0x8866aa, 1.1);
scene.add(ambientLight);

export const moonLight = new THREE.DirectionalLight(0xffcc88, 4.5);
moonLight.position.set(2, 3, 1.5);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
scene.add(moonLight);

export const fillLight = new THREE.DirectionalLight(0xaa88ff, 0.9);
fillLight.position.set(-1.5, 1, -1.5);
scene.add(fillLight);

export const candleLight = new THREE.PointLight(0xffaa66, 3.0, 16);
candleLight.position.set(0, 1.5, 0);
scene.add(candleLight);

export const candleLight2 = new THREE.PointLight(0xff8844, 2.5, 14);
candleLight2.position.set(2.5, 1.5, 1.8);
scene.add(candleLight2);

export const rimLight = new THREE.PointLight(0xaa66ff, 1.3);
rimLight.position.set(-2, 2, -2.5);
scene.add(rimLight);

// ── OrbitControls ────────────────────────────────────────────
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = true;
controls.panSpeed = 0.7;
controls.rotateSpeed = 0.9;
controls.zoomSpeed = 1.1;
controls.minDistance = 2.5;
controls.maxDistance = 25;
controls.target.set(0, 1.2, 0);
controls.update();

// ── ENHANCED POST-PROCESSING ─────────────────────────────────

// 1. Main Composer
export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// 2. Bloom Pass (glow effect)
export const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,   // strength - increased for more magic
    0.4,   // radius
    0.6    // threshold
);
composer.addPass(bloomPass);

// 3. Afterimage Pass (motion trail / ghost effect)
export const afterimagePass = new AfterimagePass(0.96); // damp parameter
afterimagePass.renderToScreen = false;
composer.addPass(afterimagePass);

// 4. Custom Vignette + Chromatic Aberration Shader
const vignetteChromaShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        intensity: { value: 0.35 },
        chromaticAberration: { value: 0.008 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_PointSize = 1.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        uniform float chromaticAberration;
        varying vec2 vUv;
        
        void main() {
            vec2 uv = vUv;
            
            // Chromatic Aberration (RGB split)
            float r = texture2D(tDiffuse, uv + vec2(chromaticAberration, 0.0)).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv - vec2(chromaticAberration, 0.0)).b;
            vec3 color = vec3(r, g, b);
            
            // Vignette (darken edges)
            float dist = length(uv - 0.5);
            float vignette = 1.0 - smoothstep(0.2, 0.8, dist) * intensity;
            color *= vignette;
            
            // Subtle color shift based on time
            color.r += sin(time) * 0.02;
            color.b -= cos(time * 0.7) * 0.02;
            
            // Film grain
            float grain = (random(uv + time) - 0.5) * 0.05;
            color += grain;
            
            gl_FragColor = vec4(color, 1.0);
        }
        
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
    `
};

const vignetteChromaPass = new ShaderPass(vignetteChromaShader);
vignetteChromaPass.renderToScreen = true;
composer.addPass(vignetteChromaPass);

// 5. FXAA Anti-aliasing (smoother edges)
let fxaaPass = null;

function initFXAA() {
    const pixelRatio = renderer.getPixelRatio();
    const uniforms = FXAAShader.uniforms;
    uniforms['resolution'].value.set(1 / (window.innerWidth * pixelRatio), 1 / (window.innerHeight * pixelRatio));
    
    fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.renderToScreen = true;
    composer.addPass(fxaaPass);
}

// ── Post-Processing Controls ─────────────────────────────────
let bloomEnabled = true;
let afterimageEnabled = false;
let vignetteEnabled = true;

export function toggleBloom() {
    bloomEnabled = !bloomEnabled;
    bloomPass.enabled = bloomEnabled;
    document.getElementById('btn-bloom').textContent = bloomEnabled ? '✨ Bloom: ON' : '✨ Bloom: OFF';
}

export function toggleAfterimage() {
    afterimageEnabled = !afterimageEnabled;
    afterimagePass.enabled = afterimageEnabled;
    document.getElementById('btn-afterimage').textContent = afterimageEnabled ? '👻 Ghost: ON' : '👻 Ghost: OFF';
}

export function toggleVignette() {
    vignetteEnabled = !vignetteEnabled;
    vignetteChromaPass.enabled = vignetteEnabled;
    document.getElementById('btn-vignette').textContent = vignetteEnabled ? '🎭 Vignette: ON' : '🎭 Vignette: OFF';
}

// Update chromatic aberration over time
export function updatePostProcessing(time) {
    if (vignetteChromaPass && vignetteChromaPass.uniforms) {
        vignetteChromaPass.uniforms.time.value = time;
        // Slight variation based on mouse? Could be cool
    }
}

// ── Resize ───────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    
    if (fxaaPass && fxaaPass.uniforms) {
        const pixelRatio = renderer.getPixelRatio();
        fxaaPass.uniforms.resolution.value.set(1 / (window.innerWidth * pixelRatio), 1 / (window.innerHeight * pixelRatio));
    }
});

// Initialize FXAA
initFXAA();