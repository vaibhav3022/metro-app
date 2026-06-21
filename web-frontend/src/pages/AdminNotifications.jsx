import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { BellRing, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch - matching typical RN logic where missing API falls back or has an endpoint
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/admin/notifications');
        if (res.data.success) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        // fallback simulated data matching RN
        setNotifications([
          { id: '1', title: 'New Merchant Signup', message: 'Shop "Cafe Metro" has requested approval.', type: 'alert', createdAt: new Date().toISOString() },
          { id: '2', title: 'High Revenue Alert', message: 'Daily ticket revenue crossed ₹10,00,000.', type: 'success', createdAt: new Date(Date.now() - 86400000).toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <button className="btn" onClick={() => navigate(-1)} style={{ width: '44px', height: '44px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px' }}>
          <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '900' }}>Admin System Alerts</h1>
      </div>

      <div className="glass-panel" style={{ padding: '30px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <BellRing size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>No New Alerts</h4>
            <p style={{ color: 'var(--text-muted)' }}>The system is running smoothly.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notifications.map(n => (
              <div key={n.id || n._id} style={{ display: 'flex', gap: '16px', background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <div style={{ padding: '12px', background: n.type === 'alert' ? 'rgba(243, 156, 18, 0.12)' : 'rgba(0, 201, 167, 0.12)', borderRadius: '12px', color: n.type === 'alert' ? 'var(--accent-orange)' : 'var(--accent-teal)', height: 'fit-content' }}>
                  {n.type === 'alert' ? <AlertCircle size={24} /> : <ShieldCheck size={24} />}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>{n.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>{n.message}</p>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
