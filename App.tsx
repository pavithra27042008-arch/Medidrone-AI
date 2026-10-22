import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/common/Navbar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { RegionalMapScene } from './components/3d/RegionalMapScene';
import { DroneInspectorView } from './components/3d/DroneInspectorView';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { EmergencyResponseCenter } from './components/dashboard/EmergencyResponseCenter';
import { HospitalNetworkDirectory } from './components/dashboard/HospitalNetworkDirectory';
import { FleetManagement } from './components/dashboard/FleetManagement';
import { MedicalInventory } from './components/dashboard/MedicalInventory';
import { DemandForecastingView } from './components/dashboard/DemandForecastingView';
import { ColdChainMonitor } from './components/dashboard/ColdChainMonitor';
import { WeatherRadar } from './components/dashboard/WeatherRadar';
import { AiLogisticsAssistant } from './components/dashboard/AiLogisticsAssistant';
import { ReportsAnalytics } from './components/dashboard/ReportsAnalytics';
import { AuditLogsView } from './components/dashboard/AuditLogsView';
import { WorkflowModal } from './components/missions/WorkflowModal';
import { 
  DEMO_USERS, 
  INITIAL_ACTIVE_MISSION, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_DEMAND_FORECASTS, 
  INITIAL_DRONES, 
  INITIAL_HOSPITALS, 
  INITIAL_INCIDENTS, 
  INITIAL_INVENTORY, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_WEATHER 
} from './data/mockData';
import { 
  AuditLogEntry, 
  DemandForecast, 
  Drone, 
  EmergencyIncident, 
  HospitalNode, 
  InventoryItem, 
  MedicalMission, 
  SmartNotification, 
  UserAccount, 
  WeatherCondition 
} from './types';
import { soundFx } from './utils/audio';
import { ShieldCheck, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('3D_MAP');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserAccount>(DEMO_USERS[0]);
  const [allUsers] = useState<UserAccount[]>(DEMO_USERS);

  // Core Data State
  const [hospitals, setHospitals] = useState<HospitalNode[]>(INITIAL_HOSPITALS);
  const [fleet, setFleet] = useState<Drone[]>(INITIAL_DRONES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [weather, setWeather] = useState<WeatherCondition>(INITIAL_WEATHER);
  const [activeMission, setActiveMission] = useState<MedicalMission | null>(INITIAL_ACTIVE_MISSION);
  const [missionsHistory, setMissionsHistory] = useState<MedicalMission[]>([INITIAL_ACTIVE_MISSION]);
  const [notifications, setNotifications] = useState<SmartNotification[]>(INITIAL_NOTIFICATIONS);
  const [incidents, setIncidents] = useState<EmergencyIncident[]>(INITIAL_INCIDENTS);
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>(INITIAL_DEMAND_FORECASTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Interactive UI state
  const [isWorkflowOpen, setIsWorkflowOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedHospital, setSelectedHospital] = useState<HospitalNode | null>(null);
  const [isObstacleSimulated, setIsObstacleSimulated] = useState<boolean>(false);
  const [preselectedAssetId, setPreselectedAssetId] = useState<string | undefined>(undefined);
  const [preselectedHospitalId, setPreselectedHospitalId] = useState<string | undefined>(undefined);

  // Log an audit trail action
  const logAuditAction = (action: string, details: string, category: AuditLogEntry['category'] = 'MISSION') => {
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      userId: currentUser.id,
      userRole: currentUser.role,
      action,
      details,
      category,
      ipHash: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}::SHA256-OK`,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Audio mute toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFx.setMuted(nextMuted);
  };

  // Theme toggle
  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Notification actions
  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSelectNotification = (n: SmartNotification) => {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    setIsNotificationDrawerOpen(false);
    if (n.targetTab) {
      setActiveTab(n.targetTab as ActiveTab);
    }
  };

  // Launch workflow with specific hospital
  const handleSelectHospitalForRoute = (hosp: HospitalNode) => {
    setPreselectedHospitalId(hosp.id);
    setIsWorkflowOpen(true);
  };

  // Dispatch asset from inventory
  const handleDispatchAsset = (item: InventoryItem) => {
    setPreselectedAssetId(item.id);
    setIsWorkflowOpen(true);
    logAuditAction('INVENTORY_DISPATCH_TRIGGERED', `Requested aerial dispatch for ${item.name} (${item.batchNumber}).`, 'INVENTORY');
  };

  // Emergency Incident Dispatch
  const handleDispatchIncident = (incident: EmergencyIncident) => {
    setPreselectedHospitalId(incident.hospitalTargetId);
    setIsWorkflowOpen(true);
    logAuditAction('EMERGENCY_INCIDENT_INTERCEPT', `Dispatched aerial response for ${incident.title} (${incident.severity}).`, 'DISPATCH');
  };

  // Create Emergency Incident
  const handleCreateIncident = (incident: EmergencyIncident) => {
    setIncidents(prev => [incident, ...prev]);
    // Also push a critical notification
    const newNotif: SmartNotification = {
      id: `notif-${Date.now().toString().slice(-4)}`,
      type: 'EMERGENCY',
      severity: 'CRITICAL',
      title: `Emergency Incident: ${incident.title}`,
      message: `Reported at ${incident.location}. Casualties: ${incident.casualtiesCount}.`,
      timestamp: incident.reportedAt,
      read: false,
      targetTab: 'EMERGENCY_CENTER',
    };
    setNotifications(prev => [newNotif, ...prev]);
    logAuditAction('INCIDENT_CREATED', `Logged SOS incident: ${incident.title}`, 'MISSION');
  };

  // Proactive Prepositioning from Demand Forecast
  const handlePrepositionStock = (forecast: DemandForecast) => {
    setIsWorkflowOpen(true);
    logAuditAction('PREDICTIVE_PREPOSITION_ORDER', `Executed AI supply buffering for ${forecast.categoryLabel}.`, 'INVENTORY');
  };

  // Update inventory units
  const handleUpdateInventoryUnits = (itemId: string, newUnits: number) => {
    setInventory(prev => prev.map(item => item.id === itemId ? { ...item, unitsAvailable: newUnits } : item));
    logAuditAction('INVENTORY_STOCK_UPDATE', `Manual stock adjustment for item #${itemId} to ${newUnits} units.`, 'INVENTORY');
  };

  // Drone Fleet Actions
  const handleChargeDrone = (droneId: string) => {
    setFleet(prev => prev.map(d => d.id === droneId ? { ...d, batteryPercentage: 100, status: 'READY' } : d));
    logAuditAction('DRONE_RAPID_CHARGE', `Initiated 100% solid-state charge cycle on UAV #${droneId}.`, 'CONFIG');
  };

  const handleRunDiagnostic = (droneId: string) => {
    setFleet(prev => prev.map(d => d.id === droneId ? { ...d, batteryHealthPct: 100, lastMaintenanceDate: '2026-10-19' } : d));
    logAuditAction('DRONE_FFT_DIAGNOSTIC', `Completed bearing vibration and RTK compass calibration on UAV #${droneId}.`, 'CONFIG');
  };

  // Mission Created in Workflow
  const handleMissionCreated = (newMission: MedicalMission, updatedInv: InventoryItem[]) => {
    setActiveMission(newMission);
    setMissionsHistory(prev => [newMission, ...prev]);
    setInventory(updatedInv);
    logAuditAction(
      'MISSION_EXECUTED_SORTIE',
      `Launched Sortie #${newMission.trackingNumber} to ${newMission.destinationHospitalId}. Route: ${newMission.selectedRouteName || 'Primary Corridor'}.`,
      'DISPATCH'
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const originHospital = hospitals.find(h => h.id === activeMission?.originHospitalId) || hospitals[0];
  const destHospital = hospitals.find(h => h.id === activeMission?.destinationHospitalId) || hospitals[1];
  const activeDrone = fleet.find(d => d.id === activeMission?.droneId) || fleet[0];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenWorkflow={() => {
          setPreselectedAssetId(undefined);
          setPreselectedHospitalId(undefined);
          setIsWorkflowOpen(true);
        }}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        activeMissionCount={activeMission ? 1 : 0}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={setCurrentUser}
      />

      {/* Demo Airspace & Safety Disclaimer Banner */}
      <div className={`px-4 py-1.5 text-[11px] font-mono border-b flex flex-wrap items-center justify-between gap-2 ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          <span>
            OPERATIONAL ROLE: <strong className={isDarkMode ? 'text-teal-300' : 'text-teal-700'}>{currentUser.title}</strong> [{currentUser.role}]
          </span>
          <span className="hidden md:inline">• Facility: {currentUser.hospitalAffiliation}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
            <Info className="w-3 h-3" /> DEMO ENVIRONMENT (Simulated GPS & Telemetry Engine)
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">FAA Part 135 & WHO GDP Compliant</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* 1. 3D Regional Digital Twin & Command Center */}
        {activeTab === '3D_MAP' && (
          <div className="flex-1 flex flex-col relative w-full h-full min-h-[calc(100vh-140px)]">
            <div className="flex-1 relative w-full h-[62vh] min-h-[420px]">
              <RegionalMapScene
                hospitals={hospitals}
                activeMission={activeMission}
                onSelectHospital={(h) => setSelectedHospital(h)}
                selectedHospitalId={selectedHospital?.id}
                isSimulatingObstacle={isObstacleSimulated}
              />
            </div>

            <div className="max-w-7xl mx-auto w-full p-4">
              <CommandCenter
                activeMission={activeMission}
                drone={activeDrone}
                origin={originHospital}
                destination={destHospital}
                weather={weather}
                onOpenWorkflow={() => setIsWorkflowOpen(true)}
                onTriggerObstacleSimulation={() => setIsObstacleSimulated(!isObstacleSimulated)}
                isObstacleSimulated={isObstacleSimulated}
              />
            </div>
          </div>
        )}

        {/* 2. Detailed 3D Drone Studio & Subsystem Inspector */}
        {activeTab === '3D_INSPECTOR' && (
          <div className="flex-1 relative w-full h-[calc(100vh-140px)] min-h-[580px]">
            <DroneInspectorView />
          </div>
        )}

        {/* 3. Emergency Response Center */}
        {activeTab === 'EMERGENCY_CENTER' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            <EmergencyResponseCenter
              incidents={incidents}
              hospitals={hospitals}
              onDispatchIncident={handleDispatchIncident}
              onCreateIncident={handleCreateIncident}
            />
          </div>
        )}

        {/* 4. Hospital Network Directory */}
        {activeTab === 'HOSPITALS' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            <HospitalNetworkDirectory
              hospitals={hospitals}
              onSelectHospitalForRoute={handleSelectHospitalForRoute}
              onInspect3D={(h) => {
                setSelectedHospital(h);
                setActiveTab('3D_MAP');
              }}
            />
          </div>
        )}

        {/* 5. Drone Fleet Management */}
        {activeTab === 'FLEET' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            <FleetManagement
              fleet={fleet}
              hospitals={hospitals}
              onSelectDroneForInspection={() => setActiveTab('3D_INSPECTOR')}
              onChargeDrone={handleChargeDrone}
              onRunDiagnostic={handleRunDiagnostic}
            />
          </div>
        )}

        {/* 6. Smart Medical Inventory */}
        {activeTab === 'INVENTORY' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            <MedicalInventory
              inventory={inventory}
              hospitals={hospitals}
              onDispatchAsset={handleDispatchAsset}
              onUpdateQuantity={handleUpdateInventoryUnits}
            />
          </div>
        )}

        {/* 7. AI Demand Forecasting */}
        {activeTab === 'DEMAND_FORECAST' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            <DemandForecastingView
              forecasts={demandForecasts}
              onPrepositionStock={handlePrepositionStock}
            />
          </div>
        )}

        {/* 8. Biological Cold-Chain Telemetry */}
        {activeTab === 'COLD_CHAIN' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            <ColdChainMonitor activeMission={activeMission} />
          </div>
        )}

        {/* 9. Meteorological & Airspace Radar */}
        {activeTab === 'WEATHER' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            <WeatherRadar
              weather={weather}
              onUpdateWeather={setWeather}
            />
          </div>
        )}

        {/* 10. AI Flight Surgeon & Logistics Advisor */}
        {activeTab === 'AI_ADVISOR' && (
          <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
            <AiLogisticsAssistant
              activeMission={activeMission}
              fleet={fleet}
              weather={weather}
            />
          </div>
        )}

        {/* 11. Flight Logs & Analytics Manifests */}
        {activeTab === 'REPORTS' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            <ReportsAnalytics
              missions={missionsHistory}
              hospitals={hospitals}
              fleet={fleet}
            />
          </div>
        )}

        {/* 12. Regulatory Compliance Audit Trail */}
        {activeTab === 'AUDIT_LOGS' && (
          <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
            <AuditLogsView auditLogs={auditLogs} />
          </div>
        )}

      </main>

      {/* Smart Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onSelectNotification={handleSelectNotification}
      />

      {/* 8-Step Interactive End-to-End Medical Workflow Modal */}
      <WorkflowModal
        isOpen={isWorkflowOpen}
        onClose={() => {
          setIsWorkflowOpen(false);
          setPreselectedAssetId(undefined);
          setPreselectedHospitalId(undefined);
        }}
        hospitals={hospitals}
        fleet={fleet}
        inventory={inventory}
        weather={weather}
        onMissionCreated={handleMissionCreated}
        preselectedHospitalId={preselectedHospitalId || selectedHospital?.id}
        preselectedAssetId={preselectedAssetId}
        onLogAuditAction={logAuditAction}
      />
    </div>
  );
}
