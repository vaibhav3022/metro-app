import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform,
  Modal, TextInput, FlatList, Share
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../api/axiosConfig';
import { updateProfileSuccess } from '../redux/slices/authSlice';

export default function GiftCardScreen() {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth?.user);
  const cardholderName = user?.name ? user.name.toUpperCase() : 'METRO USER';

  const isGiftMember = user?.role === 'member' || user?.role === 'admin';

  const [giftHistory, setGiftHistory] = useState([]);
  const [activeCards, setActiveCards] = useState([]);
  const [giftBalance, setGiftBalance] = useState(0);

  const [activeModal, setActiveModal] = useState(null); 
  const [inputAmount, setInputAmount] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        api.get('/giftcard/sent'),
        api.get('/giftcard/received')
      ]);

      const sent = sentRes.data.giftCards || [];
      const received = receivedRes.data.giftCards || [];

      // Active cards are those sent by the user that are still active (unused)
      const active = sent.filter(c => c.status === 'active');
      setActiveCards(active);
      const balance = active.reduce((sum, c) => sum + c.amount, 0);
      setGiftBalance(balance);

      const combined = [
        ...sent.map(c => ({
          id: c._id,
          type: 'debit',
          amount: c.amount,
          date: new Date(c.createdAt).toLocaleString(),
          desc: c.status === 'redeemed' ? `Redeemed by ${c.receiverEmail || 'User'}` : (c.receiverEmail ? `Sent to ${c.receiverEmail}` : 'Purchased Gift Card')
        })),
        ...received.map(c => ({
          id: c._id,
          type: 'credit',
          amount: c.amount,
          date: new Date(c.redeemedAt || c.createdAt).toLocaleString(),
          desc: `Received from ${c.senderName || 'Friend'}`
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setGiftHistory(combined);
    } catch (err) {
      console.log('Error fetching gift cards', err);
    }
  };

  const handleUpgrade = async () => {
    setActiveModal(null);
    try {
      setIsProcessing(true);
      const { data } = await api.post('/membership/create-razorpay-order', { planType: 'premium' });
      
      const options = {
        description: 'Premium Membership Upgrade',
        image: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Pune_Metro_Logo.svg/1200px-Pune_Metro_Logo.svg.png',
        currency: 'INR',
        key: data.key_id || 'rzp_test_St6f7LZjydxbQ0',
        amount: data.amount || 49900,
        name: 'Pune Metro',
        order_id: data.orderId,
        prefill: { email: user?.email, contact: user?.mobile, name: cardholderName },
        theme: { color: '#F59E0B' }
      };

      if (options.order_id && options.order_id.startsWith('order_mock_')) {
        delete options.order_id;
      }
      
      RazorpayCheckout.open(options).then(async (razorpayData) => {
        await api.post('/membership/buy', { paymentId: razorpayData.razorpay_payment_id, planType: 'premium' });
        dispatch(updateProfileSuccess({ ...user, role: 'member' }));
        Alert.alert('Success', 'You are now a Premium Member!');
      }).catch((error) => {
        Alert.alert('Error', 'Payment failed or was cancelled.');
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to initialize payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyGiftCard = async () => {
    const amount = parseInt(inputAmount);
    if (!amount || amount <= 0) return Alert.alert('Error', 'Enter a valid amount');
    if (!isGiftMember) {
      setActiveModal(null);
      return Alert.alert('Access Denied', 'Only Premium Members can buy and send gift cards. Please upgrade.');
    }
    
    try {
      setIsProcessing(true);
      const { data } = await api.post('/giftcard/create-order', { amount });
      
      const options = {
        description: `Pune Metro Gift Card worth ₹${amount}`,
        image: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Pune_Metro_Logo.svg/1200px-Pune_Metro_Logo.svg.png',
        currency: 'INR',
        key: data.key_id || 'rzp_test_St6f7LZjydxbQ0',
        amount: data.amount,
        name: 'Pune Metro',
        order_id: data.orderId,
        prefill: { email: user?.email, contact: user?.mobile, name: cardholderName },
        theme: { color: '#F43F5E' }
      };

      if (options.order_id && options.order_id.startsWith('order_mock_')) {
        delete options.order_id;
      }
      
      RazorpayCheckout.open(options).then(async (razorpayData) => {
        const createRes = await api.post('/giftcard/create', { 
          amount, 
          paymentId: razorpayData.razorpay_payment_id 
        });
        const card = createRes.data.giftCard;
        const fullCode = card?.pin ? `${card.cardId}-${card.pin}` : card?.cardId;
        fetchGiftCards();
        setActiveModal(null);
        setInputAmount('');
        // Show the code and let sender share it
        Alert.alert(
          '🎁 Gift Card Purchased!',
          `Your ₹${amount} Gift Card is ready!\n\nSecret Code:\n${fullCode}\n\nShare this code with your friend via WhatsApp or SMS so they can redeem it.`,
          [
            {
              text: '📤 Share with Friend',
              onPress: () => Share.share({
                message: `🎁 Pune Metro – METROXIA Gift Card!\n\n*Secret Code:* ${fullCode}\n\nSteps to Redeem:\n1. Download METROXIA App\n2. Go to Smart Card → Gift Cards\n3. Tap Redeem & enter this code\n4. ₹${amount} added to your Metro Wallet instantly! 🎉`,
                title: 'Gift Card Code'
              })
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }).catch((error) => {
        Alert.alert('Error', 'Payment failed or was cancelled.');
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to initialize payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendGiftPreview = () => {
    if (!isGiftMember) {
      setActiveModal(null);
      return Alert.alert('Access Denied', 'Only Premium Members can send gift cards.');
    }
    if (!inputEmail || !inputEmail.includes('@')) return Alert.alert('Error', 'Enter a valid email address');
    if (!selectedCardId) return Alert.alert('Error', 'Please select a gift card from your available cards.');

    setActiveModal('emailPreview');
  };

  const confirmSendGift = async () => {
    try {
      setIsProcessing(true);
      const res = await api.post('/giftcard/send', {
        cardId: selectedCardId,
        receiverEmail: inputEmail,
        message: 'A gift from your friend!'
      });
      const fullCode = res.data.newPin ? `${selectedCardId}-${res.data.newPin}` : selectedCardId;
      fetchGiftCards();
      setActiveModal(null);
      setInputAmount('');
      setInputEmail('');
      // Show share dialog so sender can share code via WhatsApp/SMS
      Alert.alert(
        '🎁 Gift Card Sent!',
        `Email sent to ${inputEmail} with the card ID.\n\nShare the SECRET CODE below via WhatsApp or SMS:\n\n${fullCode}`,
        [
          {
            text: 'Share via WhatsApp/SMS',
            onPress: () => Share.share({
              message: `🎁 Your Pune Metro Gift Card Code:\n\n*Code:* ${fullCode}\n\nDownload the METROXIA App → Go to Gift Cards → Tap Redeem → Enter this code to claim ₹${inputAmount}!`,
              title: 'Gift Card Code'
            })
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send email.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemGift = async () => {
    if (!inputCode) return Alert.alert('Error', 'Please enter a valid gift card code.');
    try {
      setIsProcessing(true);
      const res = await api.post('/giftcard/redeem', { code: inputCode });
      fetchGiftCards();
      setActiveModal(null);
      setInputCode('');
      Alert.alert('Success', `Gift Card Redeemed! ₹${res.data.amount} has been added to your Metro Wallet.`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to redeem gift card.');
    } finally {
      setIsProcessing(false);
    }
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
                <Text style={styles.cardTitle}>GIFT CARDS</Text>
                <Icon name="gift-outline" size={32} color="#FFF" />
              </View>
              <Text style={[styles.cardNumber, { marginTop: 10 }]}>AVAILABLE</Text>
              
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>TOTAL VALUE</Text>
                  <Text style={styles.cardBalance}>₹ {giftBalance.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardLabel}>UNUSED CARDS</Text>
                  <Text style={styles.cardHolder}>{activeCards.filter(c => !c.receiverEmail).length}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { setInputAmount(''); setActiveModal('addMoney'); }}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                <Icon name="cart-plus" size={28} color="#F43F5E" />
              </View>
              <Text style={styles.actionText}>Buy Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { setInputAmount(''); setInputEmail(''); setActiveModal('sendGift'); }}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                <Icon name="email-fast" size={28} color="#F43F5E" />
              </View>
              <Text style={styles.actionText}>Send Gift</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { setInputCode(''); setActiveModal('redeem'); }}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Icon name="cash-plus" size={28} color="#10B981" />
              </View>
              <Text style={styles.actionText}>Redeem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setActiveModal('history')}>
              <View style={[styles.actionIconBg, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
                <Icon name="history" size={28} color="#0EA5E9" />
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
                  <Text style={styles.membershipSubtitle}>{isGiftMember ? 'You can buy & send Gifts' : 'Unlock Exclusive Metro Perks'}</Text>
                </View>
                <Icon name={isGiftMember ? 'check-decagram' : 'crown'} size={40} color="#FFF" />
              </View>
            <View style={styles.membershipPerks}>
                {[
                  { icon: 'gift', text: 'Buy & Send Digital Gift Cards to anyone' },
                  { icon: 'tag-multiple', text: 'Exclusive Partner Merchant Discounts & Offers' },
                  { icon: 'wallet-giftcard', text: 'Redeem gift cards directly to Metro Wallet' },
                  { icon: 'bell-badge', text: 'Priority Notifications for deals & new offers' },
                  { icon: 'shield-check', text: 'Premium Badge & Priority Customer Support' },
                ].map((perk, i) => (
                  <View key={i} style={styles.perkRow}>
                    <Icon name={perk.icon} size={16} color="#FFF" />
                    <Text style={styles.perkText}> {perk.text}</Text>
                  </View>
                ))}
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

      {/* Buy Gift Card Modal */}
      <Modal visible={activeModal === 'addMoney'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buy a Digital Gift Card</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Icon name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Enter value for the new card</Text>
            
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
                  <Text style={styles.quickChipText}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleBuyGiftCard} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Proceed to Pay</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Send Gift Modal - shows existing unused cards */}
      <Modal visible={activeModal === 'sendGift'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send a Gift Card</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Icon name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>

            {activeCards.filter(c => !c.receiverEmail).length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Icon name="gift-off-outline" size={50} color={COLORS.textLight} />
                <Text style={[styles.modalSubtitle, { textAlign: 'center', marginTop: 12 }]}>You have no unused gift cards.{`\n`}Buy one first!</Text>
                <TouchableOpacity style={[styles.submitBtn, { marginTop: 10, width: '100%' }]} onPress={() => setActiveModal('addMoney')}>
                  <Text style={styles.submitBtnText}>Buy a Gift Card</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>Select a card to send:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {activeCards.filter(c => !c.receiverEmail).map(card => (
                      <TouchableOpacity
                        key={card._id}
                        onPress={() => setSelectedCardId(card.cardId)}
                        style={[
                          styles.quickChip,
                          { paddingHorizontal: 20, paddingVertical: 14 },
                          selectedCardId === card.cardId && { backgroundColor: '#F43F5E', borderColor: '#F43F5E' }
                        ]}
                      >
                        <Text style={[styles.quickChipText, selectedCardId === card.cardId && { color: '#FFF' }]}>₹{card.amount}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <TextInput
                  style={styles.inputField}
                  placeholder="Recipient's Email Address"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={inputEmail}
                  onChangeText={setInputEmail}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSendGiftPreview}>
                  <Text style={styles.submitBtnText}>Preview & Send</Text>
                </TouchableOpacity>
              </>
            )}
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
                <Text style={styles.emailCodeLabel}>Redemption Code:</Text>
                <Text style={styles.emailCodeText}>Will be sent via email</Text>
              </View>

              <Text style={styles.emailStepsTitle}>How to redeem:</Text>
              <Text style={styles.emailText}>1. Download the Pune Metro App.</Text>
              <Text style={styles.emailText}>2. Go to <Text style={{ fontWeight: '700' }}>Gift Cards</Text>.</Text>
              <Text style={styles.emailText}>3. Click Redeem and enter your secret code.</Text>
            </View>

            <View style={{ padding: 20 }}>
              <TouchableOpacity style={styles.submitBtn} onPress={confirmSendGift} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Confirm & Send Email</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Redeem Modal */}
      <Modal visible={activeModal === 'redeem'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Redeem Gift Card</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Icon name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Enter the code you received to add money to your Metro Wallet.</Text>
            
            <TextInput
              style={styles.inputField}
              placeholder="e.g. AB12CD34-XYZ789"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="characters"
              value={inputCode}
              onChangeText={setInputCode}
            />

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#10B981' }]} onPress={handleRedeemGift} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Redeem Code</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={activeModal === 'history'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Activity History</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Icon name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            
            <FlatList
              data={giftHistory}
              keyExtractor={(item, index) => item.id + index.toString()}
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
              <Text style={[styles.modalSubtitle, { textAlign: 'center', marginBottom: 20 }]}>Pay ₹499 to unlock Premium benefits.</Text>
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
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 20, gap: 5 },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionText: { fontSize: 11, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
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
  submitBtn: { backgroundColor: '#F43F5E', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
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
  emailCodeText: { fontSize: 18, fontWeight: '900', color: '#00C9A7', letterSpacing: 1 },
  emailStepsTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 10, marginBottom: 8 },
});
