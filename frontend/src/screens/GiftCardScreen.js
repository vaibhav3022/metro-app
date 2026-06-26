import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform,
  Modal, TextInput, FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import RazorpayCheckout from 'react-native-razorpay';

export default function GiftCardScreen() {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const navigation = useNavigation();

  const user = useSelector((state) => state.auth?.user);
  const cardholderName = user?.name ? user.name.toUpperCase() : 'VAIBHAV PATIL';

  const [isGiftMember, setIsGiftMember] = useState(false);
  const [giftBalance, setGiftBalance] = useState(1250);
  const [giftHistory, setGiftHistory] = useState([
    { id: '1', type: 'credit', amount: 1250, date: new Date().toLocaleString(), desc: 'Initial Balance' }
  ]);
  const [activeModal, setActiveModal] = useState(null); 
  const [inputAmount, setInputAmount] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = () => {
    setActiveModal(null);
    const options = {
      description: 'Premium Membership Upgrade',
      image: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Pune_Metro_Logo.svg/1200px-Pune_Metro_Logo.svg.png',
      currency: 'INR',
      key: 'rzp_test_dummy_key_123',
      amount: 49900,
      name: 'Pune Metro',
      prefill: {
        email: user?.email || 'user@example.com',
        contact: user?.mobile || '9999999999',
        name: cardholderName
      },
      theme: { color: '#F59E0B' }
    };
    
    RazorpayCheckout.open(options).then((data) => {
      setIsGiftMember(true);
      Alert.alert('Success', 'You are now a Premium Member!');
    }).catch((error) => {
      setIsGiftMember(true);
      Alert.alert('Success', 'You are now a Premium Member! (Mocked via Razorpay)');
    });
  };

  const handleAddMoney = () => {
    const amount = parseInt(inputAmount);
    if (!amount || amount <= 0) return Alert.alert('Error', 'Enter a valid amount');
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setGiftBalance(prev => prev + amount);
      setGiftHistory(prev => [{ id: Date.now().toString(), type: 'credit', amount, date: new Date().toLocaleString(), desc: 'Added via UPI' }, ...prev]);
      setActiveModal(null);
      setInputAmount('');
      Alert.alert('Success', `₹${amount} added to your Gift Card!`);
    }, 1500);
  };

  const handleSendGiftPreview = () => {
    const amount = parseInt(inputAmount);
    if (!inputEmail || !inputEmail.includes('@')) return Alert.alert('Error', 'Enter a valid email address');
    if (!amount || amount <= 0) return Alert.alert('Error', 'Enter a valid amount');
    if (amount > giftBalance) return Alert.alert('Error', 'Insufficient Gift Card balance');
    
    setActiveModal('emailPreview');
  };

  const confirmSendGift = () => {
    const amount = parseInt(inputAmount);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setGiftBalance(prev => prev - amount);
      setGiftHistory(prev => [{ id: Date.now().toString(), type: 'debit', amount, date: new Date().toLocaleString(), desc: `Sent to ${inputEmail}` }, ...prev]);
      setActiveModal(null);
      setInputAmount('');
      setInputEmail('');
      Alert.alert('Success', `Gift of ₹${amount} successfully sent via Email!`);
    }, 1500);
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gift Cards</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.cardContainer, { height: 210, paddingHorizontal: 20 }]}>
            <LinearGradient colors={['#F43F5E', '#BE123C']} style={[styles.cardFront, { padding: 24, width: '100%', height: '100%', borderRadius: 22, justifyContent: 'space-between' }]} start={{x:0, y:0}} end={{x:1, y:1}}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>GIFT CARD</Text>
                <Icon name="gift-outline" size={32} color="#FFF" />
              </View>
              <Text style={[styles.cardNumber, { marginTop: 10 }]}>**** **** **** 8892</Text>
              
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>BALANCE</Text>
                  <Text style={styles.cardBalance}>₹ {giftBalance.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardLabel}>VALID THRU</Text>
                  <Text style={styles.cardHolder}>12/28</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { setInputAmount(''); setActiveModal('addMoney'); }}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                <Icon name="plus" size={28} color="#F43F5E" />
              </View>
              <Text style={styles.actionText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { setInputAmount(''); setInputEmail(''); setActiveModal('sendGift'); }}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                <Icon name="gift" size={28} color="#F43F5E" />
              </View>
              <Text style={styles.actionText}>Send Gift</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveModal('history')}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                <Icon name="history" size={28} color="#F43F5E" />
              </View>
              <Text style={styles.actionText}>History</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.recentSection, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Gift Card Membership</Text>
            <LinearGradient colors={isGiftMember ? ['#10B981', '#059669'] : ['#FFD700', '#F59E0B']} style={styles.membershipCard} start={{x:0, y:0}} end={{x:1, y:1}}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={styles.membershipTitle}>{isGiftMember ? 'Membership Active' : 'Premium Member'}</Text>
                  <Text style={styles.membershipSubtitle}>{isGiftMember ? 'Valid till Dec 2027' : 'Unlock Exclusive Metro Perks'}</Text>
                </View>
                <Icon name={isGiftMember ? 'check-decagram' : 'crown'} size={40} color="#FFF" />
              </View>
              <View style={styles.membershipPerks}>
                <View style={styles.perkRow}>
                  <Icon name="check-circle" size={16} color="#FFF" />
                  <Text style={styles.perkText}> 5% Extra Cashback on Recharge</Text>
                </View>
                <View style={styles.perkRow}>
                  <Icon name="check-circle" size={16} color="#FFF" />
                  <Text style={styles.perkText}> Free Access to Partner Merchant Offers</Text>
                </View>
              </View>
              {!isGiftMember && (
                <TouchableOpacity style={styles.upgradeBtn} onPress={() => setActiveModal('upgrade')}>
                  <Text style={styles.upgradeBtnText}>Upgrade Now - ₹499/year</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Add Money Modal */}
      <Modal visible={activeModal === 'addMoney'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money to Gift Card</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Icon name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Current Balance: ₹{giftBalance.toLocaleString()}</Text>
            
            <TextInput
              style={styles.inputField}
              placeholder="Enter Amount (₹)"
              placeholderTextColor={COLORS.textLight}
              keyboardType="number-pad"
              value={inputAmount}
              onChangeText={setInputAmount}
            />
            
            <View style={styles.quickAmounts}>
              {[500, 1000, 2000].map(amt => (
                <TouchableOpacity key={amt} style={styles.quickChip} onPress={() => setInputAmount(amt.toString())}>
                  <Text style={styles.quickChipText}>+₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddMoney} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Proceed to Pay</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Send Gift Input Modal */}
      <Modal visible={activeModal === 'sendGift'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send a Gift via Email</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Icon name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Available Balance: ₹{giftBalance.toLocaleString()}</Text>
            
            <TextInput
              style={styles.inputField}
              placeholder="Recipient's Email Address"
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              value={inputEmail}
              onChangeText={setInputEmail}
            />
            
            <TextInput
              style={styles.inputField}
              placeholder="Gift Amount (₹)"
              placeholderTextColor={COLORS.textLight}
              keyboardType="number-pad"
              value={inputAmount}
              onChangeText={setInputAmount}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSendGiftPreview}>
              <Text style={styles.submitBtnText}>Preview Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Email Preview Modal */}
      <Modal visible={activeModal === 'emailPreview'} transparent animationType="fade">
        <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden', width: '90%', alignSelf: 'center', borderRadius: 24 }]}>
            <View style={styles.emailHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="email" size={20} color="#FFF" />
                <Text style={styles.emailHeaderTitle}>New Message</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.emailBody}>
              <Text style={styles.emailSubject}>Subject: 🎁 You've received a ₹{inputAmount} Metro Gift Card!</Text>
              <View style={styles.emailDivider} />
              
              <Text style={styles.emailText}>Hello <Text style={{ fontWeight: '800' }}>{inputEmail}</Text>,</Text>
              <Text style={styles.emailText}>Your friend has sent you a Pune Metro Gift Card worth <Text style={{ fontWeight: '800', color: '#10B981' }}>₹{inputAmount}</Text>!</Text>
              
              <View style={styles.emailCodeBox}>
                <Text style={styles.emailCodeLabel}>Your Secret Redemption Code:</Text>
                <Text style={styles.emailCodeText}>GIFT-{Math.floor(1000 + Math.random() * 9000)}-{Math.floor(1000 + Math.random() * 9000)}</Text>
              </View>

              <Text style={styles.emailStepsTitle}>How to redeem:</Text>
              <Text style={styles.emailText}>1. Download the Pune Metro App.</Text>
              <Text style={styles.emailText}>2. Go to <Text style={{ fontWeight: '700' }}>Gift Cards</Text>.</Text>
              <Text style={styles.emailText}>3. Click Redeem and enter your secret code.</Text>

              <TouchableOpacity style={styles.emailDownloadBtn} onPress={() => {}}>
                <Text style={styles.emailDownloadBtnText}>Download App Here</Text>
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <TouchableOpacity style={styles.submitBtn} onPress={confirmSendGift} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Confirm & Send Email</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={activeModal === 'history'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gift Card History</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Icon name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            
            <FlatList
              data={giftHistory}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingVertical: 10 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.historyRow}>
                  <View style={styles.historyIconBox}>
                    <Icon name={item.type === 'credit' ? 'arrow-down-left' : 'arrow-up-right'} size={24} color={item.type === 'credit' ? '#10B981' : '#F43F5E'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.historyDesc}>{item.desc}</Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                  <Text style={[styles.historyAmount, { color: item.type === 'credit' ? '#10B981' : COLORS.text }]}>
                    {item.type === 'credit' ? '+' : '-'}₹{item.amount.toLocaleString()}
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Upgrade Membership Modal */}
      <Modal visible={activeModal === 'upgrade'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#FFD700', '#F59E0B']} style={styles.upgradeHeaderBg} start={{x:0, y:0}} end={{x:1, y:1}}>
              <Icon name="crown" size={60} color="#FFF" />
            </LinearGradient>
            <View style={{ padding: 20 }}>
              <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Confirm Upgrade</Text>
              <Text style={[styles.modalSubtitle, { textAlign: 'center', marginBottom: 20 }]}>Pay ₹499 to unlock 1 year of Premium benefits.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border }]} onPress={() => setActiveModal(null)}>
                  <Text style={[styles.submitBtnText, { color: COLORS.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} onPress={handleUpgrade} disabled={isProcessing}>
                  {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Pay ₹499 via Razorpay</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  scrollContent: { padding: 20, paddingBottom: 40 },
  cardContainer: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  cardFront: { zIndex: 1, padding: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 1.5, textTransform: 'uppercase' },
  cardNumber: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginVertical: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' },
  cardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  cardBalance: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  cardHolder: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 20 },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIconBg: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 12, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  recentSection: { paddingHorizontal: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 15, letterSpacing: 0.5 },
  membershipCard: { borderRadius: 20, padding: 20, elevation: 8, shadowColor: '#F59E0B', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  membershipTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 2 },
  membershipSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  membershipPerks: { marginTop: 20, marginBottom: 20, gap: 10 },
  perkRow: { flexDirection: 'row', alignItems: 'center' },
  perkText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  upgradeBtn: { backgroundColor: '#fff', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  upgradeBtnText: { color: '#F59E0B', fontSize: 15, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  modalSubtitle: { fontSize: 14, color: COLORS.textLight, fontWeight: '600', marginBottom: 20 },
  inputField: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text, fontWeight: '700', marginBottom: 16 },
  quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickChip: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: COLORS.background, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  quickChipText: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  submitBtn: { backgroundColor: '#00C9A7', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  historyIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  historyDesc: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  historyDate: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  historyAmount: { fontSize: 16, fontWeight: '900' },
  upgradeHeaderBg: { alignItems: 'center', paddingVertical: 30, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  emailHeader: { backgroundColor: '#0047AB', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emailHeaderTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  emailBody: { padding: 20, backgroundColor: COLORS.cardBg },
  emailSubject: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 12 },
  emailDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
  emailText: { fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: 8 },
  emailCodeBox: { backgroundColor: COLORS.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginVertical: 16, alignItems: 'center' },
  emailCodeLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 4 },
  emailCodeText: { fontSize: 24, fontWeight: '900', color: '#00C9A7', letterSpacing: 2 },
  emailStepsTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 10, marginBottom: 8 },
  emailDownloadBtn: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  emailDownloadBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
