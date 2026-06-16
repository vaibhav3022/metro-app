import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { BellRing, ArrowRight, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MerchantNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/merchant/notifications');
        if (res.data.success) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <button className="btn" onClick={() => navigate(-1)} style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.08)', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px' }}>
          <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '900' }}>Merchant Notifications</h1>
      </div>

      <div className="glass-panel" style={{ padding: '30px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading messages...</p>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <BellRing size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>No Notifications</h4>
            <p style={{ color: 'var(--text-muted)' }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notifications.map(n => (
              <div key={n._id || n.id} style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.04)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ padding: '12px', background: 'rgba(155, 89, 182, 0.15)', borderRadius: '12px', color: '#9B59B6', height: 'fit-content' }}>
                  <Store size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px', color: n.isRead ? '#fff' : '#00C9A7' }}>{n.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>{n.message}</p>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
