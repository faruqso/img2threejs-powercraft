import * as THREE from 'three';
import {
  createAnkerMaggoA1618LookDevLights,
  createAnkerMaggoA1618Model,
} from '../demos/anker-maggo-a1618/createAnkerMaggoA1618Model';
import { Viewer } from '../scene';

type FinishKey = 'graphite' | 'silver' | 'blue' | 'sand' | 'green';

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
  green: {
    label: 'Pine green',
    body: 0x435c52,
    edge: 0x2b3d36,
    panel: 0x516e63,
    ring: 0x7da696,
  },
};

type CapacityKey = '5k' | '10k' | '20k' | '30k';
type CapacityPreset = {
  scale: THREE.Vector3Tuple;
};

const CAPACITIES: Record<CapacityKey, CapacityPreset> = {
  '5k': { scale: [1.0, 0.88, 0.75] },
  '10k': { scale: [1.0, 0.96, 0.88] },
  '20k': { scale: [1.0, 1.0, 1.0] },
  '30k': { scale: [1.0, 1.05, 1.15] },
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

export function renderHome(mount: HTMLElement): () => void {
  mount.innerHTML = `
    <div class="home-page" id="home-page-root">

      <!-- ========== HEADER ========== -->
      <header class="global-header home-header" id="home-header">
        <a href="#/" class="header-brand" style="text-decoration:none;">
          <div class="brand-logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 2.5H13.5L9.5 10.5H3.5L7 2.5Z" fill="#0dc9b1"/>
              <path d="M14.5 13.5H21L17 21.5H11L14.5 13.5Z" fill="#0dc9b1"/>
            </svg>
          </div>
          <div class="brand-text">
            <strong>Powerly</strong>
          </div>
        </a>
        <nav class="header-nav" aria-label="Main Navigation">
          <a href="#/" class="active">Products</a>
          <a href="#/customize/power-bank">Customization</a>
          <a href="#/about">Manufacturing</a>
          <a href="#/resources">Resources</a>
          <a href="#/pricing">Pricing</a>
        </nav>
        <div class="header-actions">
          <button class="theme-switch" id="home-theme-toggle" title="Toggle dark mode" aria-label="Toggle theme">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <div class="header-divider"></div>
          <a href="#/customize/power-bank" class="home-nav-cta">
            Start Building &rarr;
          </a>
        </div>
      </header>

      <!-- ========== HERO ========== -->
      <section class="hp-hero" aria-label="Hero">
        <div class="hp-hero-inner">

          <!-- Left: copy -->
          <div class="hp-hero-copy">
            <div class="hp-eyebrow">
              <span class="hp-eyebrow-dot"></span>
              WHITE LABEL POWER BANK MANUFACTURER
            </div>
            <h1 class="hp-hero-title">
              Build <span class="hp-title-accent">your</span><br>
              branded power<br>
              bank.
            </h1>
            <p class="hp-hero-sub">
              Design, customize and order premium power banks<br>
              with your logo, capacity, ports and features.<br>
              Built to power your brand.
            </p>
            <div class="hp-cta-row">
              <a href="#/customize/power-bank" class="hp-btn-primary" id="home-cta-customise">
                Start Customizing &rarr;
              </a>
              <a href="#/customize/power-bank" class="hp-btn-ghost" id="home-cta-order">
                Browse Models
              </a>
            </div>
            <!-- Stats strip -->
            <div class="hp-stats-row">
              <div class="hp-stat">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <div class="hp-stat-text">Low MOQ<br><span>from 50 units</span></div>
              </div>
              <div class="hp-stat-sep"></div>
              <div class="hp-stat">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <div class="hp-stat-text">Fast Production<br><span>7–15 days</span></div>
              </div>
              <div class="hp-stat-sep"></div>
              <div class="hp-stat">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                <div class="hp-stat-text">Global Delivery<br><span>Worldwide</span></div>
              </div>
            </div>
          </div>

          <!-- Center: 3D stage -->
          <div class="hp-hero-stage-wrap">
            <div class="hp-hero-canvas-container">
              <div class="hp-hero-canvas" id="home-hero-canvas"></div>
              <div class="hp-pedestal">
                <div class="hp-pedestal-top"></div>
                <div class="hp-pedestal-glow"></div>
                <div class="hp-interaction-hint">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  Drag to rotate &nbsp;&bull;&nbsp; Scroll to zoom
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Controls -->
          <div class="hp-hero-controls">
            <div class="hp-hero-controls-card">
              
              <!-- Capacity -->
              <div class="hp-control-group">
                <label>CAPACITY</label>
                <div class="hp-segmented capacity-grid">
                  <label><input type="radio" name="hp-capacity" value="5k"><span class="seg-box"><strong>5,000</strong><small>mAh</small></span></label>
                  <label><input type="radio" name="hp-capacity" value="10k" checked><span class="seg-box"><strong>10,000</strong><small>mAh</small></span></label>
                  <label><input type="radio" name="hp-capacity" value="20k"><span class="seg-box"><strong>20,000</strong><small>mAh</small></span></label>
                  <label><input type="radio" name="hp-capacity" value="30k"><span class="seg-box"><strong>30,000</strong><small>mAh</small></span></label>
                </div>
              </div>

              <!-- Color -->
              <div class="hp-control-group">
                <label>COLOR</label>
                <div class="hp-color-grid">
                  <label class="hp-color-swatch active"><input type="radio" name="hp-color" value="graphite" checked><span style="--swatch:#202126"></span></label>
                  <label class="hp-color-swatch"><input type="radio" name="hp-color" value="silver"><span style="--swatch:#fcfdfe; border: 1px solid #e2e8f0;"></span></label>
                  <label class="hp-color-swatch"><input type="radio" name="hp-color" value="blue"><span style="--swatch:#182a3d"></span></label>
                  <label class="hp-color-swatch"><input type="radio" name="hp-color" value="sand"><span style="--swatch:#e0cbb2"></span></label>
                  <label class="hp-color-swatch"><input type="radio" name="hp-color" value="green"><span style="--swatch:#435c52"></span></label>
                </div>
              </div>

              <!-- Ports -->
              <div class="hp-control-group">
                <label>PORTS</label>
                <div class="hp-ports-grid">
                  <label class="hp-port-btn"><input type="checkbox" name="hp-port" value="usb-a" checked><span class="port-inner"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg><span class="port-label">USB-A</span></span></label>
                  <label class="hp-port-btn"><input type="checkbox" name="hp-port" value="usb-c" checked><span class="port-inner"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="4"/><line x1="9" y1="12" x2="15" y2="12"/></svg><span class="port-label">USB-C</span></span></label>
                  <label class="hp-port-btn"><input type="checkbox" name="hp-port" value="lightning"><span class="port-inner"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="8" width="14" height="8" rx="2"/><path d="M12 2v6"/><path d="M12 16v6"/></svg><span class="port-label">Lightning</span></span></label>
                  <label class="hp-port-btn"><input type="checkbox" name="hp-port" value="cable"><span class="port-inner"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M8 12h8"/></svg><span class="port-label">Built-in Cable</span></span></label>
                </div>
              </div>

              <!-- MagSafe -->
              <div class="hp-control-group hp-flex-row">
                <label>MAGSAFE</label>
                <div class="hp-segmented hp-magsafe-toggle">
                  <label><input type="radio" name="hp-magsafe" value="no"><span class="seg-pill">No</span></label>
                  <label><input type="radio" name="hp-magsafe" value="yes" checked><span class="seg-pill">Yes</span></label>
                </div>
              </div>

              <!-- Logo Printing -->
              <div class="hp-control-group">
                <label>LOGO PRINTING</label>
                <div class="hp-segmented">
                  <label><input type="radio" name="hp-logo" value="laser" checked><span class="seg-pill">Laser Engraving</span></label>
                  <label><input type="radio" name="hp-logo" value="uv"><span class="seg-pill">UV Printing</span></label>
                </div>
              </div>

              <a href="#/customize/power-bank" class="hp-btn-continue">
                Continue Building &rarr;
              </a>

            </div>
          </div>
        </div>
      </section>

      <!-- ========== SOCIAL PROOF TICKER ========== -->
      <div class="hp-trust-bar">
        <p class="hp-trust-label">TRUSTED BY BRANDS, AGENCIES & ORGANIZATIONS WORLDWIDE</p>
        <div class="hp-trust-track-wrap" aria-hidden="true">
          <div class="hp-trust-track">
            <span class="hp-trust-logo">paystack</span>
            <span class="hp-trust-logo">Bolt</span>
            <span class="hp-trust-logo">Deloitte.</span>
            <span class="hp-trust-logo">Flutterwave</span>
            <span class="hp-trust-logo">piggyvest</span>
            <span class="hp-trust-logo">kuda.</span>
            <span class="hp-trust-logo">Verve</span>
            <span class="hp-trust-logo">paystack</span>
            <span class="hp-trust-logo">Bolt</span>
            <span class="hp-trust-logo">Deloitte.</span>
            <span class="hp-trust-logo">Flutterwave</span>
            <span class="hp-trust-logo">piggyvest</span>
            <span class="hp-trust-logo">kuda.</span>
            <span class="hp-trust-logo">Verve</span>
          </div>
        </div>
      </div>

    </div>
  `;

  const homePage = mount.querySelector<HTMLElement>('#home-page-root')!;

  // Trigger entry animations for the hero
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      homePage.classList.add('hp-ready');
      // Trigger the slide-in reveal
      setTimeout(() => {
        const heroInner = mount.querySelector('.hp-hero-inner');
        if (heroInner) heroInner.classList.add('hero-anim-active');
      }, 500);
    });
  });

  // Spin up the 3D preview
  const canvasMount = mount.querySelector<HTMLElement>('#home-hero-canvas')!;
  const viewer = new Viewer(canvasMount, {
    cameraPosition: [-4.5, 1.2, 9.5],
    cameraTarget: [0, 0.2, 0],
    cameraFov: 36,
    installLights: (scene) => scene.add(createAnkerMaggoA1618LookDevLights()),
  });
  const model = createAnkerMaggoA1618Model({ shadows: true, rotationSpeed: 0.025 });
  viewer.scene.add(model);

  // Apply initial 10k capacity scale
  model.scale.set(...CAPACITIES['10k'].scale);

  let raf = 0;
  let lastT = 0;
  const tick = (t: number): void => {
    const dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;
    if (model.userData.tick) model.userData.tick(dt);
    viewer.controls.update();
    viewer.renderer.render(viewer.scene, viewer.camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame((t) => { lastT = t; raf = requestAnimationFrame(tick); });

  // Wiring up the right side controls
  const handleColorChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.checked) return;
    
    // update UI active state
    mount.querySelectorAll('.hp-color-swatch').forEach(el => el.classList.remove('active'));
    target.closest('.hp-color-swatch')?.classList.add('active');

    const finish = FINISHES[target.value as FinishKey];
    if (finish) {
      setMaterialColor(model, ['glossy-rear-shell', 'matte-charging-face'], finish.body);
      setMaterialColor(model, ['front-polished-gasket'], finish.edge);
      setMaterialColor(model, ['rear-matte-panel', 'stand-leg'], finish.panel);
      setMaterialColor(model, ['magsafe-ring', 'magsafe-alignment-tail'], finish.ring);
    }
  };
  mount.querySelectorAll('input[name="hp-color"]').forEach((input) => {
    input.addEventListener('change', handleColorChange);
  });

  const handleCapacityChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.checked) return;
    const capacity = CAPACITIES[target.value as CapacityKey];
    if (capacity) {
      model.scale.set(...capacity.scale);
    }
  };
  mount.querySelectorAll('input[name="hp-capacity"]').forEach((input) => {
    input.addEventListener('change', handleCapacityChange);
  });

  const updatePorts = () => {
    const hasUsbA = (mount.querySelector('input[value="usb-a"]') as HTMLInputElement).checked;
    const hasUsbC = (mount.querySelector('input[value="usb-c"]') as HTMLInputElement).checked;
    const hasLightning = (mount.querySelector('input[value="lightning"]') as HTMLInputElement).checked;
    
    setVisibility(model, ['port-type-a-tongue', 'port-type-a-contact'], hasUsbA);
    setVisibility(model, ['port-type-c-1-tongue', 'port-type-c-1-contact'], hasUsbC);
    // Simple visual fallback for lightning if actual model doesn't support 3 separate toggles 
    // exactly, but we can toggle existing usb-c-2 for it for demo purposes
    setVisibility(model, ['port-type-c-2-tongue', 'port-type-c-2-contact'], hasLightning);
  };
  mount.querySelectorAll('input[name="hp-port"]').forEach((input) => {
    input.addEventListener('change', updatePorts);
  });

  const handleMagsafeChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.checked) return;
    const hasMagsafe = target.value === 'yes';
    setVisibility(model, ['magsafe-ring', 'magsafe-alignment-tail'], hasMagsafe);
  };
  mount.querySelectorAll('input[name="hp-magsafe"]').forEach((input) => {
    input.addEventListener('change', handleMagsafeChange);
  });

  // Dark mode toggle
  const themeToggle = mount.querySelector<HTMLButtonElement>('#home-theme-toggle');
  if (themeToggle && homePage) {
    themeToggle.addEventListener('click', () => {
      homePage.classList.toggle('dark-mode');
    });
  }

  return () => {
    cancelAnimationFrame(raf);
    viewer.renderer.dispose();
    viewer.controls.dispose();
  };
}
