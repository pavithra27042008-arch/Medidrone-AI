export type PriorityTier = 'CRITICAL_CODE_RED' | 'HIGH_PRIORITY_1' | 'STANDARD_ROUTINE';

export type MissionStatus = 
  | 'PENDING_APPROVAL'
  | 'PRE_FLIGHT_CHECK'
  | 'TAKING_OFF'
  | 'EN_ROUTE'
  | 'AVOIDING_OBSTACLE'
  | 'APPROACHING'
  | 'LANDING'
  | 'DELIVERED'
  | 'ABORTED';

export type DroneStatus = 'READY' | 'IN_FLIGHT' | 'CHARGING' | 'MAINTENANCE' | 'OFFLINE';

export type CargoCategory = 
  | 'WHOLE_BLOOD'
  | 'ANTIVENOM'
  | 'VACCINE_COLD_CHAIN'
  | 'ORGAN_TRANSPLANT'
  | 'EMERGENCY_AED'
  | 'PLASMA_PLATELETS'
  | 'DIAGNOSTIC_SAMPLES'
  | 'CRITICAL_MEDICATION'
  | 'SURGICAL_KIT';

export type UserRole = 'ADMIN' | 'HOSPITAL_STAFF' | 'DRONE_OPERATOR' | 'AUDITOR';

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  hospitalAffiliation: string;
  badgeNumber: string;
}

export interface MedicalPayload {
  id: string;
  name: string;
  category: CargoCategory;
  weightKg: number;
  temperatureTargetC: number;
  tempToleranceMinC: number;
  tempToleranceMaxC: number;
  requiresBiometricRelease: boolean;
  donorId?: string;
  bloodType?: 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';
  expiryHours: number;
  emergencyReason: string;
  lotNumber?: string;
}

export interface HospitalNode {
  id: string;
  name: string;
  shortName: string;
  type: 'TRAUMA_CENTER' | 'CHILDRENS_RESEARCH' | 'BLOOD_BANK' | 'REMOTE_CLINIC' | 'COMMUNITY_HEALTH' | 'LAB_QUARANTINE' | 'CENTRAL_PHARMACY';
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  geoLat: number;
  geoLng: number;
  helipadElevationM: number;
  availableLandingPads: number;
  hasPeltierRecharge: boolean;
  contactPerson: string;
  contactPhone: string;
  status: 'OPERATIONAL' | 'HEAVY_TRAFFIC' | 'MAINTENANCE_HOLD';
  managedInventoryCount?: number;
}

export interface Drone {
  id: string;
  model: string;
  callsign: string;
  type: 'HEXACOPTER' | 'VTOL_TILT_ROTOR' | 'QUADCOPTER_HEAVY';
  status: DroneStatus;
  batteryPercentage: number;
  batteryHealthPct: number;
  maxPayloadKg: number;
  cruiseSpeedKmh: number;
  maxRangeKm: number;
  totalFlightHours: number;
  completedMissions: number;
  lastMaintenanceDate: string;
  currentHospitalId: string;
  colorScheme: 'ARCTIC_WHITE' | 'NAVY_RESCUE' | 'STEALTH_CARBON' | 'HUMANITARIAN_RED';
  activePayload?: MedicalPayload;
  firmwareVersion: string;
}

export interface MissionTelemetry {
  altitudeMeters: number;
  groundSpeedKmh: number;
  airspeedKmh: number;
  headingDegrees: number;
  batteryPct: number;
  estimatedRemainingMinutes: number;
  cargoTempCelsius: number;
  signalStrengthDbm: number;
  gpsSatellites: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  distanceCoveredKm: number;
  totalDistanceKm: number;
  obstacleDetected: boolean;
  obstacleDistanceM?: number;
}

export interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  estimatedMinutes: number;
  altitudeProfile: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'ELEVATED';
  weatherClearance: string;
  restrictedAirspaceConflict: boolean;
  energyConsumptionPct: number;
  recommended: boolean;
  waypoints: { x: number; y: number; z: number }[];
}

export interface MedicalMission {
  id: string;
  trackingNumber: string;
  patientUrgency: PriorityTier;
  originHospitalId: string;
  destinationHospitalId: string;
  droneId: string;
  payload: MedicalPayload;
  status: MissionStatus;
  progressPct: number; // 0 - 100
  flightStartTime: string;
  estimatedArrivalTime: string;
  actualArrivalTime?: string;
  requestingPhysician: string;
  receivingPhysician: string;
  telemetry: MissionTelemetry;
  routeWaypoints: { x: number; y: number; z: number }[];
  routeNotes?: string;
  temperatureExcursionsCount: number;
  selectedRouteName?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: CargoCategory;
  hospitalId: string;
  unitsAvailable: number;
  minimumThreshold: number;
  temperatureZone: string;
  storageTempC: number;
  unitWeightKg: number;
  batchNumber: string;
  expiryDate: string;
  status: 'OPTIMAL' | 'LOW_STOCK' | 'CRITICAL_DEPLETION' | 'EXPIRED';
  replenishmentRecommendation?: string;
}

export interface WeatherCondition {
  id: string;
  stationName: string;
  temperatureC: number;
  windSpeedKmh: number;
  gustSpeedKmh: number;
  windDirection: string;
  visibilityKm: number;
  cloudBaseM: number;
  precipitationRiskPct: number;
  flightSafetyIndex: 'EXCELLENT' | 'CAUTION_GUSTS' | 'NO_FLY_STORM';
}

export interface AIAnalysisResult {
  triageScore: number; // 1-100
  urgencyLevel: PriorityTier;
  recommendedDroneId: string;
  recommendedDroneName: string;
  estimatedFlightMinutes: number;
  weatherRiskAssessment: string;
  coldChainFeasibility: string;
  altitudeRecommendation: string;
  aiReasoning: string;
  riskFactors: string[];
  routeOptions?: RouteOption[];
}

export interface SmartNotification {
  id: string;
  type: 'EMERGENCY' | 'DELAY' | 'BATTERY' | 'TEMPERATURE' | 'INVENTORY' | 'MAINTENANCE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetTab?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userRole: UserRole;
  action: string;
  details: string;
  category: 'MISSION' | 'SECURITY' | 'INVENTORY' | 'DISPATCH' | 'CONFIG';
  ipHash: string;
}

export interface EmergencyIncident {
  id: string;
  title: string;
  severity: 'MASS_CASUALTY' | 'CRITICAL_TRAUMA' | 'TOXIC_ENV' | 'PEDIATRIC_URGENT';
  location: string;
  hospitalTargetId: string;
  reportedAt: string;
  status: 'ACTIVE_DISPATCH' | 'TRIAGED' | 'STANDBY' | 'RESOLVED';
  casualtiesCount: number;
  neededSupplies: string[];
  recommendedDroneCallsign: string;
  description: string;
}

export interface DemandForecast {
  category: CargoCategory;
  categoryLabel: string;
  currentStock: number;
  predictedUsageNext72h: number;
  spikeProbabilityPct: number;
  confidenceScore: number;
  driverReason: string;
  actionRecommendation: string;
}
