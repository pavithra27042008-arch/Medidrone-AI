import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Lock, 
  CheckCircle2, 
  FileText, 
  Clock 
} from 'lucide-react';

interface AuditLogsViewProps {
  auditLogs: AuditLogEntry[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filtered = auditLogs.filter(log => {
    const matchSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
                        log.details.toLowerCase().includes(search.toLowerCase()) ||
                        log.userId.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const exportAuditCsv = () => {
    soundFx.playClick();
    const rows = [
      ['LOG_ID', 'TIMESTAMP', 'USER_ID', 'ROLE', 'CATEGORY', 'ACTION', 'DETAILS', 'IP_HASH'],
      ...filtered.map(l => [
        l.id,
        l.timestamp,
        l.userId,
        l.userRole,
        l.category,
        l.action,
        `"${l.details.replace(/"/g, '""')}"`,
        l.ipHash,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MediDrone_Audit_Trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                Regulatory Compliance Audit Trail & Chain of Custody
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              FAA Part 135 & WHO Good Distribution Practice (GDP) Immutable Action Logging
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAuditCsv}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              Export Audit CSV
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit actions, user IDs, biometric tokens..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 font-mono focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['ALL', 'DISPATCH', 'MISSION', 'SECURITY', 'INVENTORY', 'CONFIG'].map(cat => (
              <button
                key={cat}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User & Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Event Details</th>
                <th className="p-4">Verification Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-teal-300 font-bold">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {entry.timestamp}
                    </div>
                    <span className="text-[10px] text-slate-500">ID: {entry.id}</span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div className="text-slate-100 font-semibold">{entry.userId}</div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-teal-400 border border-slate-700">
                      {entry.userRole}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                      {entry.action}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Cat: {entry.category}</span>
                  </td>

                  <td className="p-4 text-slate-200 max-w-md">
                    {entry.details}
                  </td>

                  <td className="p-4 whitespace-nowrap text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-teal-400" />
                      <span>{entry.ipHash}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
