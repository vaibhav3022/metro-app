import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, QrCode, Ticket, ShieldAlert, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';

export default function TicketHistory() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [scanStation, setScanStation] = useState('PCMC'); // Default scanner simulation station
  const [scanType, setScanType] = useState('entry'); // entry | exit
  const [scanMessage, setScanMessage] = useState('');
  const [scanSuccess, setScanSuccess] = useState(null);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets/history');
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Error fetching ticket history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSimulateScan = async () => {
    if (!selectedTicket) return;
    setScanMessage('');
    setScanSuccess(null);
    try {
      const res = await api.post('/tickets/verify-qr', {
        qrData: selectedTicket.qrData,
        scanType,
        currentStation: scanStation
      });

      if (res.data.success) {
        setScanSuccess(true);
        setScanMessage(res.data.message);
        // Refresh ticket list to update statuses
        fetchTickets();
        // Update selected ticket view
        const updatedTicket = { ...selectedTicket, ticketStatus: scanType === 'entry' ? 'entered' : 'used' };
        setSelectedTicket(updatedTicket);
      }
    } catch (err) {
      setScanSuccess(false);
      setScanMessage(err.response?.data?.message || 'Scanning barrier denied entry.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-primary">Active QR</span>;
      case 'entered':
        return <span className="badge badge-warning">In Transit</span>;
      case 'used':
        return <span className="badge badge-success">Completed</span>;
      case 'expired':
        return <span className="badge badge-danger">Expired</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Ticket Bookings & Boarding Pass
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        View and manage your active boarding passes, scan entry/exit gates, and check trip logs.
      </p>

      <div className="row">
        {/* Tickets List */}
        <div className="col glass-panel" style={{ padding: '30px', flex: 1.5 }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Your Commute History</h3>
          
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No tickets booked yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tickets.map((ticket) => (
                <div 
                  key={ticket._id} 
                  onClick={() => setSelectedTicket(ticket)}
                  style={{ 
                    padding: '20px', 
                    borderRadius: '16px', 
                    background: selectedTicket?._id === ticket._id ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: selectedTicket?._id === ticket._id ? '1px solid var(--accent-teal)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', color: 'var(--accent-teal)' }}>
                      <Ticket size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '16px' }}>
                        {ticket.source} <ArrowRight size={14} style={{ display: 'inline', margin: '0 4px' }} /> {ticket.destination}
                      </h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <span>{ticket.passengers} Passenger(s)</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontWeight: '800' }}>₹{ticket.totalAmount || ticket.fare}</span>
                    {getStatusBadge(ticket.ticketStatus)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR Code Boarding pass preview */}
        <div className="col glass-panel" style={{ padding: '30px', flex: 1, minWidth: '320px' }}>
          {selectedTicket ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Boarding Pass (QR Code)</h3>
              
              {/* QR Render wrapper */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', display: 'inline-block', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                {selectedTicket.qrData ? (
                  <QRCodeSVG 
                    value={selectedTicket.qrData} 
                    size={180} 
                    level={"H"}
                    includeMargin={false}
                  />
                ) : (
                  <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                    No QR Generated
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontWeight: '800', fontSize: '18px' }}>{selectedTicket.source} ➔ {selectedTicket.destination}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                  ID: {selectedTicket.ticketId}
                </p>
                <div style={{ marginTop: '12px' }}>
                  {getStatusBadge(selectedTicket.ticketStatus)}
                </div>
              </div>

              {/* simulated barcode scanner hardware for local dev tests */}
              {(selectedTicket.ticketStatus === 'active' || selectedTicket.ticketStatus === 'entered') && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}><QrCode size={16} /> Simulate Scanner Gate</h4>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    <select 
                      className="input-field" 
                      value={scanStation} 
                      onChange={(e) => setScanStation(e.target.value)}
                      style={{ height: '40px', fontSize: '13px', padding: '0 10px', background: '#0e0f22' }}
                    >
                      <option value="PCMC">PCMC Station (Purple)</option>
                      <option value="Civil Court">Civil Court (Interchange)</option>
                      <option value="Ramwadi">Ramwadi Station (Aqua)</option>
                      <option value={selectedTicket.destination}>{selectedTicket.destination} (Ticket Dest)</option>
                    </select>

                    <select 
                      className="input-field" 
                      value={scanType} 
                      onChange={(e) => setScanType(e.target.value)}
                      style={{ height: '40px', fontSize: '13px', padding: '0 10px', background: '#0e0f22' }}
                    >
                      <option value="entry">Entry Gate</option>
                      <option value="exit">Exit Gate</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleSimulateScan}
                    className="btn btn-accent" 
                    style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                  >
                    Scan QR at Barrier
                  </button>

                  {scanSuccess !== null && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '10px', 
                      borderRadius: '8px', 
                      fontSize: '13px',
                      fontWeight: '600',
                      border: '1px solid',
                      background: scanSuccess ? 'rgba(0, 201, 167, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderColor: scanSuccess ? 'rgba(0, 201, 167, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: scanSuccess ? 'var(--accent-teal)' : 'var(--accent-red)'
                    }}>
                      {scanMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Clock size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Select a ticket from the list to display your secure boarding pass.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
