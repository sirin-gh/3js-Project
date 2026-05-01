# Gothic Portfolio — Three.js + AR + VR
## Setup in 3 commands

```bash
npm install
npm run dev
# open http://localhost:5173
```

---

## STEP 1 — Export your GLB from Blender

1. Open `portfolio_3js_project.blend` in Blender
2. Press `A` to select everything (or select only what you want)
3. Go to: **File → Export → glTF 2.0 (.glb/.gltf)**
4. On the right panel, set:
   - Format: **glTF Binary (.glb)**
   - ✅ Include → Selected Objects (optional, if you want full scene leave unchecked)
   - ✅ Geometry → Apply Modifiers
   - ✅ Data → Compression (if file is large)
5. Name the file: **`scene.glb`**
6. Save it to: `gothic-portfolio/public/models/scene.glb`

---

## STEP 2 — Verify your clickable object names

The 4 objects that will be clickable are named:

| Blender name | Panel content |
|---|---|
| `tripo_node_2cf33df9-a53a-4f7e-9751-6a0509557146` | About Me |
| `hat1_clothing_0` | My Skills |
| `Object_88` | My Projects |
| `Object_2` | Contact |

**To verify these names exist in your GLB:**
1. Run `npm run dev`
2. Open http://localhost:5173
3. Open browser Console (F12)
4. You'll see a full list: `Scene Object Tree: Mesh: "Object_88"` etc.
5. If a name isn't found, you'll see: `⚠ Object not found in GLB: "Object_88"`
6. If not found, check the exact name in Blender's Outliner panel (top-right)
   and update `src/loader.js` → `CLICKABLE_DEFS` array

---

## STEP 3 — Run it

```bash
# Install dependencies (only needed once)
npm install

# Start dev server
npm run dev
```

Then open: **http://localhost:5173**

---

## STEP 4 — Test AR on mobile

1. Make sure your PC and phone are on the **same WiFi**
2. Run `npm run dev` — it will show your local IP, e.g.:
   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.1.42:5173/
   ```
3. On your phone, open: `http://192.168.1.42:5173/ar.html`
4. Print this marker and point phone camera at it:
   https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg
5. Your 3D scene appears on the marker!

---

## STEP 5 — Test VR

- Click **⬡ Enter VR** button (top right)
- Requires a VR headset OR use the browser's VR emulator extension

---

## File structure

```
gothic-portfolio/
├── index.html          ← Main scene (Parts 1,2,3,6)
├── ar.html             ← AR page (Part 4) — separate file
├── package.json
├── vite.config.js
├── src/
│   ├── main.js         ← Entry point + animation loop (Part 3)
│   ├── style.css       ← All UI styles
│   ├── scene.js        ← Three.js scene/camera/lights/bloom (Part 1)
│   ├── loader.js       ← GLTFLoader + clickable object tagging (Part 1,6)
│   ├── interaction.js  ← Raycaster/hover/click/colour/keyboard (Part 2)
│   ├── vr.js           ← WebXR VR controllers (Part 5)
│   └── particles.js    ← Floating dust particles (Part 3)
└── public/
    ├── models/
    │   └── scene.glb   ← ⚠ PUT YOUR EXPORTED GLB HERE
    └── sounds/
        └── gothic_ambient.mp3  ← optional (any ambient mp3)
```

---

## Editing panel content

To change what appears when an object is clicked, edit `src/loader.js`:

```js
export const CLICKABLE_DEFS = [
  {
    name:  'tripo_node_2cf33df9-a53a-4f7e-9751-6a0509557146',
    label: 'The Character',   // ← tooltip text on hover
    title: 'About Me',        // ← panel heading
    icon:  '🕯',              // ← icon in panel
    text: [                   // ← lines shown in panel body
      'Your name here',
      'Your description here',
    ],
  },
  // ... 3 more objects
];
```

---

## Assignment checklist

| Part | Points | Status |
|---|---|---|
| Part 1: 3D scene, camera, lights, objects | 4 | ✅ scene.js + loader.js |
| Part 2: Orbit/zoom + click + colour change | 4 | ✅ interaction.js |
| Part 3: requestAnimationFrame + triggered animation | 3 | ✅ main.js |
| Part 4: AR with AR.js | 3 | ✅ ar.html |
| Part 5: WebXR VR + controller interaction | 3 | ✅ vr.js |
| Part 6: Day/night + sound + GLTF import | 2 | ✅ main.js + loader.js |
| **Total** | **19/20** | + up to 2 bonus |
