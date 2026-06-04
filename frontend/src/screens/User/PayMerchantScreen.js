import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'; import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../../constants/colors';
import api from '../../api/axiosConfig';

export default function PayMerchantScreen({ route, navigation }) {
  const { shop } = route.params;
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // 'wallet' or 'token'
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
      return Alert.alert('Invalid Amount', 'Please enter a valid amount.');
    }

    setLoading(true);
    try {
      if (paymentMethod === 'wallet') {
        await api.post('/shops/pay', { shopId: shop._id, amount: parseInt(amount) });
        Alert.alert('Payment Successful', `Paid ₹${amount} to ${shop.shopName}`);
        navigation.goBack();
      } else {
        await api.post('/tokens/redeem', { merchantId: shop.merchantId._id || shop.merchantId, amount: parseInt(amount) });
        Alert.alert('Payment Successful', `Redeemed ${amount} tokens at ${shop.shopName}`);
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Payment Failed', err.response?.data?.message || 'Transaction could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Merchant</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.shopCard}>
          <Image 
            source={{ uri: (shop.imageUrl && shop.imageUrl.trim().length > 5) ? shop.imageUrl : 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80' }} 
            style={styles.shopImage} 
          />
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{shop.shopName}</Text>
            <Text style={styles.merchantId}>ID: {shop.merchantId._id || shop.merchantId}</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter Amount</Text>
          <View style={styles.amountWrapper}>
            <Text style={styles.currencySymbol}>{paymentMethod === 'wallet' ? '₹' : 'T'}</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="number-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={COLORS.textLight}
              autoFocus
            />
          </View>
        </View>

        <Text style={styles.label}>Select Payment Method</Text>
        <View style={styles.methodContainer}>
          <TouchableOpacity 
            style={[styles.methodBtn, paymentMethod === 'wallet' && styles.methodActive]} 
            onPress={() => setPaymentMethod('wallet')}
          >
            <MaterialCommunityIcons name="wallet-outline" size={24} color={paymentMethod === 'wallet' ? COLORS.primary : COLORS.textLight} />
            <Text style={[styles.methodText, paymentMethod === 'wallet' && styles.methodTextActive]}>Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.methodBtn, paymentMethod === 'token' && styles.methodActive]} 
            onPress={() => setPaymentMethod('token')}
          >
            <MaterialCommunityIcons name="bitcoin" size={24} color={paymentMethod === 'token' ? COLORS.primary : COLORS.textLight} />
            <Text style={[styles.methodText, paymentMethod === 'token' && styles.methodTextActive]}>Tokens</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.payBtn, (!amount || loading) && styles.payBtnDisabled]} 
          onPress={handlePayment} 
          disabled={!amount || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="lock-check" size={20} color={COLORS.white} />
              <Text style={styles.payBtnText}>Secure Pay {paymentMethod === 'wallet' ? `₹${amount || 0}` : `${amount || 0} Tokens`}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, padding: 16 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  content: { padding: 20 },
  shopCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 30, elevation: 2 },
  shopImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  merchantId: { fontSize: 12, color: COLORS.textLight },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  inputContainer: { marginBottom: 30 },
  amountWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 20 },
  currencySymbol: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginRight: 10 },
  amountInput: { flex: 1, fontSize: 40, fontWeight: 'bold', color: COLORS.text, paddingVertical: 15 },
  methodContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 5 },
  methodActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  methodText: { fontSize: 16, fontWeight: '600', color: COLORS.textLight, marginLeft: 8 },
  methodTextActive: { color: COLORS.primary },
  payBtn: { backgroundColor: COLORS.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, elevation: 3 },
  payBtnDisabled: { backgroundColor: COLORS.textLight, elevation: 0 },
  payBtnText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, marginLeft: 10 }
});
