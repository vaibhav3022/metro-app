import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet, addMoney } from '../redux/slices/walletSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import walletAPI from '../api/walletAPI';

export default function WalletScreen({ navigation }) {
  const dispatch = useDispatch();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { balance, loading, transactions } = useSelector((state) => state.wallet);
  const user = useSelector((state) => state.auth.user);
  
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dispatch(fetchWallet());
  }, [dispatch]);

  const handleAddMoney = async () => {
    const amountVal = parseFloat(amount);
    if (!amountVal || amountVal <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    if (amountVal > 10000) {
      Alert.alert('Error', 'Cannot add more than ₹10,000 at a time.');
      return;
    }

    setIsProcessing(true);
    try {
      const orderRes = await walletAPI.createRazorpayOrder(amountVal);
      
      const options = {
        description: 'Wallet Top-up',
        image: 'https://cdn.pixabay.com/photo/2021/08/11/11/15/train-6538260_960_720.png',
        currency: orderRes.currency,
        key: 'rzp_test_St6f7LZjydxbQ0', 
        amount: orderRes.amount,
        name: 'Pune Metro Wallet',
        order_id: orderRes.orderId,
        prefill: {
          email: user?.email || 'test@test.com',
          contact: user?.phone || '9999999999',
          name: user?.name || 'User'
        },
        theme: { color: '#00C9A7' }
      };

      // If backend gave a mock order (due to test keys), delete the fake order_id 
      // so Razorpay SDK opens normally in test mode without failing validation.
      if (orderRes.orderId && orderRes.orderId.startsWith('order_mock_')) {
        delete options.order_id;
      }

      setIsProcessing(false);
      RazorpayCheckout.open(options).then(async (data) => {
         setIsProcessing(true);
         try {
            await dispatch(addMoney({ amount: amountVal, paymentId: data.razorpay_payment_id })).unwrap();
            Alert.alert('Success', `₹${amountVal} added to your wallet successfully!`);
            setAmount('');
            dispatch(fetchWallet());
         } catch (err) {
            Alert.alert('Failed', 'Could not add money to wallet.');
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
      Alert.alert('Failed', 'Could not initiate payment.');
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
          <Text style={styles.headerTitle}>My Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.balanceTop}>
              <Icon name="wallet" size={24} color="rgba(255,255,255,0.8)" />
              <Text style={styles.balanceTitle}>Pune Metro Wallet</Text>
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 10, alignSelf: 'flex-start' }} />
            ) : (
              <Text style={styles.balanceAmount}>₹ {parseFloat(balance || 0).toFixed(2)}</Text>
            )}
          </LinearGradient>

          {/* Add Money Section */}
          <View style={styles.addMoneySection}>
            <Text style={styles.sectionTitle}>Recharge Wallet</Text>
            
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
              <LinearGradient colors={isProcessing ? ['#555', '#444'] : [COLORS.secondary, COLORS.secondary]} style={styles.primaryButtonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Proceed to Pay</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions && transactions.length > 0 ? (
              transactions.map((tx, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconBox, { backgroundColor: tx.type?.toLowerCase() === 'credit' ? 'rgba(0,201,167,0.15)' : 'rgba(231,76,60,0.15)' }]}>
                      <Icon name={tx.type?.toLowerCase() === 'credit' ? 'arrow-down-left' : 'arrow-up-right'} size={20} color={tx.type?.toLowerCase() === 'credit' ? '#00C9A7' : '#E74C3C'} />
                    </View>
                    <View>
                      <Text style={styles.txTitle}>{tx.description || (tx.type?.toLowerCase() === 'credit' ? 'Wallet Top-up' : 'Ticket Purchase')}</Text>
                      <Text style={styles.txDate}>{new Date(tx.date || tx.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type?.toLowerCase() === 'credit' ? '#00C9A7' : COLORS.text }]}>
                    {tx.type?.toLowerCase() === 'credit' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noTransactionsText}>No recent transactions found.</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  scrollContent: { padding: 20, paddingBottom: 40 },
  balanceCard: { padding: 24, borderRadius: 24, elevation: 8, marginBottom: 24 },
  balanceTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  balanceTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  balanceLabel: { color: COLORS.textLight, fontSize: 13, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: 1 },
  
  addMoneySection: { backgroundColor: COLORS.cardBg, padding: 22, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 16, height: 60, marginBottom: 16 },
  currencySymbol: { fontSize: 24, color: '#00C9A7', fontWeight: '800', marginRight: 10 },
  amountInput: { flex: 1, fontSize: 28, color: COLORS.text, fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  chip: { backgroundColor: COLORS.cardBg, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  chipText: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
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
  noTransactionsText: { color: COLORS.textLight, fontStyle: 'italic', marginTop: 10, textAlign: 'center' }
});
