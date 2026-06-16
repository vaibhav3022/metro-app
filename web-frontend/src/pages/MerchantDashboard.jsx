import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, BellRing, LogOut, ArrowDownLeft, Store, History, Clock, XCircle, Ban, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MerchantDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [txModalVisible, setTxModalVisible] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statusRes = await api.get('/merchant/status');
      const merchantStatus = statusRes.data.status;
      setStatus(merchantStatus);
      if (statusRes.data.rejectionReason) setRejectionReason(statusRes.data.rejectionReason);

      if (merchantStatus === 'approved') {
        const [dashRes, txRes, notifRes] = await Promise.all([
          api.get('/merchant/dashboard'),
          api.get('/merchant/transactions?limit=50'),
          api.get('/merchant/notifications')
        ]);
        setDashboardData(dashRes.data);
        setTransactions(txRes.data.data || []);
        setUnreadCount(notifRes.data.data?.filter(n => !n.isRead).length || 0);
      }
    } catch (err) {
      console.error('Error fetching merchant data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderStatusScreen = (IconComponent, title, message, color) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', textAlign: 'center', border: `1px solid ${color}30` }}>
        <IconComponent size={60} color={color} style={{ marginBottom: '24px', display: 'inline-block' }} />
        <h2 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '16px', color }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', lineHeight: '1.6' }}>{message}</p>
        <button onClick={fetchData} className="btn" style={{ background: 'var(--accent-teal)', color: '#fff', padding: '16px 32px', borderRadius: '20px', fontWeight: '800', width: '100%' }}>
          Refresh Status
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>Loading merchant portal...</p>;
  }

  if (status === 'pending') {
    return renderStatusScreen(Clock, 'Pending Approval', 'Your application is under review. You will be notified once approved.', '#F39C12');
  } else if (status === 'suspended') {
    return renderStatusScreen(Ban, 'Account Suspended', rejectionReason || 'Your merchant account has been suspended by the admin.', '#EF4444');
  } else if (status === 'rejected') {
    return renderStatusScreen(XCircle, 'Application Rejected', rejectionReason || 'Your merchant application was rejected.', 'rgba(255,255,255,0.7)');
  }

  // Map RN chart data to Recharts format
  const chartLabels = dashboardData?.chartData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartValues = dashboardData?.chartData?.data || [0, 0, 0, 0, 0, 0, 0];
  const rechartsData = chartLabels.map((label, index) => ({
    name: label,
    sales: chartValues[index] || 0
  }));

  // Approved Dashboard
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '0.5px' }}>Merchant Portal</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn" 
            onClick={() => navigate('/merchant/notifications')} 
            style={{ padding: '10px', background: 'rgba(255,255,255,0.08)', position: 'relative' }}
          >
            <BellRing size={20} color="#fff" />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #141432' }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button 
            className="btn" 
            onClick={handleLogout} 
            style={{ padding: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Stats Row 1 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '24px', cursor: 'pointer' }} onClick={() => setTxModalVisible(true)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Sales</span>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(0, 201, 167, 0.15)' }}><ShoppingBag size={24} color="#00C9A7" /></div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900' }}>₹{dashboardData?.stats?.totalSales || 0}</h2>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '24px', cursor: 'pointer' }} onClick={() => setTxModalVisible(true)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Orders</span>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(52, 152, 219, 0.15)' }}><Store size={24} color="#3498DB" /></div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900' }}>{dashboardData?.stats?.totalOrders || 0}</h2>
        </div>
      </div>

      {/* Stats Row 2 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '24px', cursor: 'pointer' }} onClick={() => setTxModalVisible(true)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Customers</span>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(155, 89, 182, 0.15)' }}><ShoppingBag size={24} color="#9B59B6" /></div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900' }}>{dashboardData?.stats?.totalCustomers || 0}</h2>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '24px', cursor: 'pointer' }} onClick={() => setTxModalVisible(true)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Tokens Accepted</span>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(243, 156, 18, 0.15)' }}><ShoppingBag size={24} color="#F39C12" /></div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900' }}>{dashboardData?.stats?.tokensAccepted || 0}</h2>
        </div>
      </div>

      {/* Official Merchant QR */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '6px' }}>Official Merchant QR</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Customers can scan this to pay you directly</p>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          {dashboardData?.shopId ? (
            <QRCodeSVG 
              value={JSON.stringify({ 
                type: 'merchant', 
                shopId: dashboardData.shopId, 
                merchantId: dashboardData.merchantId, 
                businessName: dashboardData.businessName 
              })} 
              size={200} 
              level="H" 
              includeMargin={false}
            />
          ) : (
            <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#000' }}>Loading...</span>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Sales Growth */}
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px' }}>7-Day Sales Growth</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rechartsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.6)'}} axisLine={false} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.6)'}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A0A3E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#00C9A7', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="sales" stroke="#00C9A7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#141432', stroke: '#00C9A7' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '20px' }}>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <History size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>No Transactions</h4>
            <p style={{ color: 'var(--text-muted)' }}>You haven't received any orders yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transactions.slice(0, 5).map((tx, idx) => (
              <div key={tx._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: idx < transactions.slice(0, 5).length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(0,201,167,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ArrowDownLeft size={24} color="#00C9A7" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px' }}>{tx.userId?.name || 'Customer'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(tx.createdAt).toLocaleDateString()} • {tx.paymentMethod}</div>
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#00C9A7' }}>
                  +{tx.paymentMethod === 'Token' ? `Rs. ${tx.amount}` : `₹${tx.amount}`}
                </div>
              </div>
            ))}
            {transactions.length > 5 && (
              <button 
                onClick={() => setTxModalVisible(true)}
                className="btn" 
                style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', color: '#00C9A7', fontWeight: '800', width: '100%' }}
              >
                View All Transactions
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transactions Modal Overlay */}
      {txModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <div style={{ background: '#141432', width: '100%', maxWidth: '600px', height: '80vh', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900' }}>All Transactions</h2>
              <button onClick={() => setTxModalVisible(false)} className="btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '16px' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <History size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: '16px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>No Transactions</h4>
                  <p style={{ color: 'var(--text-muted)' }}>You haven't received any orders yet.</p>
                </div>
              ) : (
                transactions.map((tx, idx) => (
                  <div key={tx._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(0,201,167,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <ArrowDownLeft size={24} color="#00C9A7" />
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px' }}>{tx.userId?.name || 'Customer'}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()} • {tx.paymentMethod}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#00C9A7' }}>
                      +{tx.paymentMethod === 'Token' ? `Rs. ${tx.amount}` : `₹${tx.amount}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
