import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../../constants/colors';
import api from '../../api/axiosConfig';
import EmptyState from '../../components/EmptyState';
import ToastMessage from '../../components/ToastMessage';
import RazorpayCheckout from 'react-native-razorpay';

export default function TokenEconomyScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [buyAmount, setBuyAmount] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, histRes] = await Promise.all([
        api.get('/tokens/balance'),
        api.get('/tokens/history')
      ]);
      setBalance(balRes.data.tokenBalance || 0);
      setHistory(histRes.data.transactions || []);
    } catch (err) {
      showToast('Failed to fetch token data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (message, type) => setToast({ visible: true, message, type });

  const handleBuyTokens = async () => {
    const amount = parseInt(buyAmount);
    if (!amount || amount < 10) return showToast('Enter amount min ₹10', 'error');

    try {
      const orderRes = await api.post('/tokens/create-order', { amount });
      const { orderId } = orderRes.data;

      var options = {
        description: 'Buy Metro Tokens',
        image: 'https://pune-metro-logo.com/logo.png',
        currency: 'INR',
        key: 'rzp_test_St6f7LZjydxbQ0', // Keep existing Razorpay ID
        amount: amount * 100,
        name: 'Pune Metro',
        order_id: orderId,
        theme: { color: COLORS.primary }
      };

      RazorpayCheckout.open(options).then(async (data) => {
        const verifyRes = await api.post('/tokens/verify-payment', {
          amount,
          paymentId: data.razorpay_payment_id,
          orderId: data.razorpay_order_id,
          signature: data.razorpay_signature
        });
        if (verifyRes.data.success) {
          showToast('Tokens added successfully!', 'success');
          setBuyAmount('');
          fetchData();
        }
      }).catch((error) => {
        showToast('Payment Cancelled', 'error');
      });
    } catch (err) {
      showToast('Failed to create order', 'error');
    }
  };

  const handleSpendTokens = async () => {
    if (!merchantId) return showToast('Enter Merchant ID', 'error');
    const amount = parseInt(spendAmount);
    if (!amount || amount <= 0) return showToast('Enter valid amount', 'error');

    try {
      const res = await api.post('/tokens/redeem', { merchantId, amount });
      if (res.data.success) {
        showToast('Tokens redeemed successfully!', 'success');
        setMerchantId('');
        setSpendAmount('');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to redeem tokens', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Token Economy</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />} contentContainerStyle={styles.scrollContent}>
        
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.balanceHeader}>
            <MaterialCommunityIcons name="ticket" size={30} color={COLORS.white} />
            <Text style={styles.balanceLabel}>Token Balance</Text>
          </View>
          <Text style={styles.balanceValue}>{balance}</Text>
          <Text style={styles.balanceSubtitle}>1 Token = ₹1</Text>
        </View>

        {/* Buy Tokens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buy Tokens</Text>
          <Text style={styles.inputLabel}>Enter Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50 (min ₹10)"
            keyboardType="numeric"
            value={buyAmount}
            onChangeText={setBuyAmount}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleBuyTokens}>
            <Text style={styles.primaryBtnText}>Proceed to Pay</Text>
          </TouchableOpacity>
        </View>

        {/* Spend Tokens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spend Tokens</Text>
          
          <Text style={styles.inputLabel}>Merchant ID</Text>
          <Text style={styles.inputHint}>Ask the shop owner for their ID to pay them.</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 64d9f1a2..."
            value={merchantId}
            onChangeText={setMerchantId}
          />
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.primary, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]} onPress={() => navigation.navigate('QRScanner')}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Scan Merchant QR</Text>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { marginTop: 15 }]}>Tokens to Deduct</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 25"
            keyboardType="numeric"
            value={spendAmount}
            onChangeText={setSpendAmount}
          />
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.secondary, marginTop: 20 }]} onPress={handleSpendTokens}>
            <Text style={styles.primaryBtnText}>Redeem Tokens</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : history.length === 0 ? (
            <EmptyState icon="history" title="No Transactions" message="You have no token transactions yet." />
          ) : (
            history.map((tx) => (
              <View key={tx._id} style={styles.txCard}>
                <View style={styles.txLeft}>
                  <MaterialCommunityIcons name={tx.type === 'purchase' ? 'arrow-down-circle' : 'arrow-up-circle'} size={24} color={tx.type === 'purchase' ? COLORS.success : COLORS.danger} />
                  <View style={styles.txDetails}>
                    <Text style={styles.txType}>{tx.type === 'purchase' ? 'Tokens Purchased' : 'Tokens Spent'}</Text>
                    <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'purchase' ? COLORS.success : COLORS.danger }]}>
                  {tx.type === 'purchase' ? '+' : '-'}{tx.amount}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  scrollContent: { padding: 20 },
  walletCard: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 16, alignItems: 'center', elevation: 4, marginBottom: 20 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  balanceLabel: { color: COLORS.white, fontSize: 18, marginLeft: 10 },
  balanceValue: { color: COLORS.white, fontSize: 40, fontWeight: 'bold' },
  balanceSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 5 },
  section: { backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  inputHint: { fontSize: 12, color: COLORS.textLight, marginBottom: 8, fontStyle: 'italic' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
  primaryBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txDetails: { marginLeft: 12 },
  txType: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  txDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: 'bold' }
});
