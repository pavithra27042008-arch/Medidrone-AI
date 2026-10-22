import React from 'react';
import { Drone, HospitalNode, MedicalMission } from '../../types';
import { exportMissionToCsv, printMedicalManifest } from '../../utils/reports';
import { soundFx } from '../../utils/audio';
import { 
  BarChart3, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Leaf, 
  TrendingUp 
} from 'lucide-react';

interface ReportsAnalyticsProps {
  missions: MedicalMission[];
  hospitals: HospitalNode[];
  fleet: Drone[];
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  missions,
  hospitals,
  fleet,
}) => {
  // Aggregate mock metrics
  const totalFlights = 164 + missions.length;
  const avgDeliveryMinutes = 14.2;
  const groundSavedMinutes = 42;
  const coldChainIntegrity = '99.8%';
  const carbonSavedKg = 842;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                Healthcare Logistics Analytics & Audit Reports
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              FAA Part 135 & WHO GDP Compliant Flight Logs • Official Digital Airway Bills & CSV Exports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Chain of Custody Verifiable
            </span>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">TOTAL SORTIES COMPLETED</span>
          <div className="text-3xl font-bold font-mono text-teal-300">
            {totalFlights}
          </div>
          <span className="text-[10px] font-mono text-emerald-400 mt-1 block">
            100% Mission Success Rate
          </span>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">AVG RESPONSE TIME</span>
          <div className="text-3xl font-bold font-mono text-slate-100">
            {avgDeliveryMinutes} <span className="text-base text-slate-400">min</span>
          </div>
          <span className="text-[10px] font-mono text-teal-300 mt-1 block">
            Saved {groundSavedMinutes} min vs ground transit
          </span>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">COLD-CHAIN INTEGRITY</span>
          <div className="text-3xl font-bold font-mono text-teal-300">
            {coldChainIntegrity}
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            0 Temperature Excursion Failures
          </span>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-md">
          <span className="text-xs font-mono text-slate-400 block mb-1">EMISSIONS OFFSET</span>
          <div className="text-3xl font-bold font-mono text-emerald-400">
            {carbonSavedKg} <span className="text-base text-slate-400">kg</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            Zero Direct Tailpipe Exhaust
          </span>
        </div>
      </div>

      {/* Flight History Log Table */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold font-tech text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            Medical UAV Sortie Registry & Chain of Custody
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Showing recent missions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-4">Tracking Code</th>
                <th className="p-4">Cargo & Urgency</th>
                <th className="p-4">Corridor (Origin → Dest)</th>
                <th className="p-4">Drone</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Reports & Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {missions.map(m => {
                const orig = hospitals.find(h => h.id === m.originHospitalId);
                const dest = hospitals.find(h => h.id === m.destinationHospitalId);
                const d = fleet.find(f => f.id === m.droneId);

                return (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-teal-300">{m.trackingNumber}</div>
                      <div className="text-[10px] text-slate-500">{m.flightStartTime} UTC</div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-100 font-semibold">{m.payload.name}</div>
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded mt-0.5 font-bold border ${
                        m.patientUrgency === 'CRITICAL_CODE_RED'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      }`}>
                        {m.patientUrgency.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="p-4 text-slate-300">
                      <div>{orig?.shortName} → {dest?.shortName}</div>
                      <div className="text-[10px] text-slate-500">{m.telemetry.totalDistanceKm} km</div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200">{d?.callsign || m.droneId}</div>
                      <div className="text-[10px] text-slate-500">{d?.model}</div>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/40">
                        {m.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            printMedicalManifest(m, orig, dest, d);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 text-[11px] flex items-center gap-1 transition-all"
                          title="Print / Save PDF Airway Bill"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          PDF
                        </button>

                        <button
                          onClick={() => {
                            soundFx.playClick();
                            exportMissionToCsv(m, orig, dest, d);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1 transition-all"
                          title="Export CSV Telemetry"
                        >
                          <Download className="w-3.5 h-3.5" />
                          CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
