import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet, addMoney } from '../redux/slices/walletSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import { useTranslation } from 'react-i18next';
import walletAPI from '../api/walletAPI';

export default function WalletScreen({ navigation }) {
  const dispatch = useDispatch();
  const { theme: COLORS, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { balance, loading, transactions } = useSelector((state) => state.wallet);
  const user = useSelector((state) => state.auth.user);
  
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    dispatch(fetchWallet());
  }, [dispatch]);

  const handleAddMoney = async () => {
    const amountVal = parseFloat(amount);
    if (!amountVal || amountVal <= 0) {
      Alert.alert(t('common.error'), t('wallet.addMoneyError'));
      return;
    }
    if (amountVal > 10000) {
      Alert.alert(t('common.error'), t('wallet.addMoneyLimit'));
      return;
    }

    setIsProcessing(true);
    try {
      const orderRes = await walletAPI.createRazorpayOrder(amountVal);
      
      const options = {
        description: t('wallet.topup'),
        image: 'https://cdn.pixabay.com/photo/2021/08/11/11/15/train-6538260_960_720.png',
        currency: orderRes.currency,
        key: 'rzp_test_St6f7LZjydxbQ0', 
        amount: orderRes.amount,
        name: t('wallet.brand'),
        order_id: orderRes.orderId,
        prefill: {
          email: user?.email || 'test@test.com',
          contact: user?.phone || '9999999999',
          name: user?.name || 'User'
        },
        theme: { color: COLORS.primary }
      };

      if (orderRes.orderId && orderRes.orderId.startsWith('order_mock_')) {
        delete options.order_id;
      }

      setIsProcessing(false);
      RazorpayCheckout.open(options).then(async (data) => {
         setIsProcessing(true);
         try {
            await dispatch(addMoney({ amount: amountVal, paymentId: data.razorpay_payment_id })).unwrap();
            Alert.alert(t('common.success'), t('wallet.successMsg', { amount: amountVal }));
            setAmount('');
            dispatch(fetchWallet());
         } catch (err) {
            Alert.alert(t('common.error'), t('wallet.failMsg'));
         } finally {
            setIsProcessing(false);
         }
      }).catch((error) => {
         if (error.code !== 0) {
           console.log('Payment Failed', `Code: ${error.code} | Description: ${error.description}`);
         }
      });
      
    } catch (err) {
      setIsProcessing(false);
      Alert.alert(t('common.error'), t('wallet.failMsg'));
    }
  };

  const predefinedAmounts = ['100', '200', '500', '1000'];

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('wallet.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Balance Card - Digital Wallet */}
          <LinearGradient colors={[COLORS.primary, '#1565C0']} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.balanceCardHeader}>
              <View>
                <Text style={styles.balanceCardBrand}>{t('wallet.brand')}</Text>
                <Text style={styles.balanceCardSubBrand}>{t('wallet.subBrand')}</Text>
              </View>
              <Image 
                source={require('../assets/images/app_logo.png')} 
                style={styles.cardLogo} 
                resizeMode="contain" 
              />
            </View>

            <View style={styles.cardChipContainer}>
              <Icon name="credit-card-chip" size={32} color="#FFB74D" />
              <Icon name="nfc" size={24} color="rgba(255,255,255,0.7)" />
            </View>

            <Text style={styles.balanceLabel}>{t('wallet.availableBalance')}</Text>
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 10, alignSelf: 'flex-start' }} />
            ) : (
              <Text style={styles.balanceAmount}>₹ {parseFloat(balance || 0).toFixed(2)}</Text>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.cardHolderName}>{user?.name ? user.name.toUpperCase() : t('wallet.metroTraveler')}</Text>
              <Text style={styles.cardHolderName}>{user?.email ? user.email : ''}</Text>
            </View>
          </LinearGradient>

          {/* Add Money Section */}
          <View style={styles.addMoneySection}>
            <Text style={styles.sectionTitle}>{t('wallet.rechargeWallet')}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#AAAAAA"
                keyboardType="number-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.chipContainer}>
              {predefinedAmounts.map((amt) => (
                <TouchableOpacity key={amt} style={styles.chip} onPress={() => setAmount(amt)}>
                  <Text style={styles.chipText}>+₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleAddMoney}
              disabled={isProcessing}
            >
              <LinearGradient colors={isProcessing ? ['#555', '#444'] : [COLORS.secondary, '#E64A19']} style={styles.primaryButtonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('wallet.proceedToPay')}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>{t('wallet.recentTransactions')}</Text>
            {transactions && transactions.length > 0 ? (
              transactions.map((tx, index) => (
                <TouchableOpacity key={index} style={styles.transactionItem} onPress={() => setSelectedTx(tx)}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconBox, { backgroundColor: tx.type?.toLowerCase() === 'credit' ? 'rgba(46,125,50,0.15)' : 'rgba(211,47,47,0.15)' }]}>
                      <Icon name={tx.type?.toLowerCase() === 'credit' ? 'arrow-down-left' : 'arrow-up-right'} size={20} color={tx.type?.toLowerCase() === 'credit' ? '#2E7D32' : '#D32F2F'} />
                    </View>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.txTitle} numberOfLines={1}>{tx.description || (tx.type?.toLowerCase() === 'credit' ? t('wallet.topup') : t('wallet.ticketPurchase'))}</Text>
                      <Text style={styles.txDate}>{new Date(tx.date || tx.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type?.toLowerCase() === 'credit' ? '#2E7D32' : COLORS.text }]}>
                    {tx.type?.toLowerCase() === 'credit' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noTransactionsText}>{t('wallet.noTransactions')}</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Transaction Details Modal */}
      <Modal visible={!!selectedTx} transparent animationType="fade" onRequestClose={() => setSelectedTx(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('wallet.recentTransactions')}</Text>
              <TouchableOpacity onPress={() => setSelectedTx(null)}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {selectedTx && (
              <View style={styles.modalBody}>
                <View style={[styles.txIconBox, { backgroundColor: selectedTx.type?.toLowerCase() === 'credit' ? 'rgba(46,125,50,0.15)' : 'rgba(211,47,47,0.15)', width: 60, height: 60, borderRadius: 30, alignSelf: 'center', marginBottom: 16 }]}>
                  <Icon name={selectedTx.type?.toLowerCase() === 'credit' ? 'arrow-down-left' : 'arrow-up-right'} size={30} color={selectedTx.type?.toLowerCase() === 'credit' ? '#2E7D32' : '#D32F2F'} />
                </View>
                <Text style={[styles.modalAmount, { color: selectedTx.type?.toLowerCase() === 'credit' ? '#2E7D32' : COLORS.text }]}>
                  {selectedTx.type?.toLowerCase() === 'credit' ? '+' : '-'}₹{parseFloat(selectedTx.amount).toFixed(2)}
                </Text>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Date</Text>
                  <Text style={styles.modalValue}>{new Date(selectedTx.date || selectedTx.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Type</Text>
                  <Text style={styles.modalValue}>{selectedTx.type?.toUpperCase()}</Text>
                </View>
                <View style={styles.modalRowColumn}>
                  <Text style={styles.modalLabel}>Description</Text>
                  <Text style={styles.modalValueDesc}>{selectedTx.description}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  // Premium Metro Card styles
  balanceCard: { padding: 22, borderRadius: 24, elevation: 8, marginBottom: 24, overflow: 'hidden', position: 'relative' },
  balanceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  balanceCardBrand: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  balanceCardSubBrand: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  cardLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', padding: 2 },
  cardChipContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  balanceAmount: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: 0.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  cardNumber: { color: 'rgba(255,255,255,0.9)', fontSize: 13, letterSpacing: 1.5, fontWeight: '600' },
  cardHolderName: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
  
  addMoneySection: { backgroundColor: COLORS.cardBg, padding: 22, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 16, paddingHorizontal: 16, height: 60, marginBottom: 16 },
  currencySymbol: { fontSize: 24, color: COLORS.secondary, fontWeight: '800', marginRight: 10 },
  amountInput: { flex: 1, fontSize: 24, color: COLORS.text, fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  chip: { backgroundColor: 'transparent', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary },
  chipText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  primaryButton: { borderRadius: 16, overflow: 'hidden' },
  primaryButtonGrad: { height: 54, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  
  transactionsSection: { backgroundColor: COLORS.cardBg, padding: 22, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  txTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  txDate: { fontSize: 12, color: COLORS.textLight },
  txAmount: { fontSize: 16, fontWeight: '800' },
  noTransactionsText: { color: COLORS.textLight, fontStyle: 'italic', marginTop: 10, textAlign: 'center' },

  /* Modal Styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  modalBody: { width: '100%' },
  modalAmount: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalRowColumn: { paddingVertical: 12 },
  modalLabel: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  modalValue: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
  modalValueDesc: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginTop: 6, lineHeight: 22 },
});
