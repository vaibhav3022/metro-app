import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Landmark, Ticket, Store, ArrowRight, BellRing, Map, Calculator, Bus, CreditCard, HelpCircle, LogOut, History, QrCode } from 'lucide-react';

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const sliderImages = [
    { id: '1', source: '/assets/slider/metro_train.png', title: 'Smart Metro Travel' },
    { id: '2', source: '/assets/slider/station_shop.png', title: 'Station Retail Shops' },
    { id: '3', source: '/assets/slider/qr_payment.png', title: 'Cashless Payments' },
    { id: '4', source: '/assets/slider/digital_ticket.png', title: 'Digital QR Tickets' },
  ];

  useEffect(() => {
    // Determine greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const autoScroll = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliderImages.length);
    }, 3000);

    const fetchData = async () => {
      try {
        const walletRes = await api.get('/wallet/balance');
        if (walletRes.data.success) {
          setWalletBalance(walletRes.data.balance);
        }
        
        const tokenRes = await api.get('/tokens/balance');
        if (tokenRes.data.success) {
          setTokenBalance(tokenRes.data.tokenBalance);
        }

        const ticketRes = await api.get('/tickets/history');
        if (ticketRes.data.success) {
          setRecentTickets(ticketRes.data.tickets.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching home dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => clearInterval(autoScroll);
  }, []);

  const activeTicket = recentTickets?.find(t => t.ticketStatus === 'active' || t.ticketStatus === 'entered');

  const quickServices = [
    { title: 'Book Ticket', icon: <Ticket size={28} />, path: '/book', color: '#00C9A7' },
    { title: 'Ticket History', icon: <History size={28} />, path: '/history', color: '#8E44AD' },
    { title: 'Recharge', icon: <Wallet size={28} />, path: '/wallet', color: '#9B59B6' },
    { title: 'Metro Map', icon: <Map size={28} />, path: '/metro-map', color: '#3498DB' },
    { title: 'Fare Calc', icon: <Calculator size={28} />, path: '/fare-calculator', color: '#F39C12' },
    { title: 'Shops', icon: <Store size={28} />, path: '/shops', color: '#E74C3C' },
    { title: 'Scan & Pay', icon: <QrCode size={28} />, path: '/pay-merchant', color: '#1ABC9C' },
    { title: 'Scan Ticket', icon: <QrCode size={28} />, path: '/qr-scanner', color: '#E67E22' },
    { title: 'Smart Card', icon: <CreditCard size={28} />, path: '/smart-card', color: '#E91E63' },
    { title: 'Feeder Bus', icon: <Bus size={28} />, path: '/feeder-services', color: '#FF6B35' },
    { title: 'Help & Support', icon: <HelpCircle size={28} />, path: '/support', color: '#34495E' },
  ];

  return (
    <div>
      {/* Header greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{greeting},</p>
          <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0', letterSpacing: '-0.5px' }}>
            {user?.name || 'Passenger'} 👋
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/notifications" style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '22px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-primary)' }}>
            <BellRing size={20} />
            <span style={{ position: 'absolute', top: 10, right: 12, width: '8px', height: '8px', background: 'var(--accent-red)', borderRadius: '4px' }}></span>
          </Link>

          <Link to="/profile" style={{ width: '44px', height: '44px', borderRadius: '22px', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-purple))', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', fontWeight: '800', color: '#fff', boxShadow: '0 4px 12px rgba(0,201,167,0.3)', textDecoration: 'none' }}>
            {user?.name?.[0]?.toUpperCase() || 'P'}
          </Link>

          <button onClick={logout} className="btn" style={{ padding: '10px', background: 'rgba(239,68,68,0.2)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }} title="Logout">
            <LogOut size={20} color="#EF4444" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div style={{ width: '100%', height: '220px', borderRadius: '20px', overflow: 'hidden', position: 'relative', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
        {sliderImages.map((img, i) => (
          <div key={img.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: currentSlide === i ? 1 : 0, transition: 'opacity 0.5s ease', background: '#0e0f22' }}>
            <img src={img.source} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
              <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', letterSpacing: '0.5px' }}>{img.title}</h3>
            </div>
          </div>
        ))}
        {/* Pagination Dots */}
        <div style={{ position: 'absolute', bottom: '20px', right: '24px', display: 'flex', gap: '8px' }}>
          {sliderImages.map((_, i) => (
            <div key={i} style={{ width: currentSlide === i ? '24px' : '8px', height: '8px', borderRadius: '4px', background: currentSlide === i ? 'var(--accent-teal)' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s ease' }} />
          ))}
        </div>
      </div>

      {/* Balance Cards (Row) */}
      <div className="row">
        {/* Wallet balance */}
        <div className="col glass-panel stat-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--accent-teal)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Digital Wallet</span>
            <Wallet color="var(--accent-teal)" size={24} />
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px' }}>
            ₹{loading ? '...' : walletBalance.toFixed(2)}
          </h2>
          <Link to="/wallet" style={{ fontSize: '14px', color: 'var(--accent-teal)', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Top up Wallet <ArrowRight size={14} />
          </Link>
        </div>

        {/* Loyalty Token balance */}
        <div className="col glass-panel stat-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Metro loyalty Coins</span>
            <Landmark color="var(--accent-purple)" size={24} />
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px' }}>
            {loading ? '...' : tokenBalance} <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-muted)' }}>Tokens</span>
          </h2>
          <Link to="/token-economy" style={{ fontSize: '14px', color: 'var(--accent-purple)', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Earn & Redeem Tokens <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Quick Services */}
      <div style={{ marginBottom: '40px', marginTop: '40px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Quick Services</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
          {quickServices.map((service, index) => (
            <div 
              key={index} 
              className="glass-panel" 
              onClick={() => navigate(service.path)}
              style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s ease, border-color 0.2s ease', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = service.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              <div style={{ padding: '16px', borderRadius: '16px', background: `${service.color}15`, color: service.color, border: `1px solid ${service.color}30` }}>
                {service.icon}
              </div>
              <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>{service.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Ticket / Action Card */}
      <div className="row" style={{ marginTop: '40px' }}>
        {/* Active Ticket */}
        <div className="col glass-panel" style={{ padding: '30px', flex: 1.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>Recent Tickets</span>
              {activeTicket && <span className="badge badge-success">Active QR</span>}
            </h3>
            <Link to="/history" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-teal)', textDecoration: 'none' }}>View All →</Link>
          </div>

          {activeTicket ? (
            <div style={{ background: 'rgba(0,201,167,0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(0, 201, 167, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
                  {activeTicket.source} ➔ {activeTicket.destination}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                  {activeTicket.passengers} Passenger(s) • {activeTicket.isReturn ? 'Return Trip' : 'One Way'}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-teal)', fontWeight: '600', background: 'rgba(0, 201, 167, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                  <Ticket size={14} /> Active QR Ticket
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '24px', fontWeight: '900' }}>₹{activeTicket.totalAmount || activeTicket.fare}</div>
                <Link to="/history" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Show QR
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', border: '2px dashed var(--glass-border)', borderRadius: '16px', gap: '16px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>You don't have any active tickets.</p>
              <Link to="/book" className="btn btn-primary">
                Book Ticket Now
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Safety & Notifications */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <Link to="/notifications" className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', transition: 'transform 0.2s ease', color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ padding: '14px', background: 'rgba(0, 201, 167, 0.15)', borderRadius: '12px', color: 'var(--accent-teal)' }}>
              <BellRing size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '16px' }}>Notifications</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Check your latest alerts & offers</div>
            </div>
            <ArrowRight size={20} color="var(--text-muted)" />
          </Link>

          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Safety Instructions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-orange)' }}>
                ⚠️ Ticket validity: Entry must be scanned within 20 minutes of ticket generation.
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-orange)' }}>
                ⏱️ Journey duration: Exit must be completed within 90 minutes of entry.
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-blue)' }}>
                💰 Earn 5% Cashback on ticket purchases exceeding ₹100!
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
