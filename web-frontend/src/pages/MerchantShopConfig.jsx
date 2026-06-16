import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Store, Upload, CheckCircle, Save } from 'lucide-react';

export default function MerchantShopConfig() {
  const [shopData, setShopData] = useState({
    shopName: '',
    description: '',
    imageUrl: '',
    category: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // In a real app we'd fetch the specific shop of the logged-in merchant.
    // For now we just load mock data or empty data
    setTimeout(() => {
      setShopData({
        shopName: 'My Awesome Metro Shop',
        description: 'Serving hot coffee and quick bites for metro travelers.',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80',
        category: 'Cafe'
      });
      setLoading(false);
    }, 500);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setSuccess('Shop configuration saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading shop configuration...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '16px' }}>
        <div style={{ padding: '12px', background: 'rgba(0, 201, 167, 0.15)', borderRadius: '12px' }}>
          <Store size={28} color="var(--accent-teal)" />
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>My Shop Config</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your retail outlet details and branding</p>
        </div>
      </div>

      {success && (
        <div style={{ padding: '16px', background: 'rgba(0, 201, 167, 0.15)', color: 'var(--accent-teal)', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      <form className="glass-panel" style={{ padding: '30px' }} onSubmit={handleSave}>
        
        <div className="form-group">
          <label>Shop Name</label>
          <input 
            type="text" 
            className="input-field" 
            value={shopData.shopName} 
            onChange={e => setShopData({...shopData, shopName: e.target.value})} 
            required 
          />
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Category</label>
          <select 
            className="input-field" 
            value={shopData.category}
            onChange={e => setShopData({...shopData, category: e.target.value})}
          >
            <option value="Cafe">Cafe</option>
            <option value="Dining">Dining</option>
            <option value="Retail">Retail</option>
            <option value="Convenience">Convenience</option>
            <option value="Fast Food">Fast Food</option>
          </select>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Description</label>
          <textarea 
            className="input-field" 
            rows="4" 
            value={shopData.description}
            onChange={e => setShopData({...shopData, description: e.target.value})}
          />
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Store Banner Image URL</label>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <img 
              src={shopData.imageUrl} 
              alt="Shop Preview" 
              style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--glass-border)' }} 
            />
            <div style={{ flex: 1 }}>
              <input 
                type="url" 
                className="input-field" 
                value={shopData.imageUrl}
                onChange={e => setShopData({...shopData, imageUrl: e.target.value})}
                placeholder="https://..."
                style={{ marginBottom: '10px' }}
              />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Provide a high-quality image URL for your storefront. This is visible to all passengers.</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '14px 32px', fontSize: '16px' }}>
            <Save size={18} style={{ marginRight: '8px' }} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
