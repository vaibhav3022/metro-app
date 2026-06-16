import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Sparkles, CheckCircle } from 'lucide-react';

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet/balance');
      if (res.data.success) {
        setBalance(res.data.balance);
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching wallet details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleRecharge = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const amt = parseFloat(rechargeAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid recharge amount.');
      return;
    }

    setSubmitting(true);
    try {
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Are you offline?');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_puneMetroKey123', // Demo key
        amount: amt * 100, // paise
        currency: 'INR',
        name: 'Pune Metro',
        description: 'Digital Wallet Top-up',
        image: '/favicon.svg',
        handler: async function (response) {
          try {
            setSubmitting(true);
            const res = await api.post('/wallet/add-money', {
              amount: amt,
              paymentId: response.razorpay_payment_id
            });

            if (res.data.success) {
              setSuccess(true);
              setRechargeAmount('');
              fetchWallet();
              setTimeout(() => setSuccess(false), 3000);
            }
          } catch (err) {
            setError(err.response?.data?.message || 'Wallet top-up failed after payment.');
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: 'Pune Metro User',
          email: 'user@metro.com'
        },
        theme: {
          color: '#00C9A7'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError('Payment failed: ' + response.error.description);
        setSubmitting(false);
      });
      
      rzp.open();
    } catch (err) {
      setError(err.message || 'Payment initialization failed.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Digital Transit Wallet
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Recharge your metro balance instantly and view all your commute ledger entries.
      </p>

      <div className="row">
        {/* Wallet Overview & Recharge */}
        <div className="col glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(0, 201, 167, 0.1)', color: 'var(--accent-teal)' }}>
              <WalletIcon size={32} />
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Balance</div>
              <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1px' }}>
                ₹{loading ? '...' : balance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Recharge form */}
          <form onSubmit={handleRecharge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Quick Top-up</h3>
            
            {error && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 201, 167, 0.15)', color: 'var(--accent-teal)', border: '1px solid rgba(0, 201, 167, 0.3)', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CheckCircle size={16} /> <span>Wallet recharged successfully!</span>
              </div>
            )}

            <div className="form-group">
              <label>Recharge Amount (INR)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="Enter amount (e.g. ₹200)" 
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                required
              />
            </div>

            {/* Quick selectors */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[100, 200, 500].map(val => (
                <button 
                  key={val}
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setRechargeAmount(val)}
                  style={{ flex: 1, padding: '10px' }}
                >
                  + ₹{val}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting}
                style={{ flex: 1, height: '50px', fontSize: '16px' }}
              >
                <Plus size={18} /> {submitting ? 'Processing...' : 'Pay with Razorpay'}
              </button>
            </div>
          </form>

        </div>

        {/* Ledger Transaction History */}
        <div className="col glass-panel" style={{ padding: '30px', flex: 1.5 }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Transaction Ledger</h3>
          
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading history...</p>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No transactions recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
              {transactions.map((tx, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ 
                      padding: '10px', 
                      borderRadius: '10px', 
                      background: tx.type === 'credit' ? 'rgba(0, 201, 167, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: tx.type === 'credit' ? 'var(--accent-teal)' : 'var(--accent-red)'
                    }}>
                      {tx.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{tx.description}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(tx.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '800', 
                    fontSize: '16px',
                    color: tx.type === 'credit' ? 'var(--accent-teal)' : '#fff'
                  }}>
                    {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
