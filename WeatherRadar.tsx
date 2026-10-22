import React from 'react';
import { WeatherCondition } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  CloudRain, 
  Wind, 
  Compass, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Sun, 
  CloudLightning 
} from 'lucide-react';

interface WeatherRadarProps {
  weather: WeatherCondition;
  onUpdateWeather: (newWeather: WeatherCondition) => void;
}

export const WeatherRadar: React.FC<WeatherRadarProps> = ({ weather, onUpdateWeather }) => {
  const setScenario = (type: 'FAIR' | 'GUSTY' | 'STORM') => {
    soundFx.playClick(940);
    if (type === 'FAIR') {
      onUpdateWeather({
        id: 'w-fair',
        stationName: 'Air Corridor Echo-9 (North Metropolitan)',
        temperatureC: 19.2,
        windSpeedKmh: 12.0,
        gustSpeedKmh: 18.0,
        windDirection: 'NW (315°)',
        visibilityKm: 16.0,
        cloudBaseM: 750,
        precipitationRiskPct: 5,
        flightSafetyIndex: 'EXCELLENT',
      });
    } else if (type === 'GUSTY') {
      onUpdateWeather({
        id: 'w-gusts',
        stationName: 'Highland Ridge Weather Beacon #4',
        temperatureC: 13.5,
        windSpeedKmh: 34.5,
        gustSpeedKmh: 46.0,
        windDirection: 'NE (045°)',
        visibilityKm: 8.5,
        cloudBaseM: 320,
        precipitationRiskPct: 40,
        flightSafetyIndex: 'CAUTION_GUSTS',
      });
    } else if (type === 'STORM') {
      soundFx.playAlert();
      onUpdateWeather({
        id: 'w-storm',
        stationName: 'Valley Microburst Doppler Station',
        temperatureC: 10.0,
        windSpeedKmh: 54.0,
        gustSpeedKmh: 72.0,
        windDirection: 'SW (220°)',
        visibilityKm: 2.1,
        cloudBaseM: 95,
        precipitationRiskPct: 92,
        flightSafetyIndex: 'NO_FLY_STORM',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                Aeronautical Meteorology & Micro-Weather Doppler Radar
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Live Station: {weather.stationName} • Low-Altitude Airspace Turbulence & Wind Shear Profiler
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
                weather.flightSafetyIndex === 'EXCELLENT'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : weather.flightSafetyIndex === 'CAUTION_GUSTS'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-red-500/15 text-red-300 border-red-500/40'
              }`}
            >
              {weather.flightSafetyIndex === 'EXCELLENT' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {weather.flightSafetyIndex === 'CAUTION_GUSTS' && <AlertTriangle className="w-3.5 h-3.5" />}
              {weather.flightSafetyIndex === 'NO_FLY_STORM' && <ShieldAlert className="w-3.5 h-3.5" />}
              AIRSPACE SAFETY: {weather.flightSafetyIndex.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Simulation Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs font-mono text-slate-400 mr-2">Simulate Atmospheric Scenario:</span>
          <button
            onClick={() => setScenario('FAIR')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            Fair Skies (Nominal)
          </button>
          <button
            onClick={() => setScenario('GUSTY')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            Ridge Crosswinds (35 km/h)
          </button>
          <button
            onClick={() => setScenario('STORM')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <CloudLightning className="w-3.5 h-3.5 text-red-400" />
            Microburst Storm (No-Fly Trigger)
          </button>
        </div>
      </div>

      {/* Main Weather Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">SUSTAINED WIND SPEED</span>
          <div className="text-3xl font-bold font-mono text-teal-300">
            {weather.windSpeedKmh} <span className="text-base text-slate-400">km/h</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            Gusts: {weather.gustSpeedKmh} km/h • Dir: {weather.windDirection}
          </span>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">OPTICAL VISIBILITY</span>
          <div className="text-3xl font-bold font-mono text-slate-100">
            {weather.visibilityKm} <span className="text-base text-slate-400">km</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            Forward Optical & LiDAR Detection Band
          </span>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">CLOUD CEILING</span>
          <div className="text-3xl font-bold font-mono text-slate-100">
            {weather.cloudBaseM} <span className="text-base text-slate-400">m AGL</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            Drone Cruise Envelope: 100m - 140m AGL
          </span>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">PRECIPITATION RISK</span>
          <div className="text-3xl font-bold font-mono text-teal-300">
            {weather.precipitationRiskPct}%
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            IP54 Water-Sealed Rotor Housings
          </span>
        </div>
      </div>

      {/* Autonomous Flight Guidance Advisory based on current weather */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 font-mono text-xs">
        <h3 className="text-sm font-semibold font-tech text-teal-300 flex items-center gap-2">
          <Compass className="w-4 h-4 text-teal-400" />
          Autonomous Flight Controller Micro-Adjustment Strategy
        </h3>
        <p className="text-slate-300 leading-relaxed">
          {weather.flightSafetyIndex === 'EXCELLENT' &&
            'Corridor Echo-9 operating under nominal BVLOS parameters. Airframe drag coefficient 0.28. Battery discharge curve calculated at standard 18.2 Wh/km consumption rate.'}
          {weather.flightSafetyIndex === 'CAUTION_GUSTS' &&
            'Wind shear alert: Flight computer commanding 4.2° crab angle yaw compensation. Cruise altitude reduced to 105m to exploit boundary-layer terrain shielding. Minimum landing battery reserve elevated from 20% to 28%.'}
          {weather.flightSafetyIndex === 'NO_FLY_STORM' &&
            'STORM SAFETY PROTOCOL ACTIVE: All non-emergency takeoffs suspended. Active airborne UAVs ordered to execute immediate priority diversion to nearest certified helipad or enter low-altitude holding pattern.'}
        </p>
      </div>
    </div>
  );
};
