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
import { useTheme } from '../context/ThemeContext';

const API_BASE = BASE_URL || 'http://10.0.2.2:5000';

export default function SmartCardScreen() {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  
  const navigation = useNavigation();

  const [cards, setCards] = useState([]);
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setInitLoading(true);
    setTimeout(() => {
      setCards([
        { _id: 'mock-1', cardNumber: '1234567890123456', balance: 450 }
      ]);
      setInitLoading(false);
    }, 500);
  };

  const handleLinkCard = async () => {
    if (cardNumber.length !== 16) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      Alert.alert('Success', 'Card linked! ₹150 added as a welcome bonus.');
      setCards([...cards, { _id: Date.now().toString(), cardNumber, balance: 150 }]);
      setCardNumber('');
      setLoading(false);
    }, 800);
  };

  const handleRemoveCard = (cardId) => {
    Alert.alert(
      'Unlink Card',
      'Are you sure you want to remove this smart card from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => {
            setCards(cards.filter(c => c._id !== cardId));
            if (showRechargeCard === cardId) setShowRechargeCard(null);
          }
        }
      ]
    );
  };

  const formatCardNumber = (num) =>
    num.replace(/(\d{4})/g, '$1 ').trim();

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={COLORS.text} />
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveCard(card._id)}>
                            <Icon name="trash-can-outline" size={20} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrap}>
                    <Icon name="credit-card-off-outline" size={40} color={COLORS.textLight} />
                  </View>
                  <Text style={styles.emptyTitle}>No Smart Card Linked</Text>
                  <Text style={styles.emptySubtitle}>Link your physical NCMC card to check balance instantly.</Text>
                </View>
              )}

              {/* Link New Card */}
              <View style={styles.linkCard}>
                <Text style={styles.sectionTitle}>Link New Card</Text>
                <View style={styles.inputRow}>
                  <Icon name="credit-card-scan" size={24} color={COLORS.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.cardInput}
                    placeholder="Enter 16-digit card number"
                    placeholderTextColor={COLORS.textLight}
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
                  <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.linkButtonGrad} start={{x:0, y:0}} end={{x:1, y:0}}>
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

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  centered: { height: 300, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  
  cardGradient: { borderRadius: 24, padding: 24, overflow: 'hidden', elevation: 8, shadowColor: '#F59E0B', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {width: 0, height: 4} },
  cardDecor: { position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  cardNumber: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 24, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  removeBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  
  emptyCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },
  
  linkCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border, marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 16, marginBottom: 20 },
  inputIcon: { marginRight: 12 },
  cardInput: { flex: 1, paddingVertical: 16, fontSize: 16, color: COLORS.text, letterSpacing: 2, fontWeight: '600' },
  linkButtonWrap: { borderRadius: 14, overflow: 'hidden' },
  linkButtonGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, gap: 10 },
  linkButtonDisabled: { opacity: 0.5 },
  linkButtonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 }
});
