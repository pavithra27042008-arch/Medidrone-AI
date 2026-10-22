import React from 'react';
import { UserAccount } from '../../types';
import { RoleSwitcher } from './RoleSwitcher';
import { soundFx } from '../../utils/audio';
import { 
  Activity, 
  Bell, 
  Box, 
  Building2, 
  Compass, 
  Cpu, 
  FileText, 
  Moon, 
  Package, 
  Plane, 
  Plus, 
  Radio, 
  ShieldAlert, 
  ShieldCheck, 
  Snowflake, 
  Sun, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  Wind 
} from 'lucide-react';

export type ActiveTab = 
  | '3D_MAP'
  | '3D_INSPECTOR'
  | 'EMERGENCY_CENTER'
  | 'HOSPITALS'
  | 'FLEET'
  | 'INVENTORY'
  | 'DEMAND_FORECAST'
  | 'COLD_CHAIN'
  | 'WEATHER'
  | 'AI_ADVISOR'
  | 'REPORTS'
  | 'AUDIT_LOGS';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenWorkflow: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  activeMissionCount: number;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenWorkflow,
  isMuted,
  onToggleMute,
  isDarkMode,
  onToggleDarkMode,
  activeMissionCount,
  unreadNotificationsCount,
  onOpenNotifications,
  currentUser,
  allUsers,
  onSelectUser,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: '3D_MAP', label: '3D Command Center', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: '3D_INSPECTOR', label: '3D UAV Studio', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'EMERGENCY_CENTER', label: 'Emergency Response', icon: <ShieldAlert className="w-3.5 h-3.5" />, badge: 'SOS' },
    { id: 'HOSPITALS', label: 'Hospital Network', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'FLEET', label: 'Fleet Ops', icon: <Plane className="w-3.5 h-3.5" /> },
    { id: 'INVENTORY', label: 'Smart Inventory', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'DEMAND_FORECAST', label: 'AI Demand Forecast', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'COLD_CHAIN', label: 'Cold-Chain Telemetry', icon: <Snowflake className="w-3.5 h-3.5" /> },
    { id: 'WEATHER', label: 'Weather Radar', icon: <Wind className="w-3.5 h-3.5" /> },
    { id: 'AI_ADVISOR', label: 'AI Logistics Advisor', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'REPORTS', label: 'Flight Logs & PDF', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'AUDIT_LOGS', label: 'Compliance Audit', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors select-none ${
      isDarkMode 
        ? 'bg-slate-950/90 border-slate-800 text-slate-100' 
        : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        
        {/* Brand Logo & Official Tagline */}
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => {
            soundFx.playClick();
            onSelectTab('3D_MAP');
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 shrink-0">
            <Plane className="w-5 h-5 -rotate-45 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-tech text-base md:text-lg font-bold tracking-wider flex items-center">
                MEDIDRONE<span className="text-teal-500 ml-1">AI</span>
              </h1>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isDarkMode 
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' 
                  : 'bg-teal-50 text-teal-700 border-teal-200'
              }`}>
                PROTOTYPE v2.4
              </span>
            </div>
            <p className={`text-[10px] font-mono italic hidden sm:block ${
              isDarkMode ? 'text-teal-400/90' : 'text-teal-700'
            }`}>
              “Delivering Healthcare Beyond Boundaries.”
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              Airspace: <strong className={isDarkMode ? 'text-teal-300' : 'text-teal-700'}>BVLOS Active</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-teal-500" />
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              RTK-GNSS: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>19 Sats (±2cm)</strong>
            </span>
          </div>

          {activeMissionCount > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${
              isDarkMode 
                ? 'bg-teal-500/15 border-teal-500/40 text-teal-300' 
                : 'bg-teal-50 border-teal-200 text-teal-800 font-semibold'
            }`}>
              <Activity className="w-3 h-3 text-teal-500" />
              <span>{activeMissionCount} Sortie Airborne</span>
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Smart Notifications Bell */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenNotifications();
            }}
            className={`relative p-2 rounded-xl border transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-teal-300' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-teal-600'
            }`}
            title="Open Smart Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-md">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleDarkMode();
            }}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleMute();
            }}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                : isDarkMode ? 'bg-teal-500/15 border-teal-500/40 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Role Switcher RBAC */}
          <RoleSwitcher
            currentUser={currentUser}
            allUsers={allUsers}
            onSelectUser={onSelectUser}
          />

          {/* Primary Action: Dispatch Drone */}
          <button
            onClick={() => {
              soundFx.playTelemetryBeep();
              onOpenWorkflow();
            }}
            className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Dispatch UAV</span>
          </button>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className={`max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1.5 border-t ${
        isDarkMode ? 'border-slate-900' : 'border-slate-100'
      }`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              soundFx.playClick(1000);
              onSelectTab(tab.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? isDarkMode
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 font-bold shadow-sm'
                  : 'bg-teal-50 text-teal-800 border border-teal-300 font-bold shadow-sm'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[9px] px-1 rounded bg-red-500 text-white font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
