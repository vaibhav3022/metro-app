import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { ArrowRight, BarChart2, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ShopAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/merchant/dashboard');
        if (res.data) {
          setStats(res.data.stats);
          
          const labels = res.data.chartData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const data = res.data.chartData?.data || [0, 0, 0, 0, 0, 0, 0];
          
          setChartData(labels.map((l, i) => ({ name: l, value: data[i] })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <button className="btn" onClick={() => navigate(-1)} style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.08)', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px' }}>
          <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '900' }}>Shop Analytics</h1>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #00C9A7' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Gross Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#00C9A7' }}>₹{stats?.totalSales || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #3498DB' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Total Transactions</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#3498DB' }}>{stats?.totalOrders || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #9B59B6' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>Average Order Value</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#9B59B6' }}>₹{stats?.totalOrders ? Math.round(stats.totalSales / stats.totalOrders) : 0}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 size={24} color="#00C9A7" /> 
              Sales Volume (7 Days)
            </h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.5)" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A0A3E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#00C9A7', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="#00C9A7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
