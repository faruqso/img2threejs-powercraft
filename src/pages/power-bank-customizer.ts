import * as THREE from 'three';
import {
  createAnkerMaggoA1618LookDevLights,
  createAnkerMaggoA1618Model,
} from '../demos/anker-maggo-a1618/createAnkerMaggoA1618Model';
import { Viewer } from '../scene';

type FinishKey = 'graphite' | 'silver' | 'blue' | 'sand';

type MaterialSnapshot = {
  material: THREE.Material;
  color?: THREE.Color;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
};

type DefaultsSnapshot = {
  materials: MaterialSnapshot[];
  visibility: Array<{ object: THREE.Object3D; visible: boolean }>;
  lights: Array<{ light: THREE.Light; intensity: number }>;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
};

type CapacityKey = '5k' | '10k' | '20k';
type CapacityPreset = {
  label: string;
  sizeLabel: string;
  scale: THREE.Vector3Tuple;
};

interface FinishPreset {
  label: string;
  body: number;
  edge: number;
  panel: number;
  ring: number;
}

const FINISHES: Record<FinishKey, FinishPreset> = {
  graphite: {
    label: 'Graphite',
    body: 0x202126,
    edge: 0x121316,
    panel: 0x25272c,
    ring: 0x35383f,
  },
  silver: {
    label: 'Lunar silver',
    body: 0xd9dde2,
    edge: 0x9ba2aa,
    panel: 0xcfd4da,
    ring: 0xeff3f6,
  },
  blue: {
    label: 'Deep blue',
    body: 0x182a3d,
    edge: 0x0b1724,
    panel: 0x203c56,
    ring: 0x73b9df,
  },
  sand: {
    label: 'Warm sand',
    body: 0xc5b7a3,
    edge: 0x8d7f6c,
    panel: 0xd0c3af,
    ring: 0xf1e5d1,
  },
};

const USB_COLORS = {
  cyan: { label: 'Cyan', value: 0x00aaff },
  lime: { label: 'Lime', value: 0x91ff7b },
  amber: { label: 'Amber', value: 0xffbf47 },
  white: { label: 'White', value: 0xffffff },
};

const CAPACITIES: Record<CapacityKey, CapacityPreset> = {
  '5k': { label: '5,000 mAh', sizeLabel: '5,000 mAh', scale: [1, 1, 1] },
  '10k': { label: '10,000 mAh', sizeLabel: '10,000 mAh', scale: [1.06, 1.08, 1.22] },
  '20k': { label: '20,000 mAh', sizeLabel: '20,000 mAh', scale: [1.12, 1.15, 1.42] },
};

function materialOf(object: THREE.Object3D): THREE.Material | null {
  const mesh = object as THREE.Mesh;
  const material = mesh.material;
  if (!material) return null;
  return Array.isArray(material) ? material[0] : material;
}

function setMaterialColor(root: THREE.Object3D, names: string[], color: number): void {
  for (const name of names) {
    const material = materialOf(root.getObjectByName(name) ?? new THREE.Object3D());
    if (material && 'color' in material && material.color instanceof THREE.Color) {
      material.color.setHex(color);
    }
  }
}

function setVisibility(root: THREE.Object3D, names: string[], visible: boolean): void {
  for (const name of names) {
    const part = root.getObjectByName(name);
    if (part) part.visible = visible;
  }
}

function setLedPower(root: THREE.Object3D, enabled: boolean, intensity: number): void {
  for (let index = 1; index <= 4; index += 1) {
    const led = root.getObjectByName(`status-led-${index}`);
    if (!led) continue;
    led.visible = enabled;
    const material = materialOf(led) as THREE.MeshStandardMaterial | null;
    if (material?.emissive) {
      material.emissiveIntensity = enabled ? intensity : 0;
    }
  }
}

function setSurfaceGloss(root: THREE.Object3D, gloss: number): void {
  const parts = ['glossy-rear-shell', 'matte-charging-face', 'front-polished-gasket'];
  for (const name of parts) {
    const material = materialOf(root.getObjectByName(name) ?? new THREE.Object3D()) as
      | THREE.MeshPhysicalMaterial
      | null;
    if (!material) continue;
    material.roughness = THREE.MathUtils.lerp(0.82, 0.24, gloss);
    material.clearcoat = THREE.MathUtils.lerp(0.08, 0.9, gloss);
    material.clearcoatRoughness = THREE.MathUtils.lerp(0.62, 0.14, gloss);
  }
}

function drawTrackedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string,
  tracking: number,
): void {
  context.font = font;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const characters = [...value];
  const widths = characters.map((character) => context.measureText(character).width);
  const totalWidth = widths.reduce((total, width) => total + width, 0) + tracking * (characters.length - 1);
  let cursor = x - totalWidth / 2;

  characters.forEach((character, index) => {
    context.fillText(character, cursor + widths[index] / 2, y);
    cursor += widths[index] + tracking;
  });
}

function makeTextTexture(
  lines: string[],
  color = '#ded8cc',
  align: CanvasTextAlign = 'center',
  accent?: string,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = align;
  context.textBaseline = 'middle';

  const x = align === 'left' ? 34 : canvas.width / 2;
  const lineHeight = lines.length === 1 ? 44 : lines.length >= 5 ? 26 : 38;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    context.fillStyle = color;
    context.font =
      index === 0
        ? lines.length >= 5
          ? '700 28px Arial, sans-serif'
          : '700 34px Arial, sans-serif'
        : lines.length >= 5
          ? '500 18px Arial, sans-serif'
          : '500 23px Arial, sans-serif';
    if (index === 0 && align === 'center') {
      drawTrackedText(context, line, x, startY + index * lineHeight, context.font, color, 2.6);
      return;
    }
    context.fillText(line, x, startY + index * lineHeight);
  });

  if (accent) {
    context.fillStyle = accent;
    context.fillRect(canvas.width * 0.39, startY + (lines.length - 1) * lineHeight + 28, canvas.width * 0.22, 5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function updateTextPlane(
  mesh: THREE.Mesh,
  lines: string[],
  color = '#ded8cc',
  align: CanvasTextAlign = 'center',
  accent?: string,
): void {
  const material = mesh.material as THREE.MeshBasicMaterial;
  const previous = material.map;
  material.map = makeTextTexture(lines, color, align, accent);
  material.needsUpdate = true;
  previous?.dispose();
}

function makeCapacityTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const context = canvas.getContext('2d')!;
  const [amount, unit] = label.split(' ');
  const copper = '#d4a27c';

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = copper;
  context.textBaseline = 'middle';
  context.font = '700 104px Arial, sans-serif';
  context.fillText(amount, 30, 102);

  const amountWidth = context.measureText(amount).width;
  context.font = '600 47px Arial, sans-serif';
  context.fillText(unit, 48 + amountWidth, 116);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function updateCapacityPlane(mesh: THREE.Mesh, label: string): void {
  const material = mesh.material as THREE.MeshBasicMaterial;
  const previous = material.map;
  material.map = makeCapacityTexture(label);
  material.needsUpdate = true;
  previous?.dispose();
}

function makeRegulatoryTexture(capacity: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const etch = '#a7a39f';
  const compactCapacity = capacity.replace(' ', '');
  const capacityMark = `${capacity.split(',')[0]}K`;
  const lines = [
    `Anker MagGo Power Bank (${capacityMark})`,
    `Model: A1618    Battery Capacity: ${compactCapacity} 3.85Vdc/19.25Wh`,
    'USB-C Input: 5V---3A / 9V---2.22A',
    'USB-C Output: 5V---3A / 9V---2.22A / 12V---1.67A (20W Max)',
    'Wireless Output: 5W / 7.5W / 10W / 15W (Max)',
    'Total Output: 5V---3A (15W Max)',
    'Anker Innovations Limited | Made in China    S/N: AFYXXXXXXXXXX',
  ];

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textBaseline = 'middle';
  context.fillStyle = etch;
  lines.forEach((line, index) => {
    context.font = index === 0 ? '600 31px Arial, sans-serif' : '400 23px Arial, sans-serif';
    context.fillText(line, 38, 48 + index * 42);
  });

  const marksY = 394;
  context.font = '600 58px Arial, sans-serif';
  context.fillText('CE', 42, marksY);
  context.font = '700 35px Arial, sans-serif';
  context.fillText('UK', 164, marksY - 18);
  context.fillText('CA', 164, marksY + 20);

  context.lineWidth = 3;
  context.strokeStyle = etch;
  context.beginPath();
  context.arc(295, marksY, 31, 0, Math.PI * 2);
  context.stroke();
  context.font = '600 25px Arial, sans-serif';
  context.fillText('PSE', 272, marksY + 2);

  context.strokeRect(395, marksY - 29, 34, 45);
  context.beginPath();
  context.moveTo(385, marksY - 45);
  context.lineTo(440, marksY + 30);
  context.moveTo(440, marksY - 45);
  context.lineTo(385, marksY + 30);
  context.stroke();
  context.font = '600 22px Arial, sans-serif';
  context.fillText('Li-ion', 510, marksY + 4);
  context.font = '700 28px Arial, sans-serif';
  context.fillText('RoHS', 650, marksY + 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeRegulatoryPlane(name: string, capacity: string): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({
    map: makeRegulatoryTexture(capacity),
    transparent: true,
    opacity: 0.84,
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.6), material);
  mesh.name = name;
  return mesh;
}

function updateRegulatoryPlane(mesh: THREE.Mesh, capacity: string): void {
  const material = mesh.material as THREE.MeshBasicMaterial;
  const previous = material.map;
  material.map = makeRegulatoryTexture(capacity);
  material.needsUpdate = true;
  previous?.dispose();
}

function makeEngravedPlane(
  name: string,
  width: number,
  height: number,
  lines: string[],
  color = '#ded8cc',
  align: CanvasTextAlign = 'center',
  accent?: string,
): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({
    map: makeTextTexture(lines, color, align, accent),
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.name = name;
  return mesh;
}

function makeRevealPlateau(): THREE.Group {
  const stage = new THREE.Group();
  stage.name = 'power-bank-reveal-plateau';

  const baseMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x0dc9b1,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.72, 0.18, 96), baseMaterial);
  base.name = 'reveal-plateau-base';
  base.position.y = 0.09;
  base.castShadow = true;
  base.receiveShadow = true;
  stage.add(base);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.018, 16, 112), baseMaterial);
  rim.name = 'reveal-plateau-rim';
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.195;
  rim.castShadow = true;
  stage.add(rim);

  const lightRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.01, 12, 112), glowMaterial);
  lightRing.name = 'reveal-plateau-light-ring';
  lightRing.rotation.x = Math.PI / 2;
  lightRing.position.y = 0.205;
  stage.add(lightRing);

  const halo = new THREE.Mesh(new THREE.RingGeometry(0.72, 1.42, 112), glowMaterial);
  halo.name = 'reveal-plateau-halo';
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.212;
  stage.add(halo);

  const column = new THREE.PointLight(0x0dc9b1, 0.75, 4.2, 1.7);
  column.name = 'reveal-plateau-lift-light';
  column.position.set(0, 0.85, 0);
  stage.add(column);

  return stage;
}

function makePowerBankContactShadow(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(128, 128, 12, 128, 128, 118);
  gradient.addColorStop(0, 'rgba(20, 26, 36, 0.28)');
  gradient.addColorStop(0.44, 'rgba(20, 26, 36, 0.15)');
  gradient.addColorStop(1, 'rgba(20, 26, 36, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.46), material);
  shadow.name = 'power-bank-contact-shadow';
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.219;
  shadow.renderOrder = 1;
  return shadow;
}

function captureDefaults(root: THREE.Object3D, lights: THREE.Light[]): DefaultsSnapshot {
  const materials: MaterialSnapshot[] = [];
  const seenMaterials = new Set<THREE.Material>();
  const visibility: Array<{ object: THREE.Object3D; visible: boolean }> = [];

  root.traverse((object) => {
    visibility.push({ object, visible: object.visible });
    const mesh = object as THREE.Mesh;
    const materialValue = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!materialValue) return;

    const objectMaterials = Array.isArray(materialValue) ? materialValue : [materialValue];
    for (const material of objectMaterials) {
      if (seenMaterials.has(material)) continue;
      seenMaterials.add(material);

      const physical = material as THREE.MeshPhysicalMaterial;
      const standard = material as THREE.MeshStandardMaterial;
      materials.push({
        material,
        color: 'color' in material && material.color instanceof THREE.Color ? material.color.clone() : undefined,
        roughness: typeof physical.roughness === 'number' ? physical.roughness : undefined,
        metalness: typeof standard.metalness === 'number' ? standard.metalness : undefined,
        clearcoat: typeof physical.clearcoat === 'number' ? physical.clearcoat : undefined,
        clearcoatRoughness:
          typeof physical.clearcoatRoughness === 'number' ? physical.clearcoatRoughness : undefined,
        emissive:
          'emissive' in material && standard.emissive instanceof THREE.Color
            ? standard.emissive.clone()
            : undefined,
        emissiveIntensity:
          typeof standard.emissiveIntensity === 'number' ? standard.emissiveIntensity : undefined,
      });
    }
  });

  return {
    materials,
    visibility,
    lights: lights.map((light) => ({ light, intensity: light.intensity })),
    position: root.position.clone(),
    rotation: root.rotation.clone(),
    scale: root.scale.clone(),
  };
}

function restoreDefaults(root: THREE.Object3D, defaults: DefaultsSnapshot): void {
  for (const snapshot of defaults.materials) {
    const physical = snapshot.material as THREE.MeshPhysicalMaterial;
    const standard = snapshot.material as THREE.MeshStandardMaterial;
    if (snapshot.color) physical.color.copy(snapshot.color);
    if (snapshot.roughness !== undefined) physical.roughness = snapshot.roughness;
    if (snapshot.metalness !== undefined) standard.metalness = snapshot.metalness;
    if (snapshot.clearcoat !== undefined) physical.clearcoat = snapshot.clearcoat;
    if (snapshot.clearcoatRoughness !== undefined) {
      physical.clearcoatRoughness = snapshot.clearcoatRoughness;
    }
    if (snapshot.emissive) standard.emissive.copy(snapshot.emissive);
    if (snapshot.emissiveIntensity !== undefined) {
      standard.emissiveIntensity = snapshot.emissiveIntensity;
    }
  }

  for (const snapshot of defaults.visibility) {
    snapshot.object.visible = snapshot.visible;
  }

  for (const snapshot of defaults.lights) {
    snapshot.light.intensity = snapshot.intensity;
  }

  root.position.copy(defaults.position);
  root.rotation.copy(defaults.rotation);
  root.scale.copy(defaults.scale);
}

/** Renders a product configurator around the Anker MagGo power bank canvas. */
export function renderPowerBankCustomizer(mount: HTMLElement): () => void {
  mount.innerHTML = `
    <div class="customizer-page light-mesh-bg">
      <div class="customizer-canvas-mount" id="power-bank-canvas"></div>
      
      <div class="floating-actions">
        <button class="fab" id="fab-orbit" title="Drag to orbit">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/><path d="M6 11V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/></svg>
        </button>
        <button class="fab" id="fab-center" title="Center view">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="20" y2="12"/></svg>
        </button>
        <button class="fab" id="fab-zoom" title="Zoom to fit">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
      </div>

      <header class="global-header">
        <div class="header-brand">
          <div class="brand-logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 2.5H13.5L9.5 10.5H3.5L7 2.5Z" fill="#00C9B1"/>
              <path d="M14.5 13.5H21L17 21.5H11L14.5 13.5Z" fill="#00C9B1"/>
            </svg>
          </div>
          <div class="brand-text">
            <strong>POWERCRAFT</strong>
            <span>CUSTOM. BRANDED. YOURS.</span>
          </div>
        </div>
        <nav class="header-nav">
          <a href="#/" class="active">Build</a>
          <a href="#/">Gallery</a>
          <a href="#/">About</a>
        </nav>
        <div class="header-actions" style="display: flex; align-items: center;">
          <button class="theme-switch" id="theme-toggle" title="Toggle dark mode">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <div class="header-divider"></div>
          <a href="#/" class="profile-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Account
          </a>
        </div>
      </header>

      <div class="customizer-columns">
        <div class="customizer-column customizer-column-left">
          <h1 class="page-title">Custom power<br>banks.<br>Built for <span class="text-teal">your<br>brand.</span></h1>
          <p class="page-subtitle">Design, personalise and order premium power<br>banks tailored to your brand and customers.</p>

          <div class="customizer-card top-card">
            <div class="top-card-header">
              <div class="model-info">
                <div class="model-thumb" aria-hidden="true"></div>
                <div class="model-name">
                  <strong>Anker MagGo 5,000 mAh</strong>
                  <a href="#" class="change-model-link">Change model</a>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>

          <div class="left-control-stack">
            <div class="customizer-card">
              <h3 class="card-title">Body colour</h3>
              <div class="swatch-grid body-swatch-grid">
                ${Object.entries(FINISHES)
                  .map(
                    ([key, finish]) => `
                      <label class="swatch-option ${key === 'graphite' ? 'active' : ''}" title="${finish.label}">
                        <input type="radio" name="finish" value="${key}" ${key === 'graphite' ? 'checked' : ''} />
                        <span class="swatch" style="--swatch-color:#${finish.body.toString(16).padStart(6, '0')}"></span>
                      </label>
                    `,
                  )
                  .join('')}
              </div>
            </div>

            <div class="customizer-card">
              <div class="control-heading">
                <h3 class="card-title">Surface gloss</h3>
                <strong id="gloss-value">45%</strong>
              </div>
              <label class="range-control range-control-compact">
                <input id="gloss-control" type="range" min="0" max="100" value="45" />
              </label>
            </div>

            <div class="customizer-card">
              <h3 class="card-title">USB tongue colour</h3>
              <div class="usb-swatch-grid">
                ${Object.entries(USB_COLORS)
                  .map(
                    ([key, color]) => `
                      <label class="swatch-option label-swatch ${key === 'cyan' ? 'active' : ''}" title="${color.label}">
                        <input type="radio" name="usb-color" value="${key}" ${key === 'cyan' ? 'checked' : ''} />
                        <span class="swatch" style="--swatch-color:#${color.value.toString(16).padStart(6, '0')}"></span>
                        <span class="swatch-label">${color.label}</span>
                      </label>
                    `,
                  )
                  .join('')}
              </div>
            </div>

            <div class="customizer-card">
              <h3 class="card-title">Personalisation</h3>
              <label class="text-control">
                <span class="input-label">Inscription</span>
                <div class="input-wrapper">
                  <input id="brand-control" type="text" value="ANKER" maxlength="15" autocomplete="off" placeholder="Enter words or names" />
                  <div class="check-circle"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                </div>
              </label>
              <p class="card-desc">Up to 15 characters</p>
            </div>
          </div>

          <div class="left-benefits" aria-label="Product benefits">
            <div class="left-benefit"><span class="left-benefit-icon">&#9670;</span><span>Premium<br>Build</span></div>
            <div class="left-benefit"><span class="left-benefit-icon">&#9889;</span><span>Safe<br>Charging</span></div>
            <div class="left-benefit"><span class="left-benefit-icon">&#9992;</span><span>Travel<br>Friendly</span></div>
          </div>
        </div>

        <div class="customizer-column customizer-column-right">
          <div class="customizer-card">
            <h3 class="card-title">Capacity size</h3>
            <div class="segmented-control segmented-control-three capacity-segmented">
              ${Object.entries(CAPACITIES)
                .map(
                  ([key, capacity]) => `
                    <label>
                      <input type="radio" name="capacity" value="${key}" ${key === '5k' ? 'checked' : ''} />
                      <span class="segmented-box">
                        <strong>${capacity.label.split(' ')[0]}</strong>
                        <small>mAh</small>
                      </span>
                    </label>
                  `,
                )
                .join('')}
            </div>
          </div>

          <div class="customizer-card">
            <h3 class="card-title">Stage controls</h3>
            
            <label class="toggle-row">
              <span class="info-label">Add MagSafe <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span>
              <input id="magsafe-toggle" class="apple-switch" type="checkbox" checked />
            </label>
            
            <div class="control-row">
              <span class="row-label info-label">Battery indicator <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span>
              <div class="segmented-control">
                <label>
                  <input type="radio" name="indicator-type" value="leds" checked />
                  <span class="segmented-pill">LED dots</span>
                </label>
                <label>
                  <input type="radio" name="indicator-type" value="screen" />
                  <span class="segmented-pill">Info screen</span>
                </label>
              </div>
            </div>
            
            <label class="toggle-row">
              <span class="info-label">Auto rotation <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span>
              <input id="spin-toggle" class="apple-switch" type="checkbox" />
            </label>
            
            <div class="control-row">
              <span class="row-label info-label">Stage light <strong id="light-value" style="float: right;">70%</strong></span>
              <label class="range-control no-margin">
                <input id="light-control" type="range" min="20" max="120" value="70" />
              </label>
            </div>
          </div>

          <div class="customizer-card summary-card">
            <h3 class="card-title">Build summary</h3>
            
            <div class="summary-rows" aria-live="polite">
              <div class="summary-row">
                <span id="capacity-readout">Power bank</span>
                <strong>£40.00</strong>
              </div>
              <div class="summary-row">
                <span>Custom inscription</span>
                <strong>£5.00</strong>
              </div>
            </div>

            <div class="summary-total">
              <span>Total Price:</span>
              <strong>£45.00</strong>
            </div>

            <button class="btn-primary customizer-reset" id="reset-customizer" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Reset to code default
            </button>
          </div>
        </div>
      </div>

      <div class="feature-strip">
        <div class="feature-item">
          <div class="feature-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0dc9b1" stroke-width="2"><rect x="6" y="2" width="12" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg></div>
          <div class="feature-text">
            <strong>5,000 mAh</strong>
            <span>Reliable power on the go</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0dc9b1" stroke-width="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="feature-text">
            <strong>MagSafe Ready</strong>
            <span>Seamless wireless charging</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0dc9b1" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
          <div class="feature-text">
            <strong>Smart Protection</strong>
            <span>Advanced safety features</span>
          </div>
        </div>
      </div>

      <div class="customizer-hint">Drag to orbit &middot; Scroll to zoom</div>
    </div>
  `;

  const canvasMount = mount.querySelector<HTMLDivElement>('#power-bank-canvas')!;
  const viewer = new Viewer(canvasMount, {
    cameraPosition: [-4.9, 3.45, 7.15],
    cameraTarget: [0, 1.42, 0],
    cameraFov: 38,
    installLights: (scene) => scene.add(createAnkerMaggoA1618LookDevLights()),
  });
  const defaultCameraPosition = viewer.camera.position.clone();
  const defaultCameraTarget = viewer.controls.target.clone();
  const targetCameraPosition = defaultCameraPosition.clone();
  const targetCameraTarget = defaultCameraTarget.clone();
  viewer.controls.minDistance = 2.2;
  viewer.controls.maxDistance = 10;

  const revealPlateau = makeRevealPlateau();
  const contactShadow = makePowerBankContactShadow();
  revealPlateau.add(contactShadow);
  viewer.scene.add(revealPlateau);

  // The generic viewer floor produces a long directional shadow outside the product stage.
  viewer.scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.material instanceof THREE.ShadowMaterial) mesh.visible = false;
  });

  const model = createAnkerMaggoA1618Model({ shadows: true, rotationSpeed: 0 });
  model.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) mesh.castShadow = false;
  });
  model.position.y = 0.62;
  const productSpecEngraving = makeRegulatoryPlane('power-bank-product-spec-engraving', '5,000 mAh');
  productSpecEngraving.rotation.y = Math.PI;
  // Match the lower clearance to the left-side clearance for a balanced regulatory block.
  productSpecEngraving.position.set(-0.34, 0.43, -0.294);
  model.add(productSpecEngraving);

  const capacityEngraving = makeEngravedPlane(
    'power-bank-capacity-engraving',
    0.68,
    0.17,
    ['5,000 mAh'],
    '#d4a27c',
  );
  capacityEngraving.rotation.y = 0;
  capacityEngraving.position.set(-0.23, 0.29, 0.322);
  model.add(capacityEngraving);

  const screenInset = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.22),
    new THREE.MeshBasicMaterial({ color: 0x061c22, side: THREE.DoubleSide, toneMapped: false }),
  );
  screenInset.name = 'power-bank-screen-inset';
  screenInset.position.set(0, 0.62, 0.318);
  screenInset.visible = false;
  model.add(screenInset);

  const screenDisplay = makeEngravedPlane(
    'power-bank-screen-display',
    0.32,
    0.18,
    ['82%'],
    '#7fffe9',
  );
  screenDisplay.position.set(0, 0.62, 0.321);
  screenDisplay.visible = false;
  model.add(screenDisplay);

  const brandEngraving = makeEngravedPlane(
    'power-bank-brand-engraving',
    3.36,
    0.6,
    ['ANKER'],
    '#101216',
  );
  // The wordmark is deliberately oversized and follows the long face axis.
  brandEngraving.rotation.z = -Math.PI / 2;
  brandEngraving.position.set(0.3, 1.46, 0.323);
  model.add(brandEngraving);
  viewer.scene.add(model);

  let selectedIndicator: 'leds' | 'screen' = 'leds';
  let selectedCapacity: CapacityKey = '5k';
  let autoSpin = false;
  let inscriptionFocus = false;
  const targetScale = new THREE.Vector3(1, 1, 1);
  const suspendedBaseY = model.position.y;
  model.userData.tick = (dt: number, elapsed: number): void => {
    model.scale.lerp(targetScale, 1 - Math.exp(-dt * 5.6));
    contactShadow.scale.set(model.scale.x, model.scale.z, 1);
    if (autoSpin) {
      model.rotation.y += dt * 0.16;
    }
    model.position.y = suspendedBaseY + Math.sin(elapsed * 1.35) * 0.035;
    viewer.camera.position.lerp(targetCameraPosition, 1 - Math.exp(-dt * 5.8));
    viewer.controls.target.lerp(targetCameraTarget, 1 - Math.exp(-dt * 5.8));
    viewer.controls.update();
  };

  const ambientLights: Array<{ light: THREE.Light; baseIntensity: number }> = [];
  viewer.scene.traverse((object) => {
    if (object instanceof THREE.Light) {
      ambientLights.push({ light: object, baseIntensity: object.intensity });
    }
  });
  const defaults = captureDefaults(
    model,
    ambientLights.map(({ light }) => light),
  );
  const listeners: Array<() => void> = [];

  const listen = <T extends Event>(
    element: EventTarget,
    type: string,
    handler: (event: T) => void,
  ): void => {
    const listener = handler as EventListener;
    element.addEventListener(type, listener);
    listeners.push(() => element.removeEventListener(type, listener));
  };

  const applyFinish = (key: FinishKey): void => {
    const finish = FINISHES[key];
    setMaterialColor(model, ['glossy-rear-shell', 'matte-charging-face'], finish.body);
    setMaterialColor(model, ['front-polished-gasket', 'magsafe-alignment-ring'], finish.edge);
    setMaterialColor(model, ['magsafe-center-pad', 'power-button'], finish.panel);
    setMaterialColor(model, ['status-ring'], finish.ring);
    syncLeds();
  };

  const capacityReadout = mount.querySelector<HTMLElement>('#capacity-readout')!;
  const brandControl = mount.querySelector<HTMLInputElement>('#brand-control')!;

  const applyDimensions = (): void => {
    const capacity = CAPACITIES[selectedCapacity];
    targetScale.fromArray(capacity.scale);
    capacityReadout.textContent = capacity.label;
    updateCapacityPlane(capacityEngraving, capacity.label);
    updateProductSpecification();
  };

  const updateProductSpecification = (): void => {
    const capacity = CAPACITIES[selectedCapacity];
    updateRegulatoryPlane(productSpecEngraving, capacity.label);
  };

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="finish"]')) {
    listen(input, 'change', () => applyFinish(input.value as FinishKey));
  }

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="usb-color"]')) {
    listen(input, 'change', () => {
      const color = USB_COLORS[input.value as keyof typeof USB_COLORS];
      setMaterialColor(model, ['usb-c-blue-tongue'], color.value);
      const material = materialOf(model.getObjectByName('usb-c-blue-tongue') ?? new THREE.Object3D()) as
        | THREE.MeshStandardMaterial
        | null;
      if (material?.emissive) material.emissive.setHex(color.value);
    });
  }

  listen(brandControl, 'input', () => {
    const brandName = brandControl.value.trim().toUpperCase();
    brandEngraving.visible = brandName.length > 0;
    if (brandName) updateTextPlane(brandEngraving, [brandName], '#101216');
  });

  const setInscriptionFocus = (focused: boolean): void => {
    inscriptionFocus = focused;
    if (inscriptionFocus) {
      targetCameraPosition.set(0.54, 1.54, 2.45);
      targetCameraTarget.set(0.3, 1.46, 0.22);
      return;
    }
    targetCameraPosition.copy(defaultCameraPosition);
    targetCameraTarget.copy(defaultCameraTarget);
  };

  listen(brandControl, 'focus', () => setInscriptionFocus(true));
  listen(brandControl, 'blur', () => setInscriptionFocus(false));

  const glossControl = mount.querySelector<HTMLInputElement>('#gloss-control')!;
  const glossValue = mount.querySelector<HTMLElement>('#gloss-value')!;
  listen(glossControl, 'input', () => {
    const value = Number(glossControl.value);
    glossValue.textContent = `${value}%`;
    setSurfaceGloss(model, value / 100);
  });

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="indicator-type"]')) {
    listen(input, 'change', () => {
      selectedIndicator = input.value as 'leds' | 'screen';
      syncLeds();
    });
  }

  const syncLeds = (): void => {
    const isLeds = selectedIndicator === 'leds';
    setLedPower(model, isLeds, 2.4);
    
    if (screenDisplay) {
      screenDisplay.visible = !isLeds;
      screenInset.visible = !isLeds;
      const material = screenDisplay.material as THREE.MeshBasicMaterial;
      material.opacity = 0.9;
      material.color.setHex(0x7fffe9);
    }
  };

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="capacity"]')) {
    listen(input, 'change', () => {
      selectedCapacity = input.value as CapacityKey;
      applyDimensions();
    });
  }


  const magsafeToggle = mount.querySelector<HTMLInputElement>('#magsafe-toggle')!;
  listen(magsafeToggle, 'change', () => {
    setVisibility(model, ['magsafe-alignment-ring', 'magsafe-center-pad', 'magsafe-alignment-bar'], magsafeToggle.checked);
  });

  const spinToggle = mount.querySelector<HTMLInputElement>('#spin-toggle')!;
  listen(spinToggle, 'change', () => {
    autoSpin = spinToggle.checked;
  });

  const lightControl = mount.querySelector<HTMLInputElement>('#light-control')!;
  const lightValue = mount.querySelector<HTMLElement>('#light-value')!;
  listen(lightControl, 'input', () => {
    const value = Number(lightControl.value);
    lightValue.textContent = `${value}%`;
    for (const { light, baseIntensity } of ambientLights) {
      light.intensity = baseIntensity * (value / 70);
    }
  });

  const resetButton = mount.querySelector<HTMLButtonElement>('#reset-customizer')!;
  listen(resetButton, 'click', () => {
    restoreDefaults(model, defaults);
    selectedCapacity = '5k';
    autoSpin = false;
    inscriptionFocus = false;

    const finishInput = mount.querySelector<HTMLInputElement>('input[name="finish"][value="graphite"]');
    const usbInput = mount.querySelector<HTMLInputElement>('input[name="usb-color"][value="cyan"]');
    const capacityInput = mount.querySelector<HTMLInputElement>('input[name="capacity"][value="5k"]');
    if (finishInput) finishInput.checked = true;
    if (usbInput) usbInput.checked = true;
    if (capacityInput) capacityInput.checked = true;
    glossControl.value = '45';
    glossValue.textContent = '45%';
    selectedIndicator = 'leds';
    const indicatorInput = mount.querySelector<HTMLInputElement>('input[name="indicator-type"][value="leds"]');
    if (indicatorInput) indicatorInput.checked = true;
    magsafeToggle.checked = true;
    spinToggle.checked = false;
    lightControl.value = '70';
    lightValue.textContent = '70%';
    brandControl.value = 'ANKER';
    brandEngraving.visible = true;
    updateTextPlane(brandEngraving, ['ANKER'], '#101216');
    applyDimensions();
    syncLeds();
    viewer.camera.position.copy(defaultCameraPosition);
    viewer.controls.target.copy(defaultCameraTarget);
    targetCameraPosition.copy(defaultCameraPosition);
    targetCameraTarget.copy(defaultCameraTarget);
    viewer.controls.update();
  });

  // FAB Listeners
  const fabOrbit = mount.querySelector<HTMLButtonElement>('#fab-orbit');
  const fabCenter = mount.querySelector<HTMLButtonElement>('#fab-center');
  const fabZoom = mount.querySelector<HTMLButtonElement>('#fab-zoom');
  
  const themeToggle = mount.querySelector<HTMLButtonElement>('#theme-toggle');
  const customizerPage = mount.querySelector('.customizer-page');

  if (themeToggle && customizerPage) {
    listen(themeToggle, 'click', () => {
      const isDark = customizerPage.classList.toggle('dark-mode');
      
      const plateauBase = revealPlateau.getObjectByName('reveal-plateau-base') as THREE.Mesh;
      const plateauRim = revealPlateau.getObjectByName('reveal-plateau-rim') as THREE.Mesh;
      if (plateauBase && plateauBase.material instanceof THREE.MeshStandardMaterial) {
        plateauBase.material.color.setHex(isDark ? 0x181c2b : 0xffffff);
      }
      if (plateauRim && plateauRim.material instanceof THREE.MeshStandardMaterial) {
        plateauRim.material.color.setHex(isDark ? 0x181c2b : 0xffffff);
      }

      // Toggle icon
      if (isDark) {
        themeToggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      } else {
        themeToggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
      }
    });
  }
  
  if (fabOrbit) {
    listen(fabOrbit, 'click', () => {
      autoSpin = !autoSpin;
      spinToggle.checked = autoSpin;
    });
  }
  if (fabCenter) {
    listen(fabCenter, 'click', () => {
      viewer.controls.target.copy(defaultCameraTarget);
      viewer.camera.position.copy(defaultCameraPosition);
      viewer.controls.update();
    });
  }
  if (fabZoom) {
    listen(fabZoom, 'click', () => {
      viewer.camera.position.copy(defaultCameraTarget).add(new THREE.Vector3(0, 0.4, 2.8));
      viewer.controls.update();
    });
  }

  // Active state for swatch selection (since active class is needed in HTML)
  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="finish"]')) {
    listen(input, 'change', () => {
      mount.querySelectorAll('input[name="finish"]').forEach(r => r.parentElement?.classList.remove('active'));
      input.parentElement?.classList.add('active');
    });
  }
  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="usb-color"]')) {
    listen(input, 'change', () => {
      mount.querySelectorAll('input[name="usb-color"]').forEach(r => r.parentElement?.classList.remove('active'));
      input.parentElement?.classList.add('active');
    });
  }

  applyDimensions();
  syncLeds();
  viewer.start();

  return () => {
    for (const remove of listeners) remove();
    viewer.dispose();
  };
}
