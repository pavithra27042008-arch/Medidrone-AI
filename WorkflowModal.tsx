import React, { useState, useEffect } from 'react';
import { 
  AIAnalysisResult, 
  Drone, 
  HospitalNode, 
  InventoryItem, 
  MedicalMission, 
  MedicalPayload, 
  WeatherCondition 
} from '../../types';
import { triageMedicalMissionWithAI } from '../../services/aiService';
import { exportMissionToCsv, printMedicalManifest } from '../../utils/reports';
import { soundFx } from '../../utils/audio';
import { 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Radio, 
  ShieldCheck, 
  Thermometer, 
  BatteryCharging, 
  Navigation, 
  Download, 
  Printer, 
  X, 
  Plane, 
  Cpu, 
  Lock, 
  Unlock, 
  Sparkles, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: HospitalNode[];
  fleet: Drone[];
  inventory: InventoryItem[];
  weather: WeatherCondition;
  onMissionCreated: (mission: MedicalMission, updatedInventory: InventoryItem[]) => void;
  preselectedHospitalId?: string;
  preselectedAssetId?: string;
  onLogAuditAction?: (action: string, details: string) => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  onClose,
  hospitals,
  fleet,
  inventory,
  weather,
  onMissionCreated,
  preselectedHospitalId,
  preselectedAssetId,
  onLogAuditAction,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(preselectedAssetId || 'inv-blood-oneg');
  const [originId, setOriginId] = useState<string>('hosp-blood-bank');
  const [destinationId, setDestinationId] = useState<string>(preselectedHospitalId || 'hosp-highlands-remote');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-primary');

  const [emergencyReason, setEmergencyReason] = useState<string>(
    'Critical trauma patient with acute internal hemorrhage requiring immediate universal transfusion.'
  );
  const [requestingDoctor, setRequestingDoctor] = useState<string>('Dr. Elena Rostova, MD (Emergency Dept)');
  const [receivingDoctor, setReceivingDoctor] = useState<string>('Paramedic Response Team Echo');

  // Step 2 AI Triage state
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // Step 3 Drone state
  const [selectedDroneId, setSelectedDroneId] = useState<string>('drone-x1-01');

  // Step 4 & 5 Flight simulation states
  const [flightProgress, setFlightProgress] = useState<number>(0);
  const [currentAltitude, setCurrentAltitude] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentBattery, setCurrentBattery] = useState<number>(96);
  const [cargoTemp, setCargoTemp] = useState<number>(3.8);
  const [hasSimulatedObstacle, setHasSimulatedObstacle] = useState<boolean>(false);
  const [isPreflightPassed, setIsPreflightPassed] = useState<boolean>(false);

  // Step 7 Biometric Release state
  const [biometricPin, setBiometricPin] = useState<string>('8842');
  const [isPinVerified, setIsPinVerified] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');

  // Resulting created mission
  const [finalMission, setFinalMission] = useState<MedicalMission | null>(null);

  useEffect(() => {
    if (preselectedHospitalId) {
      setDestinationId(preselectedHospitalId);
    }
  }, [preselectedHospitalId]);

  if (!isOpen) return null;

  const currentItem = inventory.find(i => i.id === selectedAssetId) || inventory[0];
  const originHospital = hospitals.find(h => h.id === originId) || hospitals[0];
  const destHospital = hospitals.find(h => h.id === destinationId) || hospitals[1];
  const assignedDrone = fleet.find(d => d.id === selectedDroneId) || fleet[0];

  // Step 1 -> 2: Trigger AI Analysis
  const handleProceedToAI = async () => {
    soundFx.playClick(880);
    setStep(2);
    setIsAnalyzingAI(true);

    const payload: MedicalPayload = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      name: currentItem.name,
      category: currentItem.category,
      weightKg: currentItem.unitWeightKg * 2,
      temperatureTargetC: currentItem.storageTempC,
      tempToleranceMinC: currentItem.storageTempC - 2,
      tempToleranceMaxC: currentItem.storageTempC + 2.5,
      requiresBiometricRelease: true,
      expiryHours: 8,
      emergencyReason: emergencyReason,
    };

    const result = await triageMedicalMissionWithAI(payload, originHospital, destHospital, weather, fleet);
    setAiResult(result);
    setSelectedDroneId(result.recommendedDroneId);
    setIsAnalyzingAI(false);
    soundFx.playTelemetryBeep(true);
  };

  // Step 3 -> 4: Pre-Flight & Takeoff
  const handleStartPreflight = () => {
    soundFx.playClick();
    setStep(4);
    setIsPreflightPassed(false);
    setFlightProgress(0);

    setTimeout(() => {
      setIsPreflightPassed(true);
      soundFx.playTelemetryBeep();
      // Start rotor hum sound
      soundFx.startDroneRotorSound(0.65);
      
      // Simulate takeoff climb
      let alt = 0;
      const climbInterval = setInterval(() => {
        alt += 15;
        setCurrentAltitude(alt);
        if (alt >= 115) {
          clearInterval(climbInterval);
          setCurrentSpeed(assignedDrone.cruiseSpeedKmh);
          setCurrentBattery(assignedDrone.batteryPercentage);
          // Transition to Step 5: In Flight
          setStep(5);
          startInFlightSimulation();
        }
      }, 250);
    }, 1800);
  };

  // Step 5: Live Simulated Flight
  const startInFlightSimulation = () => {
    let p = 0;
    const flightInterval = setInterval(() => {
      p += 5;
      setFlightProgress(p);
      setCurrentBattery(prev => Math.max(15, prev - 0.4));
      // Subtle cargo temperature fluctuations within ±0.2°C
      setCargoTemp(prev => Number((currentItem.storageTempC + (Math.sin(p * 0.1) * 0.2)).toFixed(1)));

      if (p === 45) {
        soundFx.playAlert();
        setHasSimulatedObstacle(true);
        setCurrentAltitude(prev => prev + 18); // Obstacle avoidance climb
      }
      if (p === 65) {
        setHasSimulatedObstacle(false);
        setCurrentAltitude(prev => prev - 18); // Return to nominal cruise
      }

      if (p >= 100) {
        clearInterval(flightInterval);
        soundFx.stopDroneRotorSound();
        // Step 6: Landing
        setStep(6);
        simulateLandingTouchdown();
      }
    }, 380);
  };

  // Step 6: Landing Touchdown
  const simulateLandingTouchdown = () => {
    let alt = 115;
    const descentInterval = setInterval(() => {
      alt -= 20;
      setCurrentAltitude(Math.max(0, alt));
      setCurrentSpeed(prev => Math.max(0, prev - 18));
      if (alt <= 0) {
        clearInterval(descentInterval);
        soundFx.playSuccessChime();
        setStep(7); // Go to Step 7: Biometric Release
      }
    }, 350);
  };

  // Step 7: Biometric Verification
  const handleVerifyBiometrics = () => {
    soundFx.playCargoUnlock();
    setIsPinVerified(true);

    // Create the final completed mission record
    const missionId = `msn-${Date.now().toString().slice(-4)}`;
    const newMission: MedicalMission = {
      id: missionId,
      trackingNumber: `MD-${missionId.slice(-4)}-EMG`,
      patientUrgency: aiResult?.urgencyLevel || 'CRITICAL_CODE_RED',
      originHospitalId: originHospital.id,
      destinationHospitalId: destHospital.id,
      droneId: assignedDrone.id,
      payload: {
        id: `pay-${Date.now().toString().slice(-4)}`,
        name: currentItem.name,
        category: currentItem.category,
        weightKg: currentItem.unitWeightKg * 2,
        temperatureTargetC: currentItem.storageTempC,
        tempToleranceMinC: currentItem.storageTempC - 2,
        tempToleranceMaxC: currentItem.storageTempC + 2,
        requiresBiometricRelease: true,
        expiryHours: 6,
        emergencyReason,
      },
      status: 'DELIVERED',
      progressPct: 100,
      flightStartTime: new Date(Date.now() - 14 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      estimatedArrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actualArrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      requestingPhysician: requestingDoctor,
      receivingPhysician: receivingDoctor,
      selectedRouteName: aiResult?.routeOptions?.find(r => r.id === selectedRouteId)?.name || 'Primary Air Corridor Echo-9',
      telemetry: {
        altitudeMeters: 0,
        groundSpeedKmh: 0,
        airspeedKmh: 0,
        headingDegrees: 48,
        batteryPct: Math.round(currentBattery),
        estimatedRemainingMinutes: 0,
        cargoTempCelsius: cargoTemp,
        signalStrengthDbm: -64,
        gpsSatellites: 19,
        windSpeedKmh: weather.windSpeedKmh,
        windDirectionDegrees: 315,
        distanceCoveredKm: 16.4,
        totalDistanceKm: 16.4,
        obstacleDetected: false,
      },
      routeWaypoints: [
        originHospital.coordinates,
        { x: (originHospital.coordinates.x + destHospital.coordinates.x) / 2, y: 10, z: (originHospital.coordinates.z + destHospital.coordinates.z) / 2 },
        destHospital.coordinates,
      ],
      temperatureExcursionsCount: 0,
    };

    // Deduct 2 units from inventory
    const updatedInv = inventory.map(item => {
      if (item.id === currentItem.id) {
        return {
          ...item,
          unitsAvailable: Math.max(0, item.unitsAvailable - 2),
        };
      }
      return item;
    });

    if (onLogAuditAction) {
      onLogAuditAction(
        'MISSION_DELIVERED_SUCCESS',
        `Sortie #${newMission.trackingNumber} successfully delivered to ${destHospital.shortName}. Biometric PIN signature authenticated, -2 units deducted for ${newMission.payload.name}.`
      );
    }

    setFinalMission(newMission);
    onMissionCreated(newMission, updatedInv);

    // Proceed to Step 8: Reports & Confirmation
    setTimeout(() => {
      setStep(8);
      soundFx.playTelemetryBeep(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header with step indicators */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                Autonomous Medical Drone Mission Protocol
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              End-to-End Autonomous Healthcare UAV Logistics Sequence
            </p>
          </div>
          <button
            onClick={() => {
              soundFx.stopDroneRotorSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Breadcrumb */}
        <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800/80 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max text-xs font-mono">
            {[
              { id: 1, label: '1. Request' },
              { id: 2, label: '2. AI Triage' },
              { id: 3, label: '3. Fleet' },
              { id: 4, label: '4. Takeoff' },
              { id: 5, label: '5. In Flight' },
              { id: 6, label: '6. Landing' },
              { id: 7, label: '7. Biometrics' },
              { id: 8, label: '8. Manifest' },
            ].map((s, idx) => (
              <React.Fragment key={s.id}>
                <span
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    step === s.id
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/60 font-semibold'
                      : step > s.id
                      ? 'bg-slate-800 text-teal-400'
                      : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
                {idx < 7 && <span className="text-slate-600">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: Medical Request Formulation */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-teal-300 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  Select Critical Medical Cargo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inventory.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedAssetId(item.id);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedAssetId === item.id
                          ? 'bg-teal-500/15 border-teal-500 text-teal-200 shadow-md'
                          : 'bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start text-xs font-semibold">
                        <span>{item.name}</span>
                        <span className="font-mono text-teal-300">{item.storageTempC}°C</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1 flex justify-between">
                        <span>Zone: {item.temperatureZone}</span>
                        <span>{item.unitsAvailable} Units in stock</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Origin & Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Dispatch Facility (Origin):
                  </label>
                  <select
                    value={originId}
                    onChange={e => setOriginId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  >
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Emergency Recipient Helipad (Destination):
                  </label>
                  <select
                    value={destinationId}
                    onChange={e => setDestinationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  >
                    {hospitals.filter(h => h.id !== originId).map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.shortName}) — Elev {h.helipadElevationM}m
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clinical Indication */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Physician Emergency Indication / Clinical Notes:
                </label>
                <textarea
                  rows={2}
                  value={emergencyReason}
                  onChange={e => setEmergencyReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Requesting Physician:
                  </label>
                  <input
                    type="text"
                    value={requestingDoctor}
                    onChange={e => setRequestingDoctor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Receiving Trauma Staff:
                  </label>
                  <input
                    type="text"
                    value={receivingDoctor}
                    onChange={e => setReceivingDoctor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI Priority & Triage Analysis */}
          {step === 2 && (
            <div className="space-y-5">
              {isAnalyzingAI ? (
                <div className="py-16 text-center space-y-4">
                  <Cpu className="w-10 h-10 text-teal-400 animate-spin mx-auto" />
                  <p className="text-sm font-mono text-teal-300">
                    AI Emergency Triage Neural Engine calculating optimal corridor, wind vectors & cold-chain feasibility...
                  </p>
                </div>
              ) : aiResult ? (
                <div className="space-y-4">
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-teal-500/40">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        <h4 className="text-sm font-semibold font-tech uppercase text-teal-300">
                          AI Medical Logistics Assessment Complete
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-red-500/20 text-red-300 border border-red-500/40">
                        {aiResult.urgencyLevel.replace(/_/g, ' ')} [SCORE: {aiResult.triageScore}/100]
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-mono">
                      {aiResult.aiReasoning}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">WEATHER FEASIBILITY</span>
                      <span className="text-xs font-semibold text-slate-200 mt-1 block">
                        {aiResult.weatherRiskAssessment}
                      </span>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">COLD-CHAIN RETENTION</span>
                      <span className="text-xs font-semibold text-teal-300 mt-1 block">
                        {aiResult.coldChainFeasibility}
                      </span>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">RECOMMENDED ALTITUDE</span>
                      <span className="text-xs font-semibold text-slate-200 mt-1 block">
                        {aiResult.altitudeRecommendation}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-amber-400 block mb-1">IDENTIFIED FLIGHT FACTORS</span>
                    <ul className="text-xs text-slate-300 font-mono space-y-1 list-disc list-inside">
                      {aiResult.riskFactors.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Multi-Route Planning Options */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-teal-300 font-bold uppercase block">
                      AI Dynamic Route & Airspace Corridor Options:
                    </span>
                    <div className="space-y-2">
                      {(aiResult.routeOptions || []).map(route => (
                        <div
                          key={route.id}
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedRouteId(route.id);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedRouteId === route.id
                              ? 'bg-teal-500/20 border-teal-500 text-teal-100 shadow-md'
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="flex items-center gap-1.5">
                              {route.name}
                              {route.recommended && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/30 text-teal-300 border border-teal-500/50">
                                  AI RECOMMENDED
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-teal-300">{route.estimatedMinutes} min ({route.distanceKm} km)</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 mt-1">
                            <div>Profile: {route.altitudeProfile}</div>
                            <div>Weather: {route.weatherClearance}</div>
                            <div>
                              {route.restrictedAirspaceConflict ? (
                                <span className="text-amber-400 font-bold">⚠️ Mountain Mast Advisory</span>
                              ) : (
                                <span className="text-emerald-400">✓ Clean Corridor</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 3: Drone Fleet Assignment */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-teal-300 flex items-center gap-2">
                <Plane className="w-4 h-4 text-teal-400" />
                Select Autonomous UAV Carrier
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fleet.map(drone => (
                  <div
                    key={drone.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedDroneId(drone.id);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedDroneId === drone.id
                        ? 'bg-teal-500/15 border-teal-500 text-teal-100 shadow-lg'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold text-xs font-tech">{drone.model}</div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                        {drone.callsign}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                      <div>Battery: <strong className="text-slate-200">{drone.batteryPercentage}%</strong></div>
                      <div>Max Payload: <strong className="text-slate-200">{drone.maxPayloadKg} kg</strong></div>
                      <div>Cruise Speed: <strong className="text-slate-200">{drone.cruiseSpeedKmh} km/h</strong></div>
                      <div>Max Range: <strong className="text-slate-200">{drone.maxRangeKm} km</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Pre-Flight Check & Vertical Takeoff */}
          {step === 4 && (
            <div className="py-6 text-center space-y-5">
              <div className="max-w-md mx-auto bg-slate-950/60 p-5 rounded-2xl border border-slate-800 text-left space-y-3 font-mono text-xs">
                <div className="text-teal-300 font-bold mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  AUTOMATED PRE-FLIGHT TELEMETRY HANDSHAKE
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Avionics & Flight Computer:</span>
                  <span className="text-teal-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> NOMINAL</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>RTK-GNSS Satellite Lock:</span>
                  <span className="text-teal-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 19 SATS (±2cm)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Cryo-Cargo Hermetic Seal:</span>
                  <span className="text-teal-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> LOCKED ({currentItem.storageTempC}°C)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Air Corridor Clearance:</span>
                  <span className="text-teal-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> FAA-BVLOS GRANTED</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-mono text-slate-400 mb-1">
                  Spooling Brushless Rotors to 7,200 RPM... Vertical Lift Initiated
                </p>
                <div className="text-2xl font-bold font-mono text-teal-300">
                  Altitude: {currentAltitude}m AGL
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Live Flight Tracking & Obstacle Avoidance */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-semibold text-teal-300 font-tech">
                    Live Flight Corridor Tracking: {assignedDrone.callsign}
                  </h4>
                  <p className="text-xs font-mono text-slate-400">
                    Transiting to {destHospital.name}
                  </p>
                </div>
                <span className="px-3 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-mono">
                  {flightProgress}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div 
                  className="bg-teal-400 h-2.5 transition-all duration-300 ease-linear rounded-full"
                  style={{ width: `${flightProgress}%` }}
                />
              </div>

              {/* Dynamic Telemetry Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">ALTITUDE</span>
                  <span className="text-lg font-bold font-mono text-teal-300">{currentAltitude} m</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">GROUND SPEED</span>
                  <span className="text-lg font-bold font-mono text-teal-300">{currentSpeed} km/h</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">BATTERY RESERVE</span>
                  <span className="text-lg font-bold font-mono text-teal-300">{Math.round(currentBattery)}%</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">CRYO-BAY TEMP</span>
                  <span className="text-lg font-bold font-mono text-teal-300">{cargoTemp}°C</span>
                </div>
              </div>

              {/* Obstacle simulation notification */}
              {hasSimulatedObstacle && (
                <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-200 text-xs font-mono flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <strong>FORWARD LIDAR RADAR: OBSTACLE DETECTED AT 420m</strong>
                    <div className="text-[11px] text-amber-300/90">
                      Executing automated safety trajectory deflection: +18m vertical terrain buffer.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Hospital Helipad Touchdown & Landing */}
          {step === 6 && (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center mx-auto text-teal-300">
                <Plane className="w-8 h-8 rotate-90" />
              </div>
              <h3 className="text-lg font-bold font-tech text-teal-300">
                TOUCHDOWN AT {destHospital.shortName.toUpperCase()} HELIPAD
              </h3>
              <p className="text-xs font-mono text-slate-300 max-w-md mx-auto">
                Altitude: 0m • Skids firmly grounded on Pad #1. Brushless rotors spooled down to static rest. Proceeding to Biometric Decryption.
              </p>
            </div>
          )}

          {/* STEP 7: Delivery Confirmation & Biometric Cargo Unlocking */}
          {step === 7 && (
            <div className="max-w-md mx-auto space-y-5 text-center">
              <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center mx-auto text-teal-300">
                  {isPinVerified ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <h4 className="text-sm font-semibold font-tech text-slate-200">
                  RECIPIENT BIOMETRIC / CRYPTO PIN VERIFICATION
                </h4>
                <p className="text-xs font-mono text-slate-400">
                  Doctor / Lead Paramedic: Enter authorized unlock token or click below to simulate verified biometric signature.
                </p>

                <div className="flex justify-center gap-2">
                  <input
                    type="password"
                    placeholder="Enter PIN (e.g. 8842)"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-center font-mono text-sm tracking-widest text-teal-300 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={handleVerifyBiometrics}
                    className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs font-mono hover:bg-teal-400 transition-colors"
                  >
                    Authorize Decryption
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-500">
                  Demo Fast-Pass: Click 'Authorize Decryption' to instantly release latch
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Report Generation & Inventory Deduction */}
          {step === 8 && finalMission && (
            <div className="space-y-5">
              <div className="p-4 bg-teal-500/10 border border-teal-500/40 rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto" />
                <h3 className="text-base font-bold font-tech text-teal-300">
                  MISSION COMPLETE — CHAIN OF CUSTODY VERIFIED
                </h3>
                <p className="text-xs font-mono text-slate-300">
                  Tracking ID: {finalMission.trackingNumber} • 2 Units of {finalMission.payload.name} successfully transferred.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <strong className="text-teal-300 block border-b border-slate-800 pb-1">INVENTORY LOG</strong>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset:</span>
                    <span className="text-slate-200">{finalMission.payload.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Origin Stock:</span>
                    <span className="text-amber-400">-2 Units Deducted</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Temp Maintained:</span>
                    <span className="text-teal-400">{finalMission.payload.temperatureTargetC}°C (100% compliant)</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <strong className="text-teal-300 block border-b border-slate-800 pb-1">FLIGHT METRICS</strong>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transit Duration:</span>
                    <span className="text-slate-200">14 min (Saved 42 min vs ambulance)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Landing Reserve Battery:</span>
                    <span className="text-teal-400">{finalMission.telemetry.batteryPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cold Excursions:</span>
                    <span className="text-teal-400">0 Violations</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for reports */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => printMedicalManifest(finalMission, originHospital, destHospital, assignedDrone)}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-lg transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print Official Flight Manifest (PDF)
                </button>

                <button
                  onClick={() => exportMissionToCsv(finalMission, originHospital, destHospital, assignedDrone)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Mission CSV
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-750 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
                >
                  Close & View in 3D Center
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center">
          {step > 1 && step < 4 ? (
            <button
              onClick={() => {
                soundFx.playClick();
                setStep(step - 1);
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
            >
              Back
            </button>
          ) : <div />}

          {step === 1 && (
            <button
              onClick={handleProceedToAI}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-lg"
            >
              Run AI Priority Triage
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && !isAnalyzingAI && (
            <button
              onClick={() => {
                soundFx.playClick();
                setStep(3);
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-lg"
            >
              Confirm Drone Assignment
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleStartPreflight}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-lg"
            >
              Initiate Pre-Flight & 3D Takeoff
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
