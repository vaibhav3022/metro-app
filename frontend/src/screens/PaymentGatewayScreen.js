import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView,
  TextInput, ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { ticketAPI } from '../api/ticketAPI';
import { walletAPI } from '../api/walletAPI';
import { setCurrentTicket, ticketActionFailure } from '../redux/slices/ticketSlice';
import { addMoneySuccess } from '../redux/slices/walletSlice';

export default function PaymentGatewayScreen({ route, navigation }) {
  const { amount, type, ticketId, method } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const handleProcessPayment = async (status) => {
    if (status === 'success' && otp.length < 4) {
      Alert.alert('Validation Error', 'Please enter a valid OTP to simulate a successful payment.');
      return;
    }

    setLoading(true);

    try {
      if (type === 'ticket') {
        if (status === 'success') {
          const res = await ticketAPI.processPayment(ticketId, {
            paymentId: `PAY-${Date.now()}`,
            paymentMethod: method || 'card',
            paymentStatus: 'success'
          });
          dispatch(setCurrentTicket(res.ticket));
          navigation.replace('QRTicket');
        } else {
          await ticketAPI.processPayment(ticketId, {
            paymentId: `FAIL-${Date.now()}`,
            paymentMethod: method || 'card',
            paymentStatus: 'failed'
          });
          dispatch(ticketActionFailure('Payment failed by user simulation.'));
          Alert.alert('Payment Failed', 'The transaction was declined.');
          navigation.goBack();
        }
      } else if (type === 'wallet') {
        if (status === 'success') {
          const res = await walletAPI.addMoney(amount, `WAL-ADD-${Date.now()}`);
          dispatch(addMoneySuccess({ balance: res.balance, transaction: res.transaction }));
          Alert.alert('Recharge Successful', `₹${amount} added to your wallet.`);
          navigation.goBack();
        } else {
          Alert.alert('Recharge Failed', 'The top-up transaction was declined.');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred during payment processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Payment Gateway</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.merchantInfo}>
            <View style={styles.iconCircle}>
              <Icon name="shield-check" size={36} color="#00C9A7" />
            </View>
            <Text style={styles.merchantName}>Pune Metro Rail</Text>
            <Text style={styles.amountText}>₹{amount}</Text>
          </View>

          <Text style={styles.instruction}>
            A 4-digit OTP has been sent to your registered mobile number for {method === 'card' ? 'Card Verification' : 'NetBanking Authorization'}.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter OTP (e.g. 1234)"
              placeholderTextColor="#AAAAAA"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              secureTextEntry
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#00C9A7" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.failBtn]}
                onPress={() => handleProcessPayment('failed')}
              >
                <Text style={[styles.btnText, { color: '#EF4444' }]}>Simulate Failure</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleProcessPayment('success')} style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
                <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.successBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={[styles.btnText, { color: '#fff' }]}>Simulate Success</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 },
  
  card: { backgroundColor: COLORS.cardBg, margin: 20, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  merchantInfo: { alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 24 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,201,167,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  merchantName: { fontSize: 16, fontWeight: '700', color: COLORS.textLight },
  amountText: { fontSize: 36, fontWeight: '900', color: COLORS.text, marginTop: 8 },
  
  instruction: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  inputContainer: { marginBottom: 32 },
  otpInput: { borderRadius: 16, height: 60, fontSize: 24, textAlign: 'center', letterSpacing: 8, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, color: '#00C9A7', fontWeight: '900' },
  
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  btn: { flex: 1, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  failBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  successBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }
});
