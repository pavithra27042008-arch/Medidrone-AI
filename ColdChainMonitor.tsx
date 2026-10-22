import React, { useState } from 'react';
import { MedicalMission } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Thermometer, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Activity, 
  Snowflake, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';

interface ColdChainMonitorProps {
  activeMission: MedicalMission | null;
}

export const ColdChainMonitor: React.FC<ColdChainMonitorProps> = ({ activeMission }) => {
  const [selectedProfile, setSelectedProfile] = useState<'BLOOD' | 'MRNA' | 'ORGAN' | 'ANTIVENOM'>('BLOOD');

  // Realistic temperature profiles
  const profiles = {
    BLOOD: {
      name: 'Whole Blood & Red Blood Cells',
      target: 4.0,
      min: 1.5,
      max: 6.0,
      current: activeMission?.telemetry.cargoTempCelsius || 3.9,
      history: [4.1, 4.0, 3.9, 4.0, 3.8, 3.9, 4.0, 3.9, 4.0, 3.9],
      peltierWatts: 34.2,
      insulation: 'Vacuum Aerogel (Lambda 0.014 W/mK)',
    },
    MRNA: {
      name: 'mRNA Viral Neutralization Vaccines',
      target: -70.0,
      min: -80.0,
      max: -60.0,
      current: -71.4,
      history: [-70.2, -70.8, -71.2, -71.5, -71.4, -71.2, -71.4, -71.6, -71.4],
      peltierWatts: 58.5,
      insulation: 'Stirling Deep-Cryo Cooler + Dry Ice Core',
    },
    ORGAN: {
      name: 'Renal / Cardiac Perfusion Box',
      target: 4.0,
      min: 2.0,
      max: 6.0,
      current: 4.1,
      history: [4.2, 4.1, 4.1, 4.0, 4.1, 4.1, 4.2, 4.1, 4.0, 4.1],
      peltierWatts: 42.0,
      insulation: 'Pulsatile Hypothermic Perfusion Loop',
    },
    ANTIVENOM: {
      name: 'Polyvalent Antivenom Immunoglobulin',
      target: 4.5,
      min: 2.0,
      max: 8.0,
      current: 4.4,
      history: [4.6, 4.5, 4.4, 4.4, 4.5, 4.4, 4.3, 4.4, 4.5, 4.4],
      peltierWatts: 28.0,
      insulation: 'Phase-Change Bio-Sleeve PCM-4',
    },
  };

  const active = profiles[selectedProfile];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Snowflake className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                Biological Cold-Chain Chain-of-Custody Telemetry
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Active Thermoelectric Cryo-Pod Monitoring • Continuous 10 Hz Platinum RTD Sensor Validation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zero Excursions Recorded (100% Compliant)
            </span>
          </div>
        </div>

        {/* Profile Switcher Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/80 overflow-x-auto">
          {[
            { id: 'BLOOD', label: 'Whole Blood (4°C)' },
            { id: 'MRNA', label: 'mRNA Vaccine (-70°C)' },
            { id: 'ORGAN', label: 'Organ Perfusion (4°C)' },
            { id: 'ANTIVENOM', label: 'Antivenom (2-8°C)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playClick();
                setSelectedProfile(tab.id as typeof selectedProfile);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all border ${
                selectedProfile === tab.id
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">INTERNAL POD TEMP</span>
          <div className="text-3xl font-bold font-mono text-teal-300">
            {active.current} <span className="text-base text-slate-400">°C</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 mt-1 block">
            Target: {active.target}°C (Tolerance: {active.min}°C to {active.max}°C)
          </span>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">PELTIER POWER DRAW</span>
          <div className="text-3xl font-bold font-mono text-slate-100">
            {active.peltierWatts} <span className="text-base text-slate-400">W</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            Solid-State Thermoelectric Dual Stage
          </span>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">CABIN AMBIENT AIR</span>
          <div className="text-3xl font-bold font-mono text-slate-100">
            +18.5 <span className="text-base text-slate-400">°C</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            Delta T: {Math.abs(18.5 - active.current).toFixed(1)}°C Thermal Gradient
          </span>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">WHO / FDA PROTOCOL</span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            CERTIFIED
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            Good Distribution Practice (GDP)
          </span>
        </div>
      </div>

      {/* Real-Time Temperature Wave Graph */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold font-tech text-teal-300">
              Live In-Flight Thermal Telemetry Curve ({active.name})
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Sample Rate: 10 Hz RTD Sensor Array
          </span>
        </div>

        {/* SVG Curve */}
        <div className="h-44 w-full bg-slate-950/60 rounded-xl border border-slate-800 p-4 relative flex items-end">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
            {/* Safe zone background band */}
            <rect x="0" y="20" width="500" height="80" fill="rgba(13, 148, 136, 0.08)" />
            {/* Target line */}
            <line x1="0" y1="60" x2="500" y2="60" stroke="#0d9488" strokeDasharray="4 4" strokeWidth="1.5" />

            {/* Simulated Points Line */}
            <polyline
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2.5"
              points="0,62 50,60 100,58 150,61 200,60 250,59 300,60 350,59 400,60 450,59 500,60"
            />
          </svg>

          {/* Labels */}
          <div className="absolute top-2 left-4 text-[10px] font-mono text-slate-500">
            Upper Limit (+{active.max}°C)
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-4 text-[10px] font-mono text-teal-400">
            Target ({active.target}°C)
          </div>
          <div className="absolute bottom-2 left-4 text-[10px] font-mono text-slate-500">
            Lower Limit ({active.min}°C)
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80">
          <span>Active Insulation: <strong className="text-slate-200">{active.insulation}</strong></span>
          <span>Hermetic Biometric Lock: <strong className="text-teal-300">ENGAGED</strong></span>
        </div>
      </div>
    </div>
  );
};
