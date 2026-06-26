import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  StyleSheet, Text, View, TouchableOpacity, StatusBar,
  Alert, ScrollView, TextInput, ActivityIndicator, Platform, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { ticketAPI } from '../api/ticketAPI';
import { walletAPI } from '../api/walletAPI';
import { shopAPI } from '../api/shopAPI';
import { setCurrentTicket, fetchHistorySuccess } from '../redux/slices/ticketSlice';
import { deductMoneySuccess, addMoneySuccess } from '../redux/slices/walletSlice';
import { useTranslation } from 'react-i18next';

export default function PaymentScreen({ route, navigation }) {
  const { paymentContext = 'ticket', amount = 0 } = route?.params || {};
  const dispatch = useDispatch();
  const { theme: COLORS, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const bookingDetails = useSelector((state) => state.tickets.bookingDetails);
  const balance = useSelector((state) => state.wallet.balance);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  
  const [expandedSection, setExpandedSection] = useState('upi');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [manualUpiId, setManualUpiId] = useState('');

  if (paymentContext === 'ticket' && !bookingDetails) return null;

  const { source, destination, passengers, distance, farePerPerson, totalAmount } = bookingDetails || {};
  const finalAmount = (paymentContext === 'wallet' || paymentContext === 'merchant') ? amount : totalAmount;
  const isWalletSufficient = Number(balance) >= Number(finalAmount);

  const handlePaymentSuccess = async (paymentId, method, razorpayData = {}) => {
    setLoading(true);

    try {
      if (paymentContext === 'wallet') {
        setLoadingMsg(t('payment.addingToWallet'));
        const res = await walletAPI.addMoney(finalAmount, paymentId);
        dispatch(addMoneySuccess({ balance: res.balance, transaction: res.transaction }));
        setLoading(false);
        setSuccessData({
          title: t('payment.rechargeSuccess'),
          amount: finalAmount,
          message: t('payment.addedToWallet', { amount: finalAmount }),
          method: t('payment.topUp'),
          actionText: t('payment.backToDash'),
          onAction: () => navigation.goBack()
        });
        return;
      }

      if (paymentContext === 'merchant') {
        const { shopId, businessName } = route.params || {};
        setLoadingMsg(t('payment.processingMerchant'));
        
        // Process on backend (deducts wallet if method is 'wallet', else records as Razorpay transaction)
        await shopAPI.payShop(shopId, finalAmount, method === 'wallet' ? 'wallet' : 'razorpay', paymentId);
        
        if (method === 'wallet') {
          const updatedWallet = await walletAPI.getBalance();
          dispatch(deductMoneySuccess({ balance: updatedWallet.balance }));
        }

        setLoading(false);
        setSuccessData({
          title: t('payment.paymentSuccess'),
          amount: finalAmount,
          message: t('payment.paidTo', { merchant: businessName || 'Merchant' }),
          method: t('payment.merchantPayment'),
          actionText: t('payment.backToDash'),
          onAction: () => navigation.navigate('Home')
        });
        return;
      }

      setLoadingMsg(t('payment.generatingTicket'));
      const ticketResult = await ticketAPI.createTicket({ source, destination, distance, fare: farePerPerson, passengers, totalAmount: finalAmount });
      const { ticket } = ticketResult;

      const paymentResult = await ticketAPI.processPayment(ticket.ticketId, {
        paymentId, paymentMethod: method, paymentStatus: 'success', ...razorpayData
      });

      if (method === 'wallet') {
        const updatedWallet = await walletAPI.getBalance();
        dispatch(deductMoneySuccess({ balance: updatedWallet.balance }));
      }

      setLoading(false);
      dispatch(setCurrentTicket(paymentResult.ticket));

      // Refresh ticket history so HomeScreen Recent Tickets updates immediately
      try {
        const historyData = await ticketAPI.getTicketHistory();
        if (historyData.tickets) {
          dispatch(fetchHistorySuccess(historyData.tickets));
        }
      } catch (_) {}

      setSuccessData({
        title: t('payment.ticketBooked'),
        amount: finalAmount,
        message: `Ticket ID: ${paymentResult.ticket.ticketId}`,
        method: t('payment.ticketBooking'),
        actionText: t('payment.viewTicketQr'),
        onAction: () => navigation.replace('QRTicket')
      });
    } catch (error) {
      setLoading(false);
      Alert.alert(t('payment.paymentFailure'), error.response?.data?.message || 'Error processing transaction.');
    }
  };

  const processPayment = async () => {
    if (!selectedMethod) {
      Alert.alert(t('payment.selectionRequired'), t('payment.pleaseSelect'));
      return;
    }
    
    if (selectedMethod === 'wallet' && !isWalletSufficient) {
       Alert.alert(t('payment.insufficientBalance'), t('payment.pleaseTopUp'));
       return;
    }

    if (selectedMethod === 'wallet') {
      const mockPaymentId = `WAL-TXN-${Date.now()}`;
      handlePaymentSuccess(mockPaymentId, 'wallet');
      return;
    }

    // SIMULATED RAZORPAY
    setLoading(true);
    setLoadingMsg(t('payment.secureTransaction'));
    try {
      // Simulate create order
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Payment Gateway',
          `Pay ₹${finalAmount} via ${selectedMethod}?`,
          [
            { text: 'Simulate Success', onPress: () => handlePaymentSuccess(`RZP-${Date.now()}`, selectedMethod) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }, 1500);
    } catch (e) {
      setLoading(false);
      Alert.alert(t('payment.gatewayError'), t('payment.couldNotInitiate'));
    }
  };

  const toggleSection = (section) => setExpandedSection(expandedSection === section ? null : section);
  const selectOption = (methodId) => setSelectedMethod(methodId);

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00C9A7" />
          <Text style={styles.loadingMsg}>{loadingMsg}</Text>
        </View>
      )}

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('payment.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            {paymentContext === 'merchant' && (
              <View style={styles.merchantLabelWrap}>
                <Icon name="storefront" size={20} color="#00C9A7" />
                <Text style={styles.merchantLabel}>{t('payment.payingTo', { merchant: route.params?.businessName || 'Merchant' })}</Text>
              </View>
            )}
            <Text style={styles.totalPayableLabel}>{t('payment.totalPayable')}</Text>
            <Text style={styles.totalPayableAmount}>₹{finalAmount}</Text>
            <Text style={styles.orderIdText}>{t('payment.txnId')} {Date.now().toString().slice(0, 10)}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('payment.options')}</Text>

          {/* Metro Wallet Option (Only visible when booking ticket or paying merchant) */}
          {(paymentContext === 'ticket' || paymentContext === 'merchant') && (
            <View style={styles.accordionContainer}>
              <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('wallet')}>
                <View style={styles.accordionLeft}>
                  <View style={[styles.iconBg, { backgroundColor: 'rgba(0, 201, 167, 0.15)' }]}>
                    <Icon name="wallet-outline" size={24} color="#00C9A7" />
                  </View>
                  <Text style={styles.accordionTitle}>{t('payment.metroWallet')}</Text>
                </View>
                <Icon name={expandedSection === 'wallet' ? 'chevron-up' : 'chevron-down'} size={24} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
              </TouchableOpacity>

              {expandedSection === 'wallet' && (
                <View style={styles.accordionBody}>
                  <TouchableOpacity 
                    style={[styles.paymentOption, selectedMethod === 'wallet' && styles.paymentOptionSelected]} 
                    onPress={() => selectOption('wallet')}
                  >
                    <Icon name={selectedMethod === 'wallet' ? "radiobox-marked" : "radiobox-blank"} size={22} color={selectedMethod === 'wallet' ? "#00C9A7" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)")} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.optionText}>{t('payment.payWithWallet')}</Text>
                      <Text style={{ fontSize: 13, color: isWalletSufficient ? '#00C9A7' : '#EF4444', fontWeight: '600', marginTop: 2 }}>
                        {t('payment.availableBalance')} ₹{balance || '0.00'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* UPI */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('upi')}>
              <View style={styles.accordionLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(156, 39, 176, 0.15)' }]}>
                  <Icon name="cellphone-nfc" size={24} color="#9B59B6" />
                </View>
                <Text style={styles.accordionTitle}>{t('payment.upiApps')}</Text>
              </View>
              <Icon name={expandedSection === 'upi' ? 'chevron-up' : 'chevron-down'} size={24} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
            </TouchableOpacity>
            
            {expandedSection === 'upi' && (
              <View style={styles.accordionBody}>
                 {['gpay', 'phonepe', 'paytm', 'manual'].map(app => (
                   <View key={app}>
                     <TouchableOpacity 
                       style={[styles.paymentOption, selectedMethod === `upi_${app}` && styles.paymentOptionSelected]}
                       onPress={() => selectOption(`upi_${app}`)}
                     >
                       <Icon name={selectedMethod === `upi_${app}` ? "radiobox-marked" : "radiobox-blank"} size={22} color={selectedMethod === `upi_${app}` ? "#00C9A7" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)")} />
                       <Text style={styles.optionText}>{app === 'manual' ? t('payment.enterUpi') : app.charAt(0).toUpperCase() + app.slice(1)}</Text>
                     </TouchableOpacity>
                     {app === 'manual' && selectedMethod === 'upi_manual' && (
                       <View style={styles.cardForm}>
                         <TextInput 
                           style={styles.inputField} 
                           placeholder="e.g. username@bank" 
                           placeholderTextColor="#AAAAAA" 
                           autoCapitalize="none"
                           value={manualUpiId}
                           onChangeText={setManualUpiId}
                         />
                       </View>
                     )}
                   </View>
                 ))}
              </View>
            )}
          </View>

          {/* Cards */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('card')}>
              <View style={styles.accordionLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(52, 152, 219, 0.15)' }]}>
                  <Icon name="credit-card-outline" size={24} color="#3498DB" />
                </View>
                <Text style={styles.accordionTitle}>{t('payment.cards')}</Text>
              </View>
              <Icon name={expandedSection === 'card' ? 'chevron-up' : 'chevron-down'} size={24} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
            </TouchableOpacity>
            
            {expandedSection === 'card' && (
              <View style={styles.accordionBody}>
                 <TouchableOpacity style={[styles.paymentOption, selectedMethod === 'card' && styles.paymentOptionSelected]} onPress={() => selectOption('card')}>
                   <Icon name={selectedMethod === 'card' ? "radiobox-marked" : "radiobox-blank"} size={22} color={selectedMethod === 'card' ? "#00C9A7" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)")} />
                   <Text style={styles.optionText}>{t('payment.payNewCard')}</Text>
                 </TouchableOpacity>
                 
                 {selectedMethod === 'card' && (
                   <View style={styles.cardForm}>
                     <TextInput style={styles.inputField} placeholder="Card Number" placeholderTextColor="#AAAAAA" keyboardType="number-pad" maxLength={16} />
                     <View style={styles.cardRow}>
                       <TextInput style={[styles.inputField, {flex: 1, marginRight: 8}]} placeholder="MM/YY" placeholderTextColor="#AAAAAA" keyboardType="number-pad" maxLength={5} />
                       <TextInput style={[styles.inputField, {flex: 1, marginLeft: 8}]} placeholder="CVV" placeholderTextColor="#AAAAAA" keyboardType="number-pad" secureTextEntry maxLength={3} />
                     </View>
                   </View>
                 )}
              </View>
            )}
          </View>

          {/* Netbanking */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('netbanking')}>
              <View style={styles.accordionLeft}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(243, 156, 18, 0.15)' }]}>
                  <Icon name="bank" size={24} color="#F39C12" />
                </View>
                <Text style={styles.accordionTitle}>{t('payment.netBanking')}</Text>
              </View>
              <Icon name={expandedSection === 'netbanking' ? 'chevron-up' : 'chevron-down'} size={24} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
            </TouchableOpacity>
            
            {expandedSection === 'netbanking' && (
              <View style={styles.accordionBody}>
                 {['sbi', 'hdfc', 'icici'].map(bank => (
                   <TouchableOpacity key={bank} style={[styles.paymentOption, selectedMethod === `nb_${bank}` && styles.paymentOptionSelected]} onPress={() => selectOption(`nb_${bank}`)}>
                     <Icon name={selectedMethod === `nb_${bank}` ? "radiobox-marked" : "radiobox-blank"} size={22} color={selectedMethod === `nb_${bank}` ? "#00C9A7" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)")} />
                     <Text style={styles.optionText}>{bank.toUpperCase()} Bank</Text>
                   </TouchableOpacity>
                 ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={processPayment} disabled={!selectedMethod} style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient colors={!selectedMethod ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)'] : [COLORS.secondary, COLORS.secondary]} style={styles.payButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.payButtonText, !selectedMethod && { color: COLORS.textLight }]}>
                {selectedMethod ? `${t('payment.payBtn')} ₹${finalAmount}` : t('payment.selectMethod')}
              </Text>
              <Icon name="lock" size={18} color={!selectedMethod ? (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)') : '#fff'} style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Premium Success Modal */}
        <Modal visible={!!successData} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconWrap}>
                <Icon name="check-decagram" size={70} color="#00C9A7" />
              </View>
              <Text style={styles.modalTitle}>{successData?.title}</Text>
              <Text style={styles.modalAmount}>₹{successData?.amount?.toFixed(2)}</Text>
              <Text style={styles.modalMessage}>{successData?.message}</Text>
              
              <View style={styles.modalDivider} />
              <View style={styles.modalRow}>
                 <Text style={styles.modalLabel}>Type:</Text>
                 <Text style={styles.modalValue}>{successData?.method}</Text>
              </View>
              <View style={styles.modalRow}>
                 <Text style={styles.modalLabel}>Date:</Text>
                 <Text style={styles.modalValue}>{new Date().toLocaleString()}</Text>
              </View>

              <TouchableOpacity style={styles.modalBtn} onPress={() => {
                const action = successData?.onAction;
                setSuccessData(null);
                if (action) action();
              }}>
                <LinearGradient colors={['#00C9A7', '#00A88F']} style={styles.modalBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                   <Text style={styles.modalBtnText}>{successData?.actionText || 'OK'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 },
  
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,26,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100, gap: 16 },
  loadingMsg: { fontSize: 16, fontWeight: '700', color: '#fff' },

  scrollContent: { padding: 20, paddingBottom: 40 },
  summaryCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  totalPayableLabel: { fontSize: 13, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  totalPayableAmount: { fontSize: 40, fontWeight: '900', color: '#00C9A7', marginBottom: 12 },
  orderIdText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  
  merchantLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, backgroundColor: 'rgba(0, 201, 167, 0.1)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 201, 167, 0.2)' },
  merchantLabel: { fontSize: 14, color: COLORS.text, fontWeight: '800' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingHorizontal: 4 },
  
  accordionContainer: { backgroundColor: COLORS.cardBg, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  accordionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  
  accordionBody: { paddingHorizontal: 16, paddingBottom: 16 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'transparent' },
  paymentOptionSelected: { backgroundColor: 'rgba(0,201,167,0.1)', borderColor: 'rgba(0,201,167,0.3)' },
  optionText: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginLeft: 12 },
  
  cardForm: { padding: 16, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, marginTop: 8 },
  inputField: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 12, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.cardBg },
  payButton: { flexDirection: 'row', height: 60, alignItems: 'center', justifyContent: 'center' },
  payButtonText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#ffffff', borderRadius: 28, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 15 },
  modalIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 10, textAlign: 'center' },
  modalAmount: { fontSize: 40, fontWeight: '900', color: '#00C9A7', marginBottom: 10 },
  modalMessage: { fontSize: 16, color: '#555', marginBottom: 25, textAlign: 'center', fontWeight: '600' },
  
  modalDivider: { width: '100%', height: 1, backgroundColor: '#eee', marginBottom: 20 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  modalLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  modalValue: { fontSize: 14, color: '#333', fontWeight: '800' },
  
  modalBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 30 },
  modalBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
