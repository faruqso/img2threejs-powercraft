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

  const P_W  = 0.185;   // total stadium width
  const P_H  = 0.080;   // total stadium height
  const RIM  = 0.009;   // outer-bezel ring width
  const DEPTH = 0.030;  // how deep cavity goes into body
  const FACE_X = -BODY_WIDTH / 2;

  // 1. OUTER BLACK STADIUM BEZEL
  const outerBezelMat = new THREE.MeshPhysicalMaterial({ color: 0x111114, roughness: 0.55, metalness: 0.08 });
  const outerShape  = stadiumShape(P_W, P_H);
  const innerHole   = stadiumShape(P_W - RIM * 2, P_H - RIM * 2);
  outerShape.holes.push(innerHole);
  const bezelGeom = new THREE.ExtrudeGeometry(outerShape, { depth: 0.008, curveSegments: 32, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.0018, bevelThickness: 0.0018 });
  bezelGeom.translate(0, 0, -0.004);
  const outerBezel = new THREE.Mesh(bezelGeom, outerBezelMat);
  outerBezel.name = 'usb-c-outer-bezel';
  outerBezel.rotation.y = -Math.PI / 2;
  outerBezel.position.set(FACE_X - 0.001, 0, 0);
  outerBezel.castShadow = shadows;
  port.add(outerBezel);

  // 2. CHROME INNER RIM RING
  const cavW  = P_W - RIM * 2;
  const cavH  = P_H - RIM * 2;
  const rimMat = new THREE.MeshPhysicalMaterial({ color: 0x8a929b, roughness: 0.15, metalness: 0.94, clearcoat: 0.5, clearcoatRoughness: 0.08 });
  const rimRingThk = 0.004;
  const rimOuter = stadiumShape(cavW, cavH);
  const rimInner = stadiumShape(cavW - rimRingThk * 2, cavH - rimRingThk * 2);
  rimOuter.holes.push(rimInner);
  const rimGeom = new THREE.ExtrudeGeometry(rimOuter, { depth: 0.005, curveSegments: 32, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.001, bevelThickness: 0.001 });
  rimGeom.translate(0, 0, -0.0025);
  const innerRim = new THREE.Mesh(rimGeom, rimMat);
  innerRim.name = 'usb-c-chrome-rim';
  innerRim.rotation.y = -Math.PI / 2;
  innerRim.position.set(FACE_X, 0, 0);
  port.add(innerRim);

  // 3. DEEP BLACK CAVITY — open mouth at FACE_X + 0.001 (1mm recessed inside body)
  const cav2W = cavW - rimRingThk * 2;
  const cav2H = cavH - rimRingThk * 2;
  const cavShape = stadiumShape(cav2W, cav2H);
  const cavGeom  = new THREE.ExtrudeGeometry(cavShape, { depth: DEPTH, curveSegments: 32, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.002, bevelThickness: 0.002 });
  cavGeom.translate(0, 0, -DEPTH);
  const cavMat = new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 0.80, metalness: 0.05 });
  const cavity = new THREE.Mesh(cavGeom, cavMat);
  cavity.name = 'usb-c-cavity';
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.set(FACE_X + 0.001, 0, 0);
  port.add(cavity);

  // 4. BRIGHT BLUE TONGUE — front face at FACE_X + 0.004 (4mm recessed inside body)
  const TONGUE_BW = cav2W * 0.80;
  const TONGUE_BH = cav2H * 0.22;
  const TONGUE_BD = 0.012;
  const TONGUE_Y  = cav2H * 0.12;
  const TONGUE_PX = (FACE_X + 0.004) + TONGUE_BD / 2;

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2b8fff, emissive: 0x0055dd, emissiveIntensity: 0.25, roughness: 0.22, metalness: 0.14 });
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(TONGUE_BW, TONGUE_BH, TONGUE_BD), blueMat);
  tongue.name = 'usb-c-blue-tongue';
  tongue.rotation.y = -Math.PI / 2;
  tongue.position.set(TONGUE_PX, TONGUE_Y, 0);
  port.add(tongue);

  // 5. FOUR GOLD CONTACT TEETH — front face at FACE_X + 0.003 (3mm recessed inside body)
  const C_BW = cav2W * 0.14;
  const C_BH = cav2H * 0.22;
  const C_BD = 0.010;
  const C_CY = -(cav2H * 0.09);
  const CONTACT_PX   = (FACE_X + 0.003) + C_BD / 2;
  const CONTACT_SPAN = TONGUE_BW * 0.72;
  const CONTACT_STEP = CONTACT_SPAN / 3;

  const contactMat = new THREE.MeshPhysicalMaterial({ color: 0xc8921e, roughness: 0.20, metalness: 0.96, clearcoat: 0.35, clearcoatRoughness: 0.10 });
  const contactGeom = new THREE.BoxGeometry(C_BW, C_BH, C_BD);

  for (let i = 0; i < 4; i++) {
    const contact = new THREE.Mesh(contactGeom, contactMat);
    contact.name = `usb-c-contact-${i + 1}`;
    contact.rotation.y = -Math.PI / 2;
    contact.position.set(CONTACT_PX, C_CY, -CONTACT_SPAN / 2 + i * CONTACT_STEP);
    port.add(contact);
  }

  return port;
}

function makeUsbAPort(
  shadows: boolean,
  _recessMaterial: THREE.Material,
  _blueMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'legacy-usb-port';

  const P_W   = 0.190;
  const P_H   = 0.085;
  const DEPTH = 0.032;
  const FACE_X = -BODY_WIDTH / 2;

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

  // 1. OUTER BLACK BEZEL
  const RIM = 0.010;
  const outerBezelMat = new THREE.MeshPhysicalMaterial({ color: 0x111114, roughness: 0.55, metalness: 0.08 });
  const outerShape = roundedRectShape(P_W, P_H, 0.005);
  const innerHole  = roundedRectShape(P_W - RIM * 2, P_H - RIM * 2, 0.003);
  outerShape.holes.push(innerHole);

  const bezelGeom = new THREE.ExtrudeGeometry(outerShape, { depth: 0.008, steps: 1, curveSegments: 16, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.0015, bevelThickness: 0.0015 });
  bezelGeom.translate(0, 0, -0.004);
  const outerBezel = new THREE.Mesh(bezelGeom, outerBezelMat);
  outerBezel.name = 'usb-a-outer-bezel';
  outerBezel.rotation.y = -Math.PI / 2;
  outerBezel.position.set(FACE_X - 0.001, 0, 0);
  outerBezel.castShadow = shadows;
  port.add(outerBezel);

  // 2. CHROME LINER
  const cavW = P_W - RIM * 2;
  const cavH = P_H - RIM * 2;
  const LINER_THK = 0.004;

  const chromeMat = new THREE.MeshPhysicalMaterial({ color: 0x9098a2, roughness: 0.15, metalness: 0.94, clearcoat: 0.50 });
  const linerOuter = roundedRectShape(cavW, cavH, 0.003);
  const linerInner = roundedRectShape(cavW - LINER_THK * 2, cavH - LINER_THK * 2, 0.002);
  linerOuter.holes.push(linerInner);

  const linerGeom = new THREE.ExtrudeGeometry(linerOuter, { depth: 0.006, steps: 1, curveSegments: 16, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.001, bevelThickness: 0.001 });
  linerGeom.translate(0, 0, -0.003);
  const chromeLiner = new THREE.Mesh(linerGeom, chromeMat);
  chromeLiner.name = 'usb-a-chrome-liner';
  chromeLiner.rotation.y = -Math.PI / 2;
  chromeLiner.position.set(FACE_X, 0, 0);
  port.add(chromeLiner);

  // 3. PITCH-BLACK CAVITY — open mouth at FACE_X + 0.001 (1mm recessed inside body)
  const cavInnerW = cavW - LINER_THK * 2;
  const cavInnerH = cavH - LINER_THK * 2;
  const cavShape = roundedRectShape(cavInnerW, cavInnerH, 0.002);
  const cavGeom  = new THREE.ExtrudeGeometry(cavShape, { depth: DEPTH, steps: 1, curveSegments: 16, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.0015, bevelThickness: 0.0015 });
  cavGeom.translate(0, 0, -DEPTH);

  const cavMat = new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 0.85, metalness: 0.05 });
  const cavity = new THREE.Mesh(cavGeom, cavMat);
  cavity.name = 'usb-a-cavity';
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.set(FACE_X + 0.001, 0, 0);
  port.add(cavity);

  // 4. PLASTIC CONNECTOR TONGUE — front face at FACE_X + 0.004 (4mm recessed inside body)
  const TONGUE_BW = 0.160;
  const TONGUE_BH = 0.024;
  const TONGUE_BD = 0.016;

  const TONGUE_Y  = (cavInnerH / 2 - TONGUE_BH / 2) * 0.70;
  const TONGUE_PX = (FACE_X + 0.004) + TONGUE_BD / 2;

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0077ff, emissive: 0x0044bb, emissiveIntensity: 0.20, roughness: 0.30, metalness: 0.10 });
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(TONGUE_BW, TONGUE_BH, TONGUE_BD), blueMat);
  tongue.name = 'usb-a-blue-tongue';
  tongue.rotation.y = -Math.PI / 2;
  tongue.position.set(TONGUE_PX, TONGUE_Y, 0);
  port.add(tongue);

  // 5. GOLD METAL CONTACT PINS — front face at FACE_X + 0.003 (3mm recessed inside body)
  const PIN_BW = 0.018;
  const PIN_BH = 0.006;
  const PIN_BD = 0.012;

  const PIN_PX   = (FACE_X + 0.003) + PIN_BD / 2;
  const PIN_Y    = TONGUE_Y - TONGUE_BH / 2 - PIN_BH / 2;
  const PIN_SPAN = TONGUE_BW * 0.75;
  const PIN_STEP = PIN_SPAN / 3;

  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, roughness: 0.18, metalness: 0.96, clearcoat: 0.40 });
  const pinGeom = new THREE.BoxGeometry(PIN_BW, PIN_BH, PIN_BD);

  for (let i = 0; i < 4; i++) {
    const pin = new THREE.Mesh(pinGeom, goldMat);
    pin.name = `usb-a-contact-${i + 1}`;
    pin.rotation.y = -Math.PI / 2;
    pin.position.set(PIN_PX, PIN_Y, -PIN_SPAN / 2 + i * PIN_STEP);
    port.add(pin);
  }

  return port;
}

function makeMicroUsbPort(
  shadows: boolean,
  _recessMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'micro-usb-port';

  const P_W = 0.165;
  const P_H = 0.065;
  const DEPTH = 0.028;
  const FACE_X = -BODY_WIDTH / 2;

  const trapezoidShape = (wTop: number, wBot: number, h: number, r: number = 0.003): THREE.Shape => {
    const s = new THREE.Shape();
    const halfH = h / 2;
    const xT = wTop / 2, xB = wBot / 2;
    s.moveTo(-xT + r, halfH);
    s.lineTo(xT - r, halfH);
    s.quadraticCurveTo(xT, halfH, xT, halfH - r);
    s.lineTo(xB, -halfH + r);
    s.quadraticCurveTo(xB, -halfH, xB - r, -halfH);
    s.lineTo(-xB + r, -halfH);
    s.quadraticCurveTo(-xB, -halfH, -xB, -halfH + r);
    s.lineTo(-xT, halfH - r);
    s.quadraticCurveTo(-xT, halfH, -xT + r, halfH);
    return s;
  };

  // Outer Bezel
  const outerMat = new THREE.MeshPhysicalMaterial({ color: 0x111114, roughness: 0.55, metalness: 0.08 });
  const outerShape = trapezoidShape(P_W, P_W * 0.82, P_H, 0.004);
  const innerHole = trapezoidShape(P_W - 0.014, (P_W - 0.014) * 0.82, P_H - 0.014, 0.002);
  outerShape.holes.push(innerHole);
  const bezelGeom = new THREE.ExtrudeGeometry(outerShape, { depth: 0.006, curveSegments: 16, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.001, bevelThickness: 0.001 });
  bezelGeom.translate(0, 0, -0.003);
  const outerBezel = new THREE.Mesh(bezelGeom, outerMat);
  outerBezel.rotation.y = -Math.PI / 2;
  outerBezel.position.set(FACE_X - 0.001, 0, 0);
  outerBezel.castShadow = shadows;
  port.add(outerBezel);

  // Chrome Liner
  const chromeMat = new THREE.MeshPhysicalMaterial({ color: 0x8a929b, roughness: 0.15, metalness: 0.94, clearcoat: 0.5 });
  const linerOuter = trapezoidShape(P_W - 0.014, (P_W - 0.014) * 0.82, P_H - 0.014, 0.002);
  const linerInner = trapezoidShape(P_W - 0.022, (P_W - 0.022) * 0.82, P_H - 0.022, 0.002);
  linerOuter.holes.push(linerInner);
  const linerGeom = new THREE.ExtrudeGeometry(linerOuter, { depth: 0.005, curveSegments: 16, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.001, bevelThickness: 0.001 });
  linerGeom.translate(0, 0, -0.0025);
  const chromeLiner = new THREE.Mesh(linerGeom, chromeMat);
  chromeLiner.rotation.y = -Math.PI / 2;
  chromeLiner.position.set(FACE_X, 0, 0);
  port.add(chromeLiner);

  // Cavity — open mouth at FACE_X + 0.001
  const cavGeom = new THREE.ExtrudeGeometry(trapezoidShape(P_W - 0.022, (P_W - 0.022) * 0.82, P_H - 0.022, 0.002), { depth: DEPTH, curveSegments: 16, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.001, bevelThickness: 0.001 });
  cavGeom.translate(0, 0, -DEPTH);
  const cavity = new THREE.Mesh(cavGeom, new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 0.85, metalness: 0.05 }));
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.set(FACE_X + 0.001, 0, 0);
  port.add(cavity);

  // Center dark plastic tongue — front face at FACE_X + 0.004
  const TONGUE_BW = 0.130;
  const TONGUE_BH = 0.016;
  const TONGUE_BD = 0.012;
  const TONGUE_PX = (FACE_X + 0.004) + TONGUE_BD / 2;
  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(TONGUE_BW, TONGUE_BH, TONGUE_BD),
    new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.35, metalness: 0.15 }),
  );
  tongue.rotation.y = -Math.PI / 2;
  tongue.position.set(TONGUE_PX, 0.006, 0);
  port.add(tongue);

  // 5 gold contact pins — front face at FACE_X + 0.003
  const PIN_BD = 0.010;
  const PIN_PX = (FACE_X + 0.003) + PIN_BD / 2;
  const pinGeom = new THREE.BoxGeometry(0.012, 0.004, PIN_BD);
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, roughness: 0.18, metalness: 0.96, clearcoat: 0.40 });
  const span = TONGUE_BW * 0.70;
  for (let i = 0; i < 5; i++) {
    const pin = new THREE.Mesh(pinGeom, goldMat);
    pin.rotation.y = -Math.PI / 2;
    pin.position.set(PIN_PX, 0.010, -span / 2 + i * (span / 4));
    port.add(pin);
  }

  return port;
}

function makeLightningPort(
  shadows: boolean,
  _recessMaterial: THREE.Material,
): THREE.Group {
  const port = new THREE.Group();
  port.name = 'lightning-port';

  const P_W = 0.160;
  const P_H = 0.062;
  const DEPTH = 0.026;
  const FACE_X = -BODY_WIDTH / 2;

  // Outer Bezel
  const outerMat = new THREE.MeshPhysicalMaterial({ color: 0x111114, roughness: 0.55, metalness: 0.08 });
  const outerShape = stadiumShape(P_W, P_H);
  const innerHole = stadiumShape(P_W - 0.014, P_H - 0.014);
  outerShape.holes.push(innerHole);
  const bezelGeom = new THREE.ExtrudeGeometry(outerShape, { depth: 0.006, curveSegments: 24, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.001, bevelThickness: 0.001 });
  bezelGeom.translate(0, 0, -0.003);
  const outerBezel = new THREE.Mesh(bezelGeom, outerMat);
  outerBezel.rotation.y = -Math.PI / 2;
  outerBezel.position.set(FACE_X - 0.001, 0, 0);
  outerBezel.castShadow = shadows;
  port.add(outerBezel);

  // Chrome Liner
  const chromeMat = new THREE.MeshPhysicalMaterial({ color: 0x8a929b, roughness: 0.15, metalness: 0.94, clearcoat: 0.5 });
  const linerOuter = stadiumShape(P_W - 0.014, P_H - 0.014);
  const linerInner = stadiumShape(P_W - 0.022, P_H - 0.022);
  linerOuter.holes.push(linerInner);
  const linerGeom = new THREE.ExtrudeGeometry(linerOuter, { depth: 0.005, curveSegments: 24, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.001, bevelThickness: 0.001 });
  linerGeom.translate(0, 0, -0.0025);
  const chromeLiner = new THREE.Mesh(linerGeom, chromeMat);
  chromeLiner.rotation.y = -Math.PI / 2;
  chromeLiner.position.set(FACE_X, 0, 0);
  port.add(chromeLiner);

  // Cavity — open mouth at FACE_X + 0.001
  const cavGeom = new THREE.ExtrudeGeometry(stadiumShape(P_W - 0.022, P_H - 0.022), { depth: DEPTH, curveSegments: 24, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.001, bevelThickness: 0.001 });
  cavGeom.translate(0, 0, -DEPTH);
  const cavity = new THREE.Mesh(cavGeom, new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.80, metalness: 0.05 }));
  cavity.rotation.y = -Math.PI / 2;
  cavity.position.set(FACE_X + 0.001, 0, 0);
  port.add(cavity);

  // 8 Gold Contact Pins — front face at FACE_X + 0.003 (3mm recessed inside body)
  const PIN_BD = 0.010;
  const pinGeom = new THREE.BoxGeometry(0.008, 0.004, PIN_BD);
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xd4af37, roughness: 0.18, metalness: 0.96, clearcoat: 0.40 });
  const span = (P_W - 0.035) * 0.85;
  const pinPX = (FACE_X + 0.003) + PIN_BD / 2;

  for (let i = 0; i < 8; i++) {
    const pin = new THREE.Mesh(pinGeom, goldMat);
    pin.rotation.y = -Math.PI / 2;
    pin.position.set(pinPX, -(P_H - 0.022) / 2 + 0.004, -span / 2 + i * (span / 7));
    port.add(pin);
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


  const lightningPort = makeLightningPort(shadows, edgeMaterial);
  lightningPort.position.y = 0.48;
  root.add(lightningPort);

  const microUsbPort = makeMicroUsbPort(shadows, edgeMaterial);
  microUsbPort.position.y = 0.33;
  root.add(microUsbPort);

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
