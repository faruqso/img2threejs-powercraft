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
    opacity: 0.76,
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
    color: 0xdfe4eb,
    roughness: 0.34,
    metalness: 0.05,
    clearcoat: 0.42,
    clearcoatRoughness: 0.28,
  });
  const edgeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9da8b6,
    roughness: 0.22,
    metalness: 0.34,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x9fc7ff,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.72, 0.18, 96), baseMaterial);
  base.name = 'reveal-plateau-base';
  base.position.y = 0.09;
  base.castShadow = true;
  base.receiveShadow = true;
  stage.add(base);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.018, 16, 112), edgeMaterial);
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

  const column = new THREE.PointLight(0x9fc7ff, 0.75, 4.2, 1.7);
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

      <header class="global-header">
        <div class="header-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="currentColor"/>
          </svg>
          <strong>img2threejs</strong>
        </div>
        <nav class="header-nav">
          <a href="#/">Home</a>
          <a href="#/" class="active">Build</a>
          <a href="#/">Gallery</a>
          <a href="#/">About</a>
        </nav>
        <div class="header-actions">
          <a href="#/" class="profile-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Profile
          </a>
        </div>
      </header>

      <div class="customizer-columns">
        <div class="customizer-column customizer-column-left">
          <a class="back-link" href="#/">&larr; Back to models</a>
          <h1 class="page-title">Build your<br>power bank</h1>
          <p class="page-subtitle">Create your ideal power bank with <strong>img2threejs</strong></p>

          <div class="customizer-card top-card">
            <div class="top-card-header">
              <label class="radio-label active-radio">
                <input type="radio" checked>
                <span>Anker MagGo 5,000 mAh</span>
              </label>
              <a href="#" class="change-model-link">Change model</a>
            </div>
          </div>

          <div class="customizer-card">
            <h3 class="card-title">Body colour</h3>
            <div class="swatch-grid">
              ${Object.entries(FINISHES)
                .map(
                  ([key, finish]) => `
                    <label class="swatch-option" title="${finish.label}">
                      <input type="radio" name="finish" value="${key}" ${key === 'graphite' ? 'checked' : ''} />
                      <span class="swatch" style="--swatch-color:#${finish.body.toString(16).padStart(6, '0')}"></span>
                      <span>${finish.label}</span>
                    </label>
                  `,
                )
                .join('')}
            </div>
          </div>

          <div class="customizer-card row-card">
            <div class="col-half">
              <h3 class="card-title">Surface gloss</h3>
              <label class="range-control">
                <span class="range-readout"><strong id="gloss-value">45%</strong></span>
                <input id="gloss-control" type="range" min="0" max="100" value="45" />
              </label>
            </div>
          </div>

          <div class="customizer-card">
            <h3 class="card-title">USB tongue colour</h3>
            <div class="segmented-control">
              ${Object.entries(USB_COLORS)
                .map(
                  ([key, color]) => `
                    <label>
                      <input type="radio" name="usb-color" value="${key}" ${key === 'cyan' ? 'checked' : ''} />
                      <span>${color.label}</span>
                    </label>
                  `,
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="customizer-column customizer-column-right">
          <div class="customizer-card">
            <h3 class="card-title">Hardware options</h3>

            <div class="control-row">
              <span class="row-label">Capacity size</span>
              <div class="segmented-control segmented-control-three">
                ${Object.entries(CAPACITIES)
                  .map(
                    ([key, capacity]) => `
                      <label>
                        <input type="radio" name="capacity" value="${key}" ${key === '5k' ? 'checked' : ''} />
                        <span>${capacity.label}</span>
                      </label>
                    `,
                  )
                  .join('')}
              </div>
            </div>

          </div>

          <div class="customizer-card">
            <h3 class="card-title">Personalised Monogram</h3>
            <p class="card-desc">Engrave your name or any other personalised word on your power bank</p>
            <h4 class="card-subtitle">Inscription</h4>
            <label class="text-control">
              <input id="brand-control" type="text" value="ANKER" maxlength="18" autocomplete="off" placeholder="Enter words or names" />
              <div class="check-circle"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
            </label>
          </div>

          <div class="customizer-card">
            <h3 class="card-title">Stage controls</h3>
            <label class="toggle-row inline-toggle">
              <span>Add MagSafe</span>
              <input id="magsafe-toggle" type="checkbox" checked />
            </label>
            <div class="control-row">
              <span class="row-label">Battery indicator</span>
              <div class="segmented-control">
                <label>
                  <input type="radio" name="indicator-type" value="leds" checked />
                  <span>LED dots</span>
                </label>
                <label>
                  <input type="radio" name="indicator-type" value="screen" />
                  <span>Info screen</span>
                </label>
              </div>
            </div>
            <label class="toggle-row inline-toggle">
              <span>Auto rotation</span>
              <input id="spin-toggle" type="checkbox" />
            </label>

            <div class="control-row">
              <span class="row-label">Stage light</span>
              <label class="range-control no-margin">
                <span class="range-readout"><strong id="light-value">70%</strong></span>
                <input id="light-control" type="range" min="20" max="120" value="70" />
              </label>
            </div>
          </div>

          <div class="customizer-card summary-card">
            <h3 class="card-title">Build summary</h3>

            <div class="summary-rows" aria-live="polite">
              <div class="summary-row">
                <span id="capacity-readout">5,000 mAh</span>
                <strong>£40</strong>
              </div>
              <div class="summary-row">
                <span>Custom monogram</span>
                <strong>£5</strong>
              </div>
            </div>

            <div class="summary-total">
              <span>Total Price:</span>
              <strong>£60</strong>
            </div>

            <button class="btn-primary customizer-reset" id="reset-customizer" type="button">
              Reset to code default
            </button>
          </div>
        </div>
      </div>

      <div class="customizer-hint">drag to orbit &middot; pinch or scroll to zoom</div>
    </div>
  `;

  const canvasMount = mount.querySelector<HTMLDivElement>('#power-bank-canvas')!;
  const viewer = new Viewer(canvasMount, {
    cameraPosition: [-3.8, 2.9, 5.4],
    cameraTarget: [0, 1.35, 0],
    cameraFov: 36,
    background: 0xf6f8fb,
    installLights: (scene) => scene.add(createAnkerMaggoA1618LookDevLights()),
  });
  const defaultCameraPosition = viewer.camera.position.clone();
  const defaultCameraTarget = viewer.controls.target.clone();

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
  const productSpecEngraving = makeEngravedPlane(
    'power-bank-product-spec-engraving',
    0.74,
    0.58,
    [
      'ANKER MAGGO 5,000 mAh',
      'MODEL A1618  |  5,000 mAh',
      'USB-C INPUT 5V 3A',
      'USB-C OUTPUT 15W MAX',
      'QI2 WIRELESS OUTPUT',
      'MADE IN CHINA',
    ],
    '#d5c8b5',
    'center',
    '#d79a68',
  );
  productSpecEngraving.rotation.y = Math.PI;
  productSpecEngraving.position.set(0, 0.63, -0.291);
  model.add(productSpecEngraving);

  const capacityEngraving = makeEngravedPlane(
    'power-bank-capacity-engraving',
    0.6,
    0.16,
    ['5000 mAh'],
    '#d5c8b5',
  );
  capacityEngraving.rotation.y = 0;
  capacityEngraving.position.set(0, 1.05, 0.305);
  model.add(capacityEngraving);

  const screenDisplay = makeEngravedPlane(
    'power-bank-screen-display',
    0.28,
    0.16,
    ['100'],
    '#ffffff',
  );
  screenDisplay.position.set(0, 0.62, 0.305);
  screenDisplay.visible = false;
  model.add(screenDisplay);

  const brandEngraving = makeEngravedPlane(
    'power-bank-brand-engraving',
    0.76,
    0.16,
    ['ANKER'],
    '#d79a68',
  );
  // The rotated wordmark follows the long axis of the front face, as on the reference device.
  brandEngraving.rotation.z = -Math.PI / 2;
  brandEngraving.position.set(0.22, 1.55, 0.305);
  model.add(brandEngraving);
  viewer.scene.add(model);

  let selectedIndicator: 'leds' | 'screen' = 'leds';
  let selectedCapacity: CapacityKey = '5k';
  let autoSpin = false;
  const targetScale = new THREE.Vector3(1, 1, 1);
  const suspendedBaseY = model.position.y;
  model.userData.tick = (dt: number, elapsed: number): void => {
    model.scale.lerp(targetScale, 1 - Math.exp(-dt * 5.6));
    contactShadow.scale.set(model.scale.x, model.scale.z, 1);
    if (autoSpin) {
      model.rotation.y += dt * 0.16;
    }
    model.position.y = suspendedBaseY + Math.sin(elapsed * 1.35) * 0.035;
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
    updateTextPlane(capacityEngraving, [capacity.label], '#d5c8b5');
    updateProductSpecification();
  };

  const updateProductSpecification = (): void => {
    const capacity = CAPACITIES[selectedCapacity];
    updateTextPlane(
      productSpecEngraving,
      [
        `ANKER MAGGO ${capacity.label}`,
        `MODEL A1618  |  ${capacity.label}`,
        'USB-C INPUT 5V 3A',
        'USB-C OUTPUT 15W MAX',
        'QI2 WIRELESS OUTPUT',
        'MADE IN CHINA',
      ],
      '#d5c8b5',
      'center',
      '#d79a68',
    );
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
    if (brandName) updateTextPlane(brandEngraving, [brandName], '#d79a68');
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
      selectedIndicator = input.value as 'leds' | 'screen';
      syncLeds();
    });
  }

  const syncLeds = (): void => {
    const isLeds = selectedIndicator === 'leds';
    setLedPower(model, isLeds, 2.4);
    
    if (screenDisplay) {
      screenDisplay.visible = !isLeds;
      const material = screenDisplay.material as THREE.MeshBasicMaterial;
      material.opacity = 0.9;
      material.color.setHex(0x9fc7ff);
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
    updateTextPlane(brandEngraving, ['ANKER'], '#d79a68');
    applyDimensions();
    syncLeds();
    viewer.camera.position.copy(defaultCameraPosition);
    viewer.controls.target.copy(defaultCameraTarget);
    viewer.controls.update();
  });

  applyDimensions();
  syncLeds();
  viewer.start();

  return () => {
    for (const remove of listeners) remove();
    viewer.dispose();
  };
}
