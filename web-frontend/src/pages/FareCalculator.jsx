import React, { useState } from 'react';
import { Calculator, MapPin, Clock } from 'lucide-react';

const ALL_STATIONS = [
  "PCMC", "Sant Tukaram Nagar", "Bhosari (Nashik Phata)", "Kasarwadi",
  "Phugewadi", "Dapodi", "Bopodi", "Khadki", "Range Hills",
  "Shivaji Nagar", "Civil Court", "Budhwar Peth", "Mandai", "Swargate",
  "Vanaz", "Anand Nagar", "Ideal Colony", "Nal Stop",
  "Garware College", "Deccan Gymkhana", "Chhatrapati Sambhaji Udyan",
  "PMC", "Mangalwar Peth", "Pune Railway Station",
  "Ruby Hall Clinic", "Bund Garden", "Yerawada", "Kalyani Nagar", "Ramwadi"
];

export default function FareCalculator() {
  const [source, setSource] = useState(ALL_STATIONS[0]);
  const [destination, setDestination] = useState(ALL_STATIONS[10]);
  const [fareInfo, setFareInfo] = useState(null);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
    setFareInfo(null);
  };

  const calculateFare = () => {
    if (source === destination) {
      alert('Source and destination cannot be the same.');
      return;
    }
    const idx1 = ALL_STATIONS.indexOf(source);
    const idx2 = ALL_STATIONS.indexOf(destination);
    const distance = Math.abs(idx1 - idx2);

    let baseFare = 10;
    if (distance > 5) baseFare = 20;
    if (distance > 10) baseFare = 30;
    if (distance > 15) baseFare = 35;

    const time = distance * 3 + 2;
    setFareInfo({ fare: baseFare, time, distance });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Fare Calculator
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Estimate your journey time and ticket cost between any two metro stations.
      </p>

      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
        <div className="form-group">
          <label>From Station</label>
          <div className="input-group">
            <MapPin size={18} color="var(--accent-teal)" />
            <select className="input-field" value={source} onChange={(e) => { setSource(e.target.value); setFareInfo(null); }} style={{ appearance: 'auto' }}>
              {ALL_STATIONS.map(st => <option key={st} value={st} style={{color: '#000'}}>{st}</option>)}
            </select>
          </div>
        </div>

        <div style={{ position: 'relative', height: '2px', background: 'var(--glass-border)', margin: '10px 0' }}>
          <button 
            onClick={handleSwap}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '40px', height: '40px', borderRadius: '20px', background: 'var(--bg-secondary)',
              border: '1px solid var(--accent-teal)', color: 'var(--accent-teal)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 2
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}>
              <path d="m17 2 4 4-4 4" />
              <path d="M3 6h18" />
              <path d="M7 22l-4-4 4-4" />
              <path d="M21 18H3" />
            </svg>
          </button>
        </div>

        <div className="form-group">
          <label>To Station</label>
          <div className="input-group">
            <MapPin size={18} color="var(--accent-purple)" />
            <select className="input-field" value={destination} onChange={(e) => { setDestination(e.target.value); setFareInfo(null); }} style={{ appearance: 'auto' }}>
              {ALL_STATIONS.map(st => <option key={st} value={st} style={{color: '#000'}}>{st}</option>)}
            </select>
          </div>
        </div>

        <button onClick={calculateFare} className="btn btn-primary" style={{ height: '52px', marginTop: '10px' }}>
          Calculate Fare <Calculator size={18} />
        </button>
      </div>

      {fareInfo && (
        <div className="glass-panel" style={{ marginTop: '24px', padding: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', textAlign: 'center', marginBottom: '24px', letterSpacing: '0.5px' }}>
            Estimated Journey Details
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'rgba(0, 201, 167, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-teal)' }}>₹</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900' }}>₹{fareInfo.fare}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Ticket Fare</div>
            </div>

            <div style={{ width: '1px', height: '80px', background: 'var(--glass-border)' }}></div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'rgba(155, 89, 182, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
                <Clock size={24} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900' }}>{fareInfo.time}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Mins Est.</div>
            </div>

            <div style={{ width: '1px', height: '80px', background: 'var(--glass-border)' }}></div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'rgba(52, 152, 219, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
                <MapPin size={24} color="#3498DB" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900' }}>{fareInfo.distance}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Stops</div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
