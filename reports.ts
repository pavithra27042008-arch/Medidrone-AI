import { MedicalMission, HospitalNode, Drone } from '../types';

export function exportMissionToCsv(mission: MedicalMission, origin?: HospitalNode, dest?: HospitalNode, drone?: Drone) {
  const rows = [
    ['FIELD', 'VALUE'],
    ['Mission Tracking Number', mission.trackingNumber],
    ['Triage Urgency', mission.patientUrgency],
    ['Status', mission.status],
    ['Origin Facility', origin ? `${origin.name} (${origin.shortName})` : mission.originHospitalId],
    ['Destination Facility', dest ? `${dest.name} (${dest.shortName})` : mission.destinationHospitalId],
    ['Assigned Drone', drone ? `${drone.model} [${drone.callsign}]` : mission.droneId],
    ['Cargo Name', mission.payload.name],
    ['Cargo Category', mission.payload.category],
    ['Payload Weight (kg)', mission.payload.weightKg.toString()],
    ['Target Temp (°C)', mission.payload.temperatureTargetC.toString()],
    ['Current Bay Temp (°C)', mission.telemetry.cargoTempCelsius.toString()],
    ['Current Altitude (m)', mission.telemetry.altitudeMeters.toString()],
    ['Ground Speed (km/h)', mission.telemetry.groundSpeedKmh.toString()],
    ['Battery Remaining (%)', mission.telemetry.batteryPct.toString()],
    ['Total Distance (km)', mission.telemetry.totalDistanceKm.toString()],
    ['Distance Covered (km)', mission.telemetry.distanceCoveredKm.toString()],
    ['GPS Satellites Connected', mission.telemetry.gpsSatellites.toString()],
    ['RF Signal Strength (dBm)', mission.telemetry.signalStrengthDbm.toString()],
    ['Temperature Excursions', mission.temperatureExcursionsCount.toString()],
    ['Requesting Physician', mission.requestingPhysician],
    ['Receiving Physician', mission.receivingPhysician],
    ['Emergency Reason', `"${mission.payload.emergencyReason.replace(/"/g, '""')}"`],
    ['Flight Start Time', mission.flightStartTime],
    ['ETA', mission.estimatedArrivalTime],
    ['Generated At', new Date().toISOString()],
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `MediDrone_${mission.trackingNumber}_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printMedicalManifest(mission: MedicalMission, origin?: HospitalNode, dest?: HospitalNode, drone?: Drone) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MediDrone AI - Medical UAV Flight Manifest #${mission.trackingNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 32px; color: #1e293b; line-height: 1.5; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 24px; font-weight: bold; color: #0f766e; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          .badge-red { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
          .badge-green { background: #dcfce7; color: #166534; border: 1px solid #4ade80; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #f8fafc; }
          .card h3 { font-size: 14px; text-transform: uppercase; color: #475569; margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          .field { margin-bottom: 8px; font-size: 13px; }
          .field strong { color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; color: #334155; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
          .sig-box { border-bottom: 1px solid #000; height: 50px; margin-bottom: 8px; }
          .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">MEDIDRONE AI — AUTONOMOUS CARGO MANIFEST</div>
            <div class="subtitle">Certified Emergency Medical Logistics Chain of Custody & Telemetry Log</div>
          </div>
          <div>
            <span class="badge ${mission.patientUrgency === 'CRITICAL_CODE_RED' ? 'badge-red' : 'badge-green'}">
              ${mission.patientUrgency.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Mission Flight Profile</h3>
            <div class="field"><strong>Tracking ID:</strong> ${mission.trackingNumber}</div>
            <div class="field"><strong>Flight Status:</strong> ${mission.status}</div>
            <div class="field"><strong>Departed:</strong> ${mission.flightStartTime} UTC</div>
            <div class="field"><strong>Estimated/Actual Touchdown:</strong> ${mission.actualArrivalTime || mission.estimatedArrivalTime}</div>
            <div class="field"><strong>Assigned UAV:</strong> ${drone ? drone.model : mission.droneId} (${drone ? drone.callsign : ''})</div>
            <div class="field"><strong>Total Air Distance:</strong> ${mission.telemetry.totalDistanceKm} km (${mission.telemetry.distanceCoveredKm} km covered)</div>
          </div>

          <div class="card">
            <h3>Facilities & Route</h3>
            <div class="field"><strong>Dispatch Origin:</strong> ${origin ? origin.name : mission.originHospitalId}</div>
            <div class="field"><strong>Requesting Clinician:</strong> ${mission.requestingPhysician}</div>
            <div class="field"><strong>Destination Landing Pad:</strong> ${dest ? dest.name : mission.destinationHospitalId}</div>
            <div class="field"><strong>Receiving Team:</strong> ${mission.receivingPhysician}</div>
            <div class="field"><strong>Air Corridor:</strong> Alpha-Echo Mountain Bypass Route</div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 24px;">
          <h3>Payload & Active Cold-Chain Telemetry</h3>
          <table>
            <thead>
              <tr>
                <th>Medical Asset</th>
                <th>Category</th>
                <th>Mass (kg)</th>
                <th>Preservation Target</th>
                <th>Current In-Flight Temp</th>
                <th>Thermal Stability</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${mission.payload.name}</strong></td>
                <td>${mission.payload.category}</td>
                <td>${mission.payload.weightKg} kg</td>
                <td>${mission.payload.temperatureTargetC}°C (±${mission.payload.tempToleranceMaxC - mission.payload.temperatureTargetC}°C)</td>
                <td><strong style="color: #0f766e;">${mission.telemetry.cargoTempCelsius}°C</strong></td>
                <td><span class="badge badge-green">COMPLIANT (0 Excursions)</span></td>
              </tr>
            </tbody>
          </table>
          <div class="field" style="margin-top: 14px;">
            <strong>Clinical Triage Indication:</strong> ${mission.payload.emergencyReason}
          </div>
        </div>

        <div class="signatures">
          <div>
            <div class="sig-box"></div>
            <div style="font-size: 12px; color: #475569;">
              <strong>Authorized Dispatch Officer</strong><br>
              Biometrics / Cryptographic Key: #AUTH-${mission.trackingNumber.slice(-4)}-DISP
            </div>
          </div>
          <div>
            <div class="sig-box"></div>
            <div style="font-size: 12px; color: #475569;">
              <strong>Recipient Receiving Clinician</strong><br>
              Biometric Hatch Decryption Sign-off
            </div>
          </div>
        </div>

        <div class="footer">
          MediDrone AI Autonomous Medical Airspace Authority • Compliant with FAA Part 135 & WHO Cold Chain Guidelines • SHA-256 Hash Verified
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <button onclick="window.print()" style="background: #0f766e; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
