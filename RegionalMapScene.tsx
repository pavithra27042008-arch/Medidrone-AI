import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HospitalNode, MedicalMission } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  Radio, 
  AlertTriangle, 
  Maximize2, 
  Crosshair, 
  Layers, 
  Wind 
} from 'lucide-react';

interface RegionalMapSceneProps {
  hospitals: HospitalNode[];
  activeMission: MedicalMission | null;
  onSelectHospital: (hospital: HospitalNode) => void;
  selectedHospitalId?: string;
  isSimulatingObstacle?: boolean;
}

export const RegionalMapScene: React.FC<RegionalMapSceneProps> = ({
  hospitals,
  activeMission,
  onSelectHospital,
  selectedHospitalId,
  isSimulatingObstacle = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const droneMeshRef = useRef<THREE.Group | null>(null);
  const dronePropellersRef = useRef<THREE.Group[]>([]);
  const radarConeRef = useRef<THREE.Mesh | null>(null);
  const flightPathTubeRef = useRef<THREE.Mesh | null>(null);
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const obstaclesGroupRef = useRef<THREE.Group | null>(null);

  const [cameraMode, setCameraMode] = useState<'FREE_TACTICAL' | 'CHASE_CAM' | 'TOP_DOWN'>('FREE_TACTICAL');
  const [hoveredFacility, setHoveredFacility] = useState<HospitalNode | null>(null);
  const [obstacleWarning, setObstacleWarning] = useState<boolean>(false);

  // Pre-allocated math objects to avoid garbage collection stutter in render loop
  const _vecA = useRef(new THREE.Vector3());
  const _vecB = useRef(new THREE.Vector3());
  const _tangent = useRef(new THREE.Vector3());

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040914); // Deep night airspace navy
    scene.fog = new THREE.FogExp2(0x040914, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 300);
    camera.position.set(0, 36, 48);
    cameraRef.current = camera;

    // 2. High-Performance PBR Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Studio Environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x020617, 1.2);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xe0f2fe, 2.2);
    sun.position.set(25, 45, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    scene.add(sun);

    const blueFill = new THREE.DirectionalLight(0x0d9488, 1.4);
    blueFill.position.set(-30, 20, -25);
    scene.add(blueFill);

    // 5. Procedural 3D Terrain & Digital Twin Landscape
    const terrainSize = 90;
    const terrainSegments = 64;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    terrainGeo.rotateX(-Math.PI / 2);

    // Deform terrain with mountains on north-east and valley on south-west
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      // Mountain ridge formula
      let h = Math.sin(vx * 0.08) * Math.cos(vz * 0.08) * 1.5;
      if (vx > 5 && vz > 5) {
        h += Math.sin((vx - 5) * 0.15) * Math.sin((vz - 5) * 0.15) * 4.8;
      }
      if (vx < -5 && vz > 5) {
        h -= 0.6; // River valley
      }
      posAttr.setY(i, Math.max(-0.8, h));
    }
    terrainGeo.computeVertexNormals();

    // Procedural terrain grid wire texture
    const gridTexCanvas = document.createElement('canvas');
    gridTexCanvas.width = 512;
    gridTexCanvas.height = 512;
    const gctx = gridTexCanvas.getContext('2d')!;
    gctx.fillStyle = '#091322';
    gctx.fillRect(0, 0, 512, 512);
    gctx.strokeStyle = '#0f2942';
    gctx.lineWidth = 2;
    for (let p = 0; p <= 512; p += 32) {
      gctx.beginPath();
      gctx.moveTo(p, 0);
      gctx.lineTo(p, 512);
      gctx.stroke();
      gctx.beginPath();
      gctx.moveTo(0, p);
      gctx.lineTo(512, p);
      gctx.stroke();
    }
    const terrainTex = new THREE.CanvasTexture(gridTexCanvas);
    terrainTex.wrapS = THREE.RepeatWrapping;
    terrainTex.wrapT = THREE.RepeatWrapping;
    terrainTex.repeat.set(12, 12);

    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTex,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Safe Airspace Geofence Boundary Rings
    const geofenceGeo = new THREE.RingGeometry(38, 38.4, 64);
    geofenceGeo.rotateX(-Math.PI / 2);
    const geofenceMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const geofenceRing = new THREE.Mesh(geofenceGeo, geofenceMat);
    geofenceRing.position.y = 0.1;
    scene.add(geofenceRing);

    // 6. Build Hospital Nodes & Helipads
    const hospitalObjects: { mesh: THREE.Group; node: HospitalNode }[] = [];

    hospitals.forEach(hosp => {
      const hospGroup = new THREE.Group();
      hospGroup.position.set(hosp.coordinates.x, hosp.coordinates.y, hosp.coordinates.z);

      // Hospital Building Tower
      const bHeight = hosp.type === 'TRAUMA_CENTER' ? 3.5 : hosp.type === 'CHILDRENS_RESEARCH' ? 3.0 : 2.2;
      const bColor = hosp.type === 'TRAUMA_CENTER' ? 0x0f766e : hosp.type === 'BLOOD_BANK' ? 0x991b1b : 0x0369a1;

      const towerGeo = new THREE.BoxGeometry(2.4, bHeight, 2.4);
      const towerMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.3, metalness: 0.4 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.y = bHeight / 2;
      tower.castShadow = true;
      tower.receiveShadow = true;
      hospGroup.add(tower);

      // Helipad Roof Platform
      const padGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.15, 24);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = bHeight + 0.08;
      hospGroup.add(pad);

      // Helipad 'H' Decal Ring
      const hRingGeo = new THREE.RingGeometry(0.85, 1.05, 32);
      hRingGeo.rotateX(-Math.PI / 2);
      const hRingMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6, side: THREE.DoubleSide });
      const hRing = new THREE.Mesh(hRingGeo, hRingMat);
      hRing.position.y = bHeight + 0.17;
      hospGroup.add(hRing);

      // Glowing Landing Beacon Light
      const beaconLight = new THREE.PointLight(0x14b8a6, 1.2, 8);
      beaconLight.position.set(0, bHeight + 0.6, 0);
      hospGroup.add(beaconLight);

      // Vertical Marker Pillar Beam
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 6, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.45 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = bHeight + 3;
      hospGroup.add(beam);

      scene.add(hospGroup);
      hospitalObjects.push({ mesh: hospGroup, node: hosp });
    });

    // 7. Obstacle Transmission Towers / Hazard Zones
    const obstaclesGroup = new THREE.Group();
    obstaclesGroupRef.current = obstaclesGroup;

    const obstaclePositions = [
      { x: 4.5, y: 1.0, z: -2.0, h: 8.5, label: 'Telecom Tower Echo' },
      { x: 12.0, y: 2.5, z: 8.0, h: 10.0, label: 'Highland Microwave Mast' },
    ];

    obstaclePositions.forEach(obs => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(obs.x, obs.y, obs.z);

      const latticeGeo = new THREE.CylinderGeometry(0.15, 0.8, obs.h, 4);
      const latticeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.8, wireframe: true });
      const lattice = new THREE.Mesh(latticeGeo, latticeMat);
      lattice.position.y = obs.h / 2;
      lattice.castShadow = true;
      towerGroup.add(lattice);

      // Red Flashing Obstacle Beacon
      const redLight = new THREE.PointLight(0xef4444, 1.8, 12);
      redLight.position.y = obs.h + 0.2;
      towerGroup.add(redLight);

      const redBulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redBulb.position.y = obs.h + 0.2;
      towerGroup.add(redBulb);

      // Transparent Obstacle Proximity Warning Bubble
      const warnGeo = new THREE.CylinderGeometry(2.2, 2.2, obs.h + 1, 16);
      const warnMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.15, wireframe: true });
      const warnCyl = new THREE.Mesh(warnGeo, warnMat);
      warnCyl.position.y = (obs.h + 1) / 2;
      towerGroup.add(warnCyl);

      obstaclesGroup.add(towerGroup);
    });
    scene.add(obstaclesGroup);

    // 8. Flight Trajectory Curve & Tube
    const waypoints = activeMission?.routeWaypoints || [
      { x: -14, y: 1.2, z: -10 },
      { x: -7, y: 7.5, z: -4 },
      { x: 3, y: 11.5, z: 2 },
      { x: 10, y: 10.0, z: 9 },
      { x: 18, y: 3.2, z: 16 },
    ];

    const vPoints = waypoints.map(w => new THREE.Vector3(w.x, w.y, w.z));
    const curve = new THREE.CatmullRomCurve3(vPoints);
    curveRef.current = curve;

    // Glowing 3D Trajectory Tube
    const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.14, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.7,
      wireframe: false,
    });
    const flightTube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(flightTube);
    flightPathTubeRef.current = flightTube;

    // 9. Scaled Flying Medical Drone Representative in Digital Twin
    const flightDroneGroup = new THREE.Group();
    flightDroneGroup.name = 'FlightDroneDigitalTwin';

    // Drone mini fuselage
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.25, 0.9);
    const bodyM = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.4 });
    const miniBody = new THREE.Mesh(bodyGeo, bodyM);
    miniBody.castShadow = true;
    flightDroneGroup.add(miniBody);

    // Mini Medical Cross on top
    const crossTopGeo = new THREE.BoxGeometry(0.12, 0.02, 0.45);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0x0d9488 });
    const c1 = new THREE.Mesh(crossTopGeo, crossMat);
    c1.position.y = 0.13;
    flightDroneGroup.add(c1);
    const crossTopGeo2 = new THREE.BoxGeometry(0.45, 0.02, 0.12);
    const c2 = new THREE.Mesh(crossTopGeo2, crossMat);
    c2.position.y = 0.13;
    flightDroneGroup.add(c2);

    // Rotors
    const miniProps: THREE.Group[] = [];
    const rotorOffsets = [
      [-0.6, 0.15, -0.6],
      [0.6, 0.15, -0.6],
      [-0.7, 0.15, 0],
      [0.7, 0.15, 0],
      [-0.6, 0.15, 0.6],
      [0.6, 0.15, 0.6],
    ];

    rotorOffsets.forEach(pos => {
      const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
      armGeo.rotateZ(Math.PI / 2);
      const arm = new THREE.Mesh(armGeo, new THREE.MeshBasicMaterial({ color: 0x1e293b }));
      arm.position.set(pos[0] * 0.5, 0, pos[2] * 0.5);
      flightDroneGroup.add(arm);

      const pGroup = new THREE.Group();
      pGroup.position.set(pos[0], pos[1], pos[2]);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.06), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
      pGroup.add(blade);
      flightDroneGroup.add(pGroup);
      miniProps.push(pGroup);
    });
    dronePropellersRef.current = miniProps;

    // Forward LiDAR Obstacle Awareness Radar Projection Cone
    const coneGeo = new THREE.ConeGeometry(1.6, 4.5, 16, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    coneGeo.translate(0, 0, 2.25);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const radarCone = new THREE.Mesh(coneGeo, coneMat);
    radarCone.position.set(0, -0.05, 0.3);
    flightDroneGroup.add(radarCone);
    radarConeRef.current = radarCone;

    // Flight Strobe Beacon
    const droneBeacon = new THREE.PointLight(0x38bdf8, 2.0, 10);
    droneBeacon.position.set(0, 0.3, 0);
    flightDroneGroup.add(droneBeacon);

    scene.add(flightDroneGroup);
    droneMeshRef.current = flightDroneGroup;

    // Set initial drone position along curve
    const initialT = (activeMission?.progressPct || 42) / 100;
    curve.getPointAt(initialT, flightDroneGroup.position);

    // 10. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 120;
    controls.target.set(0, 4, 0);
    controlsRef.current = controls;

    // 11. Raycaster for clicking hospital nodes
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hospitalObjects.map(h => h.mesh), true);

      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && parent.parent !== scene) {
          parent = parent.parent;
        }
        const found = hospitalObjects.find(h => h.mesh === parent);
        if (found) {
          soundFx.playClick(1050);
          onSelectHospital(found.node);
        }
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hospitalObjects.map(h => h.mesh), true);

      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && parent.parent !== scene) {
          parent = parent.parent;
        }
        const found = hospitalObjects.find(h => h.mesh === parent);
        setHoveredFacility(found ? found.node : null);
      } else {
        setHoveredFacility(null);
      }
    };

    renderer.domElement.addEventListener('click', handlePointerClick);
    renderer.domElement.addEventListener('mousemove', handlePointerMove);

    // 12. Main Animation Loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Spin digital twin rotors
      miniProps.forEach(p => {
        p.rotation.y += 24.0 * delta;
      });

      // Pulse Radar Cone
      if (radarConeRef.current) {
        const pulse = 1.0 + Math.sin(time * 6.0) * 0.12;
        radarConeRef.current.scale.set(pulse, pulse, 1.0);
      }

      // Live animated flight motion along spline curve
      if (curveRef.current && flightDroneGroup) {
        // Continuous smooth simulated movement
        let progress = ((activeMission?.progressPct || 42) + (time * 1.5)) % 100;
        if (activeMission?.status === 'DELIVERED') progress = 100;
        const t = Math.min(Math.max(progress / 100, 0.001), 0.999);

        curveRef.current.getPointAt(t, _vecA.current);
        flightDroneGroup.position.copy(_vecA.current);

        // Calculate heading tangent
        curveRef.current.getTangentAt(t, _tangent.current);
        _vecB.current.addVectors(_vecA.current, _tangent.current);
        flightDroneGroup.lookAt(_vecB.current);

        // Obstacle Proximity Check
        const distToTower = flightDroneGroup.position.distanceTo(new THREE.Vector3(4.5, 5.0, -2.0));
        const isNear = distToTower < 8.0 || isSimulatingObstacle;
        setObstacleWarning(isNear);

        if (radarConeRef.current) {
          const coneMat = radarConeRef.current.material as THREE.MeshBasicMaterial;
          coneMat.color.setHex(isNear ? 0xef4444 : 0x14b8a6);
        }

        // Camera Follow Modes
        if (cameraMode === 'CHASE_CAM' && cameraRef.current && controlsRef.current) {
          const offset = _tangent.current.clone().normalize().multiplyScalar(-6.5);
          offset.y += 2.8;
          const targetCamPos = flightDroneGroup.position.clone().add(offset);
          cameraRef.current.position.lerp(targetCamPos, 0.08);
          controlsRef.current.target.lerp(flightDroneGroup.position, 0.1);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handlePointerClick);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      cancelAnimationFrame(animId);
      controls.dispose();
      terrainTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [hospitals, activeMission, isSimulatingObstacle, cameraMode, onSelectHospital]);

  // Camera presets
  const switchCameraMode = (mode: 'FREE_TACTICAL' | 'CHASE_CAM' | 'TOP_DOWN') => {
    soundFx.playClick(960);
    setCameraMode(mode);
    if (!cameraRef.current || !controlsRef.current) return;

    if (mode === 'FREE_TACTICAL') {
      cameraRef.current.position.set(0, 36, 48);
      controlsRef.current.target.set(0, 4, 0);
    } else if (mode === 'TOP_DOWN') {
      cameraRef.current.position.set(0, 68, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Top Left: Regional Airspace HUD */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-xl p-3 shadow-xl max-w-sm pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider font-tech uppercase">
              Sector Alpha Airspace Radar
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
            BVLOS APPROVED
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Active Corridor:</span>
            <span className="text-teal-300 font-semibold">Corridor Echo-9 [TRAUMA-NET]</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Facilities Online:</span>
            <span className="text-slate-200">{hospitals.length} Helipads Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Flight Rules:</span>
            <span className="text-slate-200">Autonomous RTK-GNSS + LiDAR Sweep</span>
          </div>
        </div>

        {/* Dynamic Obstacle Notification Banner */}
        {obstacleWarning && (
          <div className="mt-2.5 p-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-[11px] flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <strong className="block text-amber-300">OBSTACLE AWARENESS RADAR</strong>
              Telecom tower in proximity. Automated 15m altitude climb engaged.
            </div>
          </div>
        )}
      </div>

      {/* Top Right: Camera Mode Switcher */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 shadow-lg">
          <button
            onClick={() => switchCameraMode('FREE_TACTICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              cameraMode === 'FREE_TACTICAL'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Tactical Orbit
          </button>
          <button
            onClick={() => switchCameraMode('CHASE_CAM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              cameraMode === 'CHASE_CAM'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Chase Cam
          </button>
          <button
            onClick={() => switchCameraMode('TOP_DOWN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
              cameraMode === 'TOP_DOWN'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Plan View
          </button>
        </div>
      </div>

      {/* Hovered Facility Tooltip Card */}
      {hoveredFacility && (
        <div className="absolute bottom-6 left-6 z-10 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-teal-500/50 rounded-xl p-3 shadow-2xl text-slate-200 max-w-xs animate-in fade-in">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-teal-400" />
            <h5 className="font-semibold text-xs text-teal-200">{hoveredFacility.name}</h5>
          </div>
          <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
            <div>Type: {hoveredFacility.type.replace(/_/g, ' ')}</div>
            <div>Helipad Elevation: {hoveredFacility.helipadElevationM}m AGL</div>
            <div>Landing Pads: {hoveredFacility.availableLandingPads} Available</div>
            <div>Peltier Cryo Recharging: {hoveredFacility.hasPeltierRecharge ? 'Supported' : 'Standard Pad'}</div>
          </div>
          <div className="text-[10px] text-teal-400 mt-1 font-mono">Click to view or dispatch</div>
        </div>
      )}

      {/* Bottom Center: Quick Hospital Jump Buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-full px-4 py-2 flex items-center gap-2 overflow-x-auto max-w-[90vw] shadow-xl pointer-events-auto">
        <span className="text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-teal-400" /> Facilities:
        </span>
        {hospitals.map(h => (
          <button
            key={h.id}
            onClick={() => {
              soundFx.playClick();
              onSelectHospital(h);
              if (cameraRef.current && controlsRef.current) {
                controlsRef.current.target.set(h.coordinates.x, h.coordinates.y + 2, h.coordinates.z);
                cameraRef.current.position.set(h.coordinates.x + 8, h.coordinates.y + 12, h.coordinates.z + 12);
              }
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-all border ${
              selectedHospitalId === h.id
                ? 'bg-teal-500/20 text-teal-200 border-teal-500/60'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {h.shortName}
          </button>
        ))}
      </div>
    </div>
  );
};
