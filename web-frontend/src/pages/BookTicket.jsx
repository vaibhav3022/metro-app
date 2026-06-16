import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Ticket, ArrowRight, ArrowLeftRight, Users, RefreshCw, Milestone, Landmark } from 'lucide-react';

const ALL_STATIONS = [
  // Purple Line
  'PCMC', 'Sant Tukaram Nagar', 'Bhosari', 'Kasarwadi', 'Phugewadi', 
  'Dapodi', 'Bopodi', 'Khadki', 'Range Hills', 'Shivajinagar', 
  'Civil Court', 'Budhwar Peth', 'Mandai', 'Swargate',
  // Aqua Line
  'Vanaz', 'Anand Nagar', 'Ideal Colony', 'Nal Stop', 'Garware College', 
  'Deccan Gymkhana', 'Chhatrapati Sambhaji Udyan', 'PMC', 'Mangalwar Peth', 
  'Pune Railway Station', 'Ruby Hall Clinic', 'Bund Garden', 'Yerawada', 
  'Kalyani Nagar', 'Ramwadi'
].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates (like Civil Court)

export default function BookTicket() {
  const navigate = useNavigate();
  
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [isReturn, setIsReturn] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [fareInfo, setFareInfo] = useState(null);
  const [error, setError] = useState('');

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
    setFareInfo(null);
  };

  const calculateFare = async () => {
    if (!source || !destination) {
      setError('Please select both source and destination stations.');
      return;
    }
    if (source === destination) {
      setError('Source and destination cannot be the same.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/tickets/calculate-fare', {
        source,
        destination,
        passengers,
        isReturn
      });
      if (res.data.success) {
        setFareInfo(res.data);
      } else {
        setError(res.data.message || 'Error calculating fare.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate fare.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!fareInfo) return;
    
    // Save details and redirect to payment
    navigate('/payment', {
      state: {
        source,
        destination,
        passengers,
        isReturn,
        distance: fareInfo.distance,
        farePerPerson: fareInfo.farePerPerson,
        totalAmount: fareInfo.totalFare,
        discountApplied: fareInfo.discountApplied
      }
    });
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Book Metro Ticket
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Select your stations and book single or return journey tickets instantly.
      </p>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', marginBottom: '20px', fontWeight: '600' }}>
          {error}
        </div>
      )}

      <div className="row">
        {/* Selection panel */}
        <div className="col glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Source Station */}
          <div className="form-group">
            <label>From Station (Source)</label>
            <select 
              className="input-field" 
              value={source} 
              onChange={(e) => { setSource(e.target.value); setFareInfo(null); }}
              style={{ background: '#0e0f22' }}
            >
              <option value="">Select Origin Station</option>
              {ALL_STATIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleSwap}
            style={{ width: '48px', height: '48px', borderRadius: '50%', alignSelf: 'center', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <ArrowLeftRight size={18} color="var(--accent-teal)" />
          </button>

          {/* Destination Station */}
          <div className="form-group">
            <label>To Station (Destination)</label>
            <select 
              className="input-field" 
              value={destination} 
              onChange={(e) => { setDestination(e.target.value); setFareInfo(null); }}
              style={{ background: '#0e0f22' }}
            >
              <option value="">Select Destination Station</option>
              {ALL_STATIONS.filter(s => s !== source).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '10px 0' }} />

          {/* Passengers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>Number of Passengers</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Max 6 per booking</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '4px' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => { setPassengers(Math.max(1, passengers - 1)); setFareInfo(null); }}
                style={{ width: '36px', height: '36px', padding: 0, minWidth: '36px', borderRadius: '8px' }}
                disabled={passengers <= 1}
              >
                -
              </button>
              <span style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>{passengers}</span>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => { setPassengers(Math.min(6, passengers + 1)); setFareInfo(null); }}
                style={{ width: '36px', height: '36px', padding: 0, minWidth: '36px', borderRadius: '8px' }}
                disabled={passengers >= 6}
              >
                +
              </button>
            </div>
          </div>

          {/* Journey Type */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>Journey Type</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>One-way or Return trip</div>
            </div>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', border: '1px solid var(--glass-border)' }}>
              <button 
                type="button" 
                onClick={() => { setIsReturn(false); setFareInfo(null); }}
                className="btn" 
                style={{ padding: '8px 16px', background: !isReturn ? 'rgba(0, 201, 167, 0.15)' : 'transparent', color: !isReturn ? 'var(--accent-teal)' : 'var(--text-secondary)', fontSize: '13px' }}
              >
                One-Way
              </button>
              <button 
                type="button" 
                onClick={() => { setIsReturn(true); setFareInfo(null); }}
                className="btn" 
                style={{ padding: '8px 16px', background: isReturn ? 'rgba(0, 201, 167, 0.15)' : 'transparent', color: isReturn ? 'var(--accent-teal)' : 'var(--text-secondary)', fontSize: '13px' }}
              >
                Return
              </button>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-accent" 
            onClick={calculateFare} 
            disabled={loading || !source || !destination}
            style={{ marginTop: '10px', height: '50px' }}
          >
            {loading ? 'Calculating...' : (
              <>
                <RefreshCw size={16} /> Calculate Fare
              </>
            )}
          </button>

        </div>

        {/* Fare Summary Panel */}
        {fareInfo && (
          <div className="col glass-panel animate-pulse-slow" style={{ padding: '30px', borderLeft: '4px solid var(--accent-teal)', animationDuration: '0.8s', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>Ticket Breakdown</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Milestone size={16} /> Est. Distance:</span>
                <span style={{ fontWeight: '600' }}>{fareInfo.distance} km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Ticket size={16} /> Fare per passenger:</span>
                <span style={{ fontWeight: '600' }}>₹{fareInfo.farePerPerson}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Passengers:</span>
                <span style={{ fontWeight: '600' }}>{passengers}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Landmark size={16} /> Platform Discount:</span>
                <span style={{ color: 'var(--accent-teal)', fontWeight: '700' }}>{fareInfo.discountApplied}</span>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Total Fare:</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)' }}>₹{fareInfo.totalFare}</span>
                {fareInfo.totalFare >= 100 && (
                  <span style={{ fontSize: '12px', color: 'var(--accent-teal)', fontWeight: 'bold' }}>
                    + ₹{Math.floor(fareInfo.totalFare * 0.05)} Wallet Cashback (5%)
                  </span>
                )}
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleProceed}
              style={{ width: '100%', height: '52px', marginTop: 'auto' }}
            >
              Proceed to Payment <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
