import React, { useState } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, Save, X, Edit2, Wallet, Ticket, Bell, HelpCircle } from 'lucide-react';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ text: 'Name field cannot be left blank.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await api.put('/auth/profile', { name, email, phone });
      if (res.data.success) {
        setUser(res.data.user);
        setIsEditing(false);
        setMessage({ text: 'Profile updated successfully.', type: 'success' });
      }
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Error updating profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of your current session?')) {
      logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { icon: <Ticket size={20} />, title: 'My Tickets', subtitle: 'View booking history and QR codes', path: '/history' },
    { icon: <Wallet size={20} />, title: 'Wallet Balances', subtitle: 'Recharge card or check statements', path: '/wallet' },
    { icon: <Bell size={20} />, title: 'Notifications', subtitle: 'Check metro updates and announcements', path: '/notifications' },
    { icon: <HelpCircle size={20} />, title: 'Help & Support', subtitle: 'Reach out for billing or transit inquiries', path: '/support' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'MT';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        My Profile
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Manage your account settings and preferences.
      </p>

      {message.text && (
        <div style={{
          padding: '12px', borderRadius: '8px', marginBottom: '20px',
          background: message.type === 'success' ? 'rgba(0, 201, 167, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: message.type === 'success' ? 'var(--accent-teal)' : 'var(--accent-red)',
          border: `1px solid ${message.type === 'success' ? 'rgba(0, 201, 167, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {message.text}
        </div>
      )}

      <div className="row">
        {/* Avatar Card */}
        <div className="col glass-panel" style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #00C9A7, #9B59B6)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            <span style={{ fontSize: '36px', fontWeight: '900', color: '#fff' }}>{initials}</span>
          </div>

          {!isEditing ? (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '4px' }}>{user?.name || 'Metro Traveler'}</h2>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Phone size={14} /> +91 {user?.phone || '9999999999'}
                </div>
                {user?.email && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Mail size={14} /> {user.email}
                  </div>
                )}
              </div>
              <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ width: '100%' }}>
                <Edit2 size={16} /> Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Name</label>
                <div className="input-group">
                  <User size={18} color="var(--text-muted)" />
                  <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <div className="input-group">
                  <Phone size={18} color="var(--text-muted)" />
                  <input type="text" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-group">
                  <Mail size={18} color="var(--text-muted)" />
                  <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)' }}>
                  <X size={16} /> Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={16} /> {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Quick Links */}
        <div className="col" style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Links</h3>
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            {menuItems.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer',
                  borderBottom: idx < menuItems.length - 1 ? '1px solid var(--glass-border)' : 'none',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,201,167,0.1)', color: 'var(--accent-teal)', marginRight: '16px' }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{item.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleLogout} className="btn" style={{ marginTop: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)', width: '100%', height: '54px' }}>
            <LogOut size={18} /> Log Out of Account
          </button>
        </div>
      </div>
    </div>
  );
}
