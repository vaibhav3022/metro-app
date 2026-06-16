import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldCheck, LogOut, Mail, RefreshCw } from 'lucide-react';

export default function MerchantPending() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        padding: '24px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Decorative background circles */}
      <div
        style={{
          position: 'fixed',
          top: '-80px',
          right: '-80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155,89,182,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-100px',
          left: '-100px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,201,167,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(255, 255, 255, 0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '28px',
          padding: '48px 40px',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Animated clock icon */}
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(155, 89, 182, 0.15)',
            border: '2px solid rgba(155, 89, 182, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <Clock size={48} color="#9B59B6" strokeWidth={1.5} />
        </div>

        <h1
          style={{
            fontSize: '26px',
            fontWeight: '800',
            marginBottom: '14px',
            letterSpacing: '-0.3px',
            background: 'linear-gradient(90deg, #c084fc, #e879f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Account Under Review
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: '1.7',
            marginBottom: '32px',
          }}
        >
          Your merchant registration is currently under review. Once an admin
          approves your account, you'll gain full access to your merchant
          dashboard and tools.
        </p>

        {/* Status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(155, 89, 182, 0.1)',
            border: '1px solid rgba(155, 89, 182, 0.25)',
            borderRadius: '14px',
            padding: '14px 20px',
            marginBottom: '32px',
          }}
        >
          <RefreshCw
            size={18}
            color="#9B59B6"
            style={{ animation: 'spin 3s linear infinite', flexShrink: 0 }}
          />
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>
            Status: <span style={{ color: '#c084fc' }}>Pending Approval</span>
          </span>
        </div>

        {/* Info cards */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(0,201,167,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} color="#00C9A7" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                Admin Verification
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                Your documents are being reviewed by our team
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(155,89,182,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Mail size={18} color="#9B59B6" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                Email Notification
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                You'll be notified at{' '}
                <span style={{ color: '#c084fc' }}>{user?.email || 'your email'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            height: '52px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            color: '#EF4444',
            fontSize: '15px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      {/* Footer note */}
      <p
        style={{
          marginTop: '24px',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.35)',
          zIndex: 1,
        }}
      >
        Need help? Contact{' '}
        <a
          href="mailto:support@punemetro.in"
          style={{ color: 'rgba(155,89,182,0.8)', textDecoration: 'none' }}
        >
          support@punemetro.in
        </a>
      </p>

      {/* Keyframe styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(155,89,182,0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(155,89,182,0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
