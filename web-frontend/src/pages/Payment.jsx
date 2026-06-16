import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { CreditCard, Wallet, AlertCircle, Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const booking = location.state;

  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // wallet | razorpay
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If no booking details in state, go back
    if (!booking) {
      navigate('/book');
      return;
    }

    const fetchWallet = async () => {
      try {
        const res = await api.get('/wallet/balance');
        if (res.data.success) {
          setWalletBalance(res.data.balance);
        }
      } catch (err) {
        console.error('Error fetching wallet balance', err);
      }
    };
    fetchWallet();
  }, [booking, navigate]);

  if (!booking) return null;

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create a pending ticket record first on backend
      const ticketRes = await api.post('/tickets/create', {
        source: booking.source,
        destination: booking.destination,
        distance: booking.distance,
        fare: booking.farePerPerson,
        passengers: booking.passengers,
        totalAmount: booking.totalAmount,
        isReturn: booking.isReturn
      });

      if (!ticketRes.data.success) {
        throw new Error(ticketRes.data.message || 'Failed to initiate ticket.');
      }

      const ticketId = ticketRes.data.ticket.ticketId;

      if (paymentMethod === 'wallet') {
        if (walletBalance < booking.totalAmount) {
          throw new Error('Insufficient wallet balance. Please recharge.');
        }

        // Complete payment with wallet
        const payRes = await api.post('/tickets/payment', {
          ticketId,
          paymentMethod: 'wallet',
          paymentStatus: 'success',
          paymentId: `WAL-PAY-${Date.now()}`
        });

        if (payRes.data.success) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/history');
          }, 2000);
        } else {
          throw new Error(payRes.data.message || 'Wallet transaction failed.');
        }
      } else {
        // Razorpay checkout flow
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK failed to load.');
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_puneMetroKey123',
          amount: booking.totalAmount * 100, // paise
          currency: 'INR',
          name: 'Pune Metro',
          description: 'Ticket Booking',
          image: '/favicon.svg',
          handler: async function (response) {
            try {
              setLoading(true);
              const payRes = await api.post('/tickets/payment', {
                ticketId,
                paymentMethod: 'razorpay',
                paymentStatus: 'success',
                paymentId: response.razorpay_payment_id
              });

              if (payRes.data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/history'), 2000);
              } else {
                throw new Error(payRes.data.message || 'Razorpay transaction failed.');
              }
            } catch (err) {
              setError(err.message || 'Payment verification failed.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: 'Pune Metro Passenger',
            email: 'passenger@metro.com'
          },
          theme: {
            color: '#00C9A7'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setError('Payment failed: ' + response.error.description);
          setLoading(false);
        });
        
        rzp.open();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Checkout & Payment
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Complete payment to generate your secure metro QR ticket.
      </p>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', marginBottom: '20px', fontWeight: '600', display: 'flex', gap: '10px' }}>
          <AlertCircle /> <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderColor: 'var(--accent-teal)' }}>
          <CheckCircle size={60} color="var(--accent-teal)" style={{ marginBottom: '16px', display: 'inline-block' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Your QR Ticket has been generated. Redirecting to your ticket history...
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 201, 167, 0.1)', color: 'var(--accent-teal)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
            <Sparkles size={14} /> 5% Cashback credited to wallet!
          </div>
        </div>
      ) : (
        <div className="row">
          {/* Payment panel */}
          <div className="col glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Select Payment Method</h3>
            
            {/* Wallet Select */}
            <div 
              onClick={() => setPaymentMethod('wallet')}
              style={{ 
                padding: '20px', 
                borderRadius: '16px', 
                background: paymentMethod === 'wallet' ? 'rgba(0, 201, 167, 0.1)' : 'rgba(255,255,255,0.02)', 
                border: paymentMethod === 'wallet' ? '1px solid var(--accent-teal)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-teal)' }}>
                <Wallet size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>Metro Wallet Balance</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Available: ₹{walletBalance.toFixed(2)}</div>
              </div>
              <input 
                type="radio" 
                checked={paymentMethod === 'wallet'} 
                onChange={() => setPaymentMethod('wallet')}
                style={{ accentColor: 'var(--accent-teal)', width: '18px', height: '18px' }} 
              />
            </div>

            {/* Razorpay Select */}
            <div 
              onClick={() => setPaymentMethod('razorpay')}
              style={{ 
                padding: '20px', 
                borderRadius: '16px', 
                background: paymentMethod === 'razorpay' ? 'rgba(0, 201, 167, 0.1)' : 'rgba(255,255,255,0.02)', 
                border: paymentMethod === 'razorpay' ? '1px solid var(--accent-teal)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-teal)' }}>
                <CreditCard size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>Razorpay Secure Checkout</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pay via UPI, Cards, Netbanking</div>
              </div>
              <input 
                type="radio" 
                checked={paymentMethod === 'razorpay'} 
                onChange={() => setPaymentMethod('razorpay')}
                style={{ accentColor: 'var(--accent-teal)', width: '18px', height: '18px' }} 
              />
            </div>

            {/* Terms */}
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
              <ShieldCheck size={28} style={{ flexShrink: 0, color: 'var(--accent-teal)' }} />
              <span>
                By completing the payment, you agree to Pune Metro travel guidelines. Refunds are not applicable on generated QR tickets.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={handlePayment} 
                className="btn btn-primary" 
                style={{ height: '52px', flex: 1, fontSize: '16px' }}
                disabled={loading}
              >
                {loading ? 'Authorizing Payment...' : `Pay ₹${booking.totalAmount.toFixed(2)} Now`}
              </button>
            </div>

          </div>

          {/* Ticket Summary Side-Panel */}
          <div className="col glass-panel" style={{ padding: '30px', maxHeight: '350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Route:</span>
                <span style={{ fontWeight: 'bold' }}>{booking.source} ➔ {booking.destination}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Passengers:</span>
                <span style={{ fontWeight: '600' }}>{booking.passengers}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Type:</span>
                <span style={{ fontWeight: '600' }}>{booking.isReturn ? 'Return Trip' : 'One Way'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Commute discount:</span>
                <span style={{ color: 'var(--accent-teal)', fontWeight: 'bold' }}>{booking.discountApplied}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 'bold' }}>To Pay:</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-teal)' }}>₹{booking.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
