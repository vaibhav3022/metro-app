import React, { useState } from 'react';
import { Train, Droplets, MapPin, Settings } from 'lucide-react'; // Simulating icons

const STATIONS = [
  "PCMC", "Sant Tukaram Nagar", "Bhosari (Nashik Phata)", "Kasarwadi",
  "Phugewadi", "Dapodi", "Bopodi", "Khadki", "Range Hills",
  "Shivaji Nagar", "Civil Court", "Budhwar Peth", "Mandai", "Swargate",
  "Vanaz", "Anand Nagar", "Ideal Colony", "Nal Stop",
  "Garware College", "Deccan Gymkhana", "Chhatrapati Sambhaji Udyan",
  "PMC", "Mangalwar Peth", "Pune Railway Station",
  "Ruby Hall Clinic", "Bund Garden", "Yerawada", "Kalyani Nagar", "Ramwadi"
];

const getFacilities = (stationName) => {
  const isInterchange = stationName === "Civil Court";
  const hasParking = ["PCMC", "Swargate", "Vanaz", "Ramwadi"].includes(stationName);
  return [
    { id: '1', name: 'Parking Available', icon: 'P', status: hasParking },
    { id: '2', name: 'Elevators / Lifts', icon: '↕', status: true },
    { id: '3', name: 'Escalators', icon: '↗', status: true },
    { id: '4', name: 'Drinking Water', icon: '💧', status: true },
    { id: '5', name: 'Washrooms', icon: '🚻', status: true },
    { id: '6', name: 'Interchange', icon: '⮀', status: isInterchange }
  ];
};

export default function StationInfo() {
  const [station, setStation] = useState(STATIONS[10]); // Civil Court default
  const facilities = getFacilities(station);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Station Info
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        View available facilities across all Pune Metro stations.
      </p>

      <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(155,89,182,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(155,89,182,0.3)' }}>
            <Train size={20} color="#9B59B6" />
          </div>
          <label style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Select Station</label>
        </div>
        
        <select 
          className="input-field" 
          value={station} 
          onChange={(e) => setStation(e.target.value)}
          style={{ width: '100%', appearance: 'auto' }}
        >
          {STATIONS.map(st => (
            <option key={st} value={st} style={{ color: '#000' }}>{st}</option>
          ))}
        </select>
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '20px', letterSpacing: '0.5px' }}>
        Facilities at {station}
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {facilities.map((fac) => (
          <div 
            key={fac.id} 
            className="glass-panel" 
            style={{ 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              opacity: fac.status ? 1 : 0.6,
              border: fac.status ? '1px solid var(--glass-border)' : '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '32px', 
              background: fac.status ? 'rgba(0,201,167,0.1)' : 'rgba(255,255,255,0.05)', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', 
              marginBottom: '16px', fontSize: '28px', color: fac.status ? '#00C9A7' : 'rgba(255,255,255,0.4)' 
            }}>
              {fac.icon}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: fac.status ? '#fff' : 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
              {fac.name}
            </div>
            {!fac.status && (
              <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: '10px' }}>
                Unavailable
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
