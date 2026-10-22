import React from 'react';
import { Drone, HospitalNode } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Battery, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Plane, 
  ShieldCheck, 
  Wrench, 
  Zap, 
  AlertTriangle, 
  RotateCw 
} from 'lucide-react';

interface FleetManagementProps {
  fleet: Drone[];
  hospitals: HospitalNode[];
  onSelectDroneForInspection: (drone: Drone) => void;
  onChargeDrone: (droneId: string) => void;
  onRunDiagnostic: (droneId: string) => void;
}

export const FleetManagement: React.FC<FleetManagementProps> = ({
  fleet,
  hospitals,
  onSelectDroneForInspection,
  onChargeDrone,
  onRunDiagnostic,
}) => {
  return (
    <div className="space-y-6">
      {/* Fleet Overview Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                Autonomous UAV Fleet Operations & Predictive Health
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Active Monitoring: {fleet.length} Autonomous Medical Aircraft • Real-Time Cell Balancing & Motor Vibration Telemetry
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30">
              Fleet Readiness: 100%
            </span>
          </div>
        </div>
      </div>

      {/* Drone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fleet.map(drone => {
          const currentHosp = hospitals.find(h => h.id === drone.currentHospitalId);

          return (
            <div
              key={drone.id}
              className="bg-slate-900/85 backdrop-blur-md border border-slate-850 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-100 font-tech">
                        {drone.model}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                        {drone.callsign}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Type: {drone.type.replace(/_/g, ' ')} • FW: {drone.firmwareVersion}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                      drone.status === 'READY'
                        ? 'bg-teal-500/15 text-teal-300 border-teal-500/40'
                        : drone.status === 'IN_FLIGHT'
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                        : drone.status === 'CHARGING'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                  >
                    {drone.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-4 pt-3 border-t border-slate-800/80">
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">BATTERY</span>
                    <span className="text-teal-300 font-bold">{drone.batteryPercentage}%</span>
                    <span className="text-[9px] text-slate-500 block">Health: {drone.batteryHealthPct}%</span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">CRUISE / RANGE</span>
                    <span className="text-slate-200 font-bold">{drone.cruiseSpeedKmh} km/h</span>
                    <span className="text-[9px] text-slate-500 block">Max: {drone.maxRangeKm} km</span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                    <span className="text-[10px] text-slate-500 block">HOURS / MISSIONS</span>
                    <span className="text-slate-200 font-bold">{drone.completedMissions} Done</span>
                    <span className="text-[9px] text-slate-500 block">{drone.totalFlightHours} hrs logged</span>
                  </div>
                </div>

                {/* Station Location */}
                <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Current Helipad: <strong className="text-slate-300">{currentHosp?.shortName || drone.currentHospitalId}</strong></span>
                  <span className="text-[10px] text-slate-500">Service: {drone.lastMaintenanceDate}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick(900);
                    onSelectDroneForInspection(drone);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Plane className="w-3.5 h-3.5" />
                  3D Model Inspection
                </button>

                <button
                  onClick={() => {
                    soundFx.playTelemetryBeep();
                    onRunDiagnostic(drone.id);
                  }}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-all flex items-center gap-1.5"
                  title="Run Motor & ESC Diagnostics"
                >
                  <Cpu className="w-3.5 h-3.5 text-teal-400" />
                  Diag
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    onChargeDrone(drone.id);
                  }}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-all flex items-center gap-1.5"
                  title="Rapid Solid-State Charge"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Charge
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Predictive Maintenance & Health Telemetry Card */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-semibold text-teal-300 font-tech flex items-center gap-2">
          <Wrench className="w-4 h-4 text-teal-400" />
          Predictive Maintenance AI & Motor Telemetry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-1">
            <span className="text-[10px] text-teal-400 font-bold block">BEARING VIBRATION SENSOR (FFT)</span>
            <p className="text-slate-300">All 6 motor shafts within 0.02 mm/s RMS vibration tolerance.</p>
            <span className="text-emerald-400 text-[10px] block">Next bearing service: 280 flight hours</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-1">
            <span className="text-[10px] text-teal-400 font-bold block">SOLID-STATE BATTERY CYCLING</span>
            <p className="text-slate-300">Cell delta &lt; 0.008V. Internal resistance optimal across all 6 cells.</p>
            <span className="text-emerald-400 text-[10px] block">Degradation index: Nominal (98%)</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-1">
            <span className="text-[10px] text-teal-400 font-bold block">RTK-GNSS DUAL ANTENNA OFFSET</span>
            <p className="text-slate-300">Phase center calibration valid. Carrier-phase differential locked.</p>
            <span className="text-emerald-400 text-[10px] block">Centimeter-level positioning active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
