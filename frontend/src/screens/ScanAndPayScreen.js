import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RNCamera } from 'react-native-camera'; // Note: Ensure linked correctly
import LinearGradient from 'react-native-linear-gradient';
import shopAPI from '../api/shopAPI';
import { ticketAPI } from '../api/ticketAPI';
import RazorpayCheckout from 'react-native-razorpay';

export default function ScanAndPayScreen({ route, navigation }) {
  const [scanned, setScanned] = useState(!!route.params?.shopId);
  const [merchantData, setMerchantData] = useState(route.params?.shopId ? { shopId: route.params.shopId, businessName: route.params.shopName } : null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [token, setToken] = useState(null);

  const user = useSelector((state) => state.auth.user);

  const handleBarCodeRead = (e) => {
    if (!scanned) {
      setScanned(true);
      console.log('QR RAW DATA:', e.data); // debug log
      try {
        let data;
        try {
          data = JSON.parse(e.data);
        } catch {
          // Not valid JSON
          Alert.alert(
            'Invalid QR',
            `This is not a valid merchant QR code.\n\nScanned: ${e.data?.substring(0, 80)}`,
            [{ text: 'Try Again', onPress: () => setScanned(false) }]
          );
          return;
        }

        console.log('QR PARSED:', JSON.stringify(data)); // debug log

        // Accept QR if type is MERCHANT_PAYMENT OR has merchantId/shopId
        const resolvedId = data.merchantId || data.shopId;
        const isMerchantQR =
          resolvedId ||
          data.type === 'MERCHANT_PAYMENT';

        if (isMerchantQR) {
          setMerchantData({
            shopId: resolvedId || data._id || 'unknown',
            merchantId: resolvedId || data._id || 'unknown',
            businessName:
              data.merchantName ||
              data.businessName ||
              data.shopName ||
              data.name ||
              'Pune Metro Shop',
            type: data.type || 'MERCHANT_PAYMENT',
          });
        } else {
          Alert.alert(
            'Invalid QR',
            `This is not a valid merchant QR code.\n\nReceived: ${JSON.stringify(data).substring(0, 100)}`,
            [{ text: 'Try Again', onPress: () => setScanned(false) }]
          );
        }
      } catch (err) {
        Alert.alert('Scan Failed', 'Could not read the QR code. Please try again.', [
          { text: 'Try Again', onPress: () => setScanned(false) }
        ]);
      }
    }
  };

  const handlePayment = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Razorpay order on backend
      const orderData = await ticketAPI.createRazorpayOrder(amt);
      console.log('Razorpay Order Created:', JSON.stringify(orderData));

      // 2. Open Razorpay Checkout directly
      const options = {
        description: `Payment to ${merchantData.businessName || 'Merchant'}`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: orderData.currency || 'INR',
        key: orderData.key_id,
        amount: String(orderData.amount), // already in paise from backend
        name: 'Pune Metro',
        order_id: orderData.orderId,
        prefill: {
          email: user?.email || 'user@punemetro.com',
          contact: user?.phone || '9999999999',
          name: user?.name || 'Metro User',
        },
        theme: { color: '#00C9A7' },
      };

      console.log('Razorpay Options:', JSON.stringify(options));
      const razorpayResult = await RazorpayCheckout.open(options);
      console.log('Razorpay Success:', JSON.stringify(razorpayResult));

      // 3. Payment success → record on backend
      const paymentId = razorpayResult.razorpay_payment_id;
      await shopAPI.payShop(
        merchantData.shopId,
        amt,
        'razorpay',
        paymentId
      );

      setIsProcessing(false);
      Alert.alert(
        'Payment Successful! ✅',
        `₹${amt} paid to ${merchantData.businessName || 'Merchant'} successfully!`,
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      setIsProcessing(false);
      console.log('Razorpay Error:', JSON.stringify(error));
      // Razorpay cancelled or failed
      const errDesc = error?.error?.description || error?.description || '';
      const errCode = error?.error?.code || error?.code || '';
      if (errCode === 'PAYMENT_CANCELLED' || errDesc.toLowerCase().includes('cancel')) {
        Alert.alert('Payment Cancelled', 'You cancelled the payment.', [
          { text: 'Try Again' }
        ]);
      } else {
        Alert.alert(
          'Payment Failed',
          error?.response?.data?.message || errDesc || 'Something went wrong. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Token success UI removed as payment is now direct

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan & Pay</Text>
          <View style={{ width: 40 }} />
        </View>

        {!scanned ? (
          <View style={styles.scannerContainer}>
            <RNCamera
              style={styles.camera}
              onBarCodeRead={handleBarCodeRead}
              captureAudio={false}
            >
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanText}>Align QR code within the frame</Text>
              </View>
            </RNCamera>
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.paymentContainer}>
            <View style={styles.merchantCard}>
              <View style={styles.merchantIconWrap}>
                <Icon name="storefront" size={50} color="#9B59B6" />
              </View>
              <Text style={styles.merchantName}>{merchantData?.businessName || merchantData?.merchantName || 'Unknown Merchant'}</Text>
              <Text style={styles.merchantId}>ID: {merchantData?.merchantId || merchantData?.shopId}</Text>
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handlePayment}
              disabled={isProcessing}
            >
              <LinearGradient colors={isProcessing ? ['#555', '#444'] : ['#00C9A7', '#009980']} style={styles.primaryButtonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pay Securely</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setScanned(false);
                setMerchantData(null);
                setAmount('');
              }}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  
  scannerContainer: { flex: 1, backgroundColor: '#0A0A1A', margin: 20, borderRadius: 32, overflow: 'hidden' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(10,10,26,0.6)', justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 280, height: 280, borderWidth: 3, borderColor: '#00C9A7', backgroundColor: 'transparent', borderRadius: 24 },
  scanText: { color: '#fff', marginTop: 24, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  
  paymentContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  merchantCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  merchantIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(155,89,182,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  merchantName: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center' },
  merchantId: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 20, height: 80, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  currencySymbol: { fontSize: 40, color: '#00C9A7', fontWeight: '900', marginRight: 15 },
  amountInput: { flex: 1, fontSize: 40, color: '#fff', fontWeight: 'bold' },
  
  primaryButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  primaryButtonGrad: { height: 60, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  
  cancelButton: { height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  cancelButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIconWrap: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#00C9A7', marginBottom: 12 },
  successDesc: { fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  tokenBox: { backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 24, paddingHorizontal: 40, borderRadius: 24, borderWidth: 2, borderColor: '#00C9A7', borderStyle: 'dashed', marginBottom: 40 },
  tokenText: { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: 12 },
  homeBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' }
});
