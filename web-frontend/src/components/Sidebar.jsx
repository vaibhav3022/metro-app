import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Train, LayoutDashboard, Ticket, Wallet, History, Store, LogOut, ShieldAlert, BadgeCent, User, Bell, Info, Calculator, Bus, HelpCircle, CreditCard, Map, Landmark } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const getLinks = () => {
    if (!user) return [];

    if (user.role === 'admin') {
      return [
        { path: '/admin', label: 'Admin Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/admin/merchants', label: 'Merchants', icon: <Store size={20} /> },
        { path: '/admin/stations', label: 'Station Config', icon: <Train size={20} /> },
        { path: '/admin/revenue', label: 'Revenue Analytics', icon: <ShieldAlert size={20} /> },
      ];
    }

    if (user.role === 'merchant') {
      return [
        { path: '/merchant', label: 'Merchant Panel', icon: <LayoutDashboard size={20} /> },
        { path: '/merchant/shop', label: 'My Shop Config', icon: <Store size={20} /> },
        { path: '/merchant/analytics', label: 'Sales Analytics', icon: <BadgeCent size={20} /> },
      ];
    }

    // Default Passenger
    return [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { path: '/book', label: 'Book Ticket', icon: <Ticket size={20} /> },
      { path: '/wallet', label: 'Digital Wallet', icon: <Wallet size={20} /> },
      { path: '/history', label: 'Ticket History', icon: <History size={20} /> },
      { path: '/token-economy', label: 'Token Economy', icon: <Landmark size={20} /> },
      { path: '/metro-map', label: 'Metro Map', icon: <Map size={20} /> },
      { path: '/shops', label: 'Local Shops', icon: <Store size={20} /> },
      { path: '/smart-card', label: 'Smart Card', icon: <CreditCard size={20} /> },
      { path: '/fare-calculator', label: 'Fare Calculator', icon: <Calculator size={20} /> },
      { path: '/station-info', label: 'Station Info', icon: <Info size={20} /> },
      { path: '/feeder-services', label: 'Feeder Services', icon: <Bus size={20} /> },
      { path: '/notifications', label: 'Notifications', icon: <Bell size={20} /> },
      { path: '/support', label: 'Help & Support', icon: <HelpCircle size={20} /> },
      { path: '/profile', label: 'Profile', icon: <User size={20} /> },
    ];
  };

  const navLinks = getLinks();

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingLeft: '8px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FFFFFF', padding: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'var(--box-shadow)' }}>
          <img src="/pune_metro_logo.png" alt="Pune Metro Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px' }}>PUNE METRO</span>
      </div>

      {/* Nav Link items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/admin' || link.path === '/merchant'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
              color: isActive ? '#fff' : 'var(--text-primary)',
              background: isActive ? 'var(--accent-teal)' : 'transparent',
              border: isActive ? '1px solid var(--accent-teal)' : '1px solid transparent',
              textDecoration: 'none',
              fontWeight: isActive ? '600' : '500',
              transition: 'all 0.2s ease',
            })}
            className="nav-item-hover"
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Profile info & Logout */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingLeft: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-purple))', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
            {user?.name?.[0]?.toUpperCase() || 'P'}
          </div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>{user?.name || 'Passenger'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '10px 16px', justifyContent: 'flex-start', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)' }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
