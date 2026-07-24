import * as THREE from 'three';
import { animate } from 'motion';
import {
  createAnkerMaggoA1618LookDevLights,
  createAnkerMaggoA1618Model,
  createRingRimGeometry,
  createRingFaceGeometry,
  makeBatteryPercentageDisplay,
  RingShapeKey,
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

type CapacityKey = '5k' | '10k' | '20k' | '40k' | '60k' | '120k';
type CapacityPreset = {
  label: string;
  sizeLabel: string;
  scale: THREE.Vector3Tuple;
  unitPrice: number;
};

type WattageKey = '15w' | '30w' | '65w' | '100w';
type WattagePreset = {
  label: string;
  priceDelta: number;
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
    ring: 0x8a929b,
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
  '5k': { label: '5,000 mAh', sizeLabel: '5,000 mAh', scale: [1.0, 0.88, 0.75], unitPrice: 14.5 },
  '10k': { label: '10,000 mAh', sizeLabel: '10,000 mAh', scale: [1.0, 0.96, 0.88], unitPrice: 20.5 },
  '20k': { label: '20,000 mAh', sizeLabel: '20,000 mAh', scale: [1.0, 1.0, 1.0], unitPrice: 27.5 },
  '40k': { label: '40,000 mAh', sizeLabel: '40,000 mAh', scale: [1.0, 1.08, 1.22], unitPrice: 38.5 },
  '60k': { label: '60,000 mAh', sizeLabel: '60,000 mAh', scale: [1.0, 1.18, 1.42], unitPrice: 49.5 },
  '120k': { label: '120,000 mAh', sizeLabel: '120,000 mAh', scale: [1.0, 1.28, 1.65], unitPrice: 74.5 },
};

const WATTAGES: Record<WattageKey, WattagePreset> = {
  '15w': { label: '15W', priceDelta: 0 },
  '30w': { label: '30W', priceDelta: 3 },
  '65w': { label: '65W', priceDelta: 8 },
  '100w': { label: '100W', priceDelta: 14 },
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
  for (let index = 1; index <= 6; index += 1) {
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

function makeCapacityTexture(label: string, wattage: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const context = canvas.getContext('2d')!;
  const [amount, unit] = label.split(' ');
  const copper = '#d4a27c';

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = copper;
  context.textBaseline = 'middle';
  context.font = '700 50px Arial, sans-serif';
  context.fillText(wattage, 10, 114);

  const wattageWidth = context.measureText(wattage).width;
  context.font = '700 104px Arial, sans-serif';
  context.fillText(amount, 28 + wattageWidth, 102);

  const amountWidth = context.measureText(amount).width;
  context.font = '600 47px Arial, sans-serif';
  context.fillText(unit, 44 + wattageWidth + amountWidth, 114);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function updateCapacityPlane(mesh: THREE.Mesh, label: string, wattage: string): void {
  const material = mesh.material as THREE.MeshBasicMaterial;
  const previous = material.map;
  material.map = makeCapacityTexture(label, wattage);
  material.needsUpdate = true;
  previous?.dispose();
}

function makeRegulatoryTexture(capacity: string, wattage: string): THREE.CanvasTexture {
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
    `USB-C Output: 5V---3A / 9V---2.22A / 12V---1.67A (${wattage} Max)`,
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

function makeRegulatoryPlane(name: string, capacity: string, wattage: string): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({
    map: makeRegulatoryTexture(capacity, wattage),
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

function updateRegulatoryPlane(mesh: THREE.Mesh, capacity: string, wattage: string): void {
  const material = mesh.material as THREE.MeshBasicMaterial;
  const previous = material.map;
  material.map = makeRegulatoryTexture(capacity, wattage);
  material.needsUpdate = true;
  previous?.dispose();
}

function makeBrandTexture(value: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1120;
  canvas.height = 200;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#000000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '600 128px Arial, Helvetica, sans-serif';
  context.fillStyle = '#ffffff';
  context.fillText(value, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeBrandPlane(name: string, value: string): THREE.Mesh {
  const texture = makeBrandTexture(value);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x8a929b,
    roughness: 0.15,
    metalness: 0.94,
    clearcoat: 0.5,
    clearcoatRoughness: 0.08,
    alphaMap: texture,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.52, 0.45), material);
  mesh.name = name;
  return mesh;
}

function updateBrandPlane(mesh: THREE.Mesh, value: string): void {
  const material = mesh.material as THREE.MeshPhysicalMaterial;
  const previous = material.alphaMap;
  material.alphaMap = makeBrandTexture(value);
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
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.68), material);
  shadow.name = 'power-bank-contact-shadow';
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.006;
  shadow.renderOrder = 1;
  return shadow;
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

      <header class="global-header">
        <a href="#/" class="header-brand" style="text-decoration:none;">
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
        </a>
        <div class="header-actions" style="display: flex; align-items: center; gap: 0.75rem;">
          <button class="theme-switch" id="theme-toggle" title="Toggle dark mode">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
        </div>
      </header>

      <div class="customizer-columns" id="customizer-bottom-sheet">
        <div class="bottom-sheet-handle-bar" id="sheet-handle">
          <div class="sheet-handle-pill"></div>
        </div>

        <div class="customizer-column customizer-column-left">
          <h1 class="page-title">Custom power banks. Built for <span class="text-teal">your brand.</span></h1>
          <p class="page-subtitle">Design, personalise and order premium power banks tailored to your brand and customers.</p>

          <button type="button" class="start-customising-btn" id="start-customising-cta">
            <span>Start Customising</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>

          <div class="left-control-stack">
            <div class="customizer-card">
              <div class="card-header-row">
                <div class="card-header-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <h3 class="card-title">Body colour</h3>
                <svg class="card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
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
              <div class="card-header-row">
                <div class="card-header-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M5.2 5.2A7 7 0 0 0 5 7"/><path d="M19 12a7 7 0 0 1-7 7"/></svg>
                </div>
                <h3 class="card-title">Surface gloss</h3>
                <strong id="gloss-value" class="card-header-aside">45%</strong>
                <svg class="card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <label class="range-control range-control-compact">
                <input id="gloss-control" type="range" min="0" max="100" value="45" />
              </label>
            </div>

            <div class="customizer-card">
              <div class="card-header-row">
                <div class="card-header-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <h3 class="card-title">Personalisation</h3>
                <svg class="card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <label class="text-control">
                <span class="input-label">Inscription</span>
                <div class="input-wrapper">
                  <input id="brand-control" type="text" value="PowerCraft" maxlength="10" autocomplete="off" placeholder="Enter words or names" />
                  <button class="inscription-done" id="inscription-done" type="button" hidden aria-label="Finish inscription">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </button>
                </div>
                <p class="input-error" id="brand-error" hidden></p>
              </label>
              <p class="card-desc" id="brand-desc">Up to 10 characters</p>
            </div>
          </div>

          <div class="left-benefits" aria-label="Product benefits">
            <div class="left-benefit"><span class="left-benefit-icon">&#9670;</span><span>Premium<br>Build</span></div>
            <div class="left-benefit"><span class="left-benefit-icon">&#9889;</span><span>Safe<br>Charging</span></div>
            <div class="left-benefit"><span class="left-benefit-icon">&#9992;</span><span>Travel<br>Friendly</span></div>
          </div>
        </div>

        <div class="customizer-column customizer-column-right">
          <div class="customizer-card capacity-output-card">
            <div class="card-header-row">
              <div class="card-header-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="14" height="10" rx="2"/><path d="M16 11h2a2 2 0 0 1 0 4h-2"/></svg>
              </div>
              <h3 class="card-title">Capacity size</h3>
              <svg class="card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <div class="segmented-control capacity-segmented capacity-grid">
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
            <div class="wattage-control-block">
              <h3 class="card-title">Wattage output</h3>
              <div class="segmented-control wattage-segmented">
                ${Object.entries(WATTAGES)
                  .map(
                    ([key, wattage]) => `
                      <label>
                        <input type="radio" name="wattage" value="${key}" ${key === '30w' ? 'checked' : ''} />
                        <span class="segmented-pill">${wattage.label}</span>
                      </label>
                    `,
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <div class="customizer-card collapsed">
            <div class="card-header-row">
              <div class="card-header-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <h3 class="card-title">Charging features</h3>
              <svg class="card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            
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

            <div class="control-row no-margin">
              <span class="row-label info-label">Display ring shape <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span>
              <div class="segmented-control">
                <label>
                  <input type="radio" name="ring-shape" value="circle" checked />
                  <span class="segmented-pill">Circle</span>
                </label>
                <label>
                  <input type="radio" name="ring-shape" value="squircle" />
                  <span class="segmented-pill">Squircle</span>
                </label>
                <label>
                  <input type="radio" name="ring-shape" value="hexagon" />
                  <span class="segmented-pill">Hexagon</span>
                </label>
              </div>
            </div>
            <button class="card-done-btn" type="button" style="display: none;">Done</button>
          </div>

          <div class="customizer-card collapsed">
            <div class="card-header-row">
              <div class="card-header-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="14" height="10" rx="2"/><line x1="7" y1="12" x2="11" y2="12"/></svg>
              </div>
              <h3 class="card-title" style="margin:0;">Port configuration</h3>
              <span class="port-status-badge" id="port-status-badge">Wireless Only</span>
              <svg class="card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <div class="port-choice-grid">
              <label class="port-choice-card">
                <input type="checkbox" name="port-option" value="type-a" />
                <div class="port-choice-inner">
                  <div class="port-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg>
                  </div>
                  <div class="port-choice-info">
                    <strong>USB-A</strong>
                    <small>High-speed</small>
                  </div>
                  <div class="port-checkbox-icon">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              </label>

              <label class="port-choice-card">
                <input type="checkbox" name="port-option" value="legacy-usb" />
                <div class="port-choice-inner">
                  <div class="port-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
                  </div>
                  <div class="port-choice-info">
                    <strong>USB</strong>
                    <small>Standard port</small>
                  </div>
                  <div class="port-checkbox-icon">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              </label>

              <label class="port-choice-card">
                <input type="checkbox" name="port-option" value="type-c" />
                <div class="port-choice-inner">
                  <div class="port-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="4"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
                  </div>
                  <div class="port-choice-info">
                    <strong>USB-C</strong>
                    <small>Fast charge</small>
                  </div>
                  <div class="port-checkbox-icon">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              </label>

              <label class="port-choice-card">
                <input type="checkbox" name="port-option" value="lightning" />
                <div class="port-choice-inner">
                  <div class="port-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="8" width="14" height="8" rx="2"/><path d="M12 2v6"/><path d="M12 16v6"/></svg>
                  </div>
                  <div class="port-choice-info">
                    <strong>Lightning</strong>
                    <small>iOS port</small>
                  </div>
                  <div class="port-checkbox-icon">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
              </label>
            </div>

            <!-- Sub-customization: USB tongue colour (shown when at least 1 port is enabled) -->
            <div class="sub-customization-section" id="usb-tongue-section" style="display: none;">
              <h4 class="sub-section-title">USB tongue colour</h4>
              <div class="swatch-grid body-swatch-grid">
                ${Object.entries(USB_COLORS)
                  .map(
                    ([key, color]) => `
                      <label class="swatch-option ${key === 'cyan' ? 'active' : ''}" title="${color.label}">
                        <input type="radio" name="usb-color" value="${key}" ${key === 'cyan' ? 'checked' : ''} />
                        <span class="swatch" style="--swatch-color:#${color.value.toString(16).padStart(6, '0')}"></span>
                      </label>
                    `,
                  )
                  .join('')}
              </div>
            </div>
            <button class="card-done-btn" type="button" style="display: none;">Done</button>
          </div>

          <div class="customizer-card summary-card collapsed">
            <div class="card-header-row">
              <div class="card-header-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <h3 class="card-title">Order summary &amp; booking</h3>
              <svg class="card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            
            <div class="order-spec-grid summary-extra-detail">
              <div class="order-spec-item">
                <span class="spec-label">MOQ (MIN. ORDER)</span>
                <strong class="spec-val">50 units</strong>
              </div>
              <div class="order-spec-item">
                <span class="spec-label">UNIT PRICE</span>
                <strong class="spec-val" id="unit-price-val">£14.50 / unit</strong>
              </div>
            </div>

            <div class="quantity-picker-row">
              <span class="row-label info-label" style="margin: 0;">Order Quantity</span>
              <div class="qty-control">
                <button type="button" class="qty-btn" id="qty-minus">-</button>
                <input type="number" id="order-qty" value="50" min="50" step="50" readonly />
                <button type="button" class="qty-btn" id="qty-plus">+</button>
              </div>
            </div>

            <div class="summary-rows summary-extra-detail" aria-live="polite">
              <div class="summary-row">
                <span id="capacity-readout">5,000 mAh</span>
                <strong id="subtotal-val">£725.00</strong>
              </div>
            </div>

            <div class="summary-total">
              <span>Total Price:</span>
              <strong id="order-total-price">£725.00</strong>
            </div>

            <button class="btn-primary place-order-btn" id="place-order-btn" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Place Order
            </button>

            <div class="lead-time-notice summary-extra-detail">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Estimated Lead Time: <strong>5 - 7 Days</strong></span>
            </div>

            <div class="order-secondary-actions summary-extra-detail">
              <button class="btn-secondary-link" id="reset-customizer" type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Reset to default
              </button>
              <button class="btn-secondary-link" id="request-sample-btn" type="button">
                Request sample (£25)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="customizer-hint">Drag to orbit &middot; Scroll to zoom</div>

      <div class="stage-fab-wrapper" id="stage-fab-wrapper">
        <button class="stage-fab-button" id="stage-fab-toggle" type="button" aria-label="Toggle stage controls" title="Lighting & Camera Controls">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span class="fab-label">Stage</span>
        </button>

        <div class="stage-popover-menu" id="stage-popover-menu">
          <div class="stage-control-group">
            <span class="stage-control-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              Stage light <strong id="light-value">70%</strong>
            </span>
            <label class="range-control no-margin" style="width: 100%;">
              <input id="light-control" type="range" min="20" max="120" value="70" />
            </label>
          </div>

          <div class="stage-control-group">
            <label class="toggle-row no-margin" style="margin: 0; gap: 0.6rem; justify-content: space-between; width: 100%;">
              <span class="stage-control-title" style="margin: 0;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Auto rotation
              </span>
              <input id="spin-toggle" class="apple-switch" type="checkbox" />
            </label>
          </div>

          <div class="stage-action-buttons">
            <button class="stage-btn" id="fab-center" type="button" title="Recenter View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Center</span>
            </button>
            <button class="stage-btn" id="fab-zoom" type="button" title="Zoom Product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              <span>Zoom</span>
            </button>
          </div>
        </div>
      </div>
</div>
  `;

  const canvasMount = mount.querySelector<HTMLDivElement>('#power-bank-canvas')!;
  const isMobileViewport = window.innerWidth <= 768;
  const viewer = new Viewer(canvasMount, {
    cameraPosition: [-5.5, 0.8, 8.8],
    cameraTarget: [0, isMobileViewport ? -0.12 : -0.50, 0],
    cameraFov: 36,
    cameraOffsetY: isMobileViewport ? 0.08 : 0.22,
    installLights: (scene) => scene.add(createAnkerMaggoA1618LookDevLights()),
  });
  const defaultCameraPosition = viewer.camera.position.clone();
  const defaultCameraTarget = viewer.controls.target.clone();
  const targetCameraPosition = defaultCameraPosition.clone();
  const targetCameraTarget = defaultCameraTarget.clone();
  const defaultCameraZoom = viewer.camera.zoom;
  let targetCameraZoom = defaultCameraZoom;
  viewer.controls.minDistance = 2.2;
  viewer.controls.maxDistance = 10;

  let isFocusedOnCard = false;
  const preFocusState = {
    position: defaultCameraPosition.clone(),
    target: defaultCameraTarget.clone(),
    zoom: defaultCameraZoom,
  };

  const savePreFocusState = (): void => {
    if (!isFocusedOnCard) {
      preFocusState.position.copy(viewer.camera.position);
      preFocusState.target.copy(viewer.controls.target);
      preFocusState.zoom = viewer.camera.zoom;
    }
  };

  const restorePreFocusState = (): void => {
    if (isFocusedOnCard) {
      resetToDefaultCamera();
    }
  };

  const revealPlateau = makeRevealPlateau();
  revealPlateau.position.y = -0.593;
  viewer.scene.add(revealPlateau);

  const contactShadow = makePowerBankContactShadow();
  contactShadow.position.y = 0.213;
  revealPlateau.add(contactShadow);

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
  model.position.y = -0.38;
  const productSpecEngraving = makeRegulatoryPlane('power-bank-product-spec-engraving', '5,000 mAh', '30W');
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
  capacityEngraving.position.set(-0.31, 0.29, 0.322);
  model.add(capacityEngraving);

  const brandEngraving = makeBrandPlane('power-bank-brand-engraving', 'PowerCraft');
  // The wordmark is rotated vertically, moved slightly left to 0.53, and raised by 10% offset from top of model (Y=1.62).
  brandEngraving.rotation.z = -Math.PI / 2;
  brandEngraving.position.set(0.53, 1.62, 0.323);
  model.add(brandEngraving);
  viewer.scene.add(model);

  let selectedIndicator: 'leds' | 'screen' = 'leds';
  let selectedCapacity: CapacityKey = '5k';
  let selectedWattage: WattageKey = '30w';
  let autoSpin = false;
  let isCameraTransitioning = false;
  const targetScale = new THREE.Vector3(1, 1, 1);
  const suspendedBaseY = model.position.y;

  viewer.controls.addEventListener('start', () => {
    isCameraTransitioning = false;
    if (!isFocusedOnCard) {
      targetCameraPosition.copy(viewer.camera.position);
      targetCameraTarget.copy(viewer.controls.target);
      targetCameraZoom = viewer.camera.zoom;
      preFocusState.position.copy(viewer.camera.position);
      preFocusState.target.copy(viewer.controls.target);
      preFocusState.zoom = viewer.camera.zoom;
    } else {
      // If user manually drags on canvas while focused, release card focus
      isFocusedOnCard = false;
    }
  });

  viewer.controls.addEventListener('change', () => {
    if (!isFocusedOnCard && !isCameraTransitioning) {
      preFocusState.position.copy(viewer.camera.position);
      preFocusState.target.copy(viewer.controls.target);
      preFocusState.zoom = viewer.camera.zoom;
    }
  });

  model.userData.tick = (dt: number, elapsed: number): void => {
    model.scale.lerp(targetScale, 1 - Math.exp(-dt * 5.6));
    contactShadow.scale.set(model.scale.x, model.scale.z, 1);

    const invScaleY = 1 / model.scale.y;
    const invScaleZ = 1 / model.scale.z;

    // Keep PowerCraft text raised by a fixed 10% offset from top of model (2.78 - 1.16/scaleY), independent of model scaling
    brandEngraving.position.y = 2.78 - 1.16 * invScaleY;
    // brandEngraving is rotated -90deg on Z, so local X maps to world Y. Set local X to invScaleY to cancel model.scale.y!
    brandEngraving.scale.set(invScaleY, 1.0, invScaleZ);

    const bodyMeshNames = new Set([
      'glossy-rear-shell',
      'front-polished-gasket',
      'matte-charging-face',
    ]);

    const uniformScaledNames = new Set([
      'power-bank-capacity-engraving',
      'power-bank-spec-engraving',
      'battery-status-display',
      'battery-percentage-display',
      'status-display',
      'screenInset',
      'screenDisplay',
    ]);

    for (const child of model.children) {
      if (!bodyMeshNames.has(child.name) && child !== brandEngraving) {
        if (uniformScaledNames.has(child.name)) {
          child.scale.set(model.scale.y, 1.0, invScaleZ);
        } else {
          child.scale.set(1.0, invScaleY, invScaleZ);
        }
      }
    }

    if (autoSpin) {
      model.rotation.y += dt * 0.16;
    }
    model.position.y = suspendedBaseY + Math.sin(elapsed * 1.35) * 0.035;

    if (isCameraTransitioning) {
      viewer.camera.position.lerp(targetCameraPosition, 1 - Math.exp(-dt * 5.2));
      viewer.controls.target.lerp(targetCameraTarget, 1 - Math.exp(-dt * 5.2));
      if (Math.abs(viewer.camera.zoom - targetCameraZoom) > 0.002) {
        viewer.camera.zoom = THREE.MathUtils.lerp(viewer.camera.zoom, targetCameraZoom, 1 - Math.exp(-dt * 5.2));
        viewer.camera.updateProjectionMatrix();
      }
      if (
        viewer.camera.position.distanceTo(targetCameraPosition) < 0.015 &&
        viewer.controls.target.distanceTo(targetCameraTarget) < 0.015 &&
        Math.abs(viewer.camera.zoom - targetCameraZoom) < 0.005
      ) {
        isCameraTransitioning = false;
      }
    }
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

  let selectedFinish: FinishKey = 'graphite';

  const applyFinish = (key: FinishKey): void => {
    selectedFinish = key;
    const finish = FINISHES[key];
    setMaterialColor(model, ['glossy-rear-shell', 'matte-charging-face'], finish.body);
    setMaterialColor(model, ['front-polished-gasket', 'magsafe-alignment-ring'], finish.edge);
    setMaterialColor(model, ['magsafe-center-pad', 'power-button'], finish.panel);
    setMaterialColor(model, ['status-ring', 'power-bank-brand-engraving'], finish.ring);
    syncLeds();
  };

  const capacityReadout = mount.querySelector<HTMLElement>('#capacity-readout')!;
  const brandControl = mount.querySelector<HTMLInputElement>('#brand-control')!;
  const inscriptionDone = mount.querySelector<HTMLButtonElement>('#inscription-done')!;
  const brandError = mount.querySelector<HTMLParagraphElement>('#brand-error')!;
  const brandDesc = mount.querySelector<HTMLParagraphElement>('#brand-desc')!;
  let committedBrandName = brandControl.value.trim();

  const applyDimensions = (): void => {
    const capacity = CAPACITIES[selectedCapacity];
    targetScale.fromArray(capacity.scale);
    capacityReadout.textContent = capacity.label;
    updateCapacityPlane(capacityEngraving, capacity.label, WATTAGES[selectedWattage].label);
    updateProductSpecification();
  };

  const updateProductSpecification = (): void => {
    const capacity = CAPACITIES[selectedCapacity];
    updateRegulatoryPlane(productSpecEngraving, capacity.label, WATTAGES[selectedWattage].label);
  };

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="finish"]')) {
    listen(input, 'change', () => applyFinish(input.value as FinishKey));
  }

  const setPortFocus = (): void => {
    savePreFocusState();
    isFocusedOnCard = true;
    isCameraTransitioning = true;
    targetCameraPosition.set(-5.2, 0.15, 2.6);
    targetCameraTarget.set(-0.55, 0.12, 0.0);
    targetCameraZoom = 1.38;
  };

  const setUsbTongueFocus = (): void => {
    savePreFocusState();
    isFocusedOnCard = true;
    isCameraTransitioning = true;
    targetCameraPosition.set(-4.5, 0.18, 1.9);
    targetCameraTarget.set(-0.60, 0.22, 0.0);
    targetCameraZoom = 1.52;
  };

  const setMagSafeFocus = (): void => {
    savePreFocusState();
    isFocusedOnCard = true;
    isCameraTransitioning = true;
    targetCameraPosition.set(3.8, 0.35, -5.2);
    targetCameraTarget.set(0, 0.20, 0);
    targetCameraZoom = 1.35;
  };

  const setFrontDisplayFocus = (): void => {
    savePreFocusState();
    isFocusedOnCard = true;
    isCameraTransitioning = true;
    targetCameraPosition.set(-0.4, 0.25, 6.2);
    targetCameraTarget.set(0, 0.18, 0);
    targetCameraZoom = 1.40;
  };

  const setInscriptionFocus = (focused: boolean): void => {
    if (focused) {
      savePreFocusState();
      isFocusedOnCard = true;
      targetCameraTarget.set(0.12, -0.10, 0.0);
      targetCameraPosition.set(-1.6, 0.35, 6.2);
      targetCameraZoom = 1.38;
      isCameraTransitioning = true;
    } else {
      restorePreFocusState();
    }
  };

  const resetToDefaultCamera = (): void => {
    isFocusedOnCard = false;
    isCameraTransitioning = true;
    targetCameraPosition.copy(defaultCameraPosition);
    targetCameraTarget.copy(defaultCameraTarget);
    targetCameraZoom = defaultCameraZoom;
    preFocusState.position.copy(defaultCameraPosition);
    preFocusState.target.copy(defaultCameraTarget);
    preFocusState.zoom = defaultCameraZoom;
  };

  const resetCameraFocus = (): void => {
    restorePreFocusState();
  };

  // "Done" CTA in each card → reset camera to default
  for (const doneBtn of mount.querySelectorAll<HTMLButtonElement>('.card-done-btn')) {
    listen(doneBtn, 'click', (e: Event) => {
      e.stopPropagation(); // don't toggle the accordion
      resetToDefaultCamera();
    });
  }

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="usb-color"]')) {
    listen(input, 'change', () => {
      setUsbTongueFocus();
      const color = USB_COLORS[input.value as keyof typeof USB_COLORS];
      setMaterialColor(model, ['usb-c-blue-tongue', 'usb-a-blue-tongue', 'micro-usb-blue-tongue'], color.value);
      ['usb-c-blue-tongue', 'usb-a-blue-tongue', 'micro-usb-blue-tongue'].forEach((name) => {
        const material = materialOf(model.getObjectByName(name) ?? new THREE.Object3D()) as
          | THREE.MeshStandardMaterial
          | null;
        if (material?.emissive) material.emissive.setHex(color.value);
      });
      markPortChanged();
    });
  }

  const usbAPort = model.getObjectByName('usb-a-port');
  const legacyUsbPort = model.getObjectByName('micro-usb-port') || model.getObjectByName('legacy-usb-port');
  const usbCPort = model.getObjectByName('usb-c-port');
  const lightningPort = model.getObjectByName('lightning-port');

  const portInputs = Array.from(mount.querySelectorAll<HTMLInputElement>('input[name="port-option"]'));
  const portStatusBadge = mount.querySelector<HTMLElement>('#port-status-badge');

  const syncPorts = (): void => {
    const hasTypeA = portInputs.some(i => i.value === 'type-a' && i.checked);
    const hasLegacyUsb = portInputs.some(i => i.value === 'legacy-usb' && i.checked);
    const hasTypeC = portInputs.some(i => i.value === 'type-c' && i.checked);
    const hasLightning = portInputs.some(i => i.value === 'lightning' && i.checked);

    if (usbAPort) usbAPort.visible = hasTypeA;
    if (legacyUsbPort) legacyUsbPort.visible = hasLegacyUsb;
    if (usbCPort) usbCPort.visible = hasTypeC;
    if (lightningPort) lightningPort.visible = hasLightning;

    const activePorts: string[] = [];
    if (hasTypeA) activePorts.push('USB-A');
    if (hasLegacyUsb) activePorts.push('USB');
    if (hasTypeC) activePorts.push('USB-C');
    if (hasLightning) activePorts.push('Lightning');

    const usbTongueSection = mount.querySelector<HTMLElement>('#usb-tongue-section');
    if (usbTongueSection) {
      usbTongueSection.style.display = activePorts.length > 0 ? 'block' : 'none';
    }

    if (portStatusBadge) {
      if (activePorts.length === 0) {
        portStatusBadge.textContent = 'Wireless Only';
      } else {
        portStatusBadge.textContent = `${activePorts.length} ${activePorts.length === 1 ? 'Port' : 'Ports'}`;
      }
    }
  };

  // Set initial state (No ports selected by default)
  syncPorts();

  // Customizer Card Focus Interactivity
  const allCards = Array.from(mount.querySelectorAll<HTMLElement>('.customizer-card'));
  const portCard = allCards.find(c => c.querySelector('input[name="port-option"]'));
  const chargingFeaturesCard = allCards.find(c => c.querySelector('#magsafe-toggle'));
  const magsafeToggle = mount.querySelector<HTMLInputElement>('#magsafe-toggle')!;
  const chargingDoneBtn = chargingFeaturesCard?.querySelector<HTMLButtonElement>('.card-done-btn');
  const portDoneBtn = portCard?.querySelector<HTMLButtonElement>('.card-done-btn');

  const markChargingChanged = () => {
    if (chargingDoneBtn) {
      chargingDoneBtn.style.display = 'block';
      const wrapper = chargingFeaturesCard?.querySelector<HTMLElement>('.card-content-wrapper');
      if (wrapper && !chargingFeaturesCard?.classList.contains('collapsed')) {
        wrapper.style.height = 'auto';
      }
    }
  };

  const markPortChanged = () => {
    if (portDoneBtn) {
      portDoneBtn.style.display = 'block';
      const wrapper = portCard?.querySelector<HTMLElement>('.card-content-wrapper');
      if (wrapper && !portCard?.classList.contains('collapsed')) {
        wrapper.style.height = 'auto';
      }
    }
  };

  if (chargingDoneBtn) {
    listen(chargingDoneBtn, 'click', (e: Event) => {
      e.stopPropagation();
      resetToDefaultCamera();
      chargingDoneBtn.style.display = 'none';
    });
  }

  if (portDoneBtn) {
    listen(portDoneBtn, 'click', (e: Event) => {
      e.stopPropagation();
      resetToDefaultCamera();
      portDoneBtn.style.display = 'none';
    });
  }

  for (const input of portInputs) {
    listen(input, 'change', () => {
      setPortFocus();
      const checkedPorts = portInputs.filter(i => i.checked);
      if (magsafeToggle && !magsafeToggle.checked && checkedPorts.length === 0) {
        input.checked = true;
      }
      syncPorts();
      markPortChanged();
    });
  }

  // Smooth Motion accordion functions with column-based mutual exclusion & motion blur
  const cardAnimMap = new Map<HTMLElement, boolean>();

  const animateCollapseCard = (card: HTMLElement): Promise<void> => {
    if (card.classList.contains('collapsed')) return Promise.resolve();

    const headerEl = card.querySelector<HTMLElement>('.card-header-row, .card-header-with-badge, .card-header-accordion');
    const chevronSvg = headerEl?.querySelector<HTMLElement>('.card-chevron svg, svg.card-chevron');

    if (chevronSvg) {
      chevronSvg.style.transform = 'rotate(0deg)';
    }

    cardAnimMap.set(card, true);

    const extraDetails = Array.from(card.querySelectorAll<HTMLElement>('.summary-extra-detail'));
    if (extraDetails.length > 0) {
      const controls = animate(
        extraDetails,
        { opacity: [1, 0] },
        { duration: 0.22, ease: 'easeOut' }
      );
      return controls.then(() => {
        card.classList.add('collapsed');
        extraDetails.forEach(el => el.style.display = 'none');
        cardAnimMap.set(card, false);
      });
    }

    const contentWrapper = card.querySelector<HTMLElement>('.card-content-wrapper');
    if (!contentWrapper) return Promise.resolve();

    contentWrapper.style.overflow = 'hidden';
    const startHeight = contentWrapper.offsetHeight || contentWrapper.scrollHeight;

    const controls = animate(
      contentWrapper,
      {
        height: [startHeight, 0],
        opacity: [1, 0],
        filter: ['blur(0px)', 'blur(6px)'],
      },
      { duration: 0.28, ease: 'easeOut' }
    );

    return controls.then(() => {
      card.classList.add('collapsed');
      contentWrapper.style.display = 'none';
      contentWrapper.style.filter = 'none';
      cardAnimMap.set(card, false);
    });
  };

  const animateExpandCard = (card: HTMLElement): Promise<void> => {
    if (!card.classList.contains('collapsed')) return Promise.resolve();

    // Mutual exclusion: Close any other open card in the same column!
    const parentCol = card.closest('.customizer-column');
    if (parentCol) {
      const openSiblings = Array.from(parentCol.querySelectorAll<HTMLElement>('.customizer-card:not(.collapsed)'));
      openSiblings.forEach((sibling) => {
        if (sibling !== card) {
          animateCollapseCard(sibling);
        }
      });
    }

    card.classList.remove('collapsed');

    // On mobile, snap/scroll the expanded card to the top of the action sheet drawer
    if (window.innerWidth <= 768) {
      const container = document.getElementById('customizer-bottom-sheet');
      if (container) {
        if (container.classList.contains('is-collapsed')) {
          container.classList.remove('is-collapsed');
          mount.classList.remove('is-sheet-collapsed');
        }
        setTimeout(() => {
          const containerRect = container.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          const relativeTop = cardRect.top - containerRect.top + container.scrollTop;
          container.scrollTo({
            top: Math.max(0, relativeTop - 12),
            behavior: 'smooth',
          });
        }, 50);
      }
    }

    const headerEl = card.querySelector<HTMLElement>('.card-header-row, .card-header-with-badge, .card-header-accordion');
    const chevronSvg = headerEl?.querySelector<HTMLElement>('.card-chevron svg, svg.card-chevron');

    if (chevronSvg) {
      chevronSvg.style.transform = 'rotate(-180deg)';
    }

    cardAnimMap.set(card, true);

    const extraDetails = Array.from(card.querySelectorAll<HTMLElement>('.summary-extra-detail'));
    if (extraDetails.length > 0) {
      extraDetails.forEach(el => el.style.display = '');
      const controls = animate(
        extraDetails,
        { opacity: [0, 1] },
        { duration: 0.28, ease: 'easeOut' }
      );
      return controls.then(() => {
        cardAnimMap.set(card, false);
      });
    }

    const contentWrapper = card.querySelector<HTMLElement>('.card-content-wrapper');
    if (!contentWrapper) return Promise.resolve();

    contentWrapper.style.display = 'block';
    contentWrapper.style.height = 'auto';
    contentWrapper.style.overflow = 'hidden';
    const targetHeight = contentWrapper.scrollHeight;
    contentWrapper.style.height = '0px';

    const controls = animate(
      contentWrapper,
      {
        height: [0, targetHeight],
        opacity: [0, 1],
        filter: ['blur(6px)', 'blur(0px)'],
      },
      { duration: 0.32, ease: 'easeOut' }
    );

    return controls.then(() => {
      contentWrapper.style.height = 'auto';
      contentWrapper.style.overflow = 'visible';
      contentWrapper.style.filter = 'none';
      cardAnimMap.set(card, false);
    });
  };

  for (const card of allCards) {
    const titleEl = card.querySelector<HTMLElement>('.card-title');
    if (!titleEl) continue;

    let headerEl = card.querySelector<HTMLElement>('.card-header-row, .card-header-with-badge, .card-header-accordion');
    if (!headerEl) {
      headerEl = document.createElement('div');
      headerEl.className = 'card-header-accordion';
      titleEl.parentNode?.insertBefore(headerEl, titleEl);
      headerEl.appendChild(titleEl);
    }

    if (!headerEl.querySelector('.card-chevron')) {
      const chevron = document.createElement('button');
      chevron.className = 'card-chevron';
      chevron.type = 'button';
      chevron.setAttribute('aria-label', 'Toggle card collapse');
      chevron.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      headerEl.appendChild(chevron);
    }

    const extraDetails = Array.from(card.querySelectorAll<HTMLElement>('.summary-extra-detail'));
    let contentWrapper = card.querySelector<HTMLElement>('.card-content-wrapper');
    if (!contentWrapper && extraDetails.length === 0) {
      contentWrapper = document.createElement('div');
      contentWrapper.className = 'card-content-wrapper';
      const siblings: Element[] = [];
      let next = headerEl.nextElementSibling;
      while (next) {
        siblings.push(next);
        next = next.nextElementSibling;
      }
      siblings.forEach((child) => contentWrapper!.appendChild(child));
      card.appendChild(contentWrapper);
    }

    const chevronSvg = headerEl.querySelector<HTMLElement>('.card-chevron svg, svg.card-chevron');

    const isInitiallyCollapsed = card.classList.contains('collapsed');
    if (isInitiallyCollapsed) {
      if (extraDetails.length > 0) {
        extraDetails.forEach(el => el.style.display = 'none');
      } else if (contentWrapper) {
        contentWrapper.style.display = 'none';
        contentWrapper.style.height = '0px';
        contentWrapper.style.opacity = '0';
        contentWrapper.style.overflow = 'hidden';
      }
      if (chevronSvg) chevronSvg.style.transform = 'rotate(0deg)';
    } else {
      if (extraDetails.length > 0) {
        extraDetails.forEach(el => el.style.display = '');
      } else if (contentWrapper) {
        contentWrapper.style.display = 'block';
        contentWrapper.style.height = 'auto';
        contentWrapper.style.opacity = '1';
        contentWrapper.style.overflow = 'visible';
      }
      if (chevronSvg) chevronSvg.style.transform = 'rotate(-180deg)';
    }

    listen(headerEl, 'click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.closest('input') || (target.closest('button') && !target.closest('.card-chevron'))) return;

      if (cardAnimMap.get(card)) return;

      const isCurrentlyCollapsed = card.classList.contains('collapsed');

      if (isCurrentlyCollapsed) {
        animateExpandCard(card);
      } else {
        restorePreFocusState();
        animateCollapseCard(card);
      }
    });
  }

  listen(brandControl, 'input', () => {
    if (brandControl.value.length > 10) {
      brandControl.value = brandControl.value.slice(0, 10);
    }
    const brandName = brandControl.value.trim();
    brandEngraving.visible = brandName.length > 0;
    if (brandName) updateBrandPlane(brandEngraving, brandName);
    inscriptionDone.hidden = brandName === committedBrandName;

    const hasError = brandControl.value.length > 10;
    brandControl.classList.toggle('error', hasError);
    brandError.textContent = hasError ? 'Maximum 10 characters allowed' : '';
    brandError.hidden = !hasError;
    brandDesc.hidden = hasError;
  });

  listen(brandControl, 'focus', () => {
    setInscriptionFocus(true);
    brandControl.classList.remove('error');
    brandError.hidden = true;
    brandDesc.hidden = false;
  });
  listen(brandControl, 'blur', () => {
    if (brandControl.value.trim() === committedBrandName) {
      setInscriptionFocus(false);
    }
  });
  listen(inscriptionDone, 'click', () => {
    committedBrandName = brandControl.value.trim();
    inscriptionDone.hidden = true;
    brandControl.classList.remove('error');
    brandError.hidden = true;
    brandDesc.hidden = false;
    setInscriptionFocus(false);
    brandControl.blur();
  });

  const glossControl = mount.querySelector<HTMLInputElement>('#gloss-control')!;
  const glossValue = mount.querySelector<HTMLElement>('#gloss-value')!;
  listen(glossControl, 'input', () => {
    const value = Number(glossControl.value);
    glossValue.textContent = `${value}%`;
    setSurfaceGloss(model, value / 100);
  });

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="indicator-type"]')) {
    listen(input, 'change', () => {
      setFrontDisplayFocus();
      selectedIndicator = input.value as 'leds' | 'screen';
      syncLeds();
      markChargingChanged();
    });
  }

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="ring-shape"]')) {
    listen(input, 'change', () => {
      setFrontDisplayFocus();
      markChargingChanged();
      const shapeKey = input.value as RingShapeKey;
      const rimMesh = model.getObjectByName('status-ring') as THREE.Mesh | null;
      const faceMesh = model.getObjectByName('status-face') as THREE.Mesh | null;
      if (rimMesh) {
        rimMesh.geometry.dispose();
        rimMesh.geometry = createRingRimGeometry(shapeKey);
      }
      if (faceMesh) {
        faceMesh.geometry.dispose();
        faceMesh.geometry = createRingFaceGeometry(shapeKey);
      }

      const displayGroup = model.getObjectByName('battery-status-display') as THREE.Group | null;
      const oldPercentage = model.getObjectByName('battery-percentage-display') as THREE.Mesh | null;
      if (displayGroup && oldPercentage) {
        const isVisible = oldPercentage.visible;
        displayGroup.remove(oldPercentage);
        if (oldPercentage.geometry) oldPercentage.geometry.dispose();
        const newPercentage = makeBatteryPercentageDisplay(shapeKey);
        newPercentage.position.set(0, 0, 0.014);
        newPercentage.visible = isVisible;
        displayGroup.add(newPercentage);
      }
    });
  }

  const oledFaceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x061118,
    roughness: 0.12,
    metalness: 0.25,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });

  const syncLeds = (): void => {
    const isLeds = selectedIndicator === 'leds';
    setLedPower(model, isLeds, 2.4);

    const percentageDisplay = model.getObjectByName('battery-percentage-display');
    if (percentageDisplay) {
      percentageDisplay.visible = !isLeds;
    }

    const faceMesh = model.getObjectByName('status-face') as THREE.Mesh | null;
    if (faceMesh) {
      if (!isLeds) {
        faceMesh.material = oledFaceMaterial;
      } else {
        const finish = FINISHES[selectedFinish];
        setMaterialColor(model, ['status-face'], finish.panel);
      }
    }
  };

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="capacity"]')) {
    listen(input, 'change', () => {
      selectedCapacity = input.value as CapacityKey;
      applyDimensions();
      updateOrderSummary();
    });
  }

  for (const input of mount.querySelectorAll<HTMLInputElement>('input[name="wattage"]')) {
    listen(input, 'change', () => {
      selectedWattage = input.value as WattageKey;
      applyDimensions();
      updateOrderSummary();
    });
  }


  function ensureValidChargingMechanism(): void {
    const checkedPorts = portInputs.filter(i => i.checked);
    if (!magsafeToggle.checked && checkedPorts.length === 0) {
      const usbCInput = portInputs.find(i => i.value === 'type-c');
      if (usbCInput) {
        usbCInput.checked = true;
      }
    }
  };

  listen(magsafeToggle, 'change', () => {
    markChargingChanged();
    const magsafeVisible = magsafeToggle.checked;
    if (magsafeVisible) setMagSafeFocus();
    else setFrontDisplayFocus();
    // Hide/show the entire magsafe-charging-surface group (includes ring, center-pad, grooves, bar)
    setVisibility(model, ['magsafe-charging-surface'], magsafeVisible);
    // Belt-and-suspenders: also traverse to catch any individually-visible groove meshes
    const magsafeSurface = model.getObjectByName('magsafe-charging-surface');
    if (magsafeSurface) {
      magsafeSurface.traverse((child) => {
        child.visible = magsafeVisible;
      });
    }
    ensureValidChargingMechanism();
    syncPorts();
  });

  // Stage FAB toggle
  const fabWrapper = mount.querySelector<HTMLElement>('#stage-fab-wrapper');
  const fabToggle = mount.querySelector<HTMLButtonElement>('#stage-fab-toggle');
  if (fabToggle && fabWrapper) {
    listen(fabToggle, 'click', (e: Event) => {
      e.stopPropagation();
      fabWrapper.classList.toggle('is-open');
    });

    listen(document.body, 'click', (e: Event) => {
      if (!fabWrapper.contains(e.target as Node)) {
        fabWrapper.classList.remove('is-open');
      }
    });
  }

  // Bottom sheet collapse/peek toggle, CTA click & touch drag
  const bottomSheet = mount.querySelector<HTMLElement>('#customizer-bottom-sheet');
  const sheetHandle = mount.querySelector<HTMLElement>('#sheet-handle');
  const startCustomisingBtn = mount.querySelector<HTMLButtonElement>('#start-customising-cta');
  const sheetHeaderColumn = mount.querySelector<HTMLElement>('.customizer-column-left');

  if (bottomSheet) {
    const setSheetState = (collapsed: boolean) => {
      bottomSheet.classList.toggle('is-collapsed', collapsed);
      mount.classList.toggle('is-sheet-collapsed', collapsed);
    };

    // Start collapsed by default on mobile screens
    if (window.innerWidth <= 768) {
      setSheetState(true);
    }

    if (startCustomisingBtn) {
      listen(startCustomisingBtn, 'click', (e: Event) => {
        e.stopPropagation();
        setSheetState(false);
      });
    }

    if (sheetHandle) {
      listen(sheetHandle, 'click', () => {
        setSheetState(!bottomSheet.classList.contains('is-collapsed'));
      });
    }

    let startY = 0;
    let isDragging = false;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    if (sheetHandle) {
      listen(sheetHandle, 'touchstart', onTouchStart as EventListener);
    }
    if (sheetHeaderColumn) {
      listen(sheetHeaderColumn, 'touchstart', (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.closest('.customizer-card') || target.closest('button')) return;
        onTouchStart(e as TouchEvent);
      });
    }

    listen(window, 'touchmove', (e: Event) => {
      if (!isDragging) return;
      const touch = (e as TouchEvent).touches[0];
      const deltaY = touch.clientY - startY;
      
      if (deltaY > 35 && bottomSheet.scrollTop <= 5) {
        setSheetState(true);
        isDragging = false;
      } else if (deltaY < -35 && bottomSheet.classList.contains('is-collapsed')) {
        setSheetState(false);
        isDragging = false;
      }
    });

    listen(window, 'touchend', () => {
      isDragging = false;
    });
  }

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
    selectedWattage = '30w';
    autoSpin = false;
    setInscriptionFocus(false);

    const finishInput = mount.querySelector<HTMLInputElement>('input[name="finish"][value="graphite"]');
    const usbInput = mount.querySelector<HTMLInputElement>('input[name="usb-color"][value="cyan"]');
    const capacityInput = mount.querySelector<HTMLInputElement>('input[name="capacity"][value="5k"]');
    const wattageInput = mount.querySelector<HTMLInputElement>('input[name="wattage"][value="30w"]');
    if (finishInput) finishInput.checked = true;
    if (usbInput) usbInput.checked = true;
    if (capacityInput) capacityInput.checked = true;
    if (wattageInput) wattageInput.checked = true;
    glossControl.value = '45';
    glossValue.textContent = '45%';
    selectedIndicator = 'leds';
    const indicatorInput = mount.querySelector<HTMLInputElement>('input[name="indicator-type"][value="leds"]');
    if (indicatorInput) indicatorInput.checked = true;
    magsafeToggle.checked = true;
    spinToggle.checked = false;
    lightControl.value = '70';
    lightValue.textContent = '70%';
    brandControl.value = 'PowerCraft';
    committedBrandName = 'POWERCRAFT';
    inscriptionDone.hidden = true;
    brandEngraving.visible = true;
    updateBrandPlane(brandEngraving, 'PowerCraft');
    applyDimensions();
    syncLeds();
    resetToDefaultCamera();
  });

  // FAB Listeners
  const fabOrbit = mount.querySelector<HTMLButtonElement>('#fab-orbit');
  const fabCenter = mount.querySelector<HTMLButtonElement>('#fab-center');
  const fabZoom = mount.querySelector<HTMLButtonElement>('#fab-zoom');
  
  if (fabCenter) {
    listen(fabCenter, 'click', () => resetToDefaultCamera());
  }
  if (fabOrbit) {
    listen(fabOrbit, 'click', () => resetCameraFocus());
  }
  
  const themeToggle = mount.querySelector<HTMLButtonElement>('#theme-toggle');
  const customizerPage = mount.querySelector('.customizer-page');
  const orderQtyInput = mount.querySelector<HTMLInputElement>('#order-qty');
  const qtyMinus = mount.querySelector<HTMLButtonElement>('#qty-minus');
  const qtyPlus = mount.querySelector<HTMLButtonElement>('#qty-plus');
  const orderTotalPrice = mount.querySelector<HTMLElement>('#order-total-price');
  const subtotalVal = mount.querySelector<HTMLElement>('#subtotal-val');
  const unitPriceVal = mount.querySelector<HTMLElement>('#unit-price-val');
  const summaryCapacityReadout = mount.querySelector<HTMLElement>('#capacity-readout');

  function updateOrderSummary() {
    if (!orderQtyInput) return;
    const qty = parseInt(orderQtyInput.value, 10) || 50;
    
    let unitPrice = CAPACITIES[selectedCapacity].unitPrice + WATTAGES[selectedWattage].priceDelta;

    if (qty >= 500) unitPrice *= 0.82;
    else if (qty >= 200) unitPrice *= 0.90;

    const total = qty * unitPrice;

    const collapsedQtyVal = mount.querySelector<HTMLElement>('#collapsed-qty-val');
    const collapsedPriceVal = mount.querySelector<HTMLElement>('#collapsed-price-val');

    if (unitPriceVal) unitPriceVal.textContent = `£${unitPrice.toFixed(2)} / unit`;
    if (subtotalVal) subtotalVal.textContent = `£${total.toFixed(2)}`;
    if (orderTotalPrice) orderTotalPrice.textContent = `£${total.toFixed(2)}`;
    if (collapsedQtyVal) collapsedQtyVal.textContent = `${qty} units`;
    if (collapsedPriceVal) collapsedPriceVal.textContent = `£${total.toFixed(2)}`;
    if (summaryCapacityReadout) summaryCapacityReadout.textContent = CAPACITIES[selectedCapacity].label;
  }

  if (qtyMinus && orderQtyInput) {
    listen(qtyMinus, 'click', () => {
      let current = parseInt(orderQtyInput.value, 10) || 50;
      if (current > 50) {
        current -= 50;
        orderQtyInput.value = String(current);
        updateOrderSummary();
      }
    });
  }

  if (qtyPlus && orderQtyInput) {
    listen(qtyPlus, 'click', () => {
      let current = parseInt(orderQtyInput.value, 10) || 50;
      current += 50;
      orderQtyInput.value = String(current);
      updateOrderSummary();
    });
  }

  let toastTimer: number | undefined;
  const showToast = (title: string, message: string, emoji = '🎉'): void => {
    let toast = mount.querySelector<HTMLElement>('.customizer-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'customizer-toast';
      mount.appendChild(toast);
    }
    toast.innerHTML = `
      <span class="customizer-toast-icon">${emoji}</span>
      <div>
        <strong style="display:block; color:#fff; font-weight:600;">${title}</strong>
        <span style="color:#a0aec0; font-size:0.85rem;">${message}</span>
      </div>
    `;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast?.classList.remove('show');
    }, 4200);
  };

  const handlePlaceOrder = (): void => {
    showToast(
      'Order Placed Successfully!',
      `Quantity: ${orderQtyInput?.value || 50} units | Total: ${orderTotalPrice?.textContent || '£725.00'} (Lead time: 5-7 business days)`,
      '🎉',
    );
  };

  const placeOrderBtn = mount.querySelector<HTMLButtonElement>('#place-order-btn');
  if (placeOrderBtn) {
    listen(placeOrderBtn, 'click', handlePlaceOrder);
  }

  const collapsedOrderBtn = mount.querySelector<HTMLButtonElement>('#collapsed-order-btn');
  if (collapsedOrderBtn) {
    listen(collapsedOrderBtn, 'click', (e: Event) => {
      e.stopPropagation();
      handlePlaceOrder();
    });
  }

  const requestSampleBtn = mount.querySelector<HTMLButtonElement>('#request-sample-btn');
  if (requestSampleBtn) {
    listen(requestSampleBtn, 'click', () => {
      showToast(
        'Sample Request Initiated!',
        'A customized sample unit (£25) will be prepared and shipped to your address.',
        '📦',
      );
    });
  }

  // Theme toggle with fast, native in-place component transitions
  if (themeToggle && customizerPage) {
    listen(themeToggle, 'click', () => {
      const isDark = customizerPage.classList.toggle('dark-mode');
      document.body.classList.toggle('dark-mode', isDark);
      document.documentElement.classList.toggle('dark-mode', isDark);

      const plateauBase = revealPlateau.getObjectByName('reveal-plateau-base') as THREE.Mesh;
      const plateauRim = revealPlateau.getObjectByName('reveal-plateau-rim') as THREE.Mesh;
      if (plateauBase && plateauBase.material instanceof THREE.Material && 'color' in plateauBase.material) {
        (plateauBase.material as THREE.MeshStandardMaterial).color.setHex(isDark ? 0x181c2b : 0xffffff);
      }
      if (plateauRim && plateauRim.material instanceof THREE.Material && 'color' in plateauRim.material) {
        (plateauRim.material as THREE.MeshStandardMaterial).color.setHex(isDark ? 0x181c2b : 0xffffff);
      }

      // Toggle icon
      if (isDark) {
        themeToggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      } else {
        themeToggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="12" y1="4" x2="12" y2="2"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
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
      resetToDefaultCamera();
    });
  }
  if (fabZoom) {
    listen(fabZoom, 'click', () => {
      isFocusedOnCard = false;
      isCameraTransitioning = true;
      targetCameraPosition.copy(defaultCameraPosition);
      targetCameraTarget.copy(defaultCameraTarget);
      targetCameraZoom = Math.abs(viewer.camera.zoom - 1.45) < 0.05 ? 1.0 : 1.45;
      preFocusState.position.copy(defaultCameraPosition);
      preFocusState.target.copy(defaultCameraTarget);
      preFocusState.zoom = targetCameraZoom;
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

  for (const col of mount.querySelectorAll<HTMLElement>('.customizer-column')) {
    const updateScrollState = () => {
      col.classList.toggle('is-scrolled', col.scrollTop > 4);
    };
    listen(col, 'scroll', updateScrollState);
    updateScrollState();
  }

  applyDimensions();
  syncLeds();
  viewer.start();

  return () => {
    for (const remove of listeners) remove();
    viewer.dispose();
  };
}
