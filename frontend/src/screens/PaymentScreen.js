import React, { useState } from 'react';
import COLORS from '../constants/colors';
import {
  StyleSheet, Text, View, TouchableOpacity, StatusBar,
  Alert, ScrollView, TextInput, ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { ticketAPI } from '../api/ticketAPI';
import { walletAPI } from '../api/walletAPI';
import { shopAPI } from '../api/shopAPI';
import { setCurrentTicket } from '../redux/slices/ticketSlice';
import { deductMoneySuccess } from '../redux/slices/walletSlice';

export default function PaymentScreen({ route, navigation }) {
  const { paymentContext = 'ticket', amount = 0 } = route?.params || {};
  const dispatch = useDispatch();
  const bookingDetails = useSelector((state) => state.tickets.bookingDetails);
  const balance = useSelector((state) => state.wallet.balance);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
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
        setLoadingMsg('Adding money to wallet...');
        const res = await walletAPI.addMoney(finalAmount, paymentId);
        dispatch(addMoneySuccess({ balance: res.balance, transaction: res.transaction }));
        setLoading(false);
        Alert.alert('Recharge Successful', `₹${finalAmount} added to your wallet.`);
        navigation.goBack();
        return;
      }

      if (paymentContext === 'merchant') {
        const { shopId, businessName } = route.params || {};
        setLoadingMsg('Processing merchant payment...');
        
        // Process on backend (deducts wallet if method is 'wallet', else records as Razorpay transaction)
        await shopAPI.payShop(shopId, finalAmount, method === 'wallet' ? 'wallet' : 'razorpay', paymentId);
        
        if (method === 'wallet') {
          const updatedWallet = await walletAPI.getBalance();
          dispatch(deductMoneySuccess({ balance: updatedWallet.balance }));
        }

        setLoading(false);
        Alert.alert('Payment Successful', `₹${finalAmount} paid to ${businessName || 'Merchant'} successfully!`, [
          { text: 'OK', onPress: () => navigation.navigate('Home') }
        ]);
        return;
      }

      setLoadingMsg('Generating your digital QR ticket...');
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

      Alert.alert(
        'Payment Successful',
        `Ticket booked successfully!\nTicket ID: ${paymentResult.ticket.ticketId}`,
        [{ text: 'View Ticket QR', onPress: () => navigation.replace('QRTicket') }]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Payment Failure', error.response?.data?.message || 'Error processing transaction.');
    }
  };

  const processPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Selection Required', 'Please select a payment provider.');
      return;
    }
    
    if (selectedMethod === 'wallet' && !isWalletSufficient) {
       Alert.alert('Insufficient Balance', 'Please top up your wallet or select another method.');
       return;
    }

    if (selectedMethod === 'wallet') {
      const mockPaymentId = `WAL-TXN-${Date.now()}`;
      handlePaymentSuccess(mockPaymentId, 'wallet');
      return;
    }

    // SIMULATED RAZORPAY
    setLoading(true);
    setLoadingMsg('Initiating secure transaction...');
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
      Alert.alert('Gateway Error', 'Could not initiate payment.');
    }
  };

  const toggleSection = (section) => setExpandedSection(expandedSection === section ? null : section);
  const selectOption = (methodId) => setSelectedMethod(methodId);

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00C9A7" />
          <Text style={styles.loadingMsg}>{loadingMsg}</Text>
        </View>
      )}

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            {paymentContext === 'merchant' && (
              <View style={styles.merchantLabelWrap}>
                <Icon name="storefront" size={20} color="#00C9A7" />
                <Text style={styles.merchantLabel}>Paying to {route.params?.businessName || 'Merchant'}</Text>
              </View>
            )}
            <Text style={styles.totalPayableLabel}>Total Payable Amount</Text>
            <Text style={styles.totalPayableAmount}>₹{finalAmount}</Text>
            <Text style={styles.orderIdText}>TXN ID: {Date.now().toString().slice(0, 10)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Payment Options</Text>

          {/* Metro Wallet Option (Only visible when booking ticket or paying merchant) */}
          {(paymentContext === 'ticket' || paymentContext === 'merchant') && (
            <View style={styles.accordionContainer}>
              <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('wallet')}>
                <View style={styles.accordionLeft}>
                  <View style={[styles.iconBg, { backgroundColor: 'rgba(0, 201, 167, 0.15)' }]}>
                    <Icon name="wallet-outline" size={24} color="#00C9A7" />
                  </View>
                  <Text style={styles.accordionTitle}>Metro Wallet</Text>
                </View>
                <Icon name={expandedSection === 'wallet' ? 'chevron-up' : 'chevron-down'} size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>

              {expandedSection === 'wallet' && (
                <View style={styles.accordionBody}>
                  <TouchableOpacity 
                    style={[styles.paymentOption, selectedMethod === 'wallet' && styles.paymentOptionSelected]} 
                    onPress={() => selectOption('wallet')}
                  >
                    <Icon name={selectedMethod === 'wallet' ? "radiobox-marked" : "radiobox-blank"} size={22} color={selectedMethod === 'wallet' ? "#00C9A7" : "rgba(255,255,255,0.3)"} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.optionText}>Pay with Metro Wallet</Text>
                      <Text style={{ fontSize: 13, color: isWalletSufficient ? '#00C9A7' : '#EF4444', fontWeight: '600', marginTop: 2 }}>
                        Available Balance: ₹{balance || '0.00'}
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
                <Text style={styles.accordionTitle}>UPI Apps</Text>
              </View>
              <Icon name={expandedSection === 'upi' ? 'chevron-up' : 'chevron-down'} size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            
            {expandedSection === 'upi' && (
              <View style={styles.accordionBody}>
                 {['gpay', 'phonepe', 'paytm', 'manual'].map(app => (
                   <View key={app}>
                     <TouchableOpacity 
                       style={[styles.paymentOption, selectedMethod === `upi_${app}` && styles.paymentOptionSelected]}
                       onPress={() => selectOption(`upi_${app}`)}
                     >
                       <Icon name={selectedMethod === `upi_${app}` ? "radiobox-marked" : "radiobox-blank"} size={22} color={selectedMethod === `upi_${app}` ? "#00C9A7" : "rgba(255,255,255,0.3)"} />
                       <Text style={styles.optionText}>{app === 'manual' ? 'Enter UPI ID' : app.charAt(0).toUpperCase() + app.slice(1)}</Text>
                     </TouchableOpacity>
                     {app === 'manual' && selectedMethod === 'upi_manual' && (
                       <View style={styles.cardForm}>
                         <TextInput 
                           style={styles.inputField} 
                           placeholder="e.g. username@bank" 
                           placeholderTextColor="rgba(255,255,255,0.3)" 
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
                <Text style={styles.accordionTitle}>Credit / Debit Cards</Text>
              </View>
              <Icon name={expandedSection === 'card' ? 'chevron-up' : 'chevron-down'} size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            
            {expandedSection === 'card' && (
              <View style={styles.accordionBody}>
                 <TouchableOpacity style={[styles.paymentOption, selectedMethod === 'card' && styles.paymentOptionSelected]} onPress={() => selectOption('card')}>
                   <Icon name={selectedMethod === 'card' ? "radiobox-marked" : "radiobox-blank"} size={22} color={selectedMethod === 'card' ? "#00C9A7" : "rgba(255,255,255,0.3)"} />
                   <Text style={styles.optionText}>Pay with New Card</Text>
                 </TouchableOpacity>
                 
                 {selectedMethod === 'card' && (
                   <View style={styles.cardForm}>
                     <TextInput style={styles.inputField} placeholder="Card Number" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="number-pad" maxLength={16} />
                     <View style={styles.cardRow}>
                       <TextInput style={[styles.inputField, {flex: 1, marginRight: 8}]} placeholder="MM/YY" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="number-pad" maxLength={5} />
                       <TextInput style={[styles.inputField, {flex: 1, marginLeft: 8}]} placeholder="CVV" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="number-pad" secureTextEntry maxLength={3} />
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
                <Text style={styles.accordionTitle}>Net Banking</Text>
              </View>
              <Icon name={expandedSection === 'netbanking' ? 'chevron-up' : 'chevron-down'} size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            
            {expandedSection === 'netbanking' && (
              <View style={styles.accordionBody}>
                 {['sbi', 'hdfc', 'icici'].map(bank => (
                   <TouchableOpacity key={bank} style={[styles.paymentOption, selectedMethod === `nb_${bank}` && styles.paymentOptionSelected]} onPress={() => selectOption(`nb_${bank}`)}>
                     <Icon name={selectedMethod === `nb_${bank}` ? "radiobox-marked" : "radiobox-blank"} size={22} color={selectedMethod === `nb_${bank}` ? "#00C9A7" : "rgba(255,255,255,0.3)"} />
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
                {selectedMethod ? `PAY ₹${finalAmount}` : 'SELECT METHOD'}
              </Text>
              <Icon name="lock" size={18} color={!selectedMethod ? 'rgba(255,255,255,0.4)' : '#fff'} style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  merchantLabel: { fontSize: 14, color: '#fff', fontWeight: '800' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingHorizontal: 4 },
  
  accordionContainer: { backgroundColor: COLORS.cardBg, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  accordionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  
  accordionBody: { paddingHorizontal: 16, paddingBottom: 16 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'transparent' },
  paymentOptionSelected: { backgroundColor: 'rgba(0,201,167,0.1)', borderColor: 'rgba(0,201,167,0.3)' },
  optionText: { fontSize: 15, fontWeight: '600', color: '#fff', marginLeft: 12 },
  
  cardForm: { padding: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, marginTop: 8 },
  inputField: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 12, fontSize: 15, color: '#fff', fontWeight: '500' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,10,26,0.8)' },
  payButton: { flexDirection: 'row', height: 60, alignItems: 'center', justifyContent: 'center' },
  payButtonText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
