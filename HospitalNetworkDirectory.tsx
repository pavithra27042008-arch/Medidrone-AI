import React, { useState } from 'react';
import { HospitalNode } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Search, 
  Send, 
  CheckCircle2, 
  Layers, 
  Snowflake, 
  Radio, 
  ArrowUpRight 
} from 'lucide-react';

interface HospitalNetworkDirectoryProps {
  hospitals: HospitalNode[];
  onSelectHospitalForRoute: (hospital: HospitalNode) => void;
  onInspect3D: (hospital: HospitalNode) => void;
}

export const HospitalNetworkDirectory: React.FC<HospitalNetworkDirectoryProps> = ({
  hospitals,
  onSelectHospitalForRoute,
  onInspect3D,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filtered = hospitals.filter(h => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
                        h.shortName.toLowerCase().includes(search.toLowerCase()) ||
                        h.contactPerson.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'ALL' || h.type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                Regional Healthcare Facilities & Helipad Network
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Synchronized Trauma Centers, Blood Biorepositories, Laboratories & Remote Highland Health Posts
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30">
              Active Helipads: {hospitals.reduce((acc, h) => acc + h.availableLandingPads, 0)} Landing Pads
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search facilities, clinicians, phone numbers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 font-mono focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Facilities' },
              { id: 'TRAUMA_CENTER', label: 'Trauma Centers' },
              { id: 'BLOOD_BANK', label: 'Blood Banks' },
              { id: 'CHILDRENS_RESEARCH', label: 'Pediatric' },
              { id: 'REMOTE_CLINIC', label: 'Remote Stations' },
              { id: 'CENTRAL_PHARMACY', label: 'Pharmacies' },
              { id: 'LAB_QUARANTINE', label: 'Bio-Labs' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedType(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all border ${
                  selectedType === tab.id
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(hosp => (
          <div
            key={hosp.id}
            className="bg-slate-900/85 backdrop-blur-md border border-slate-850 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700 uppercase font-bold">
                    {hosp.type.replace(/_/g, ' ')}
                  </span>
                  <h3 className="font-bold text-sm text-slate-100 font-tech mt-1.5">
                    {hosp.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{hosp.shortName}</span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                  hosp.status === 'OPERATIONAL'
                    ? 'bg-teal-500/15 text-teal-300 border-teal-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                }`}>
                  {hosp.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-4 pt-3 border-t border-slate-800/80">
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block">HELIPAD ELEVATION</span>
                  <span className="text-slate-200 font-bold">{hosp.helipadElevationM}m AGL</span>
                  <span className="text-[9px] text-teal-400 block">{hosp.availableLandingPads} Pads Ready</span>
                </div>

                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block">PELTIER RECHARGE</span>
                  <span className="text-slate-200 font-bold">{hosp.hasPeltierRecharge ? 'Active' : 'Standard'}</span>
                  <span className="text-[9px] text-slate-400 block">4°C / -70°C Dock</span>
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-3 space-y-1 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{hosp.contactPerson}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-teal-300">{hosp.contactPhone}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onInspect3D(hosp);
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-all flex items-center justify-center gap-1"
              >
                <Radio className="w-3.5 h-3.5 text-teal-400" />
                Focus 3D Twin
              </button>

              <button
                onClick={() => {
                  soundFx.playTelemetryBeep();
                  onSelectHospitalForRoute(hosp);
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                Route Drone
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
