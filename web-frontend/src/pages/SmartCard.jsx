import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { CreditCard, Link2, Zap, AlertCircle } from 'lucide-react';

export default function SmartCard() {
  const [cards, setCards] = useState([]);
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [showRechargeCard, setShowRechargeCard] = useState(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await api.get('/smartcard');
      if (res.data.success) {
        setCards(res.data.cards || []);
      }
    } catch (e) {
      console.error(e);
      setCards([
        { _id: 'mock-1', cardNumber: '1234567890123456', balance: 450 }
      ]);
    } finally {
      setInitLoading(false);
    }
  };

  const handleLinkCard = async (e) => {
    e.preventDefault();
    if (cardNumber.length !== 16) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/smartcard/link', { cardNumber });
      if (res.data.success) {
        alert('Card linked! ₹150 added as a welcome bonus.');
        setCardNumber('');
        fetchCards();
      } else {
        alert(res.data.message || 'Error linking card');
      }
    } catch (e) {
      alert('Mock Success: Card linked successfully!');
      setCards([...cards, { _id: Date.now().toString(), cardNumber, balance: 150 }]);
      setCardNumber('');
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (cardId) => {
    const amount = parseInt(rechargeAmount, 10);
    if (isNaN(amount) || amount < 50) {
      alert('Minimum recharge is ₹50');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/smartcard/recharge', { cardId, amount });
      if (res.data.success) {
        alert('Card recharged successfully!');
        setShowRechargeCard(null);
        setRechargeAmount('');
        fetchCards();
      } else {
        alert(res.data.message || 'Recharge failed');
      }
    } catch (e) {
      alert('Mock Success: Card recharged!');
      setShowRechargeCard(null);
      setRechargeAmount('');
      fetchCards();
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (num) => num.replace(/(\d{4})/g, '$1 ').trim();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Smart Card Link
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Link your physical NCMC Pune Metro Card to check balances and recharge online.
      </p>

      {initLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="row">
          {/* Linked Cards */}
          <div className="col" style={{ flex: 1.2 }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', color: 'var(--text-muted)' }}>Your Linked Cards</h3>
            
            {cards.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <CreditCard size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
                <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>No Smart Card Linked</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Link your physical NCMC card to check balance and recharge instantly.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {cards.map(card => (
                  <div key={card._id}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)', 
                      borderRadius: '24px', padding: '24px', color: '#fff',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)', position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '80px', background: 'rgba(255,255,255,0.1)' }}></div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <CreditCard size={32} color="rgba(255,255,255,0.9)" />
                        <Zap size={24} color="rgba(255,255,255,0.9)" />
                      </div>
                      
                      <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', color: 'rgba(255,255,255,0.8)' }}>
                        One Pune NCMC Card
                      </div>
                      <div style={{ fontSize: '24px', letterSpacing: '3px', fontWeight: '900', fontFamily: 'monospace', marginBottom: '24px' }}>
                        {formatCardNumber(card.cardNumber)}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', color: 'rgba(255,255,255,0.8)' }}>
                            Available Balance
                          </div>
                          <div style={{ fontSize: '32px', fontWeight: '900' }}>₹{card.balance}</div>
                        </div>
                        <button 
                          onClick={() => setShowRechargeCard(showRechargeCard === card._id ? null : card._id)}
                          style={{ background: '#fff', color: '#D97706', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          Recharge
                        </button>
                      </div>
                    </div>

                    {showRechargeCard === card._id && (
                      <div className="glass-panel" style={{ marginTop: '12px', padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Quick Recharge</h4>
                        <input 
                          type="number" 
                          className="input-field" 
                          placeholder="Enter amount (min ₹50)"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          style={{ marginBottom: '12px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => { setShowRechargeCard(null); setRechargeAmount(''); }} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }}>Cancel</button>
                          <button onClick={() => handleRecharge(card._id)} className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'Processing...' : 'Confirm Pay'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link New Card */}
          <div className="col glass-panel" style={{ flex: 1, padding: '30px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px' }}>Link New Card</h3>
            <form onSubmit={handleLinkCard}>
              <div className="form-group">
                <label>16-Digit Card Number</label>
                <div className="input-group">
                  <CreditCard size={18} color="var(--text-muted)" />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength="16"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '52px', marginTop: '10px' }} disabled={loading || cardNumber.length !== 16}>
                <Link2 size={18} /> {loading ? 'Linking...' : 'Link Smart Card'}
              </button>
            </form>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--accent-red)', fontSize: '13px', lineHeight: '1.5' }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>Make sure your card is issued by Pune Metro (NCMC supported). Linking third-party bank cards is not supported for balance checks.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
