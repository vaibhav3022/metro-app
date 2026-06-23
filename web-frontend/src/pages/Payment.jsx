import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { CreditCard, Wallet, AlertCircle, Sparkles, CheckCircle, ShieldCheck, X, Lock, Smartphone } from 'lucide-react';

// ─── Mock Payment Modal ──────────────────────────────────────────────────────
function MockPaymentModal({ amount, onSuccess, onClose }) {
  const [tab, setTab] = useState('card'); // card | upi
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('form'); // form | processing | done

  const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };

  const handlePay = () => {
    if (tab === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16 || !expiry || cvv.length < 3 || !cardName.trim()) {
        alert('Please fill all card details correctly.');
        return;
      }
    } else {
      if (!upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g., name@upi)');
        return;
      }
    }

    setStep('processing');
    setProcessing(true);

    // Simulate payment processing delay
    setTimeout(() => {
      setStep('done');
      setTimeout(() => {
        onSuccess(`MOCK-RZP-${Date.now()}`);
      }, 1000);
    }, 2500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '20px', width: '100%', maxWidth: '420px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #00C9A7 0%, #0077B6 100%)',
          padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Secure Payment</div>
            <div style={{ color: '#fff', fontSize: '22px', fontWeight: '900', marginTop: '2px' }}>₹{amount.toFixed(2)}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '2px' }}>Pune Metro Transit Authority</div>
          </div>
          <button onClick={onClose} disabled={processing} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {step === 'form' && (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                {[
                  { id: 'card', label: '💳 Card', icon: CreditCard },
                  { id: 'upi', label: '📱 UPI', icon: Smartphone }
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s',
                    background: tab === t.id ? 'linear-gradient(135deg, #00C9A7, #0077B6)' : 'transparent',
                    color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.5)'
                  }}>{t.label}</button>
                ))}
              </div>

              {tab === 'card' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>CARDHOLDER NAME</label>
                    <input
                      value={cardName} onChange={e => setCardName(e.target.value)}
                      placeholder="Name on card"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>CARD NUMBER</label>
                    <input
                      value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))}
                      placeholder="4111 1111 1111 1111"
                      maxLength={19}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>EXPIRY</label>
                      <input
                        value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY" maxLength={5}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>CVV</label>
                      <input
                        value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="•••" type="password" maxLength={3}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '-4px' }}>
                    <span>Test: use any card number with future expiry & any CVV</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>UPI ID</label>
                    <input
                      value={upiId} onChange={e => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(0,201,167,0.08)', borderRadius: '10px', border: '1px solid rgba(0,201,167,0.2)' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>✅ Supported apps: GPay, PhonePe, Paytm, BHIM</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Test: use any@upi format</div>
                  </div>
                </div>
              )}

              <button
                onClick={handlePay}
                style={{
                  width: '100%', marginTop: '20px', padding: '14px',
                  background: 'linear-gradient(135deg, #00C9A7 0%, #0077B6 100%)',
                  border: 'none', borderRadius: '12px', color: '#fff',
                  fontWeight: '800', fontSize: '15px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 20px rgba(0,201,167,0.3)'
                }}
              >
                <Lock size={16} /> Pay ₹{amount.toFixed(2)} Securely
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                <ShieldCheck size={12} /> 256-bit SSL Encrypted · Secured by Pune Metro
              </div>
            </>
          )}

          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                <div style={{ width: '64px', height: '64px', border: '4px solid rgba(0,201,167,0.2)', borderTopColor: '#00C9A7', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '17px', marginTop: '20px' }}>Authorizing Payment...</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>Please do not close this window</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <CheckCircle size={60} color="#00C9A7" style={{ marginBottom: '12px' }} />
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '18px' }}>Payment Successful!</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>Generating your QR ticket...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
  color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', letterSpacing: '0.5px'
};

// ─── Main Payment Page ────────────────────────────────────────────────────────
export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const booking = location.state;

  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // wallet | razorpay
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [pendingTicketId, setPendingTicketId] = useState(null);

  useEffect(() => {
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

  // Step 1: Create pending ticket, then open payment UI
  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      // Create pending ticket on backend
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
          throw new Error('Insufficient wallet balance. Please recharge your Metro Wallet.');
        }

        // Wallet payment — process directly
        const payRes = await api.post('/tickets/payment', {
          ticketId,
          paymentMethod: 'wallet',
          paymentStatus: 'success',
          paymentId: `WAL-PAY-${Date.now()}`
        });

        if (payRes.data.success) {
          setSuccess(true);
          setTimeout(() => navigate('/history'), 2000);
        } else {
          throw new Error(payRes.data.message || 'Wallet transaction failed.');
        }
      } else {
        // Store ticket ID and open mock card modal
        setPendingTicketId(ticketId);
        setShowMockModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: After mock payment succeeds, confirm on backend
  const handleMockPaymentSuccess = async (mockPaymentId) => {
    setShowMockModal(false);
    setLoading(true);
    setError('');
    try {
      const payRes = await api.post('/tickets/payment', {
        ticketId: pendingTicketId,
        paymentMethod: 'razorpay',
        paymentStatus: 'success',
        paymentId: mockPaymentId
      });

      if (payRes.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/history'), 2000);
      } else {
        throw new Error(payRes.data.message || 'Payment confirmation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {showMockModal && (
        <MockPaymentModal
          amount={booking.totalAmount}
          onSuccess={handleMockPaymentSuccess}
          onClose={() => { setShowMockModal(false); setLoading(false); }}
        />
      )}

      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Checkout &amp; Payment
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

            {/* Card/UPI Select */}
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
                <div style={{ fontWeight: '700', fontSize: '15px' }}>Card / UPI Payment</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pay via Credit/Debit Card or UPI</div>
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
