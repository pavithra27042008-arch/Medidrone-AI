import React, { useState } from 'react';
import { EmergencyIncident, HospitalNode } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Ambulance, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Plus, 
  Send, 
  ShieldAlert, 
  Users, 
  Zap, 
  Activity 
} from 'lucide-react';

interface EmergencyResponseCenterProps {
  incidents: EmergencyIncident[];
  hospitals: HospitalNode[];
  onDispatchIncident: (incident: EmergencyIncident) => void;
  onCreateIncident: (incident: EmergencyIncident) => void;
}

export const EmergencyResponseCenter: React.FC<EmergencyResponseCenterProps> = ({
  incidents,
  hospitals,
  onDispatchIncident,
  onCreateIncident,
}) => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [severity, setSeverity] = useState<EmergencyIncident['severity']>('CRITICAL_TRAUMA');
  const [location, setLocation] = useState<string>('');
  const [targetHospitalId, setTargetHospitalId] = useState<string>(hospitals[0]?.id || '');
  const [casualties, setCasualties] = useState<number>(2);
  const [suppliesStr, setSuppliesStr] = useState<string>('Universal O- Blood (2 Units), AED CPR Unit');
  const [description, setDescription] = useState<string>('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location) return;

    soundFx.playAlert();
    const newInc: EmergencyIncident = {
      id: `inc-${Date.now().toString().slice(-4)}`,
      title,
      severity,
      location,
      hospitalTargetId: targetHospitalId,
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'ACTIVE_DISPATCH',
      casualtiesCount: Number(casualties),
      neededSupplies: suppliesStr.split(',').map(s => s.trim()),
      recommendedDroneCallsign: 'MEDIC-ONE',
      description: description || 'Urgent field emergency triage reported via emergency command hotline.',
    };

    onCreateIncident(newInc);
    setIsCreating(false);
    setTitle('');
    setLocation('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-slate-100">
                Emergency Response & Critical Incident Center
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Real-Time Emergency Dispatch Triage • AI Airspace Priority Routing & Multi-Casualty Coordination
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsCreating(!isCreating);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-lg shadow-red-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Report Emergency Incident (SOS)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Incident Intake Form */}
      {isCreating && (
        <form onSubmit={handleFormSubmit} className="bg-slate-900/90 border border-red-500/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold font-tech text-red-300 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              Emergency Incident Dispatch Intake
            </h3>
            <span className="text-[10px] font-mono text-red-400">PRIORITY 1 HIGH-RISK</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Incident Title / Emergency Nature:</label>
              <input
                type="text"
                placeholder="e.g. Mountain Pass Multi-Vehicle Rollover"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Triage Severity:</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as typeof severity)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-red-500 focus:outline-none"
              >
                <option value="MASS_CASUALTY">MASS CASUALTY (Code Red Priority 1)</option>
                <option value="CRITICAL_TRAUMA">CRITICAL TRAUMA (Immediate Airlift)</option>
                <option value="TOXIC_ENV">TOXIC / ENVENOMATION (Antidote Urgency)</option>
                <option value="PEDIATRIC_URGENT">PEDIATRIC / ORGAN PRESERVATION</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Location Coordinates / Landmark:</label>
              <input
                type="text"
                placeholder="e.g. Pine Ridge Trail Post 4 (Highland Sector)"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Target Receiving Facility Helipad:</label>
              <select
                value={targetHospitalId}
                onChange={e => setTargetHospitalId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-red-500 focus:outline-none"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.shortName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Estimated Casualties:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={casualties}
                onChange={e => setCasualties(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Required Biologics / Supplies (comma-separated):</label>
              <input
                type="text"
                value={suppliesStr}
                onChange={e => setSuppliesStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Field Clinical Description & Hazards:</label>
            <textarea
              rows={2}
              placeholder="Provide road blockages, weather conditions, or entrapped victims details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono shadow-lg transition-all"
            >
              Broadcast Emergency & Calculate Drone Intercept
            </button>
          </div>
        </form>
      )}

      {/* Incidents List */}
      <div className="grid grid-cols-1 gap-4">
        {incidents.map(inc => {
          const hosp = hospitals.find(h => h.id === inc.hospitalTargetId);

          return (
            <div
              key={inc.id}
              className="bg-slate-900/85 backdrop-blur-md border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-none" />
                    <h3 className="text-sm font-bold font-tech text-slate-100">
                      {inc.title}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                      {inc.severity.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {inc.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Reported: {inc.reportedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      Casualties: <strong className="text-red-300">{inc.casualtiesCount}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                    Status: {inc.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-mono bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                {inc.description}
              </p>

              {/* Supplies & AI Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Required Medical Biologics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inc.neededSupplies.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-teal-200 border border-slate-700 text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">AI Recommended Drone:</span>
                    <span className="text-teal-300 font-bold">{inc.recommendedDroneCallsign}</span>
                    <span className="text-[10px] text-slate-400 block">Target Hub: {hosp?.shortName}</span>
                  </div>

                  <button
                    onClick={() => {
                      soundFx.playTelemetryBeep(true);
                      onDispatchIncident(inc);
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Launch Intercept Mission
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
