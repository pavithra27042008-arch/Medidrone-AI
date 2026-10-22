import React, { useState } from 'react';
import { CargoCategory, HospitalNode, InventoryItem } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Thermometer, 
  Layers 
} from 'lucide-react';

interface MedicalInventoryProps {
  inventory: InventoryItem[];
  hospitals: HospitalNode[];
  onDispatchAsset: (item: InventoryItem) => void;
  onUpdateQuantity: (itemId: string, newUnits: number) => void;
}

export const MedicalInventory: React.FC<MedicalInventoryProps> = ({
  inventory,
  hospitals,
  onDispatchAsset,
  onUpdateQuantity,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                Regional Medical Biologics & Emergency Cargo Inventory
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Synchronized Bio-Bank Reserves • Automated RFID Stock Tracking & Expiry Alerts
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30">
              Total Managed SKUs: {inventory.length}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by medical asset name, batch code or blood type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Biologics' },
              { id: 'WHOLE_BLOOD', label: 'Blood & Plasma' },
              { id: 'ANTIVENOM', label: 'Antivenoms' },
              { id: 'VACCINE_COLD_CHAIN', label: 'Vaccines' },
              { id: 'ORGAN_TRANSPLANT', label: 'Organs' },
              { id: 'EMERGENCY_AED', label: 'AED Defibrillators' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all border ${
                  selectedCategory === tab.id
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

      {/* Inventory Table */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-4">Medical Cargo / Specimen</th>
                <th className="p-4">Storage Facility</th>
                <th className="p-4">Temp Zone</th>
                <th className="p-4">Units Available</th>
                <th className="p-4">Batch / Expiry</th>
                <th className="p-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredItems.map(item => {
                const hosp = hospitals.find(h => h.id === item.hospitalId);
                const isLow = item.unitsAvailable <= item.minimumThreshold;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-100">{item.name}</div>
                      <div className="text-[10px] text-teal-400 mt-0.5 font-mono">
                        {item.category.replace(/_/g, ' ')} • {item.unitWeightKg} kg/unit
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200">{hosp?.name || item.hospitalId}</div>
                      <div className="text-[10px] text-slate-500">{hosp?.shortName}</div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-teal-300 font-semibold">{item.storageTempC}°C</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{item.temperatureZone}</div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold font-mono ${isLow ? 'text-amber-400' : 'text-slate-100'}`}>
                          {item.unitsAvailable}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (Min: {item.minimumThreshold})
                        </span>
                      </div>
                      {isLow && (
                        <span className="text-[9px] text-amber-400 uppercase font-bold block mt-0.5">
                          Low Stock Alert
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-[11px] text-slate-400">
                      <div>Batch: <span className="text-slate-300">{item.batchNumber}</span></div>
                      <div>Exp: <span className="text-slate-300">{item.expiryDate}</span></div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            soundFx.playClick(1050);
                            onDispatchAsset(item);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Dispatch UAV
                        </button>
                        <button
                          onClick={() => {
                            soundFx.playClick(800);
                            onUpdateQuantity(item.id, item.unitsAvailable + 5);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
                          title="Restock +5 Units"
                        >
                          <Plus className="w-3.5 h-3.5" />
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
