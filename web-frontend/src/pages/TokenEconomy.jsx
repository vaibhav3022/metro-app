import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Landmark, ArrowUpCircle, ArrowDownCircle, AlertCircle, ShoppingCart } from 'lucide-react';

export default function TokenEconomy() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [buyAmount, setBuyAmount] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, histRes] = await Promise.all([
        api.get('/tokens/balance'),
        api.get('/tokens/history')
      ]);
      setBalance(balRes.data.tokenBalance || 0);
      setHistory(histRes.data.transactions || []);
    } catch (err) {
      console.error('Error fetching token data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleBuyTokens = async (e) => {
    e.preventDefault();
    const amount = parseInt(buyAmount);
    if (!amount || amount < 10) {
      return showMessage('Enter amount min ₹10', 'error');
    }

    try {
      const orderRes = await api.post('/tokens/create-order', { amount });
      const { orderId, amount: totalAmountPaise } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_St6f7LZjydxbQ0',
        amount: totalAmountPaise || amount * 100, // fallback if backend didn't return
        currency: 'INR',
        name: 'Pune Metro',
        description: 'Buy Metro Tokens',
        image: 'https://cdn-icons-png.flaticon.com/512/1033/1033221.png',
        theme: { color: '#9B59B6' },
      };
      
      if (orderId && !orderId.startsWith('order_mock')) {
        options.order_id = orderId;
      }

      options.handler = async function (response) {
          try {
            const verifyRes = await api.post('/tokens/verify-payment', {
              amount,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            });
            if (verifyRes.data.success) {
              showMessage('Tokens added successfully!', 'success');
              setBuyAmount('');
              fetchData();
            }
          } catch (err) {
            showMessage('Failed to verify payment', 'error');
          }
        };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          showMessage('Payment Failed', 'error');
        });
        rzp.open();
      } else {
        showMessage('Payment gateway not loaded.', 'error');
      }
    } catch (err) {
      showMessage('Failed to create order', 'error');
    }
  };

  const handleSpendTokens = async (e) => {
    e.preventDefault();
    if (!merchantId) return showMessage('Enter Merchant ID', 'error');
    const amount = parseInt(spendAmount);
    if (!amount || amount <= 0) return showMessage('Enter valid amount', 'error');

    try {
      const res = await api.post('/tokens/redeem', { merchantId, amount });
      if (res.data.success) {
        showMessage('Tokens redeemed successfully!', 'success');
        setMerchantId('');
        setSpendAmount('');
        fetchData();
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to redeem tokens', 'error');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Token Economy
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Earn, buy, and spend Metro Loyalty Tokens at station shops.
      </p>

      {message.text && (
        <div style={{ 
          padding: '16px', 
          marginBottom: '24px', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 201, 167, 0.1)',
          color: message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-teal)',
          border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 201, 167, 0.2)'}`
        }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: '600' }}>{message.text}</span>
        </div>
      )}

      <div className="row">
        {/* Left Column: Balance & Buy */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Balance Card */}
          <div className="glass-panel" style={{ padding: '30px', background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(155, 89, 182, 0.05))', borderColor: 'rgba(155, 89, 182, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Landmark size={28} color="var(--accent-purple)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent-purple)' }}>Loyalty Tokens</h3>
            </div>
            <h2 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '4px' }}>
              {loading ? '...' : balance}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>1 Token = ₹1</p>
          </div>

          {/* Buy Tokens Form */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Buy Tokens</h3>
            <form onSubmit={handleBuyTokens}>
              <div className="input-group">
                <label>Amount (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="e.g. 100 (min ₹10)"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  min="10"
                  required
                />
              </div>

              {buyAmount >= 10 && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginTop: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <span>Tokens value:</span>
                    <span>₹{parseInt(buyAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <span>GST (18%):</span>
                    <span>+ ₹{Math.ceil(parseInt(buyAmount) * 0.18)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', fontWeight: '800', fontSize: '16px' }}>
                    <span>Total Payable:</span>
                    <span style={{ color: 'var(--accent-teal)' }}>₹{parseInt(buyAmount) + Math.ceil(parseInt(buyAmount) * 0.18)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
                    A GST Tax Invoice will be sent automatically via our Webhook verification system upon successful payment.
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="btn" style={{ flex: 1, background: 'var(--accent-purple)', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: '700' }}>
                  Pay with Razorpay
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1, background: 'var(--accent-teal)', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: '700', border: 'none' }}
                  onClick={async () => {
                    const amount = parseInt(buyAmount);
                    if (!amount || amount < 10) return showMessage('Enter amount min ₹10', 'error');
                    try {
                      const verifyRes = await api.post('/tokens/verify-payment', {
                        amount,
                        paymentId: `MOCK_PAY_${Date.now()}`,
                        orderId: `MOCK_ORDER_${Date.now()}`,
                        signature: `MOCK_SIG`
                      });
                      if (verifyRes.data.success) {
                        showMessage('Tokens added successfully! (Mock)', 'success');
                        setBuyAmount('');
                        fetchData();
                      }
                    } catch (err) {
                      showMessage('Mock payment failed', 'error');
                    }
                  }}
                >
                  Mock Pay (Dev)
                </button>
              </div>
            </form>
          </div>

          {/* Spend Tokens Form */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Spend Tokens</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Ask the shop owner for their Merchant ID to pay them with tokens.</p>
            <form onSubmit={handleSpendTokens}>
              <div className="input-group">
                <label>Merchant ID</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 64d9f1a2..."
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  required
                />
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>Tokens to Deduct</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="e.g. 25"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <button type="submit" className="btn" style={{ width: '100%', background: 'var(--accent-blue)', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: '700', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ShoppingCart size={18} /> Redeem Tokens
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div className="col glass-panel" style={{ padding: '30px', flex: 1.5 }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Transaction History</h3>
          
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading history...</p>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              No token transactions yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map((tx) => (
                <div key={tx._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {tx.type === 'purchase' ? (
                      <ArrowDownCircle size={32} color="var(--accent-teal)" />
                    ) : (
                      <ArrowUpCircle size={32} color="var(--accent-red)" />
                    )}
                    <div>
                      <h4 style={{ fontWeight: '600', fontSize: '15px' }}>
                        {tx.type === 'purchase' ? 'Tokens Purchased' : 'Tokens Spent'}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: tx.type === 'purchase' ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
                    {tx.type === 'purchase' ? '+' : '-'}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
