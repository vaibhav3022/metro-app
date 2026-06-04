import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL } from '../api/axiosConfig';

const API_BASE = BASE_URL || 'http://10.0.2.2:5000';

export default function SmartCardScreen() {
  const navigation = useNavigation();

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
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_BASE}/api/smartcard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
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

  const handleLinkCard = async () => {
    if (cardNumber.length !== 16) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_BASE}/api/smartcard/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardNumber })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'Card linked! ₹150 added as a welcome bonus.');
        setCardNumber('');
        fetchCards();
      } else {
        Alert.alert('Error', data.message || 'Error linking card');
      }
    } catch (e) {
      Alert.alert('Mock Success', 'Card linked successfully!');
      setCards([...cards, { _id: Date.now().toString(), cardNumber, balance: 150 }]);
      setCardNumber('');
    }
    setLoading(false);
  };

  const handleRecharge = async (cardId) => {
    const amount = parseInt(rechargeAmount, 10);
    if (isNaN(amount) || amount < 50) {
      Alert.alert('Invalid Amount', 'Minimum recharge is ₹50');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_BASE}/api/smartcard/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardId, amount })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'Card recharged successfully!');
        setShowRechargeCard(null);
        setRechargeAmount('');
        fetchCards();
      } else {
        Alert.alert('Error', data.message || 'Recharge failed');
      }
    } catch (e) {
      Alert.alert('Mock Success', 'Card recharged!');
      setShowRechargeCard(null);
      setRechargeAmount('');
      fetchCards();
    }
    setLoading(false);
  };

  const formatCardNumber = (num) =>
    num.replace(/(\d{4})/g, '$1 ').trim();

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Smart Card</Text>
            <View style={{ width: 44 }} />
          </View>

          {initLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#00C9A7" />
            </View>
          ) : (
            <>
              {/* Cards Section */}
              <Text style={styles.sectionTitle}>Your Linked Cards</Text>
              {cards.length > 0 ? (
                cards.map(card => (
                  <View key={card._id} style={{ marginBottom: 16 }}>
                    <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.cardGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                      <View style={styles.cardDecor} />
                      <View style={styles.cardHeaderRow}>
                        <Icon name="integrated-circuit" size={40} color="rgba(255,255,255,0.8)" />
                        <Icon name="contactless-payment" size={30} color="rgba(255,255,255,0.8)" />
                      </View>
                      <Text style={styles.cardLabel}>One Pune NCMC Card</Text>
                      <Text style={styles.cardNumber}>{formatCardNumber(card.cardNumber)}</Text>
                      <View style={styles.cardFooter}>
                        <View>
                          <Text style={styles.balanceLabel}>Available Balance</Text>
                          <Text style={styles.balanceValue}>₹{card.balance}</Text>
                        </View>
                        <TouchableOpacity style={styles.rechargeBtn} onPress={() => setShowRechargeCard(card._id)}>
                          <Text style={styles.rechargeBtnText}>Recharge</Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>

                    {showRechargeCard === card._id && (
                      <View style={styles.rechargeForm}>
                        <TextInput
                          style={styles.rechargeInput}
                          placeholder="Enter amount (min ₹50)"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          keyboardType="numeric"
                          value={rechargeAmount}
                          onChangeText={setRechargeAmount}
                        />
                        <View style={styles.rechargeActions}>
                          <TouchableOpacity style={styles.cancelRecharge} onPress={() => { setShowRechargeCard(null); setRechargeAmount(''); }}>
                            <Text style={styles.cancelRechargeText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.confirmRecharge} onPress={() => handleRecharge(card._id)} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmRechargeText}>Confirm Pay</Text>}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrap}>
                    <Icon name="credit-card-off-outline" size={40} color="rgba(255,255,255,0.4)" />
                  </View>
                  <Text style={styles.emptyTitle}>No Smart Card Linked</Text>
                  <Text style={styles.emptySubtitle}>Link your physical NCMC card to check balance and recharge online instantly.</Text>
                </View>
              )}

              {/* Link New Card */}
              <View style={styles.linkCard}>
                <Text style={styles.sectionTitle}>Link New Card</Text>
                <View style={styles.inputRow}>
                  <Icon name="credit-card-scan" size={24} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.cardInput}
                    placeholder="Enter 16-digit card number"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={cardNumber}
                    onChangeText={(t) => setCardNumber(t.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    maxLength={16}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.linkButtonWrap, (loading || cardNumber.length !== 16) && styles.linkButtonDisabled]}
                  onPress={handleLinkCard}
                  disabled={loading || cardNumber.length !== 16}
                >
                  <LinearGradient colors={['#00C9A7', '#009980']} style={styles.linkButtonGrad} start={{x:0, y:0}} end={{x:1, y:0}}>
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <>
                        <Icon name="link-variant" size={20} color="#fff" />
                        <Text style={styles.linkButtonText}>Link Smart Card</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  
  centered: { height: 300, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  
  cardGradient: { borderRadius: 24, padding: 24, overflow: 'hidden', elevation: 8, shadowColor: '#F59E0B', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {width: 0, height: 4} },
  cardDecor: { position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  cardNumber: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 24, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  rechargeBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  rechargeBtnText: { color: '#D97706', fontWeight: '800', fontSize: 14 },
  
  rechargeForm: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rechargeInput: { backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, color: '#fff', fontSize: 18, marginBottom: 16, fontWeight: '700' },
  rechargeActions: { flexDirection: 'row', gap: 12 },
  cancelRecharge: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cancelRechargeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  confirmRecharge: { flex: 1, backgroundColor: '#00C9A7', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmRechargeText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
  
  linkCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, marginBottom: 20 },
  inputIcon: { marginRight: 12 },
  cardInput: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#fff', letterSpacing: 2, fontWeight: '600' },
  linkButtonWrap: { borderRadius: 14, overflow: 'hidden' },
  linkButtonGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 10 },
  linkButtonDisabled: { opacity: 0.5 },
  linkButtonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
