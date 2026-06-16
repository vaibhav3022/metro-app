import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Store, Tag, Coffee, ShoppingBag, ArrowRight, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Shops() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await api.get('/shops');
        if (res.data.success) {
          const themes = [
            { name: 'Starbucks Transit', cat: 'Cafe', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80', desc: 'Premium coffee and quick bites for your journey.', products: [{name: 'Caramel Macchiato', price: 280}, {name: 'Butter Croissant', price: 150}] },
            { name: 'Subway Station', cat: 'Fast Food', img: 'https://images.unsplash.com/photo-1550503088-34860b2ebce2?w=500&q=80', desc: 'Fresh subs and healthy salads on the go.', products: [{name: 'Veggie Delite Sub', price: 160}, {name: 'Oatmeal Cookie', price: 50}] },
            { name: 'Relay Convenience', cat: 'Retail', img: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=500&q=80', desc: 'Magazines, snacks, and travel essentials.', products: [{name: 'Mineral Water', price: 20}, {name: 'Travel Neck Pillow', price: 450}] },
            { name: 'Haldirams Express', cat: 'Dining', img: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b0?w=500&q=80', desc: 'Authentic Indian snacks and sweets.', products: [{name: 'Raj Kachori', price: 110}, {name: 'Masala Dosa', price: 140}] },
          ];

          const diverseShops = (res.data.shops || []).map((shop, index) => {
            const theme = themes[index % themes.length];
            return {
              ...shop,
              shopName: theme.name,
              category: theme.cat,
              imageUrl: theme.img,
              description: theme.desc,
              products: theme.products
            };
          });
          setShops(diverseShops);
        }
      } catch (err) {
        console.error('Error fetching shops list', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Station Retail & Dining
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Explore cafe outlets, dining, and shops located inside Pune Metro stations.
      </p>

      <div className="row">
        {/* Shops Directory Grid */}
        <div className="col" style={{ flex: 1.5 }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading retail directory...</p>
          ) : shops.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No station shops registered.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {shops.map((shop) => (
                <div 
                  key={shop._id} 
                  className="glass-panel" 
                  onClick={() => setSelectedShop(shop)}
                  style={{ 
                    cursor: 'pointer', 
                    border: selectedShop?._id === shop._id ? '1px solid var(--accent-teal)' : '1px solid var(--glass-border)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ width: '100%', height: '160px', overflow: 'hidden' }}>
                    <img 
                      src={shop.imageUrl || shop.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80'} 
                      alt={shop.shopName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80'; }}
                    />
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-primary" style={{ background: 'rgba(0, 201, 167, 0.1)', color: 'var(--accent-teal)' }}>
                        {shop.category}
                      </span>
                      <Store size={20} color="var(--text-secondary)" />
                    </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>{shop.shopName}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {shop.description || 'Enjoy refreshments and transit retail shopping during your journey.'}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Offers: {shop.offers?.length || 0} active
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--accent-teal)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View Shop <ArrowRight size={14} />
                    </span>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Shop Catalog detail panel */}
        <div className="col glass-panel" style={{ padding: '30px', flex: 1, minWidth: '320px' }}>
          {selectedShop ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ width: '100%', height: '200px', borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' }}>
                <img 
                  src={selectedShop.imageUrl || selectedShop.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80'} 
                  alt={selectedShop.shopName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80'; }}
                />
              </div>
              <div>
                <span className="badge badge-success">{selectedShop.category}</span>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '10px', marginBottom: '6px' }}>
                  {selectedShop.shopName}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {selectedShop.description || 'Retail convenience outlet.'}
                </p>
              </div>

              {/* Promo Offers list */}
              {selectedShop.offers?.length > 0 && (
                <div style={{ background: 'rgba(155, 89, 182, 0.05)', border: '1px dashed var(--accent-purple)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-purple)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={16} /> Special Promo Active
                  </h4>
                  {selectedShop.offers.map((offer, idx) => (
                    <div key={idx} style={{ fontSize: '13px' }}>
                      <strong>{offer.title}</strong>: Get {offer.discount} off on total order.
                    </div>
                  ))}
                </div>
              )}

              {/* Products list */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
                  Featured Menu / Catalog
                </h4>
                {selectedShop.products?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedShop.products.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{p.name}</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{p.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No products listed.</p>
                )}
              </div>

              {/* Pay Shop shortcut button */}
              <button 
                onClick={() => navigate('/pay-merchant', { state: { shopId: selectedShop._id, shopName: selectedShop.shopName } })}
                className="btn btn-primary" 
                style={{ width: '100%', height: '50px' }}
              >
                Scan & Pay Merchant
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Store size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Select a retail shop from the directory to view their menu catalog and active coupon offers.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
