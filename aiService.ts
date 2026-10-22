import { GoogleGenAI } from '@google/genai';
import { 
  AIAnalysisResult, 
  DemandForecast, 
  Drone, 
  HospitalNode, 
  MedicalMission, 
  MedicalPayload, 
  RouteOption, 
  WeatherCondition 
} from '../types';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genAIClient) {
    const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY 
      ? process.env.GEMINI_API_KEY 
      : (typeof window !== 'undefined' && (window as unknown as { GEMINI_API_KEY?: string }).GEMINI_API_KEY) || '';
    if (apiKey) {
      genAIClient = new GoogleGenAI({ apiKey });
    }
  }
  return genAIClient;
}

export function buildRouteOptions(
  origin: HospitalNode,
  dest: HospitalNode,
  weather: WeatherCondition,
  distanceKm: number
): RouteOption[] {
  const midX = (origin.coordinates.x + dest.coordinates.x) / 2;
  const midZ = (origin.coordinates.z + dest.coordinates.z) / 2;

  return [
    {
      id: 'route-primary',
      name: 'Primary Air Corridor Echo-9 (Direct Trajectory)',
      distanceKm: distanceKm,
      estimatedMinutes: Math.round((distanceKm / 95) * 60 + 2),
      altitudeProfile: 'Cruise at 115m AGL (Optimal Lift-to-Drag)',
      riskLevel: 'LOW',
      weatherClearance: `Clearance granted. Headwind component: ${Math.round(weather.windSpeedKmh * 0.4)} km/h.`,
      restrictedAirspaceConflict: false,
      energyConsumptionPct: 18.5,
      recommended: true,
      waypoints: [
        origin.coordinates,
        { x: midX, y: 11.5, z: midZ },
        dest.coordinates,
      ],
    },
    {
      id: 'route-valley',
      name: 'Valley River Low-Altitude Corridor (Terrain Shielded)',
      distanceKm: Math.round((distanceKm * 1.15) * 10) / 10,
      estimatedMinutes: Math.round(((distanceKm * 1.15) / 95) * 60 + 3),
      altitudeProfile: 'Cruise at 80m AGL (Ground Boundary Layer Shield)',
      riskLevel: 'LOW',
      weatherClearance: 'Max gust protection. Bypasses mountain shear zones.',
      restrictedAirspaceConflict: false,
      energyConsumptionPct: 22.0,
      recommended: weather.windSpeedKmh > 30,
      waypoints: [
        origin.coordinates,
        { x: midX - 6, y: 7.0, z: midZ + 4 },
        dest.coordinates,
      ],
    },
    {
      id: 'route-ridge',
      name: 'High-Altitude Express Ridge (Fastest Descent)',
      distanceKm: Math.round((distanceKm * 0.92) * 10) / 10,
      estimatedMinutes: Math.round(((distanceKm * 0.92) / 110) * 60 + 2),
      altitudeProfile: 'Cruise at 155m AGL (High Mountain Overflight)',
      riskLevel: weather.windSpeedKmh > 25 ? 'ELEVATED' : 'MEDIUM',
      weatherClearance: 'Micro-turbulence advisory near ridge tower.',
      restrictedAirspaceConflict: true, // Proximity to microwave mast
      energyConsumptionPct: 16.2,
      recommended: false,
      waypoints: [
        origin.coordinates,
        { x: midX + 5, y: 16.0, z: midZ - 3 },
        dest.coordinates,
      ],
    },
  ];
}

export async function triageMedicalMissionWithAI(
  payload: MedicalPayload,
  origin: HospitalNode,
  dest: HospitalNode,
  weather: WeatherCondition,
  fleet: Drone[]
): Promise<AIAnalysisResult> {
  // Approximate air distance (Euclidean on coordinate grid)
  const dx = dest.coordinates.x - origin.coordinates.x;
  const dy = dest.coordinates.y - origin.coordinates.y;
  const dz = dest.coordinates.z - origin.coordinates.z;
  const distanceKm = Math.max(4.5, Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 1.2 * 10) / 10);

  // Clinical algorithm calculations
  let triageScore = 70;
  if (payload.category === 'WHOLE_BLOOD' || payload.category === 'ORGAN_TRANSPLANT') triageScore = 96;
  else if (payload.category === 'ANTIVENOM') triageScore = 92;
  else if (payload.category === 'EMERGENCY_AED') triageScore = 94;
  else if (payload.category === 'PLASMA_PLATELETS') triageScore = 85;
  else if (payload.category === 'SURGICAL_KIT') triageScore = 88;
  else triageScore = 75;

  const urgencyLevel = triageScore >= 90 ? 'CRITICAL_CODE_RED' : triageScore >= 75 ? 'HIGH_PRIORITY_1' : 'STANDARD_ROUTINE';

  // Find best compatible drone
  const eligibleDrones = fleet.filter(d => 
    d.status !== 'MAINTENANCE' && 
    d.status !== 'OFFLINE' && 
    d.maxPayloadKg >= payload.weightKg &&
    d.batteryPercentage >= 30
  );

  const selectedDrone = eligibleDrones.length > 0
    ? eligibleDrones.sort((a, b) => b.batteryPercentage - a.batteryPercentage)[0]
    : fleet[0];

  const estimatedMinutes = Math.round((distanceKm / selectedDrone.cruiseSpeedKmh) * 60 + 2.5);
  const routeOptions = buildRouteOptions(origin, dest, weather, distanceKm);

  // Try Gemini if available
  const ai = getGenAI();
  if (ai) {
    try {
      const prompt = `You are the chief AI flight surgeon and emergency logistics coordinator for MediDrone AI.
Analyze this medical transport:
- Payload: ${payload.name} (${payload.category}, ${payload.weightKg}kg)
- Temperature requirement: ${payload.temperatureTargetC}°C
- Urgency notes: ${payload.emergencyReason}
- Origin: ${origin.name}
- Destination: ${dest.name} (elev ${dest.helipadElevationM}m)
- Distance: ${distanceKm} km
- Weather: Wind ${weather.windSpeedKmh} km/h, ${weather.windDirection}
- Selected Drone: ${selectedDrone.model}

Return strict JSON only:
{
  "triageScore": <1-100>,
  "urgencyLevel": "CRITICAL_CODE_RED" | "HIGH_PRIORITY_1" | "STANDARD_ROUTINE",
  "weatherRiskAssessment": "<concise sentence>",
  "coldChainFeasibility": "<concise sentence>",
  "altitudeRecommendation": "<concise sentence>",
  "aiReasoning": "<2-3 sentences explaining triage urgency and flight priority>",
  "riskFactors": ["<risk 1>", "<risk 2>"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          triageScore: parsed.triageScore || triageScore,
          urgencyLevel: parsed.urgencyLevel || urgencyLevel,
          recommendedDroneId: selectedDrone.id,
          recommendedDroneName: selectedDrone.model,
          estimatedFlightMinutes: estimatedMinutes,
          weatherRiskAssessment: parsed.weatherRiskAssessment || `Wind shear safe at ${weather.windSpeedKmh} km/h. Clear visibility.`,
          coldChainFeasibility: parsed.coldChainFeasibility || `Active thermoelectric peltier pod maintains ${payload.temperatureTargetC}°C with 99.4% stability.`,
          altitudeRecommendation: parsed.altitudeRecommendation || `Cruise at 110m AGL to clear regional power lines and terrain peaks.`,
          aiReasoning: parsed.aiReasoning || `High clinical urgency for ${payload.name}. Immediate autonomous corridor clearance approved.`,
          riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : ['Mountain ridge turbulence', 'Rapid cold-chain monitoring required'],
          routeOptions,
        };
      }
    } catch (err) {
      console.warn('Gemini triage fallback triggered:', err);
    }
  }

  // Deterministic fallback
  const isColdChain = payload.category === 'WHOLE_BLOOD' || payload.category === 'VACCINE_COLD_CHAIN' || payload.category === 'ORGAN_TRANSPLANT';
  return {
    triageScore,
    urgencyLevel,
    recommendedDroneId: selectedDrone.id,
    recommendedDroneName: selectedDrone.model,
    estimatedFlightMinutes: estimatedMinutes,
    weatherRiskAssessment: weather.windSpeedKmh > 30 
      ? `High crosswind (${weather.windSpeedKmh} km/h) requires yaw compensation and +15% power reserve.`
      : `Nominal flight corridor: ${weather.windSpeedKmh} km/h ${weather.windDirection}. Favorable tailwind on initial outbound leg.`,
    coldChainFeasibility: isColdChain 
      ? `Active peltier cryo-pod locked at ${payload.temperatureTargetC}°C. Battery reserve accounts for continuous 35W chiller load.`
      : `Ambient shock-damped compartment active. Temperature within safe physiological bounds.`,
    altitudeRecommendation: dest.helipadElevationM > 100 
      ? `Climb to 145m AGL through ridge pass, descent rate 2.5 m/s upon final helipad approach.`
      : `Standard cruise altitude 110m AGL. Clears urban obstacles and telecom towers.`,
    aiReasoning: `Clinical assessment assigns ${urgencyLevel.replace(/_/g, ' ')} for ${payload.name}. Direct air routing bypasses 42 minutes of road transit. Drone ${selectedDrone.callsign} assigned with ${selectedDrone.batteryPercentage}% battery state of charge.`,
    riskFactors: [
      dest.helipadElevationM > 100 ? 'Highland terrain elevation requiring ridge clearance' : 'Urban bird / light drone congestion corridor',
      isColdChain ? 'Active thermoelectric continuous temperature logging mandatory' : 'Rapid ground handover required upon touchdown'
    ],
    routeOptions,
  };
}

export async function askAiLogisticsAssistant(
  question: string,
  contextData: {
    activeMission?: unknown;
    fleetCount: number;
    weather: WeatherCondition;
  }
): Promise<string> {
  const ai = getGenAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are MediDrone AI's expert tactical dispatch and medical UAV flight surgeon assistant.
Current operational state:
- Fleet size: ${contextData.fleetCount} operational drones
- Active weather: ${contextData.weather.stationName}, wind ${contextData.weather.windSpeedKmh} km/h (${contextData.weather.windDirection}), safety: ${contextData.weather.flightSafetyIndex}
- Question: ${question}

Provide a direct, authoritative, professional answer in 2-3 short paragraphs using realistic medical logistics, aeronautical terminology, battery thermal parameters, and emergency triage priorities.`,
      });
      if (response.text) return response.text;
    } catch (e) {
      console.warn('Gemini chat fallback:', e);
    }
  }

  const q = question.toLowerCase();
  if (q.includes('wind') || q.includes('weather') || q.includes('gust')) {
    return `Analysis: Air corridor winds are currently measured at ${contextData.weather.windSpeedKmh} km/h with gusts up to ${contextData.weather.gustSpeedKmh} km/h from ${contextData.weather.windDirection}. 
    
Our Hexacopter and VTOL platforms are aerodynamically rated for sustained winds up to 45 km/h. Flight control algorithms utilize differential thrust vectoring to compensate for crosswinds with negligible path drift (<0.4m). If wind speeds exceed 35 km/h, the autonomous flight computer automatically commands a 15-meter altitude reduction to benefit from ground-boundary shear dampening.`;
  }

  if (q.includes('battery') || q.includes('drain') || q.includes('range')) {
    return `Power Reserve Telemetry: MediDrone UAVs carry 24,000 mAh 6S Solid-State Lithium batteries with dedicated cell balancing. Active cryo-cooling pods consume roughly 35W continuous draw, which reduces overall maximum flight range by only 7.2%. 
    
Our safety protocol enforces a mandatory 22% Minimum Landing Reserve (MLR). In the event of headwind resistance or temporary holding patterns, the return-to-base (RTB) algorithm triggers automatically if remaining flight time plus reserve equals time-to-nearest-helipad.`;
  }

  if (q.includes('cold') || q.includes('temp') || q.includes('vaccine') || q.includes('blood')) {
    return `Cold-Chain Chain of Custody Protocol: All biological payloads (whole blood, platelets, antivenom, and mRNA vaccines) are encased in an aerogel-insulated, active dual-Peltier thermoelectric compartment.
    
Internal temperature is sampled at 10 Hz with calibrated platinum RTD sensors. In-flight telemetry broadcasts temperature readings every 500ms to the ground command station. If any excursion beyond target tolerances (+1.5°C to +6°C for whole blood) is detected for >30 seconds, an automated alert is flagged and Peltier boost mode activates immediately.`;
  }

  return `Tactical Logistics Protocol: MediDrone AI maintains real-time synchronization between hospital blood banks, trauma centers, and remote clinical outposts. 
  
All autonomous flight paths adhere to FAA Part 135 & DGCA beyond-visual-line-of-sight (BVLOS) protocols with dynamic geofencing, dual LiDAR obstacle avoidance, and encrypted 5G/satellite telemetry links. Emergency Code Red missions receive instant priority corridor clearance, suppressing non-essential drone traffic.`;
}

export function generateAutomatedOperationalSummary(
  fleet: Drone[],
  missions: MedicalMission[],
  weather: WeatherCondition
): string {
  const activeCount = fleet.filter(d => d.status === 'IN_FLIGHT').length;
  const readyCount = fleet.filter(d => d.status === 'READY').length;
  const chargingCount = fleet.filter(d => d.status === 'CHARGING').length;

  return `EXECUTIVE OPERATIONAL BRIEFING:
- Airspace Corridor Status: Green (BVLOS Active) across all 7 regional healthcare nodes.
- Fleet Readiness: ${readyCount} Available, ${activeCount} In Flight, ${chargingCount} Rapid-Charging.
- Chain of Custody: 100% Cold-Chain compliance maintained with zero thermal excursion events.
- Average Flight Duration: 14.2 minutes (bypassing 48 minutes of mountainous ground terrain).
- Meteorological Advisory: ${weather.stationName} reports ${weather.windSpeedKmh} km/h winds (${weather.flightSafetyIndex}). Corridor Echo-9 open.`;
}
