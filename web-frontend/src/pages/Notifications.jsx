import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Bell, CheckCircle, Info, Tag, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type, isRead) => {
    const color = isRead ? 'var(--text-muted)' : 'var(--accent-teal)';
    switch(type) {
      case 'transaction': return <RefreshCw size={20} color={color} />;
      case 'alert': return <AlertTriangle size={20} color={isRead ? 'var(--text-muted)' : 'var(--accent-red)'} />;
      case 'promotion': return <Tag size={20} color={isRead ? 'var(--text-muted)' : 'var(--accent-purple)'} />;
      default: return <Info size={20} color={color} />;
    }
  };

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Notifications
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Stay updated with transit alerts and promotional offers.
          </p>
        </div>
        <button onClick={markAllRead} className="btn" style={{ background: 'rgba(0, 201, 167, 0.1)', color: 'var(--accent-teal)', border: '1px solid rgba(0, 201, 167, 0.3)' }}>
          <CheckCircle size={16} /> Mark all as read
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Bell size={48} color="rgba(0, 201, 167, 0.2)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>No New Notifications</h3>
            <p style={{ color: 'var(--text-secondary)' }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((item, idx) => (
              <div 
                key={item._id}
                onClick={() => !item.isRead && markRead(item._id)}
                style={{
                  display: 'flex', gap: '16px', padding: '20px', cursor: item.isRead ? 'default' : 'pointer',
                  borderBottom: idx < notifications.length - 1 ? '1px solid var(--glass-border)' : 'none',
                  background: item.isRead ? 'transparent' : 'rgba(0, 201, 167, 0.05)',
                  transition: 'background 0.2s ease',
                  position: 'relative'
                }}
                onMouseOver={(e) => { if (!item.isRead) e.currentTarget.style.background = 'rgba(0, 201, 167, 0.1)' }}
                onMouseOut={(e) => { if (!item.isRead) e.currentTarget.style.background = 'rgba(0, 201, 167, 0.05)' }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: item.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(0, 201, 167, 0.15)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                  {getIcon(item.type, item.isRead)}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: item.isRead ? '600' : '800', color: item.isRead ? '#fff' : 'var(--accent-teal)', marginBottom: '4px' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                    {item.message}
                  </p>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
                {!item.isRead && (
                  <div style={{ position: 'absolute', top: '24px', right: '20px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-teal)' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
