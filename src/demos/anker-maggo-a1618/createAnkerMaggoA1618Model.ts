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
const USB_BLUE = 0x009fff;

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

function makeSidePort(
  shadows: boolean,
  recessMaterial: THREE.Material,
  blueMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'usb-c-port';

  // A real USB-C opening has a dark outer bezel, a recessed cavity, and a
  // slim central tongue. The blue is deliberately limited to that tongue.
  const recess = makePanel('usb-c-bezel', 0.20, 0.092, 0.010, 0.040, recessMaterial, shadows, 0.004);
  recess.rotation.y = -Math.PI / 2;
  recess.position.x = -BODY_WIDTH / 2 + 0.001;
  port.add(recess);

  const cavityMaterial = new THREE.MeshStandardMaterial({
    color: 0x05070a,
    roughness: 0.5,
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

  return port;
}

function makeLowerPort(shadows: boolean, portMaterial: THREE.Material): THREE.Mesh {
  const port = makePanel('lower-usb-c-recess', 0.17, 0.060, 0.010, 0.024, portMaterial, shadows, 0.003);
  port.rotation.x = Math.PI / 2;
  port.position.set(0, 0.073, 0);
  return port;
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

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.192, 0.012, 14, 64), ringMaterial);
  rim.name = 'status-ring';
  rim.castShadow = shadows;
  display.add(rim);

  const face = new THREE.Mesh(new THREE.CircleGeometry(0.171, 64), displayMaterial);
  face.name = 'status-face';
  face.position.z = 0.001;
  display.add(face);

  const ledRadius = 0.116;
  const ledAngles = [150, 112, 73, 34];
  for (const [index, angleDegrees] of ledAngles.entries()) {
    const angle = THREE.MathUtils.degToRad(angleDegrees);
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), ledMaterial);
    led.name = `status-led-${index + 1}`;
    led.position.set(Math.cos(angle) * ledRadius, Math.sin(angle) * ledRadius, 0.004);
    display.add(led);
  }

  return display;
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

  const usbPort = makeSidePort(shadows, edgeMaterial, blueMaterial);
  usbPort.position.y = 0.63;
  root.add(usbPort);

  root.add(makeLowerPort(shadows, edgeMaterial));

  // Single, flush side button above the blue USB-C insert.
  const sideButton = makePanel(
    'side-power-button',
    0.20,
    BODY_HEIGHT * 0.34,
    0.006,
    0.065,
    bodyGraphite,
    shadows,
    0.006,
  );
  sideButton.rotation.y = -Math.PI / 2;
  sideButton.position.set(-BODY_WIDTH / 2 - 0.006, BODY_CENTER_Y + 0.11, -0.012);
  root.add(sideButton);

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
