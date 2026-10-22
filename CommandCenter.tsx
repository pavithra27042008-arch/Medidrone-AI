import React from 'react';
import { Drone, HospitalNode, MedicalMission, WeatherCondition } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Activity, 
  Battery, 
  Clock, 
  Compass, 
  MapPin, 
  Radio, 
  ShieldAlert, 
  Thermometer, 
  Wind, 
  Zap, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';

interface CommandCenterProps {
  activeMission: MedicalMission | null;
  drone: Drone | null;
  origin: HospitalNode | null;
  destination: HospitalNode | null;
  weather: WeatherCondition;
  onOpenWorkflow: () => void;
  onTriggerObstacleSimulation: () => void;
  isObstacleSimulated: boolean;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  activeMission,
  drone,
  origin,
  destination,
  weather,
  onOpenWorkflow,
  onTriggerObstacleSimulation,
  isObstacleSimulated,
}) => {
  if (!activeMission) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 text-center space-y-4">
        <Activity className="w-10 h-10 text-teal-400 mx-auto" />
        <h3 className="text-base font-bold font-tech text-slate-200">
          No Active Airborne Mission
        </h3>
        <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
          All drones in standby. Launch an emergency medical transport workflow to initiate live 3D telemetry tracking.
        </p>
        <button
          onClick={onOpenWorkflow}
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg"
        >
          Dispatch Emergency UAV
        </button>
      </div>
    );
  }

  const { telemetry, payload } = activeMission;

  return (
    <div className="space-y-4">
      {/* Top Banner: Mission Status & Urgency */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-teal-400 animate-none" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-teal-300 font-bold">
                  MISSION #{activeMission.trackingNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  activeMission.patientUrgency === 'CRITICAL_CODE_RED'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                }`}>
                  {activeMission.patientUrgency.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                {payload.name} ({payload.weightKg} kg)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playAlert();
                onTriggerObstacleSimulation();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 ${
                isObstacleSimulated
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/60'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {isObstacleSimulated ? 'Clear Simulated Hazard' : 'Simulate Obstacle Hazard'}
            </button>

            <button
              onClick={() => {
                soundFx.playClick(800);
                onOpenWorkflow();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono transition-all"
            >
              Mission Wizard
            </button>
          </div>
        </div>

        {/* Route Facilities Line */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Origin: <strong className="text-slate-200">{origin?.shortName || activeMission.originHospitalId}</strong></span>
          </div>
          <div className="text-teal-400 font-bold">→ 18.6 km Air Corridor →</div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            <span>Destination: <strong className="text-teal-300">{destination?.shortName || activeMission.destinationHospitalId}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Telemetry Gauges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Gauge 1: Altitude */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span className="font-mono flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" /> Altitude AGL
            </span>
            <span className="text-[10px] text-teal-300 font-mono">MSL +45m</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {telemetry.altitudeMeters} <span className="text-sm font-normal text-slate-400">m</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (telemetry.altitudeMeters / 150) * 100)}%` }} />
          </div>
        </div>

        {/* Gauge 2: Ground Speed */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span className="font-mono flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-teal-400" /> Ground Speed
            </span>
            <span className="text-[10px] text-teal-300 font-mono">Air: {telemetry.airspeedKmh} km/h</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {telemetry.groundSpeedKmh} <span className="text-sm font-normal text-slate-400">km/h</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${(telemetry.groundSpeedKmh / 140) * 100}%` }} />
          </div>
        </div>

        {/* Gauge 3: Battery & Power */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span className="font-mono flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-teal-400" /> Battery SoC
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">22.8V 6S</span>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-300">
            {telemetry.batteryPct} <span className="text-sm font-normal text-slate-400">%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${telemetry.batteryPct}%` }} />
          </div>
        </div>

        {/* Gauge 4: Cold-Chain Bay Temp */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span className="font-mono flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-teal-400" /> Cryo-Bay Temp
            </span>
            <span className="text-[10px] text-teal-300 font-mono">Target: {payload.temperatureTargetC}°C</span>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-300">
            {telemetry.cargoTempCelsius} <span className="text-sm font-normal text-slate-400">°C</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: '85%' }} />
          </div>
        </div>
      </div>

      {/* Secondary Telemetry Strip */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>ETA: <strong className="text-teal-300">{activeMission.estimatedArrivalTime}</strong> ({telemetry.estimatedRemainingMinutes} min rem)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-slate-400" />
          <span>RF Signal: <strong className="text-slate-200">{telemetry.signalStrengthDbm} dBm</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-slate-400" />
          <span>Wind: <strong className="text-slate-200">{telemetry.windSpeedKmh} km/h @ {telemetry.windDirectionDegrees}°</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-teal-400" />
          <span>GNSS Satellites: <strong className="text-teal-300">{telemetry.gpsSatellites} Locked</strong></span>
        </div>
      </div>
    </div>
  );
};
