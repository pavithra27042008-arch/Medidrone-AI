import * as THREE from 'three';

export interface Drone3DInstance {
  group: THREE.Group;
  propellers: THREE.Group[];
  cargoDoor: THREE.Group;
  avionicsCover: THREE.Group;
  batteryPack: THREE.Group;
  armsGroup: THREE.Group;
  landingSkidGroup: THREE.Group;
  sensorTurret: THREE.Group;
  cargoBayInterior: THREE.Group;
  navLights: { mesh: THREE.Mesh; light: THREE.PointLight; baseIntensity: number }[];
  update: (delta: number, rotorSpeed: number, explodedFactor: number, cargoDoorFactor: number) => void;
  setColorScheme: (scheme: 'ARCTIC_WHITE' | 'NAVY_RESCUE' | 'STEALTH_CARBON' | 'HUMANITARIAN_RED') => void;
  dispose: () => void;
}

// Procedural texture for medical cross decal
function createMedicalCrossTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Background circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.fill();

  // Outer border
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#0d9488'; // Medical teal
  ctx.stroke();

  // Medical Cross
  ctx.fillStyle = '#0d9488';
  const armW = 90;
  const armL = 300;
  // Vertical arm
  ctx.fillRect(256 - armW / 2, 256 - armL / 2, armW, armL);
  // Horizontal arm
  ctx.fillRect(256 - armL / 2, 256 - armW / 2, armL, armW);

  // Text around badge
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MEDIC CARGO', 256, 90);
  ctx.font = 'bold 24px monospace';
  ctx.fillText('CRYO-BIO-POD', 256, 440);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural carbon weave normal / bump texture
function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#0f172a';
  const size = 16;
  for (let x = 0; x < 128; x += size * 2) {
    for (let y = 0; y < 128; y += size * 2) {
      ctx.fillRect(x, y, size, size);
      ctx.fillRect(x + size, y + size, size, size);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

export function buildRealisticDroneModel(): Drone3DInstance {
  const root = new THREE.Group();
  root.name = 'MediDroneRoot';

  const carbonTex = createCarbonFiberTexture();
  const medicalCrossTex = createMedicalCrossTexture();

  // Materials definitions
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.15,
  });

  const darkCarbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.4,
    bumpMap: carbonTex,
    bumpScale: 0.02,
  });

  const motorMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.2,
    metalness: 0.85,
  });

  const goldAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.7,
  });

  const rotorBladeMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.15,
    metalness: 0.5,
  });

  const tealGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0x14b8a6,
    emissive: 0x0d9488,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  const glassCameraMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x111827,
    roughness: 0.1,
    metalness: 0.9,
    transmission: 0.6,
    ior: 1.5,
  });

  // 1. Central Chassis Group
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'ChassisGroup';

  // Aerodynamic main fuselage hull (compound geometry)
  const hullGeo = new THREE.CylinderGeometry(0.75, 0.9, 0.45, 8);
  hullGeo.rotateY(Math.PI / 8);
  const hullMesh = new THREE.Mesh(hullGeo, bodyMaterial);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  chassisGroup.add(hullMesh);

  // Lower chassis protective skid plate
  const lowerPlateGeo = new THREE.CylinderGeometry(0.85, 0.7, 0.15, 8);
  lowerPlateGeo.rotateY(Math.PI / 8);
  const lowerPlate = new THREE.Mesh(lowerPlateGeo, darkCarbonMaterial);
  lowerPlate.position.y = -0.28;
  lowerPlate.castShadow = true;
  chassisGroup.add(lowerPlate);

  // 2. Top Avionics & GPS Cover (Lifts in exploded view)
  const avionicsCover = new THREE.Group();
  avionicsCover.name = 'AvionicsCover';
  const domeGeo = new THREE.SphereGeometry(0.72, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  domeGeo.scale(1, 0.45, 1);
  const domeMesh = new THREE.Mesh(domeGeo, bodyMaterial);
  domeMesh.position.y = 0.22;
  domeMesh.castShadow = true;
  avionicsCover.add(domeMesh);

  // GPS / RTK Antenna Mast
  const rtkMastGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8);
  const rtkMast = new THREE.Mesh(rtkMastGeo, darkCarbonMaterial);
  rtkMast.position.set(0.3, 0.45, -0.2);
  const rtkHeadGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.06, 16);
  const rtkHead = new THREE.Mesh(rtkHeadGeo, tealGlowMaterial);
  rtkHead.position.y = 0.12;
  rtkMast.add(rtkHead);
  avionicsCover.add(rtkMast);
  chassisGroup.add(avionicsCover);

  // 3. Central Modular Battery Pack (slides backward in exploded view)
  const batteryPack = new THREE.Group();
  batteryPack.name = 'BatteryPack';
  const batteryGeo = new THREE.BoxGeometry(0.65, 0.25, 0.85);
  const batteryMesh = new THREE.Mesh(batteryGeo, darkCarbonMaterial);
  batteryMesh.position.set(0, 0.02, -0.05);
  batteryMesh.castShadow = true;
  batteryPack.add(batteryMesh);

  // Gold contacts & handle
  const handleGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 16, Math.PI);
  const handleMesh = new THREE.Mesh(handleGeo, goldAccentMaterial);
  handleMesh.position.set(0, 0.05, -0.48);
  handleMesh.rotateX(Math.PI / 2);
  batteryPack.add(handleMesh);
  chassisGroup.add(batteryPack);

  // 4. Hexacopter Carbon Fiber Arms & Rotors
  const armsGroup = new THREE.Group();
  armsGroup.name = 'ArmsGroup';

  const armCount = 6;
  const armLength = 1.95;
  const propellers: THREE.Group[] = [];
  const navLights: { mesh: THREE.Mesh; light: THREE.PointLight; baseIntensity: number }[] = [];

  for (let i = 0; i < armCount; i++) {
    const angle = (i * Math.PI * 2) / armCount;
    const armAssembly = new THREE.Group();
    armAssembly.rotation.y = angle;

    // Carbon boom tube
    const boomGeo = new THREE.CylinderGeometry(0.045, 0.05, armLength, 12);
    boomGeo.rotateZ(Math.PI / 2);
    const boomMesh = new THREE.Mesh(boomGeo, darkCarbonMaterial);
    boomMesh.position.set(armLength / 2 + 0.35, 0.08, 0);
    boomMesh.castShadow = true;
    armAssembly.add(boomMesh);

    // Boom clamp on chassis
    const clampGeo = new THREE.BoxGeometry(0.18, 0.16, 0.18);
    const clampMesh = new THREE.Mesh(clampGeo, motorMetalMaterial);
    clampMesh.position.set(0.6, 0.08, 0);
    armAssembly.add(clampMesh);

    // Motor Mount / Nacelle at arm tip
    const motorTipX = armLength + 0.35;
    const motorMount = new THREE.Group();
    motorMount.position.set(motorTipX, 0.12, 0);

    // Brushless Motor Stator/Rotor Housing
    const motorGeo = new THREE.CylinderGeometry(0.15, 0.14, 0.22, 16);
    const motorMesh = new THREE.Mesh(motorGeo, motorMetalMaterial);
    motorMesh.castShadow = true;
    motorMount.add(motorMesh);

    // Gold motor cooling vents ring
    const ventRingGeo = new THREE.TorusGeometry(0.14, 0.02, 8, 16);
    ventRingGeo.rotateX(Math.PI / 2);
    const ventRing = new THREE.Mesh(ventRingGeo, goldAccentMaterial);
    ventRing.position.y = 0.08;
    motorMount.add(ventRing);

    // Propeller Hub & Dual Blades
    const propHub = new THREE.Group();
    propHub.position.y = 0.16;

    // Spinner cap
    const spinnerGeo = new THREE.ConeGeometry(0.08, 0.12, 16);
    const spinner = new THREE.Mesh(spinnerGeo, motorMetalMaterial);
    spinner.position.y = 0.04;
    propHub.add(spinner);

    // Blade 1 & Blade 2 (aerodynamic twisted carbon)
    const bladeGeo = new THREE.BoxGeometry(0.95, 0.015, 0.12);
    const blade1 = new THREE.Mesh(bladeGeo, rotorBladeMaterial);
    blade1.position.x = 0.45;
    blade1.rotation.x = 0.15; // aerodynamic pitch
    blade1.castShadow = true;
    propHub.add(blade1);

    const blade2 = new THREE.Mesh(bladeGeo, rotorBladeMaterial);
    blade2.position.x = -0.45;
    blade2.rotation.x = -0.15;
    blade2.castShadow = true;
    propHub.add(blade2);

    motorMount.add(propHub);
    propellers.push(propHub);

    // Navigation LEDs
    // Arm 0/1 front/right: Green; Arm 4/5 left: Red; Rear arm 3: White
    let lightColor = 0x14b8a6;
    if (i === 1 || i === 2) lightColor = 0x22c55e; // Starboard Green
    else if (i === 4 || i === 5) lightColor = 0xef4444; // Port Red
    else lightColor = 0xffffff; // Tail White

    const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: lightColor });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0, -0.1, 0);
    motorMount.add(ledMesh);

    const pointLight = new THREE.PointLight(lightColor, 0.6, 2.5);
    pointLight.position.set(0, -0.1, 0);
    motorMount.add(pointLight);

    navLights.push({ mesh: ledMesh, light: pointLight, baseIntensity: 0.6 });
    armAssembly.add(motorMount);
    armsGroup.add(armAssembly);
  }
  chassisGroup.add(armsGroup);

  // 5. Medical Cargo Compartment Pod (Underslung Bay with Biometric Seal)
  const cargoBayInterior = new THREE.Group();
  cargoBayInterior.name = 'CargoBayInterior';
  cargoBayInterior.position.y = -0.45;

  // Insulated medical cryo capsule body
  const cargoPodGeo = new THREE.BoxGeometry(0.9, 0.45, 0.95);
  const cargoPodMesh = new THREE.Mesh(cargoPodGeo, bodyMaterial);
  cargoPodMesh.castShadow = true;
  cargoBayInterior.add(cargoPodMesh);

  // Medical Cross Decal on Left & Right sides of pod
  const decalGeo = new THREE.PlaneGeometry(0.38, 0.38);
  const decalMat = new THREE.MeshStandardMaterial({
    map: medicalCrossTex,
    transparent: true,
    roughness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });

  const decalRight = new THREE.Mesh(decalGeo, decalMat);
  decalRight.position.set(0.451, 0, 0);
  decalRight.rotation.y = Math.PI / 2;
  cargoBayInterior.add(decalRight);

  const decalLeft = new THREE.Mesh(decalGeo, decalMat);
  decalLeft.position.set(-0.451, 0, 0);
  decalLeft.rotation.y = -Math.PI / 2;
  cargoBayInterior.add(decalLeft);

  // Internal biological sample racks (visible when door opens)
  const internalVialGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8);
  const bloodVialMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.1, metalness: 0.1 });
  for (let vx = -0.15; vx <= 0.15; vx += 0.15) {
    for (let vz = -0.15; vz <= 0.15; vz += 0.15) {
      const vial = new THREE.Mesh(internalVialGeo, bloodVialMat);
      vial.position.set(vx, 0.05, vz);
      cargoBayInterior.add(vial);
    }
  }

  // Active Peltier thermoelectric heat-sink fins underneath
  const heatsinkGeo = new THREE.BoxGeometry(0.6, 0.06, 0.6);
  const heatsinkMesh = new THREE.Mesh(heatsinkGeo, motorMetalMaterial);
  heatsinkMesh.position.y = -0.25;
  cargoBayInterior.add(heatsinkMesh);

  // Cargo Hatch Door (Swings down or drops for delivery)
  const cargoDoor = new THREE.Group();
  cargoDoor.name = 'CargoDoor';
  cargoDoor.position.set(0, -0.22, 0.48); // Pivot point at bottom front
  const doorGeo = new THREE.BoxGeometry(0.86, 0.42, 0.04);
  doorGeo.translate(0, 0.21, 0); // shift geometry relative to hinge
  const doorMesh = new THREE.Mesh(doorGeo, darkCarbonMaterial);
  doorMesh.castShadow = true;
  cargoDoor.add(doorMesh);

  // Biometric fingerprint/RFID lock badge on door
  const lockGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
  lockGeo.rotateX(Math.PI / 2);
  const lockMesh = new THREE.Mesh(lockGeo, tealGlowMaterial);
  lockMesh.position.set(0, 0.21, 0.025);
  cargoDoor.add(lockMesh);

  cargoBayInterior.add(cargoDoor);
  chassisGroup.add(cargoBayInterior);

  // 6. Forward Gimbal Camera & Dual LiDAR obstacle scanner
  const sensorTurret = new THREE.Group();
  sensorTurret.name = 'SensorTurret';
  sensorTurret.position.set(0, -0.18, 0.82);

  // Gimbal fork bracket
  const bracketGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12);
  const bracketMesh = new THREE.Mesh(bracketGeo, motorMetalMaterial);
  sensorTurret.add(bracketMesh);

  // Spherical camera sphere
  const cameraSphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const cameraSphere = new THREE.Mesh(cameraSphereGeo, darkCarbonMaterial);
  cameraSphere.position.y = -0.12;
  cameraSphere.castShadow = true;

  // Front camera optical lens
  const lensGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.04, 16);
  lensGeo.rotateX(Math.PI / 2);
  const lensMesh = new THREE.Mesh(lensGeo, glassCameraMaterial);
  lensMesh.position.set(0, 0, 0.11);
  cameraSphere.add(lensMesh);

  sensorTurret.add(cameraSphere);

  // Dual LiDAR Obstacle Detectors on left & right
  const lidarGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12);
  lidarGeo.rotateX(Math.PI / 2);
  const lidarLeft = new THREE.Mesh(lidarGeo, darkCarbonMaterial);
  lidarLeft.position.set(-0.35, 0, 0.7);
  const lidarEmitter = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), tealGlowMaterial);
  lidarEmitter.position.z = 0.051;
  lidarLeft.add(lidarEmitter);
  chassisGroup.add(lidarLeft);

  const lidarRight = lidarLeft.clone();
  lidarRight.position.x = 0.35;
  chassisGroup.add(lidarRight);
  chassisGroup.add(sensorTurret);

  // 7. Carbon Landing Skids & Struts
  const landingSkidGroup = new THREE.Group();
  landingSkidGroup.name = 'LandingSkids';

  // Left and Right Skids
  [-0.65, 0.65].forEach(xOffset => {
    const skidAssembly = new THREE.Group();
    skidAssembly.position.x = xOffset;

    // Longitudinal rail (pipe)
    const railGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8);
    railGeo.rotateX(Math.PI / 2);
    const railMesh = new THREE.Mesh(railGeo, darkCarbonMaterial);
    railMesh.position.y = -0.85;
    railMesh.castShadow = true;
    skidAssembly.add(railMesh);

    // Front curved ski tip
    const tipGeo = new THREE.TorusGeometry(0.18, 0.035, 8, 12, Math.PI / 2);
    tipGeo.rotateY(Math.PI / 2);
    const tipMesh = new THREE.Mesh(tipGeo, darkCarbonMaterial);
    tipMesh.position.set(0, -0.72, 1.1);
    skidAssembly.add(tipMesh);

    // Angled support struts (front and back)
    [-0.55, 0.55].forEach(zOffset => {
      const strutGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.7, 8);
      const strutMesh = new THREE.Mesh(strutGeo, motorMetalMaterial);
      strutMesh.position.set(xOffset > 0 ? -0.1 : 0.1, -0.55, zOffset);
      strutMesh.rotation.z = xOffset > 0 ? -0.25 : 0.25;
      strutMesh.castShadow = true;
      skidAssembly.add(strutMesh);
    });

    landingSkidGroup.add(skidAssembly);
  });
  chassisGroup.add(landingSkidGroup);

  // Soft Contact Shadow Plane Grounding (beneath drone)
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = 256;
  contactCanvas.height = 256;
  const cctx = contactCanvas.getContext('2d')!;
  const grad = cctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, 256, 256);

  const shadowTex = new THREE.CanvasTexture(contactCanvas);
  const contactPlaneGeo = new THREE.PlaneGeometry(4.5, 4.5);
  const contactMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
  });
  const contactShadow = new THREE.Mesh(contactPlaneGeo, contactMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -0.88;
  root.add(contactShadow);

  root.add(chassisGroup);

  // Position entire root so skids sit flush at Y=0
  chassisGroup.position.y = 0.86;

  let blinkTimer = 0;

  return {
    group: root,
    propellers,
    cargoDoor,
    avionicsCover,
    batteryPack,
    armsGroup,
    landingSkidGroup,
    sensorTurret,
    cargoBayInterior,
    navLights,
    update(delta: number, rotorSpeed: number, explodedFactor: number, cargoDoorFactor: number) {
      // 1. Rotate Propellers (alternating CW / CCW for torque balance)
      const bladeSpeed = rotorSpeed * 28.0;
      propellers.forEach((prop, idx) => {
        const dir = idx % 2 === 0 ? 1 : -1;
        prop.rotation.y += bladeSpeed * delta * dir;
      });

      // 2. Exploded Component View interpolation
      // Arms expand radially
      armsGroup.position.set(0, explodedFactor * 0.25, 0);
      armsGroup.scale.set(1 + explodedFactor * 0.35, 1, 1 + explodedFactor * 0.35);

      // Avionics cover lifts vertically
      avionicsCover.position.y = explodedFactor * 0.75;

      // Battery pack slides backward
      batteryPack.position.z = -explodedFactor * 0.85;

      // Cargo bay drops downward
      cargoBayInterior.position.y = -0.45 - explodedFactor * 0.65;

      // Landing skids lower slightly
      landingSkidGroup.position.y = -explodedFactor * 0.4;

      // 3. Cargo Hatch Door opening animation (swings downward 110 degrees)
      cargoDoor.rotation.x = cargoDoorFactor * (Math.PI * 0.65);

      // 4. Subtle Gimbal idle tracking
      sensorTurret.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
      sensorTurret.rotation.x = Math.sin(Date.now() * 0.0015) * 0.08;

      // 5. Navigation Strobe flash
      blinkTimer += delta;
      if (blinkTimer > 0.8) {
        blinkTimer = 0;
        navLights.forEach((item, idx) => {
          const flash = idx === 3 ? 1.8 : 1.2;
          item.light.intensity = item.baseIntensity * flash;
          setTimeout(() => {
            item.light.intensity = item.baseIntensity;
          }, 80);
        });
      }
    },
    setColorScheme(scheme) {
      if (scheme === 'ARCTIC_WHITE') {
        bodyMaterial.color.setHex(0xf8fafc);
        darkCarbonMaterial.color.setHex(0x1e293b);
      } else if (scheme === 'NAVY_RESCUE') {
        bodyMaterial.color.setHex(0x0f2942);
        darkCarbonMaterial.color.setHex(0x0b1726);
      } else if (scheme === 'STEALTH_CARBON') {
        bodyMaterial.color.setHex(0x18181b);
        darkCarbonMaterial.color.setHex(0x09090b);
      } else if (scheme === 'HUMANITARIAN_RED') {
        bodyMaterial.color.setHex(0xdc2626);
        darkCarbonMaterial.color.setHex(0x1e293b);
      }
    },
    dispose() {
      carbonTex.dispose();
      medicalCrossTex.dispose();
      shadowTex.dispose();
      root.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    },
  };
}
