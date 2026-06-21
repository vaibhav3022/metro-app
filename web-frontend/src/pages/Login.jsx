import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Train, Mail, Lock, Key, ArrowRight, User, Store, Shield } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const { loginWithPassword, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('user'); // user | merchant | admin
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState(1); // 1: Send OTP / Password, 2: Verify OTP
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAction = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (role === 'user') {
        if (step === 1) {
          // Send OTP
          await sendOTP(email, isRegister);
          setMessage('OTP sent successfully to ' + email);
          setStep(2);
        } else {
          // Verify OTP
          const otpData = { 
            email, 
            otp, 
            name, 
            phone, 
            role: 'user', 
            password: 'password123' 
          };
          await verifyOTP(otpData);
          navigate('/dashboard');
        }
      } else {
        // Merchant or Admin Login (Password based)
        const res = await loginWithPassword(email, password);
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else if (res.user.role === 'merchant') {
          navigate('/merchant');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <ThemeToggle />
      </div>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px', textAlign: 'center' }}>
        
        {/* Logo */}
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-purple))', marginBottom: '20px' }}>
          <Train size={36} color="#fff" />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px', letterSpacing: '1px' }}>PUNE METRO</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>आली आपली मेट्रो 🚇</p>

        {/* Role Selector Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', padding: '4px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
          <button 
            type="button"
            className="btn" 
            onClick={() => { setRole('user'); setStep(1); setError(''); }} 
            style={{ flex: 1, background: role === 'user' ? 'rgba(0, 137, 123, 0.12)' : 'transparent', color: role === 'user' ? 'var(--accent-teal)' : 'var(--text-secondary)', padding: '10px' }}
          >
            <User size={16} /> Passenger
          </button>
          <button 
            type="button"
            className="btn" 
            onClick={() => { setRole('merchant'); setStep(1); setError(''); }} 
            style={{ flex: 1, background: role === 'merchant' ? 'rgba(25, 118, 210, 0.12)' : 'transparent', color: role === 'merchant' ? 'var(--accent-blue)' : 'var(--text-secondary)', padding: '10px' }}
          >
            <Store size={16} /> Merchant
          </button>
          <button 
            type="button"
            className="btn" 
            onClick={() => { setRole('admin'); setStep(1); setError(''); }} 
            style={{ flex: 1, background: role === 'admin' ? 'rgba(106, 27, 154, 0.12)' : 'transparent', color: role === 'admin' ? 'var(--accent-purple)' : 'var(--text-secondary)', padding: '10px' }}
          >
            <Shield size={16} /> Admin
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(211, 47, 47, 0.12)', color: 'var(--accent-red)', border: '1px solid rgba(211, 47, 47, 0.2)', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(46, 125, 50, 0.12)', color: 'var(--success-color)', border: '1px solid rgba(46, 125, 50, 0.2)', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAction}>
          {step === 1 ? (
            <>
              {/* Email field */}
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--accent-teal)' }} />
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="Enter email address" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    style={{ paddingLeft: '48px' }}
                    required 
                  />
                </div>
              </div>

              {/* Password based logic for Merchant/Admin */}
              {role !== 'user' && (
                <div className="form-group">
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--accent-blue)' }} />
                    <input 
                      type="password" 
                      className="input-field" 
                      placeholder="Enter password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      style={{ paddingLeft: '48px' }}
                      required 
                    />
                  </div>
                </div>
              )}

              {/* Registration fields for new Passenger */}
              {role === 'user' && isRegister && (
                <>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Enter name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Enter phone number" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      required 
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            /* Step 2: Input OTP */
            <div className="form-group">
              <label>Enter 6-digit OTP</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--accent-teal)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter 6-digit OTP" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  style={{ paddingLeft: '48px', letterSpacing: '4px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}
                  required 
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', height: '52px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (
              <>
                {role === 'user' && step === 1 ? 'Send Verification OTP' : 'Continue'} 
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {role === 'user' && step === 1 && (
          <div style={{ marginTop: '24px', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </span>{' '}
            <button 
              type="button"
              className="btn" 
              onClick={() => setIsRegister(!isRegister)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-teal)', textDecoration: 'underline', padding: 0, fontSize: '14px', fontWeight: '600' }}
            >
              {isRegister ? 'Sign In' : 'Register Now'}
            </button>
          </div>
        )}

        {role === 'user' && step === 2 && (
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ width: '100%', marginTop: '12px' }} 
            onClick={() => setStep(1)}
          >
            Go Back
          </button>
        )}

      </div>
    </div>
  );
}
