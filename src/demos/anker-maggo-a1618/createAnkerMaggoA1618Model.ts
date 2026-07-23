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

function stadiumShape(width: number, height: number): THREE.Shape {
  const shape = new THREE.Shape();
  const radius = height / 2;
  const straightWidth = Math.max(0, width - height);
  const xLeft = -straightWidth / 2;
  const xRight = straightWidth / 2;

  shape.moveTo(xLeft, -radius);
  shape.lineTo(xRight, -radius);
  shape.absarc(xRight, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(xLeft, radius);
  shape.absarc(xLeft, 0, radius, Math.PI / 2, (3 * Math.PI) / 2, false);
  return shape;
}


function makeUsbCPort(
  shadows: boolean,
  _recessMaterial: THREE.Material,
  _blueMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'usb-c-port';

  // ─── Dimensions (world-space, portrait orientation) ────────────────────────
  // USB-C female port is a wide oval (stadium shape) on the narrow side of the
  // power bank. All measurements are derived from the reference photo.
  const P_W  = 0.185;   // total stadium width
  const P_H  = 0.080;   // total stadium height
  const RIM  = 0.009;   // outer-bezel ring width
  const DEPTH = 0.030;  // how deep the cavity goes into the body

  // X-axis along the edge (port faces -X in body space)
  const FACE_X = -BODY_WIDTH / 2;

  // ─── 1. OUTER BLACK STADIUM BEZEL (matches device body colour) ────────────
  //  Rings drawn as outer-shape with inner hole to get the flat face of the rim.
  const outerBezelMat = new THREE.MeshPhysicalMaterial({
    color: 0x111114,
    roughness: 0.55,
    metalness: 0.08,
  });
  const outerShape  = stadiumShape(P_W,          P_H);
  const innerHole   = stadiumShape(P_W - RIM * 2, P_H - RIM * 2);
  outerShape.holes.push(innerHole);
  const bezelGeom = new THREE.ExtrudeGeometry(outerShape, {
    depth: 0.008,
    curveSegments: 32,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.0018,
    bevelThickness: 0.0018,
  });
  bezelGeom.translate(0, 0, -0.004);
  const outerBezel = new THREE.Mesh(bezelGeom, outerBezelMat);
  outerBezel.name = 'usb-c-outer-bezel';
  outerBezel.rotation.y = -Math.PI / 2;
  outerBezel.position.set(FACE_X + 0.001, 0, 0);
  outerBezel.castShadow = shadows;
  port.add(outerBezel);

  // ─── 2. CHROME/NICKEL INNER RIM RING ─────────────────────────────────────
  //  A thin polished ring just inside the outer black bezel.
  const cavW  = P_W - RIM * 2;
  const cavH  = P_H - RIM * 2;
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: 0x8a929b,
    roughness: 0.15,
    metalness: 0.94,
    clearcoat: 0.5,
    clearcoatRoughness: 0.08,
  });
  const rimRingThk = 0.004;
  const rimOuter = stadiumShape(cavW, cavH);
  const rimInner = stadiumShape(cavW - rimRingThk * 2, cavH - rimRingThk * 2);
  rimOuter.holes.push(rimInner);
  const rimGeom = new THREE.ExtrudeGeometry(rimOuter, {
    depth: 0.005,
    curveSegments: 32,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.001,
    bevelThickness: 0.001,
  });
  rimGeom.translate(0, 0, -0.0025);
  const innerRim = new THREE.Mesh(rimGeom, rimMat);
  innerRim.name = 'usb-c-chrome-rim';
  innerRim.rotation.y = -Math.PI / 2;
  innerRim.position.set(FACE_X, 0, 0);
  port.add(innerRim);

  // ─── 3. DEEP BLACK CAVITY (fill the opening with a very dark recess) ──────
  const cav2W = cavW - rimRingThk * 2;
  const cav2H = cavH - rimRingThk * 2;
  const cavShape = stadiumShape(cav2W, cav2H);
  const cavGeom  = new THREE.ExtrudeGeometry(cavShape, {
    depth: DEPTH,
    curveSegments: 32,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.002,
    bevelThickness: 0.002,
  });
  cavGeom.translate(0, 0, -DEPTH);
  const cavMat = new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 0.80, metalness: 0.05 });
  const cavity = new THREE.Mesh(cavGeom, cavMat);
  cavity.name = 'usb-c-cavity';
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.set(FACE_X - 0.002, 0, 0);
  port.add(cavity);

  // ── Key geometry insight (rotation.y = -π/2) ──────────────────────────────
  // After this rotation:  local X → world Z (port width direction)
  //                       local Y → world Y (port height direction)
  //                       local Z → world -X (depth INTO the body)
  //
  // For BoxGeometry(bW, bH, bD) at position (px, py, pz):
  //   • World Z extent : pz ± bW/2   (port width)
  //   • World Y extent : py ± bH/2   (port height)
  //   • World X extent : px ± bD/2   (viewer-facing face = px + bD/2)
  //
  // To ensure NO protrusion (viewer face ≤ FACE_X):
  //   px + bD/2 ≤ FACE_X  →  px = FACE_X - RECESS - bD/2
  // ────────────────────────────────────────────────────────────────────────────

  // Common constants
  const RECESS = 0.005; // how far both tongue and contacts sit back from FACE_X

  // Derived cavity inner dimensions (same as above)
  // cav2W ≈ 0.159, cav2H ≈ 0.054  (already declared above)

  // ─── 4. BRIGHT BLUE TONGUE — flat BoxGeometry slab, fully inside cavity ──
  //
  // Reference image proportions (img2threejs pass):
  //   • Width  : ~80 % of cavity width  → cav2W * 0.80
  //   • Height : ~22 % of cavity height → cav2H * 0.22
  //   • Y pos  : tongue centre sits ~24 % of cavity half-height above centre
  //              → TONGUE_Y = cav2H * 0.24 / 2 ≈ cav2H * 0.12
  //              (occupies roughly the upper portion of the opening, like ref)
  //   • Depth  : 5 mm thin slab — just enough to cast light/shadow

  const TONGUE_BW  = cav2W * 0.80;  // world-Z span  (local X in BoxGeometry)
  const TONGUE_BH  = cav2H * 0.22;  // world-Y span  (local Y)
  const TONGUE_BD  = 0.005;          // world-X depth (local Z) — thin slab
  const TONGUE_Y   = cav2H * 0.12;  // upward offset from cavity centre (world Y)

  // Outer (viewer-facing) face lands at: FACE_X - RECESS ✓ (fully inside)
  const TONGUE_PX  = FACE_X - RECESS - TONGUE_BD / 2;

  const blueMat = new THREE.MeshStandardMaterial({
    color:             0x2b8fff,
    emissive:          0x0055dd,
    emissiveIntensity: 0.30,
    roughness:         0.22,
    metalness:         0.14,
  });
  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(TONGUE_BW, TONGUE_BH, TONGUE_BD),
    blueMat,
  );
  tongue.name = 'usb-c-blue-tongue';
  tongue.rotation.y = -Math.PI / 2;
  tongue.position.set(TONGUE_PX, TONGUE_Y, 0);
  port.add(tongue);

  // ─── 5. FOUR GOLD CONTACT TEETH — flat BoxGeometry tabs, fully inside ─────
  //
  // Reference image proportions (img2threejs pass):
  //   • Each tab width : ~14 % of cavity width  → cav2W * 0.14
  //   • Tab height     : ~22 % of cavity height → cav2H * 0.22  (same as tongue height)
  //   • Y centre       : sits just below cavity centre by ~9 % of cavity half-height
  //                       → CONTACT_CY = -(cav2H * 0.09)
  //   • 4 tabs evenly spaced across 72 % of tongue span

  const C_BW   = cav2W * 0.14;   // individual tab world-Z width
  const C_BH   = cav2H * 0.22;   // tab world-Y height
  const C_BD   = 0.005;           // tab world-X depth (same recess as tongue)
  const C_CY   = -(cav2H * 0.09); // vertical centre below cavity mid-line

  const CONTACT_PX   = FACE_X - RECESS - C_BD / 2;  // flush behind tongue face
  const CONTACT_SPAN = TONGUE_BW * 0.72;             // total span for 4 tabs
  const CONTACT_STEP = CONTACT_SPAN / 3;             // gap between centres

  const contactMat = new THREE.MeshPhysicalMaterial({
    color:              0xc8921e,
    roughness:          0.20,
    metalness:          0.96,
    clearcoat:          0.35,
    clearcoatRoughness: 0.10,
  });
  const contactGeom = new THREE.BoxGeometry(C_BW, C_BH, C_BD);

  for (let i = 0; i < 4; i++) {
    const contact = new THREE.Mesh(contactGeom, contactMat);
    contact.name = `usb-c-contact-${i + 1}`;
    contact.rotation.y = -Math.PI / 2;
    contact.position.set(
      CONTACT_PX,
      C_CY,
      -CONTACT_SPAN / 2 + i * CONTACT_STEP,   // evenly spaced in world Z
    );
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
  _recessMaterial: THREE.Material,
  _blueMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'legacy-usb-port';

  // ─── Dimensions (world-space, portrait orientation) ────────────────────────
  // Legacy USB-A (USB 3.0) rectangular port dimensions from sculpt spec:
  const P_W   = 0.190;   // total frame width
  const P_H   = 0.085;   // total frame height
  const DEPTH = 0.032;  // cavity depth recessed into body (-X)
  const RECESS = 0.005; // front face setback behind casing surface to prevent protrusion

  const FACE_X = -BODY_WIDTH / 2;

  // Helper to construct rounded rectangle shape for USB-A cutout
  const roundedRectShape = (w: number, h: number, r: number = 0.004): THREE.Shape => {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };

  // ─── 1. PORT FRAME & OUTER MATTE BEZEL ────────────────────────────────────
  const RIM = 0.010;
  const outerBezelMat = new THREE.MeshPhysicalMaterial({
    color: 0x111114,
    roughness: 0.55,
    metalness: 0.08,
  });
  const outerShape = roundedRectShape(P_W, P_H, 0.005);
  const innerHole  = roundedRectShape(P_W - RIM * 2, P_H - RIM * 2, 0.003);
  outerShape.holes.push(innerHole);

  const bezelGeom = new THREE.ExtrudeGeometry(outerShape, {
    depth: 0.008,
    steps: 1,
    curveSegments: 16,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.0015,
    bevelThickness: 0.0015,
  });
  bezelGeom.translate(0, 0, -0.004);
  const outerBezel = new THREE.Mesh(bezelGeom, outerBezelMat);
  outerBezel.name = 'usb-a-outer-bezel';
  outerBezel.rotation.y = -Math.PI / 2;
  outerBezel.position.set(FACE_X + 0.001, 0, 0);
  outerBezel.castShadow = shadows;
  port.add(outerBezel);

  // ─── 2. POLISHED SILVER/NICKEL METALLIC SHIELD FRAME (INNER LINER) ────────
  const cavW = P_W - RIM * 2;
  const cavH = P_H - RIM * 2;
  const LINER_THK = 0.004;

  const chromeMat = new THREE.MeshPhysicalMaterial({
    color: 0x9098a2,
    roughness: 0.15,
    metalness: 0.94,
    clearcoat: 0.50,
  });
  const linerOuter = roundedRectShape(cavW, cavH, 0.003);
  const linerInner = roundedRectShape(cavW - LINER_THK * 2, cavH - LINER_THK * 2, 0.002);
  linerOuter.holes.push(linerInner);

  const linerGeom = new THREE.ExtrudeGeometry(linerOuter, {
    depth: 0.006,
    steps: 1,
    curveSegments: 16,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.001,
    bevelThickness: 0.001,
  });
  linerGeom.translate(0, 0, -0.003);
  const chromeLiner = new THREE.Mesh(linerGeom, chromeMat);
  chromeLiner.name = 'usb-a-chrome-liner';
  chromeLiner.rotation.y = -Math.PI / 2;
  chromeLiner.position.set(FACE_X, 0, 0);
  port.add(chromeLiner);

  // ─── 3. PITCH-BLACK RECESSED CAVITY ───────────────────────────────────────
  const cavInnerW = cavW - LINER_THK * 2;
  const cavInnerH = cavH - LINER_THK * 2;

  const cavShape = roundedRectShape(cavInnerW, cavInnerH, 0.002);
  const cavGeom  = new THREE.ExtrudeGeometry(cavShape, {
    depth: DEPTH,
    steps: 1,
    curveSegments: 16,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.0015,
    bevelThickness: 0.0015,
  });
  cavGeom.translate(0, 0, -DEPTH);

  const cavMat = new THREE.MeshStandardMaterial({
    color: 0x030304,
    roughness: 0.85,
    metalness: 0.05,
  });
  const cavity = new THREE.Mesh(cavGeom, cavMat);
  cavity.name = 'usb-a-cavity';
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.set(FACE_X - 0.002, 0, 0);
  port.add(cavity);

  // ─── 4. PLASTIC CONNECTOR TONGUE (USB 3.0 ELECTRIC BLUE WAFER) ─────────────
  // Occupies upper 45% of the cavity height, recessed RECESS (0.005) inside
  const TONGUE_BW = 0.160;  // world-Z width (local X)
  const TONGUE_BH = 0.024;  // world-Y height (local Y)
  const TONGUE_BD = 0.022;  // world-X depth (local Z)

  // Position tongue in upper 45% of cavity height
  const TONGUE_Y  = (cavInnerH / 2 - TONGUE_BH / 2) * 0.70;
  const TONGUE_PX = FACE_X - RECESS - TONGUE_BD / 2;

  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x0077ff,
    emissive: 0x0044bb,
    emissiveIntensity: 0.20,
    roughness: 0.30,
    metalness: 0.10,
  });
  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(TONGUE_BW, TONGUE_BH, TONGUE_BD),
    blueMat,
  );
  tongue.name = 'usb-a-blue-tongue';
  tongue.rotation.y = -Math.PI / 2;
  tongue.position.set(TONGUE_PX, TONGUE_Y, 0);
  port.add(tongue);

  // ─── 5. GOLD METAL CONTACT PINS (4 PINS ON TONGUE UNDERSIDE) ──────────────
  const PIN_BW = 0.018;  // world-Z width
  const PIN_BH = 0.006;  // world-Y thickness (flush along underside of tongue)
  const PIN_BD = 0.016;  // world-X depth

  const PIN_PX   = TONGUE_PX + 0.002;
  const PIN_Y    = TONGUE_Y - TONGUE_BH / 2 - PIN_BH / 2;
  const PIN_SPAN = TONGUE_BW * 0.75;
  const PIN_STEP = PIN_SPAN / 3;

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4af37,
    roughness: 0.18,
    metalness: 0.96,
    clearcoat: 0.40,
  });
  const pinGeom = new THREE.BoxGeometry(PIN_BW, PIN_BH, PIN_BD);

  for (let i = 0; i < 4; i++) {
    const pin = new THREE.Mesh(pinGeom, goldMat);
    pin.name = `usb-a-contact-${i + 1}`;
    pin.rotation.y = -Math.PI / 2;
    pin.position.set(
      PIN_PX,
      PIN_Y,
      -PIN_SPAN / 2 + i * PIN_STEP,
    );
    port.add(pin);
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

export function makeBatteryPercentageDisplay(shapeKey: RingShapeKey = 'circle'): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create the battery percentage display texture.');
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Deep OLED dark glass backdrop fitting shape
  const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 240);
  bgGrad.addColorStop(0, 'rgba(8, 22, 30, 0.98)');
  bgGrad.addColorStop(0.7, 'rgba(5, 14, 20, 0.99)');
  bgGrad.addColorStop(1, 'rgba(2, 6, 10, 1.0)');
  ctx.fillStyle = bgGrad;

  ctx.beginPath();
  if (shapeKey === 'circle') {
    ctx.arc(cx, cy, 235, 0, Math.PI * 2);
  } else if (shapeKey === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      const x = cx + 235 * Math.cos(a);
      const y = cy + 235 * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else {
    // Squircle
    const w = 450, h = 450, r = 90;
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r);
  }
  ctx.fill();

  // 2. Shape-following Progress Bar Gauge (86% fill)
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 16;
  ctx.strokeStyle = '#00ffcc';
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (shapeKey === 'circle') {
    const radius = 195;
    const startAngle = Math.PI * 0.75;
    const totalAngle = Math.PI * 1.5;
    const endAngle = startAngle + totalAngle * 0.86;

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + totalAngle);
    ctx.strokeStyle = 'rgba(0, 220, 180, 0.16)';
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Active
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 18;
    ctx.stroke();
  } else if (shapeKey === 'hexagon') {
    const hexRadius = 195;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      const x = cx + hexRadius * Math.cos(a);
      const y = cy + hexRadius * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0, 220, 180, 0.16)';
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Active stroke dash
    ctx.setLineDash([1150 * 0.86, 1150 * 0.14]);
    ctx.strokeStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // Squircle path gauge
    const w = 380, h = 380, r = 75;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r);
    ctx.strokeStyle = 'rgba(0, 220, 180, 0.16)';
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Active stroke dash
    ctx.setLineDash([1320 * 0.86, 1320 * 0.14]);
    ctx.strokeStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.shadowBlur = 0;

  // 3. Top Charging Badge (⚡ 30W FAST)
  ctx.fillStyle = '#7fffe9';
  ctx.font = '600 24px "SFProText-Semibold", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡ 30W FAST', cx, cy - 85);

  // 4. Center Main Percentage Readout (86%)
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 128px "SFMono-Regular", Consolas, sans-serif';
  ctx.fillText('86', cx - 18, cy + 6);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#00ffcc';
  ctx.font = '700 52px "SFMono-Regular", Consolas, sans-serif';
  ctx.fillText('%', cx + 115, cy - 20);

  // 5. Bottom Sub-label (1h 45m REMAINING)
  ctx.fillStyle = '#8a9fb0';
  ctx.font = '600 22px "SFProText-Semibold", -apple-system, sans-serif';
  ctx.fillText('1h 45m REMAINING', cx, cy + 90);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.33, 0.33),
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
    return new THREE.CircleGeometry(0.192, 64);
  } else if (shapeKey === 'hexagon') {
    return new THREE.CircleGeometry(0.198, 6);
  } else {
    // Squircle face matching squircle rim dimensions
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

  const ledRadius = 0.125;
  const ledAngles = [160, 134, 108, 82, 56, 30];
  for (const [index, angleDegrees] of ledAngles.entries()) {
    const angle = THREE.MathUtils.degToRad(angleDegrees);
    const led = new THREE.Mesh(new THREE.CircleGeometry(0.015, 20), ledMaterial);
    led.name = `status-led-${index + 1}`;
    led.position.set(Math.cos(angle) * ledRadius, Math.sin(angle) * ledRadius, 0.012);
    display.add(led);
  }

  const percentage = makeBatteryPercentageDisplay('circle');
  percentage.position.set(0, 0, 0.014);
  percentage.visible = false; // LED dots mode by default has ONLY dots
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
