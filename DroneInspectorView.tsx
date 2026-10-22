import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildRealisticDroneModel, Drone3DInstance } from './DroneModel';
import { soundFx } from '../../utils/audio';
import { 
  Camera, 
  RotateCw, 
  Sliders, 
  Layers, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  Package, 
  Zap, 
  ShieldCheck, 
  Maximize2 
} from 'lucide-react';

interface DroneInspectorProps {
  initialRotorSpeed?: number;
  onCargoToggle?: (isOpen: boolean) => void;
}

export const DroneInspectorView: React.FC<DroneInspectorProps> = ({ 
  initialRotorSpeed = 0.5 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const droneInstanceRef = useRef<Drone3DInstance | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // UI state
  const [rotorSpeed, setRotorSpeed] = useState<number>(initialRotorSpeed);
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [isCargoOpen, setIsCargoOpen] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<'ARCTIC_WHITE' | 'NAVY_RESCUE' | 'STEALTH_CARBON' | 'HUMANITARIAN_RED'>('ARCTIC_WHITE');
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('All Systems Nominal');

  // Animation targets for damping
  const targetExplodedRef = useRef<number>(0);
  const currentExplodedRef = useRef<number>(0);
  const targetCargoRef = useRef<number>(0);
  const currentCargoRef = useRef<number>(0);

  targetExplodedRef.current = explodedFactor;
  targetCargoRef.current = isCargoOpen ? 1 : 0;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060d19); // Deep dark oceanic navy
    scene.fog = new THREE.FogExp2(0x060d19, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(3.8, 2.4, 4.6);
    cameraRef.current = camera;

    // 2. Renderer with PBR & ACES Filmic
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map (Mandatory per Three.js guidelines)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig (3-Point Studio + Ground grid)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x091e3a, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(5, 8, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 2.0); // Teal medical rim
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // Studio Circular Technical Floor Grid
    const gridHelper = new THREE.GridHelper(14, 28, 0x0d9488, 0x1e293b);
    gridHelper.position.y = -0.02;
    scene.add(gridHelper);

    // Tech concentric rings on floor
    const ringGeo = new THREE.RingGeometry(2.8, 2.84, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x0d9488, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -0.01;
    scene.add(ringMesh);

    // 5. Build Procedural Drone Model
    const drone = buildRealisticDroneModel();
    scene.add(drone.group);
    droneInstanceRef.current = drone;

    // 6. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath floor
    controls.minDistance = 1.5;
    controls.maxDistance = 12.0;
    controls.target.set(0, 0.5, 0);
    controlsRef.current = controls;

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // 7. Render Loop with Delta Clock & Smooth Damping
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      // Smooth damped interpolation for exploded view and cargo hatch
      currentExplodedRef.current = THREE.MathUtils.damp(
        currentExplodedRef.current,
        targetExplodedRef.current,
        6.0,
        delta
      );
      currentCargoRef.current = THREE.MathUtils.damp(
        currentCargoRef.current,
        targetCargoRef.current,
        7.0,
        delta
      );

      // Update drone procedural model
      drone.update(
        delta,
        rotorSpeed,
        currentExplodedRef.current,
        currentCargoRef.current
      );

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handling
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
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      drone.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [rotorSpeed]);

  // Handle color scheme update
  useEffect(() => {
    if (droneInstanceRef.current) {
      droneInstanceRef.current.setColorScheme(colorScheme);
    }
  }, [colorScheme]);

  // Handle wireframe toggle
  useEffect(() => {
    if (!droneInstanceRef.current) return;
    droneInstanceRef.current.group.traverse(obj => {
      if (obj instanceof THREE.Mesh && !Array.isArray(obj.material)) {
        obj.material.wireframe = isWireframe;
      }
    });
  }, [isWireframe]);

  // Camera preset transitions
  const setCameraPreset = (preset: 'ISO' | 'FRONT' | 'TOP' | 'CARGO' | 'ROTOR') => {
    soundFx.playClick(920);
    if (!cameraRef.current || !controlsRef.current) return;

    if (preset === 'ISO') {
      cameraRef.current.position.set(3.8, 2.4, 4.6);
      controlsRef.current.target.set(0, 0.5, 0);
      setSelectedSubsystem('Complete Hexacopter Architecture');
    } else if (preset === 'FRONT') {
      cameraRef.current.position.set(0, 0.9, 4.2);
      controlsRef.current.target.set(0, 0.6, 0);
      setSelectedSubsystem('Optical Turret & Dual LiDAR Collision Array');
    } else if (preset === 'TOP') {
      cameraRef.current.position.set(0, 5.8, 0.1);
      controlsRef.current.target.set(0, 0, 0);
      setSelectedSubsystem('Aerodynamic Propulsion & RTK GPS Mast');
    } else if (preset === 'CARGO') {
      cameraRef.current.position.set(0, 0.2, 2.2);
      controlsRef.current.target.set(0, -0.2, 0);
      setSelectedSubsystem('Thermoelectric Cryo-Cargo Biological Pod');
    } else if (preset === 'ROTOR') {
      cameraRef.current.position.set(2.2, 1.6, 1.2);
      controlsRef.current.target.set(1.9, 0.9, 0);
      setSelectedSubsystem('Brushless Motor Nacelle & Carbon Blades');
    }
  };

  const handleCargoClick = () => {
    soundFx.playCargoUnlock();
    setIsCargoOpen(prev => !prev);
  };

  const handleRotorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setRotorSpeed(val);
    if (val > 0.05) {
      soundFx.startDroneRotorSound(val);
    } else {
      soundFx.stopDroneRotorSound();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Technical Spec Badge (Minimal, unobtrusive per Three.js skill) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-3.5 shadow-xl max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <h3 className="text-xs font-semibold tracking-wider text-teal-300 uppercase font-tech">
            AeroPulse-X1 Hexacopter
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            REV-4.2
          </span>
        </div>
        <p className="text-[11px] text-slate-300 mb-2 font-mono">
          Inspection Mode: <span className="text-teal-200">{selectedSubsystem}</span>
        </p>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
          <div>
            <span className="text-slate-500 block">MTOW</span>
            <span className="text-slate-200 font-semibold">18.5 kg</span>
          </div>
          <div>
            <span className="text-slate-500 block">PAYLOAD BAY</span>
            <span className="text-slate-200 font-semibold">6.5 kg Cryo</span>
          </div>
          <div>
            <span className="text-slate-500 block">MAX SPEED</span>
            <span className="text-slate-200 font-semibold">120 km/h</span>
          </div>
          <div>
            <span className="text-slate-500 block">TEMP ZONE</span>
            <span className="text-teal-400 font-semibold">-20°C / +4°C</span>
          </div>
        </div>
      </div>

      {/* Top Right: Status & View Helper Bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => {
            soundFx.playClick();
            setIsWireframe(!isWireframe);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 ${
            isWireframe
              ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
              : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
          }`}
          title="Toggle Wireframe Structural Inspection"
        >
          <Layers className="w-3.5 h-3.5" />
          {isWireframe ? 'X-Ray Active' : 'Solid Shell'}
        </button>

        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-teal-400" />
          <span>Left Drag: Orbit • Right: Pan • Scroll: Zoom</span>
        </div>
      </div>

      {/* Unified Bottom Control Dock (Compliant with Three.js Skill Section 5) */}
      <div 
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-all duration-300 ease-in-out ${
          isDockCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Tab */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => {
              soundFx.playClick(600);
              setIsDockCollapsed(!isDockCollapsed);
            }}
            className="bg-slate-900/90 hover:bg-slate-800 border-t border-x border-slate-700/70 rounded-t-lg px-4 py-1 text-[11px] font-mono text-teal-300 flex items-center gap-1.5 shadow-lg transition-colors"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Expand 3D UAV Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls (Zen View)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Container */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            
            {/* Control 1: Exploded View Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-400" />
                  Exploded View
                </span>
                <span className="font-mono text-teal-300 text-[11px]">
                  {Math.round(explodedFactor * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodedFactor}
                onChange={e => {
                  setExplodedFactor(parseFloat(e.target.value));
                  if (parseFloat(e.target.value) > 0.05) {
                    setSelectedSubsystem('Schematic Subsystem Separation');
                  }
                }}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Flight Trim</span>
                <span>Sub-Assemblies</span>
              </div>
            </div>

            {/* Control 2: Rotor RPM Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <RotateCw className={`w-3.5 h-3.5 text-teal-400 ${rotorSpeed > 0.1 ? 'animate-spin' : ''}`} />
                  Rotor Propulsion
                </span>
                <span className="font-mono text-teal-300 text-[11px]">
                  {Math.round(rotorSpeed * 8400)} RPM
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={rotorSpeed}
                onChange={handleRotorChange}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Static</span>
                <span>Flight Cruise</span>
              </div>
            </div>

            {/* Control 3: Cargo Hatch Toggle & Finishes */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-teal-400" />
                Cryo-Pod Compartment
              </span>
              <button
                onClick={handleCargoClick}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${
                  isCargoOpen
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/50 hover:bg-teal-500/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isCargoOpen ? 'Close Biometric Hatch' : 'Open Biometric Bay'}
              </button>
            </div>

            {/* Control 4: Quick Camera Presets & Finishes */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-teal-400" />
                Optic Angle Presets
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setCameraPreset('ISO')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono border border-slate-700"
                >
                  Iso
                </button>
                <button
                  onClick={() => setCameraPreset('FRONT')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono border border-slate-700"
                >
                  Front
                </button>
                <button
                  onClick={() => setCameraPreset('TOP')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono border border-slate-700"
                >
                  Plan
                </button>
                <button
                  onClick={() => setCameraPreset('CARGO')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono border border-slate-700 text-teal-300"
                >
                  Pod
                </button>
                <button
                  onClick={() => setCameraPreset('ROTOR')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono border border-slate-700"
                >
                  Motor
                </button>
              </div>

              {/* Color Scheme Picker */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-mono">Livery:</span>
                <button
                  onClick={() => setColorScheme('ARCTIC_WHITE')}
                  className={`w-4 h-4 rounded-full bg-slate-100 border ${colorScheme === 'ARCTIC_WHITE' ? 'ring-2 ring-teal-400' : 'border-slate-600'}`}
                  title="Arctic Medical White"
                />
                <button
                  onClick={() => setColorScheme('NAVY_RESCUE')}
                  className={`w-4 h-4 rounded-full bg-blue-900 border ${colorScheme === 'NAVY_RESCUE' ? 'ring-2 ring-teal-400' : 'border-slate-600'}`}
                  title="Navy Rescue"
                />
                <button
                  onClick={() => setColorScheme('STEALTH_CARBON')}
                  className={`w-4 h-4 rounded-full bg-zinc-900 border ${colorScheme === 'STEALTH_CARBON' ? 'ring-2 ring-teal-400' : 'border-slate-600'}`}
                  title="Stealth Carbon"
                />
                <button
                  onClick={() => setColorScheme('HUMANITARIAN_RED')}
                  className={`w-4 h-4 rounded-full bg-red-600 border ${colorScheme === 'HUMANITARIAN_RED' ? 'ring-2 ring-teal-400' : 'border-slate-600'}`}
                  title="Humanitarian Emergency Red"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
