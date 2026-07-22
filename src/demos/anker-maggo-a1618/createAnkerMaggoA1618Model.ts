import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export interface AnkerMaggoA1618Options {
  shadows?: boolean;
  /** Radians per second. Set to 0 to disable the subtle turntable motion. */
  rotationSpeed?: number;
}

// A1618 dimensions: 107.3 x 69.5 x 20.5 mm. The model uses 2.70 world
// units for the height and preserves the measured width/depth ratios.
const BODY_HEIGHT = 2.7;
const BODY_WIDTH = BODY_HEIGHT * (69.5 / 107.3);
const BODY_DEPTH = BODY_HEIGHT * (20.5 / 107.3);
const BODY_CENTER_Y = BODY_HEIGHT / 2 + 0.08;

// Match the satin-graphite black material used by the Sony WF-1000XM3 earbuds.
const SONY_BUD_BLACK = 0x212124;
const SONY_BODY_BLACK = 0x1b1b1e;
const SONY_INNER_BLACK = 0x141416;
// Extracted from the USB-C close-up with the img2threejs PBR-evidence pass.
const USB_BLUE = 0x54a2d8;

function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function makeRoundedPanelGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevel = 0.018,
): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, height, radius), {
    depth,
    steps: 1,
    curveSegments: 18,
    bevelEnabled: bevel > 0,
    bevelSegments: 4,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function makePanel(
  name: string,
  width: number,
  height: number,
  depth: number,
  radius: number,
  material: THREE.Material,
  shadows: boolean,
  bevel = 0.018,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    makeRoundedPanelGeometry(width, height, depth, radius, bevel),
    material,
  );
  mesh.name = name;
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  return mesh;
}

function makeUsbCPort(
  shadows: boolean,
  recessMaterial: THREE.Material,
  blueMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'usb-c-port';

  // Reference-derived USB-C stack: polished black bezel, deep cavity, blue
  // reversible tongue, and the four visible gold contact pads below it.
  const bezelParts = [
    ['usb-c-bezel-top', 0.152, 0.012, 0, 0.033],
    ['usb-c-bezel-bottom', 0.152, 0.012, 0, -0.033],
    ['usb-c-bezel-left', 0.012, 0.064, -0.076, 0],
    ['usb-c-bezel-right', 0.012, 0.064, 0.076, 0],
  ] as const;
  for (const [name, width, height, z, y] of bezelParts) {
    const rail = makePanel(name, width, height, 0.010, 0.005, recessMaterial, shadows, 0.003);
    rail.rotation.y = -Math.PI / 2;
    rail.position.set(-BODY_WIDTH / 2 + 0.001, y, z);
    port.add(rail);
  }

  const cavityMaterial = new THREE.MeshStandardMaterial({
    color: 0x010101,
    roughness: 0.42,
    metalness: 0.05,
  });
  const cavity = makePanel('usb-c-cavity', 0.152, 0.046, 0.004, 0.020, cavityMaterial, false, 0.002);
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.x = -BODY_WIDTH / 2 + 0.006;
  port.add(cavity);

  const tongue = makePanel('usb-c-blue-tongue', 0.102, 0.011, 0.004, 0.005, blueMaterial, false, 0.002);
  tongue.rotation.y = -Math.PI / 2;
  tongue.position.x = -BODY_WIDTH / 2 + 0.002;
  port.add(tongue);

  const contactMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa5773d,
    roughness: 0.30,
    metalness: 0.88,
    clearcoat: 0.18,
  });
  for (const [index, offset] of [-0.039, -0.013, 0.013, 0.039].entries()) {
    const contact = makePanel('usb-c-contact-' + (index + 1), 0.016, 0.009, 0.003, 0.002, contactMaterial, false, 0.001);
    contact.rotation.y = -Math.PI / 2;
    contact.position.set(-BODY_WIDTH / 2 + 0.002, -0.020, offset);
    port.add(contact);
  }

  return port;
}

function addOpenSideBezel(
  port: THREE.Group,
  prefix: string,
  width: number,
  height: number,
  recessMaterial: THREE.Material,
  shadows: boolean,
): void {
  const railThickness = 0.012;
  const rails = [
    [`${prefix}-bezel-top`, width, railThickness, 0, height / 2 - railThickness / 2],
    [`${prefix}-bezel-bottom`, width, railThickness, 0, -height / 2 + railThickness / 2],
    [`${prefix}-bezel-left`, railThickness, height - railThickness * 2, -width / 2 + railThickness / 2, 0],
    [`${prefix}-bezel-right`, railThickness, height - railThickness * 2, width / 2 - railThickness / 2, 0],
  ] as const;
  for (const [name, railWidth, railHeight, z, y] of rails) {
    const rail = makePanel(name, railWidth, railHeight, 0.010, 0.004, recessMaterial, shadows, 0.003);
    rail.rotation.y = -Math.PI / 2;
    rail.position.set(-BODY_WIDTH / 2 + 0.001, y, z);
    port.add(rail);
  }
}

function makeUsbAPort(
  shadows: boolean,
  recessMaterial: THREE.Material,
  blueMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'legacy-usb-port';

  const cavityMaterial = new THREE.MeshStandardMaterial({ color: 0x010101, roughness: 0.40, metalness: 0.06 });
  const cavity = makePanel('usb-a-cavity', 0.142, 0.048, 0.005, 0.018, cavityMaterial, false, 0.002);
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.x = -BODY_WIDTH / 2 + 0.006;
  port.add(cavity);

  addOpenSideBezel(port, 'usb-a', 0.158, 0.068, recessMaterial, shadows);

  const blueTongue = makePanel('usb-a-blue-tongue', 0.112, 0.014, 0.004, 0.004, blueMaterial, false, 0.002);
  blueTongue.rotation.y = -Math.PI / 2;
  blueTongue.position.set(-BODY_WIDTH / 2 + 0.002, 0.008, 0);
  port.add(blueTongue);

  const contactMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa5773d, roughness: 0.3, metalness: 0.88 });
  for (const [index, offset] of [-0.038, -0.013, 0.013, 0.038].entries()) {
    const contact = makePanel(`usb-a-contact-${index + 1}`, 0.014, 0.008, 0.003, 0.001, contactMaterial, false, 0.001);
    contact.rotation.y = -Math.PI / 2;
    contact.position.set(-BODY_WIDTH / 2 + 0.002, -0.012, offset);
    port.add(contact);
  }

  return port;
}

function makeStandardUsbPort(
  shadows: boolean,
  recessMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'usb-a-port';

  const cavityMaterial = new THREE.MeshStandardMaterial({ color: 0x010101, roughness: 0.35, metalness: 0.10 });
  const chromeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb9bec5,
    roughness: 0.20,
    metalness: 0.88,
    clearcoat: 0.32,
  });
  const tongueMaterial = new THREE.MeshStandardMaterial({ color: 0x242629, roughness: 0.30, metalness: 0.18 });
  const contactMaterial = new THREE.MeshPhysicalMaterial({ color: 0xd19a43, roughness: 0.26, metalness: 0.92 });

  const cavity = makePanel('standard-usb-cavity', 0.218, 0.096, 0.005, 0.018, cavityMaterial, false, 0.002);
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.x = -BODY_WIDTH / 2 + 0.006;
  port.add(cavity);

  // A separate chrome liner gives this USB-A socket the conventional metal
  // face from the reference, while the outer black rails retain the case seam.
  addOpenSideBezel(port, 'standard-usb', 0.246, 0.124, recessMaterial, shadows);
  addOpenSideBezel(port, 'standard-usb-chrome', 0.208, 0.090, chromeMaterial, false);

  const tongue = makePanel('standard-usb-tongue', 0.166, 0.024, 0.005, 0.003, tongueMaterial, false, 0.002);
  tongue.rotation.y = -Math.PI / 2;
  tongue.position.set(-BODY_WIDTH / 2 + 0.001, 0, 0);
  port.add(tongue);

  for (const [index, offset] of [-0.066, -0.022, 0.022, 0.066].entries()) {
    for (const y of [-0.034, 0.034]) {
      const contact = makePanel(`standard-usb-contact-${index + 1}-${y > 0 ? 'top' : 'bottom'}`, 0.018, 0.008, 0.003, 0.001, contactMaterial, false, 0.001);
      contact.rotation.y = -Math.PI / 2;
      contact.position.set(-BODY_WIDTH / 2 + 0.001, y, offset);
      port.add(contact);
    }
  }

  return port;
}

function makeLightningPort(
  shadows: boolean,
  recessMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'lightning-port';

  const cavityMaterial = new THREE.MeshStandardMaterial({ color: 0x010101, roughness: 0.38, metalness: 0.08 });
  addOpenSideBezel(port, 'lightning', 0.174, 0.072, recessMaterial, shadows);

  const cavity = makePanel('lightning-cavity', 0.144, 0.042, 0.004, 0.018, cavityMaterial, false, 0.002);
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.x = -BODY_WIDTH / 2 + 0.006;
  port.add(cavity);

  const contactMaterial = new THREE.MeshPhysicalMaterial({ color: 0xd19a43, roughness: 0.28, metalness: 0.9 });
  for (const [index, offset] of [-0.049, -0.035, -0.021, -0.007, 0.007, 0.021, 0.035, 0.049].entries()) {
    const contact = makePanel(`lightning-contact-${index + 1}`, 0.008, 0.018, 0.003, 0.001, contactMaterial, false, 0.001);
    contact.rotation.y = -Math.PI / 2;
    contact.position.set(-BODY_WIDTH / 2 + 0.002, 0, offset);
    port.add(contact);
  }

  return port;
}

function makeSidePowerButton(
  shadows: boolean,
  bezelMaterial: THREE.Material,
  buttonMaterial: THREE.Material,
): THREE.Group {
  const buttonGroup = new THREE.Group();
  buttonGroup.name = 'side-power-button';

  const bezel = makePanel('power-button-bezel', 0.23, 0.12, 0.008, 0.052, bezelMaterial, shadows, 0.004);
  bezel.rotation.y = Math.PI / 2;
  bezel.position.x = BODY_WIDTH / 2 - 0.001;
  buttonGroup.add(bezel);

  const button = makePanel('power-button', 0.185, 0.084, 0.005, 0.040, buttonMaterial, shadows, 0.003);
  button.rotation.y = Math.PI / 2;
  button.position.x = BODY_WIDTH / 2 - 0.002;
  buttonGroup.add(button);

  return buttonGroup;
}

function makeBatteryPercentageDisplay(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create the battery percentage display texture.');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#d9dee5';
  context.font = '700 94px "SFMono-Regular", Consolas, "Liberation Mono", monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('86%', canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.172, 0.054),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  display.name = 'battery-percentage-display';
  display.renderOrder = 2;
  return display;
}

export type RingShapeKey = 'circle' | 'squircle' | 'hexagon';

export function createRingRimGeometry(shapeKey: RingShapeKey): THREE.BufferGeometry {
  if (shapeKey === 'circle') {
    return new THREE.TorusGeometry(0.192, 0.015, 16, 64);
  } else if (shapeKey === 'hexagon') {
    return new THREE.TorusGeometry(0.198, 0.015, 16, 6);
  } else {
    // Squircle (Rounded Square)
    const shape = new THREE.Shape();
    const w = 0.36, h = 0.36, r = 0.08;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    const points = shape.getPoints(32);
    const path3D = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, p.y, 0)), true);
    return new THREE.TubeGeometry(path3D, 64, 0.015, 12, true);
  }
}

export function createRingFaceGeometry(shapeKey: RingShapeKey): THREE.BufferGeometry {
  if (shapeKey === 'circle') {
    return new THREE.CircleGeometry(0.176, 64);
  } else if (shapeKey === 'hexagon') {
    return new THREE.CircleGeometry(0.182, 6);
  } else {
    // Squircle face
    const shape = new THREE.Shape();
    const w = 0.34, h = 0.34, r = 0.075;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new THREE.ShapeGeometry(shape);
  }
}

function makeStatusDisplay(
  shadows: boolean,
  ringMaterial: THREE.Material,
  displayMaterial: THREE.Material,
  ledMaterial: THREE.Material,
): THREE.Group {
  const display = new THREE.Group();
  display.name = 'battery-status-display';
  display.position.set(0, 0.62, BODY_DEPTH / 2 + 0.044);

  const rim = new THREE.Mesh(createRingRimGeometry('circle'), ringMaterial);
  rim.name = 'status-ring';
  rim.position.z = 0.008;
  rim.castShadow = shadows;
  display.add(rim);

  const face = new THREE.Mesh(createRingFaceGeometry('circle'), displayMaterial);
  face.name = 'status-face';
  face.position.z = 0.001;
  display.add(face);

  const ledRadius = 0.116;
  const ledAngles = [150, 112, 73, 34];
  for (const [index, angleDegrees] of ledAngles.entries()) {
    const angle = THREE.MathUtils.degToRad(angleDegrees);
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.018, 20), ledMaterial);
    led.name = `status-led-${index + 1}`;
    led.position.set(Math.cos(angle) * ledRadius, Math.sin(angle) * ledRadius, 0.012);
    display.add(led);
  }

  const percentage = makeBatteryPercentageDisplay();
  percentage.position.set(0, -0.082, 0.014);
  display.add(percentage);

  return display;
}

function makeMagneticBack(
  shadows: boolean,
  ringMaterial: THREE.Material,
  centerMaterial: THREE.Material,
): THREE.Group {
  const back = new THREE.Group();
  back.name = 'magsafe-charging-surface';

  // The reference's charging target fills more of the rear surface than the
  // earlier version. Its broad, finely ribbed outer band is modeled here as
  // an inset ring with radial grooves rather than a smooth decorative torus.
  const innerRadius = 0.462;
  const outerRadius = 0.536;
  const ring = new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, 128), ringMaterial);
  ring.name = 'magsafe-alignment-ring';
  ring.rotation.y = Math.PI;
  ring.castShadow = shadows;
  back.add(ring);

  const center = new THREE.Mesh(new THREE.CircleGeometry(innerRadius, 96), centerMaterial);
  center.name = 'magsafe-center-pad';
  center.rotation.y = Math.PI;
  center.position.z = 0.004;
  center.receiveShadow = shadows;
  back.add(center);

  const grooveMaterial = new THREE.MeshStandardMaterial({
    color: 0x151619,
    roughness: 0.42,
    metalness: 0.14,
  });
  const grooveGeometry = new THREE.BoxGeometry(outerRadius - innerRadius - 0.009, 0.0032, 0.002);
  const grooveRadius = (innerRadius + outerRadius) / 2;
  for (let index = 0; index < 112; index += 1) {
    const angle = (index / 112) * Math.PI * 2;
    const groove = new THREE.Mesh(grooveGeometry, grooveMaterial);
    groove.name = `magsafe-ring-groove-${index + 1}`;
    groove.position.set(
      Math.cos(angle) * grooveRadius,
      Math.sin(angle) * grooveRadius,
      -0.003,
    );
    groove.rotation.set(0, Math.PI, angle);
    back.add(groove);
  }

  // Keep the alignment bar engraved with the ring, rather than letting it
  // become a raised strap when the model is seen exactly from the side.
  const alignmentBar = makePanel('magsafe-alignment-bar', 0.052, 0.22, 0.001, 0.025, ringMaterial, false, 0.001);
  alignmentBar.rotation.y = Math.PI;
  alignmentBar.position.set(0, -0.70, -0.0225);
  back.add(alignmentBar);

  return back;
}

/**
 * Procedural reconstruction of the black Anker MagGo 5K power bank (A1618).
 * The measured 107.3 x 69.5 x 20.5 mm ratio drives the body proportions;
 * surface details are reconstructed from the supplied three-quarter image.
 */
export function createAnkerMaggoA1618Model(
  options: AnkerMaggoA1618Options = {},
): THREE.Group {
  const shadows = options.shadows ?? true;
  const rotationSpeed = options.rotationSpeed ?? 0.038;

  const root = new THREE.Group();
  root.name = 'anker-maggo-a1618';

  const satinGraphite = new THREE.MeshPhysicalMaterial({
    color: SONY_BUD_BLACK,
    roughness: 0.52,
    metalness: 0.05,
    clearcoat: 0.45,
    clearcoatRoughness: 0.42,
    envMapIntensity: 0.55,
  });
  const edgeMaterial = new THREE.MeshPhysicalMaterial({
    color: SONY_INNER_BLACK,
    roughness: 0.7,
    metalness: 0.05,
  });
  const bodyGraphite = new THREE.MeshPhysicalMaterial({
    color: SONY_BODY_BLACK,
    roughness: 0.62,
    metalness: 0.04,
    clearcoat: 0.14,
    clearcoatRoughness: 0.6,
    envMapIntensity: 0.4,
  });
  const ringMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x303237,
    roughness: 0.27,
    metalness: 0.30,
    clearcoat: 0.68,
    clearcoatRoughness: 0.22,
  });
  const displayMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x232529,
    roughness: 0.22,
    metalness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.10,
  });
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf4f7ff,
    emissiveIntensity: 2.8,
    roughness: 0.18,
    toneMapped: false,
  });
  const blueMaterial = new THREE.MeshStandardMaterial({
    color: USB_BLUE,
    emissive: 0x006fbb,
    emissiveIntensity: 0.34,
    roughness: 0.27,
    metalness: 0.20,
  });

  const shell = new THREE.Mesh(
    new RoundedBoxGeometry(BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH, 8, 0.105),
    satinGraphite,
  );
  shell.name = 'glossy-rear-shell';
  shell.position.y = BODY_CENTER_Y;
  shell.castShadow = shadows;
  shell.receiveShadow = shadows;
  root.add(shell);

  // A narrow polished gasket remains visible around the matte charging face.
  const frontGasket = makePanel(
    'front-polished-gasket',
    BODY_WIDTH * 0.982,
    BODY_HEIGHT * 0.986,
    0.045,
    0.18,
    edgeMaterial,
    shadows,
    0.012,
  );
  frontGasket.position.set(0, BODY_CENTER_Y + 0.005, BODY_DEPTH / 2 - 0.006);
  root.add(frontGasket);

  const chargingFace = makePanel(
    'matte-charging-face',
    BODY_WIDTH * 0.955,
    BODY_HEIGHT * 0.963,
    0.036,
    0.17,
    satinGraphite,
    shadows,
    0.009,
  );
  chargingFace.position.set(0, BODY_CENTER_Y + 0.025, BODY_DEPTH / 2 + 0.024);
  root.add(chargingFace);

  const statusDisplay = makeStatusDisplay(shadows, ringMaterial, displayMaterial, ledMaterial);
  root.add(statusDisplay);

  const magsafeBack = makeMagneticBack(shadows, edgeMaterial, bodyGraphite);
  magsafeBack.position.set(0, BODY_CENTER_Y + 0.25, -BODY_DEPTH / 2 - 0.023);
  root.add(magsafeBack);

  const usbPort = makeUsbCPort(shadows, edgeMaterial, blueMaterial);
  usbPort.position.y = 0.63;
  root.add(usbPort);

  const usbAPort = makeUsbAPort(shadows, edgeMaterial, blueMaterial);
  usbAPort.position.y = 0.78;
  root.add(usbAPort);

  const standardUsbPort = makeStandardUsbPort(shadows, edgeMaterial);
  standardUsbPort.position.y = 0.96;
  root.add(standardUsbPort);

  const lightningPort = makeLightningPort(shadows, edgeMaterial);
  lightningPort.position.y = 0.48;
  root.add(lightningPort);

  const powerButton = makeSidePowerButton(shadows, edgeMaterial, bodyGraphite);
  powerButton.position.y = 0.63;
  root.add(powerButton);

  root.userData.tick = (dt: number): void => {
    root.rotation.y += dt * rotationSpeed;
  };
  root.userData.productDimensionsMm = [69.5, 107.3, 20.5];
  root.userData.interactions = ['drag-or-swipe-to-orbit', 'wheel-or-pinch-to-zoom'];

  root.rotation.y = -0.16;
  return root;
}

export function createAnkerMaggoA1618LookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  lights.name = 'anker-maggo-lookdev-lights';

  const key = new THREE.DirectionalLight(0xfff8ef, 2.6);
  key.position.set(-3.8, 5.8, 5.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 18;
  key.shadow.bias = -0.00035;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xc7dcff, 1.1);
  fill.position.set(4.5, 2.7, 2.8);
  lights.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 1.7);
  rim.position.set(0.5, 4.2, -5.5);
  lights.add(rim);

  const base = new THREE.HemisphereLight(0xf4f6fa, 0x4b4e54, 0.75);
  lights.add(base);

  return lights;
}
