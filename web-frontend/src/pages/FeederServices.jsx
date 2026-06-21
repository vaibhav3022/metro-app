import React from 'react';
import { Bus, Bike, Car, ArrowRight } from 'lucide-react';

export default function FeederServices() {
  const services = [
    {
      icon: <Bus size={28} color="#db2777" />,
      iconBg: 'rgba(219,39,119,0.15)',
      title: 'PMPML Metro Shuttle',
      description: 'Frequent bus services available from major metro stations including Civil Court, Shivaji Nagar, and Swargate. Connect directly to IT parks and hubs.',
      buttonLabel: 'View Bus Routes',
      gradient: 'linear-gradient(90deg, #db2777, #be185d)',
      btnStyle: { border: '1px solid rgba(219,39,119,0.5)' },
      playStoreUrl: 'https://play.google.com/store/apps/details?id=in.chartr.pmpml'
    },
    {
      icon: <Bike size={28} color="#22c55e" />,
      iconBg: 'rgba(34,197,94,0.15)',
      title: 'E-Bike Rentals',
      description: 'Rent an E-bike from outside any metro station. Scan and unlock using partner apps to easily reach home or office.',
      buttonLabel: 'Find E-Bikes',
      gradient: 'linear-gradient(90deg, #22c55e, #16a34a)',
      btnStyle: { border: '1px solid rgba(34,197,94,0.5)' },
      playStoreUrl: 'https://play.google.com/store/apps/details?id=app.yulu.bike'
    },
    {
      icon: <Car size={28} color="#ea580c" />,
      iconBg: 'rgba(234,88,12,0.15)',
      title: 'Partner Cabs/Autos',
      description: 'Prepaid and app-based autos and cabs are stationed directly at designated pick-up zones outside busy stations.',
      buttonLabel: 'Book a Ride',
      gradient: 'linear-gradient(90deg, #ea580c, #c2410c)',
      btnStyle: { border: '1px solid rgba(234,88,12,0.5)' },
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ubercab'
    },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Feeder Services
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Last mile connectivity from Pune Metro stations.
      </p>

      <div style={{ 
        background: 'rgba(0,137,123,0.08)', 
        borderRadius: '24px', padding: '32px', textAlign: 'center', marginBottom: '32px',
        border: '1px solid rgba(0,137,123,0.15)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '12px' }}>Last Mile Connectivity</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
          Pune Metro provides seamless feeder services to help you reach your final destination easily. Choose from shuttle buses, e-bikes, or partner cabs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {services.map((s, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: s.iconBg, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
              {s.icon}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>{s.title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>
              {s.description}
            </p>
            <button 
              style={{
                background: s.gradient, color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px',
                fontWeight: '800', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                cursor: 'pointer'
              }}
              onClick={() => window.open(s.playStoreUrl, '_blank')}
            >
              {s.buttonLabel} <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
