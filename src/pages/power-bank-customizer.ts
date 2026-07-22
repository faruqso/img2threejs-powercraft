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
  rotation: THREE.Euler;
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
    rotation: root.rotation.clone(),
  };
}

function restoreDefaults(defaults: DefaultsSnapshot): void {
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
}

/** Renders a product configurator around the Anker MagGo power bank canvas. */
export function renderPowerBankCustomizer(mount: HTMLElement): () => void {
  mount.innerHTML = `
    <div class="customizer-page">
      <div class="customizer-canvas-mount" id="power-bank-canvas"></div>

      <header class="customizer-topbar">
        <a class="back-link" href="#/">&larr; Gallery</a>
        <span class="customizer-model">Anker MagGo 5K</span>
      </header>

      <aside class="customizer-panel customizer-panel-left" aria-label="Power bank finish options">
        <div class="customizer-panel-head">
          <span class="panel-kicker">Finish</span>
          <h1>Power bank canvas</h1>
        </div>

        <fieldset class="control-group">
          <legend>Body colour</legend>
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
        </fieldset>

        <label class="range-control">
          <span>
            Surface gloss
            <strong id="gloss-value">45%</strong>
          </span>
          <input id="gloss-control" type="range" min="0" max="100" value="45" />
        </label>

        <fieldset class="control-group">
          <legend>USB tongue colour</legend>
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
        </fieldset>
      </aside>

      <aside class="customizer-panel customizer-panel-right" aria-label="Power bank feature options">
        <div class="customizer-panel-head">
          <span class="panel-kicker">Features</span>
          <h2>Hardware details</h2>
        </div>

        <label class="toggle-row">
          <span>MagSafe alignment ring</span>
          <input id="magsafe-toggle" type="checkbox" checked />
        </label>
        <label class="toggle-row">
          <span>Battery LEDs</span>
          <input id="led-toggle" type="checkbox" checked />
        </label>
        <label class="toggle-row">
          <span>Auto rotation</span>
          <input id="spin-toggle" type="checkbox" checked />
        </label>

        <label class="range-control">
          <span>
            LED brightness
            <strong id="led-value">80%</strong>
          </span>
          <input id="led-control" type="range" min="20" max="100" value="80" />
        </label>

        <label class="range-control">
          <span>
            Stage light
            <strong id="light-value">70%</strong>
          </span>
          <input id="light-control" type="range" min="20" max="120" value="70" />
        </label>

        <button class="customizer-reset" id="reset-customizer" type="button">
          Reset to code default
        </button>
      </aside>

      <div class="customizer-hint">drag to orbit &middot; pinch or scroll to zoom</div>
    </div>
  `;

  const canvasMount = mount.querySelector<HTMLDivElement>('#power-bank-canvas')!;
  const viewer = new Viewer(canvasMount, {
    cameraPosition: [-3.1, 2.45, 4.2],
    cameraTarget: [0, 1.35, 0],
    cameraFov: 32,
    background: 0xf4f5f7,
    installLights: (scene) => scene.add(createAnkerMaggoA1618LookDevLights()),
  });

  const model = createAnkerMaggoA1618Model({ shadows: true, rotationSpeed: 0 });
  viewer.scene.add(model);

  let autoSpin = true;
  model.userData.tick = (dt: number): void => {
    if (autoSpin) model.rotation.y += dt * 0.16;
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
    element: Element,
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

  const glossControl = mount.querySelector<HTMLInputElement>('#gloss-control')!;
  const glossValue = mount.querySelector<HTMLElement>('#gloss-value')!;
  listen(glossControl, 'input', () => {
    const value = Number(glossControl.value);
    glossValue.textContent = `${value}%`;
    setSurfaceGloss(model, value / 100);
  });

  const ledToggle = mount.querySelector<HTMLInputElement>('#led-toggle')!;
  const ledControl = mount.querySelector<HTMLInputElement>('#led-control')!;
  const ledValue = mount.querySelector<HTMLElement>('#led-value')!;
  const syncLeds = (): void => {
    const value = Number(ledControl.value);
    ledValue.textContent = `${value}%`;
    setLedPower(model, ledToggle.checked, THREE.MathUtils.lerp(0.6, 4.2, value / 100));
  };
  listen(ledToggle, 'change', syncLeds);
  listen(ledControl, 'input', syncLeds);

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
    restoreDefaults(defaults);
    model.rotation.copy(defaults.rotation);
    autoSpin = true;

    const finishInput = mount.querySelector<HTMLInputElement>('input[name="finish"][value="graphite"]');
    const usbInput = mount.querySelector<HTMLInputElement>('input[name="usb-color"][value="cyan"]');
    if (finishInput) finishInput.checked = true;
    if (usbInput) usbInput.checked = true;
    glossControl.value = '45';
    glossValue.textContent = '45%';
    ledToggle.checked = true;
    ledControl.value = '80';
    ledValue.textContent = '80%';
    magsafeToggle.checked = true;
    spinToggle.checked = true;
    lightControl.value = '70';
    lightValue.textContent = '70%';
  });

  viewer.start();

  return () => {
    for (const remove of listeners) remove();
    viewer.dispose();
  };
}
