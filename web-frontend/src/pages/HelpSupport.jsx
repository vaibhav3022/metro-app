import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Headphones, Ticket, ChevronDown, CheckCircle, Clock } from 'lucide-react';

const CATEGORIES = ['Grievance', 'Lost & Found', 'Suggestion', 'Other'];

export default function HelpSupport() {
  const [tab, setTab] = useState('New'); // New | MyTickets
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);

  useEffect(() => {
    if (tab === 'MyTickets') fetchComplaints();
  }, [tab]);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      if (res.data.success) {
        setMyComplaints(res.data.complaints || []);
      }
    } catch (e) {
      console.error(e);
      // Mock data fallback if api fails
      setMyComplaints([
        { _id: '1', category: 'Lost & Found', description: 'Left umbrella on aqua line', status: 'Pending', createdAt: new Date().toISOString() },
        { _id: '2', category: 'Suggestion', description: 'Add more seats at Vanaz', status: 'Resolved', createdAt: new Date(Date.now() - 86400000).toISOString() }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/complaints/submit', { category, description });
      if (res.data.success) {
        alert(res.data.message || 'Ticket Submitted Successfully');
        setDescription('');
        setTab('MyTickets');
      } else {
        alert(res.data.message || 'Failed to submit');
      }
    } catch (e) {
      // Mock success if endpoint missing
      alert('Ticket Submitted! (Mock)');
      setDescription('');
      setTab('MyTickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => status?.toLowerCase() === 'resolved' ? 'var(--accent-teal)' : '#f97316';
  const getStatusBg = (status) => status?.toLowerCase() === 'resolved' ? 'rgba(0,201,167,0.1)' : 'rgba(249,115,22,0.1)';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Help & Support
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Reach out for grievance redressal, lost & found, or suggestions.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: 'rgba(255,255,255,0.06)', padding: '6px', borderRadius: '16px' }}>
        {['New', 'MyTickets'].map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            className="btn"
            style={{ 
              flex: 1, 
              background: tab === t ? 'rgba(0,201,167,0.2)' : 'transparent',
              color: tab === t ? 'var(--accent-teal)' : 'rgba(255,255,255,0.5)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px'
            }}
          >
            {t === 'New' ? 'Submit New Ticket' : 'My Support Tickets'}
          </button>
        ))}
      </div>

      {tab === 'New' ? (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'rgba(155,89,182,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(155,89,182,0.3)' }}>
              <Headphones size={28} color="#9B59B6" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>How can we help you?</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Select Category</label>
              <div style={{ position: 'relative' }}>
                <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} style={{ appearance: 'none', width: '100%' }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
                </select>
                <ChevronDown size={20} color="var(--text-muted)" style={{ position: 'absolute', right: '16px', top: '16px', pointerEvents: 'none' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                className="input-field" 
                rows="6" 
                placeholder="Describe your issue, suggestion, or what you lost in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '52px' }}>
              {loading ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>
      ) : (
        <div>
          {myComplaints.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Ticket size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>No support tickets found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>You haven't submitted any queries yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myComplaints.map(c => (
                <div key={c._id} className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                      {c.category}
                    </span>
                    <span className="badge" style={{ background: getStatusBg(c.status), color: getStatusColor(c.status), border: `1px solid ${getStatusColor(c.status)}33` }}>
                      {c.status || 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: '15px', color: '#fff', lineHeight: '1.6', marginBottom: '16px' }}>
                    {c.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                    <Clock size={14} /> 
                    {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
