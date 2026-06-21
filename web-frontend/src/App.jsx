import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';
import Login from './pages/Login';
import Home from './pages/Home';
import BookTicket from './pages/BookTicket';
import Payment from './pages/Payment';
import TicketHistory from './pages/TicketHistory';
import Wallet from './pages/Wallet';
import Shops from './pages/Shops';
import PayMerchant from './pages/PayMerchant';
import AdminDashboard from './pages/AdminDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import StationInfo from './pages/StationInfo';
import FareCalculator from './pages/FareCalculator';
import FeederServices from './pages/FeederServices';
import HelpSupport from './pages/HelpSupport';
import SmartCard from './pages/SmartCard';
import MetroMap from './pages/MetroMap';
import TokenEconomy from './pages/TokenEconomy';
import QRScanner from './pages/QRScanner';
import AdminNotifications from './pages/AdminNotifications';
import MerchantNotifications from './pages/MerchantNotifications';
import ShopAnalytics from './pages/ShopAnalytics';
import MerchantShopConfig from './pages/MerchantShopConfig';
import MerchantPending from './pages/MerchantPending';
import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Authenticating user session...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect unauthorized roles to their respective dashboards
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'merchant' && user?.status === 'pending') return <Navigate to="/merchant-pending" replace />;
    if (user?.role === 'merchant') return <Navigate to="/merchant" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
        <header className="top-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 40px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--bg-secondary)',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          height: '70px',
          width: '100%'
        }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Pune Metro Transit System
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ThemeToggle />
          </div>
        </header>
        <div style={{ flex: 1, padding: '40px' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

function AppContent() {
  const { token, user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Auth Route */}
        <Route 
          path="/login" 
          element={token ? (
            user?.role === 'admin' ? <Navigate to="/admin" replace /> :
            user?.role === 'merchant' && user?.status === 'pending' ? <Navigate to="/merchant-pending" replace /> :
            user?.role === 'merchant' ? <Navigate to="/merchant" replace /> :
            <Navigate to="/dashboard" replace />
          ) : <Login />} 
        />

        {/* Passenger Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/book" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <BookTicket />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Payment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <TicketHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wallet" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Wallet />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/shops" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Shops />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pay-merchant" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <PayMerchant />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/station-info" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <StationInfo />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fare-calculator" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <FareCalculator />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/feeder-services" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <FeederServices />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/support" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <HelpSupport />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/smart-card" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <SmartCard />
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/metro-map" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <MetroMap />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/token-economy" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <TokenEconomy />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/qr-scanner" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <QRScanner />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/merchants" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/stations" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/revenue" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/notifications" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminNotifications />
            </ProtectedRoute>
          } 
        />

        {/* Merchant Routes */}
        <Route 
          path="/merchant" 
          element={
            <ProtectedRoute allowedRoles={['merchant']}>
              <MerchantDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/merchant/shop" 
          element={
            <ProtectedRoute allowedRoles={['merchant']}>
              <MerchantShopConfig />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/merchant/analytics" 
          element={
            <ProtectedRoute allowedRoles={['merchant']}>
              <ShopAnalytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/merchant/notifications" 
          element={
            <ProtectedRoute allowedRoles={['merchant']}>
              <MerchantNotifications />
            </ProtectedRoute>
          } 
        />

        {/* Merchant Pending Route */}
        <Route 
          path="/merchant-pending" 
          element={
            token ? <MerchantPending /> : <Navigate to="/login" replace />
          } 
        />

        {/* Default Redirect */}
        <Route 
          path="*" 
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
