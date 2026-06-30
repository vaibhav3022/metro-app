import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { QrCode, AlertCircle, CheckCircle, Store, ArrowRight, ShieldCheck, Camera, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function PayMerchant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const shopData = location.state;

  const [scanned, setScanned] = useState(!!shopData?.shopId);
  const [merchantData, setMerchantData] = useState(shopData?.shopId ? { 
    shopId: shopData.shopId, 
    businessName: shopData.shopName 
  } : null);
  
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // wallet | razorpay
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!scanned && !success) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
      );

      scanner.render(
        async (decodedText) => {
          console.log('QR Scanned:', decodedText);
          try {
            const data = JSON.parse(decodedText);
            const resolvedId = data.mId || data.merchantId || data.shopId || data._id;
            const typeUpper = data.type ? String(data.type).toUpperCase() : '';
            const isMerchantQR = resolvedId || typeUpper === 'MERCHANT_PAYMENT' || typeUpper === 'MERCHANT';
            
            if (isMerchantQR && resolvedId) {
              const initialName = data.merchantName || data.businessName || data.shopName || data.name || 'Pune Metro Shop';
              setMerchantData({
                shopId: resolvedId,
                businessName: initialName,
                type: data.type
              });
              setScanned(true);
              scanner.clear().catch(err => console.error("Error clearing scanner", err));

              // Resolve real-time name
              try {
                const response = await api.get('/shops');
                if (response.data && response.data.success && response.data.shops) {
                  const matchedShop = response.data.shops.find(
                    (s) =>
                      s._id === resolvedId ||
                      s.merchantId?._id === resolvedId ||
                      s.merchantId === resolvedId
                  );
                  if (matchedShop) {
                    setMerchantData(prev => ({
                      ...prev,
                      businessName: matchedShop.shopName
                    }));
                  }
                }
              } catch (fetchErr) {
                console.error("Error fetching real-time shop name on web", fetchErr);
              }
            } else {
              setError("This is not a valid merchant QR code.");
            }
          } catch (err) {
            setError("Could not read the QR code. Please try again.");
          }
        },
        (error) => {
          // ignore scan errors (they happen every frame a QR isn't detected)
        }
      );

      return () => {
        scanner.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
      };
    }
  }, [scanned, success]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const amt = parseFloat(amount);
    if (!merchantData?.shopId) {
      setError('Invalid Merchant ID. Please rescan.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'wallet') {
        if (walletBalance < amt) throw new Error('Insufficient wallet balance.');
        const res = await api.post('/shops/pay', {
          shopId: merchantData.shopId,
          amount: amt,
          paymentMethod: 'wallet',
          paymentId: `WAL-SHOP-${Date.now()}`
        });

        if (res.data.success) {
          setSuccess(true);
          setAmount('');
          const balanceRes = await api.get('/wallet/balance');
          if (balanceRes.data.success) setWalletBalance(balanceRes.data.balance);
        } else {
          throw new Error(res.data.message || 'Payment processing failed.');
        }
        setLoading(false);
      } else {
        // Razorpay flow
        if (!window.Razorpay) throw new Error('Razorpay SDK failed to load.');

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_puneMetroKey123',
          amount: amt * 100,
          currency: 'INR',
          name: merchantData.businessName || 'Pune Metro Shop',
          description: 'Merchant Payment',
          image: '/favicon.svg',
          handler: async function (response) {
            try {
              setLoading(true);
              const res = await api.post('/shops/pay', {
                shopId: merchantData.shopId,
                amount: amt,
                paymentMethod: 'razorpay',
                paymentId: response.razorpay_payment_id
              });

              if (res.data.success) {
                setSuccess(true);
                setAmount('');
                const balanceRes = await api.get('/wallet/balance');
                if (balanceRes.data.success) setWalletBalance(balanceRes.data.balance);
              } else {
                throw new Error(res.data.message || 'Razorpay transaction failed.');
              }
            } catch (err) {
              setError(err.message || 'Payment verification failed.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user?.name || 'Customer',
            email: user?.email || 'customer@metro.com'
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
      setError(err.response?.data?.message || err.message || 'Error processing merchant payment.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <button className="btn" onClick={() => navigate(-1)} style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.08)', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '16px' }}>
          <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Scan & Pay</h1>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', marginBottom: '20px', fontWeight: '600', display: 'flex', gap: '10px' }}>
          <AlertCircle /> <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderColor: 'var(--accent-teal)' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '60px', background: 'rgba(0,201,167,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={60} color="var(--accent-teal)" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '12px', color: 'var(--accent-teal)' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '16px' }}>
            Paid to {merchantData?.businessName || 'Merchant'} successfully.
          </p>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => navigate('/home')}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px' }}
          >
            Back to Home
          </button>
        </div>
      ) : !scanned ? (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Scan Merchant QR</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Align QR code within the frame to automatically detect the shop.</p>
          </div>
          <div style={{ background: '#fff', color: '#000', padding: '20px' }}>
            <div id="reader" style={{ width: '100%' }}></div>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <button 
              className="btn" 
              onClick={() => {
                const manualId = prompt("Enter Merchant ID manually (fallback for dev):");
                if(manualId) {
                  setMerchantData({ shopId: manualId, businessName: 'Manual Entry' });
                  setScanned(true);
                }
              }}
              style={{ fontSize: '13px', color: 'var(--text-muted)' }}
            >
              Enter shop ID manually instead
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', background: 'rgba(255,255,255,0.04)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'rgba(155,89,182,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
              <Store size={40} color="#9B59B6" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '6px' }}>{merchantData?.businessName || 'Unknown Merchant'}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>ID: {merchantData?.shopId}</div>
          </div>

          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '10px 20px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: '40px', fontWeight: '900', color: 'var(--accent-teal)', marginRight: '16px' }}>₹</span>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '40px', fontWeight: 'bold', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '4px', border: '1px solid var(--glass-border)' }}>
              <button 
                type="button" 
                onClick={() => setPaymentMethod('wallet')}
                className="btn" 
                style={{ flex: 1, padding: '12px', background: paymentMethod === 'wallet' ? 'rgba(0, 201, 167, 0.15)' : 'transparent', color: paymentMethod === 'wallet' ? 'var(--accent-teal)' : 'var(--text-secondary)', fontSize: '14px', borderRadius: '10px', fontWeight: '600' }}
              >
                Wallet (₹{walletBalance.toFixed(2)})
              </button>
              <button 
                type="button" 
                onClick={() => setPaymentMethod('razorpay')}
                className="btn" 
                style={{ flex: 1, padding: '12px', background: paymentMethod === 'razorpay' ? 'rgba(0, 201, 167, 0.15)' : 'transparent', color: paymentMethod === 'razorpay' ? 'var(--accent-teal)' : 'var(--text-secondary)', fontSize: '14px', borderRadius: '10px', fontWeight: '600' }}
              >
                Razorpay Card/UPI
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading || !amount}
              style={{ background: loading ? '#555' : 'linear-gradient(to right, #00C9A7, #009980)', border: 'none', color: '#fff', width: '100%', height: '60px', borderRadius: '16px', fontSize: '18px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {loading ? 'Processing...' : 'Pay Securely'}
            </button>

            <button 
              type="button"
              onClick={() => {
                setScanned(false);
                setMerchantData(null);
                setAmount('');
              }}
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', height: '50px', borderRadius: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
