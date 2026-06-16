import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { QrCode, AlertCircle, CheckCircle, ArrowRight, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner() {
  const navigate = useNavigate();
  
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!scanned) {
      const scanner = new Html5QrcodeScanner(
        "ticket-reader",
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
      );

      scanner.render(
        async (decodedText) => {
          setScanned(true);
          scanner.clear();
          await verifyTicket(decodedText);
        },
        (error) => {
          // ignore frame errors
        }
      );

      return () => {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      };
    }
  }, [scanned]);

  const verifyTicket = async (qrData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // If it's a JSON string (our format), parse and stringify again or just send raw.
      // The backend expects `qrData` to be whatever string the QR contains.
      const res = await api.post('/tickets/scan', { qrData });
      if (res.data.success || res.data.message) {
        setSuccess(res.data.message || 'Ticket Verified Successfully!');
      } else {
        throw new Error('Verification failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify ticket.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = () => {
    const code = prompt("Enter manual ticket code (e.g. DEMO-TICKET-123):");
    if (code) {
      setScanned(true);
      verifyTicket(code);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setError('');
    setSuccess('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <button className="btn" onClick={() => navigate(-1)} style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.08)', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px' }}>
          <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Scan Ticket QR</h1>
      </div>

      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
        
        {loading ? (
          <div style={{ padding: '60px 0' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '45px', background: 'rgba(0,201,167,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', border: '1px solid rgba(0,201,167,0.3)' }}>
              <div className="spin-animation" style={{ width: '40px', height: '40px', borderRadius: '20px', border: '4px solid transparent', borderTopColor: '#00C9A7', borderRightColor: '#00C9A7' }} />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '8px' }}>Verifying Ticket...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please wait while we check your ticket.</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 0' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '45px', background: 'rgba(239,68,68,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={40} color="#EF4444" />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '8px' }}>Scan Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{error}</p>
            <button onClick={resetScanner} className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px' }}>
              Try Again
            </button>
          </div>
        ) : success ? (
          <div style={{ padding: '40px 0' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '45px', background: 'rgba(0,201,167,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', border: '1px solid rgba(0,201,167,0.3)' }}>
              <CheckCircle size={40} color="#00C9A7" />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '8px' }}>Scan Successful</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{success}</p>
            <button onClick={() => navigate('/home')} className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px' }}>
              Back to Home
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: '#fff', color: '#000', padding: '10px', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
              <div id="ticket-reader" style={{ width: '100%' }}></div>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Align your digital or physical ticket QR code within the frame.</p>
            
            <button onClick={handleManualScan} className="btn" style={{ background: 'linear-gradient(to right, #9B59B6, #8E44AD)', color: '#fff', width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: '800' }}>
              Simulate Successful Scan
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}
