import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Store, BadgeCent, ShieldCheck, Check, X, AlertCircle, 
  Trash2, Train, BellRing, RefreshCw, LogOut, ChartLine, History 
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [users, setUsers] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | revenue | merchants | users | stations
  const [selectedItem, setSelectedItem] = useState(null); // for Modals

  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/merchants')) setActiveTab('merchants');
    else if (path.includes('/stations')) setActiveTab('stations');
    else if (path.includes('/revenue')) setActiveTab('revenue');
    else if (path.includes('/users')) setActiveTab('users');
    else setActiveTab('overview');
  }, [location]);

  const fetchStatsAndData = async () => {
    try {
      const statsRes = await api.get('/admin/dashboard');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setRecentTransactions(statsRes.data.recentTransactions || []);
        setRecentBookings(statsRes.data.recentBookings || []);
      }
      
      const merchantRes = await api.get('/admin/merchants');
      if (merchantRes.data.success) setMerchants(merchantRes.data.data || []);

      const usersRes = await api.get('/admin/users');
      if (usersRes.data.success) setUsers(usersRes.data.data || []);

      const revRes = await api.get('/admin/revenue');
      if (revRes.data.success && Object.keys(revRes.data.data || {}).length > 0) {
        setRevenue(revRes.data.data);
      } else {
        setRevenue({ totalRevenue: 124500, ticketRevenue: 85000, walletRecharges: 39500 });
      }

      const revChartRes = await api.get('/admin/revenue/chart');
      if (revChartRes.data.success && revChartRes.data.data && revChartRes.data.data.length > 0) {
        setRevenueChart(revChartRes.data.data);
      } else {
        setRevenueChart([
          { date: 'Mon', tickets: 12000, wallet: 5000 },
          { date: 'Tue', tickets: 15000, wallet: 7000 },
          { date: 'Wed', tickets: 11000, wallet: 4000 },
          { date: 'Thu', tickets: 18000, wallet: 8000 },
          { date: 'Fri', tickets: 22000, wallet: 10000 },
          { date: 'Sat', tickets: 25000, wallet: 12000 },
          { date: 'Sun', tickets: 20000, wallet: 9000 },
        ]);
      }

      const stationsRes = await api.get('/stations');
      if (stationsRes.data.success) setStations(stationsRes.data.data || []);

    } catch (err) {
      console.error('Error fetching admin dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatsAndData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatsAndData();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMerchantStatus = async (id, statusAction) => {
    try {
      const res = await api.put(`/admin/merchants/${id}/${statusAction}`);
      if (res.data.success) {
        fetchStatsAndData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update merchant status.');
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading Control Center...</p>;
  }

  const StatCard = ({ title, value, icon, color, bg }) => (
    <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: bg, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
        {icon}
      </div>
      <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '4px' }}>{value}</h2>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>{title}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header matching RN Admin Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>Admin Panel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>Pune Metro Control Center</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleRefresh} className="btn" style={{ padding: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <RefreshCw size={20} color="#fff" className={refreshing ? "spin-animation" : ""} />
          </button>
          <button onClick={() => navigate('/admin/notifications')} className="btn" style={{ padding: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <BellRing size={20} color="#fff" />
          </button>
          <button onClick={handleLogout} className="btn" style={{ padding: '10px', background: 'rgba(239,68,68,0.2)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)' }}>
            <LogOut size={20} color="#EF4444" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '32px', overflowX: 'auto' }}>
        {['overview', 'revenue', 'merchants', 'users', 'stations'].map(tab => (
          <button 
            key={tab}
            onClick={() => navigate(tab === 'overview' ? '/admin' : `/admin/${tab}`)}
            className="btn" 
            style={{ 
              background: activeTab === tab ? 'rgba(0, 201, 167, 0.15)' : 'transparent', 
              color: activeTab === tab ? 'var(--accent-teal)' : 'var(--text-secondary)',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              fontWeight: '600'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Overview</h3>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <StatCard title="Total Revenue" value={`₹${stats?.totalRevenue?.toLocaleString() || revenue?.totalRevenue || 0}`} icon={<BadgeCent size={28} color="#00C9A7" />} bg="rgba(0,201,167,0.15)" />
            <StatCard title="Active Users" value={stats?.activeUsers?.toLocaleString() || users.length || 0} icon={<Users size={28} color="#9B59B6" />} bg="rgba(155,89,182,0.15)" />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <StatCard title="Merchants" value={stats?.totalMerchants || merchants.filter(m => m.status === 'approved').length || 0} icon={<Store size={28} color="#3498DB" />} bg="rgba(52,152,219,0.15)" />
            <StatCard title="Pending Shops" value={stats?.pendingMerchantRequests || merchants.filter(m => m.status === 'pending').length || 0} icon={<AlertCircle size={28} color="#F39C12" />} bg="rgba(243,156,18,0.15)" />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', marginTop: '30px' }}>Management Modules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
            {[
              { title: 'Revenue Analytics', icon: <ChartLine size={24} color="#00C9A7" />, bg: 'rgba(0,201,167,0.15)', tab: 'revenue' },
              { title: 'Merchant Management', icon: <Store size={24} color="#9B59B6" />, bg: 'rgba(155,89,182,0.15)', tab: 'merchants' },
              { title: 'User Management', icon: <Users size={24} color="#3498DB" />, bg: 'rgba(52,152,219,0.15)', tab: 'users' },
              { title: 'Station Management', icon: <Train size={24} color="#F39C12" />, bg: 'rgba(243,156,18,0.15)', tab: 'stations' },
            ].map(module => (
              <button key={module.tab} onClick={() => navigate(`/admin/${module.tab}`)} className="btn" style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: module.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px' }}>
                  {module.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{module.title}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Manage & view details</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)' }}>&gt;</div>
              </button>
            ))}
          </div>

          <div className="row" style={{ gap: '20px' }}>
            {/* Recent Ticket Bookings */}
            <div className="col glass-panel" style={{ padding: '24px', flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Recent Ticket Bookings</h3>
              {recentBookings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No recent bookings.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentBookings.map((bk, i) => (
                    <div key={i} onClick={() => setSelectedItem({ type: 'booking', data: bk })} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0,201,167,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '14px' }}>
                        <Train size={24} color="#00C9A7" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{bk.userId?.name || 'Unknown User'}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{bk.sourceStation} &rarr; {bk.destinationStation}</div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}>₹{bk.fare}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Shop Payments */}
            <div className="col glass-panel" style={{ padding: '24px', flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Recent Shop Payments</h3>
              {recentTransactions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No recent transactions.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentTransactions.map((tx, i) => (
                    <div key={i} onClick={() => setSelectedItem({ type: 'transaction', data: tx })} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(155,89,182,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '14px' }}>
                        <Store size={24} color="#9B59B6" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{tx.userId?.name || 'User'} at {tx.merchantId?.businessName || 'Shop'}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{new Date(tx.createdAt).toLocaleDateString()} &bull; {tx.paymentMethod}</div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#00C9A7' }}>+{tx.paymentMethod === 'Token' ? `Rs. ${tx.amount}` : `₹${tx.amount}`}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Keep existing tabs content below but re-styled */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>User Management</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '16px', fontWeight: '600' }}>{u.name}</td>
                  <td style={{ padding: '16px' }}>{u.email}</td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'merchant' ? 'badge-warning' : 'badge-success'}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'merchants' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Merchant Management</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Business</th>
                <th style={{ padding: '12px 16px' }}>Owner</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map(m => (
                <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '16px', fontWeight: '600' }}>{m.businessName}</td>
                  <td style={{ padding: '16px' }}>{m.userId?.name || 'Owner'}</td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${m.status === 'approved' ? 'badge-success' : m.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                    {m.status === 'pending' && (
                      <>
                        <button onClick={() => handleMerchantStatus(m._id, 'approve')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Approve</button>
                        <button onClick={() => handleMerchantStatus(m._id, 'reject')} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>Reject</button>
                      </>
                    )}
                    {m.status === 'approved' && (
                      <button onClick={() => handleMerchantStatus(m._id, 'suspend')} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>Suspend</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Revenue Analytics</h3>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <div className="stat-card glass-panel" style={{ flex: 1, padding: '20px', background: 'rgba(0, 201, 167, 0.05)' }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Total System Revenue</h4>
              <h2 style={{ fontSize: '32px', color: 'var(--accent-teal)' }}>₹{revenue?.totalRevenue || 0}</h2>
            </div>
            <div className="stat-card glass-panel" style={{ flex: 1, padding: '20px', background: 'rgba(52, 152, 219, 0.05)' }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Ticket Revenue</h4>
              <h2 style={{ fontSize: '32px', color: 'var(--accent-blue)' }}>₹{revenue?.ticketRevenue || 0}</h2>
            </div>
            <div className="stat-card glass-panel" style={{ flex: 1, padding: '20px', background: 'rgba(155, 89, 182, 0.05)' }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Wallet Recharges</h4>
              <h2 style={{ fontSize: '32px', color: 'var(--accent-purple)' }}>₹{revenue?.walletRecharges || 0}</h2>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: '#1A0A3E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="tickets" name="Tickets (₹)" fill="#00C9A7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wallet" name="Wallet (₹)" fill="#9B59B6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'stations' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Station Management</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>All metro stations currently active in the transit network.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {stations.map(st => (
              <div key={st._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Train size={24} color="var(--accent-blue)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: '800' }}>{st.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status: {st.status || 'Active'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction / Booking Detail Modal Overlay */}
      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#141432', width: '90%', maxWidth: '400px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button onClick={() => setSelectedItem(null)} className="btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '16px' }}>
                <X size={20} />
              </button>
            </div>
            
            {selectedItem.type === 'booking' && (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'rgba(0,201,167,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                  <Train size={40} color="#00C9A7" />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: '20px' }}>Ticket Booking Details</h2>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '20px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {[
                    ['User', selectedItem.data.userId?.name || 'Unknown'],
                    ['Email', selectedItem.data.userId?.email || 'N/A'],
                    ['Route', `${selectedItem.data.sourceStation} \u2192 ${selectedItem.data.destinationStation}`],
                    ['Fare', `\u20B9${selectedItem.data.fare}`],
                    ['Status', selectedItem.data.status?.toUpperCase()],
                    ['Date', new Date(selectedItem.data.createdAt).toLocaleString()]
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>{label}:</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff', textAlign: 'right' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedItem.type === 'transaction' && (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'rgba(155,89,182,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
                  <Store size={40} color="#9B59B6" />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: '20px' }}>Order Payment Details</h2>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '20px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {[
                    ['User', selectedItem.data.userId?.name || 'Unknown'],
                    ['Merchant', selectedItem.data.merchantId?.businessName || 'N/A'],
                    ['Method', selectedItem.data.paymentMethod],
                    ['Amount', selectedItem.data.paymentMethod === 'Token' ? `${selectedItem.data.amount} Tokens` : `\u20B9${selectedItem.data.amount}`],
                    ['Date', new Date(selectedItem.data.createdAt).toLocaleString()]
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>{label}:</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff', textAlign: 'right' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
