import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RNCamera } from 'react-native-camera'; // Note: Ensure linked correctly
import LinearGradient from 'react-native-linear-gradient';
import shopAPI from '../api/shopAPI';
import { ticketAPI } from '../api/ticketAPI';
import RazorpayCheckout from 'react-native-razorpay';
import { useTranslation } from 'react-i18next';

export default function ScanAndPayScreen({ route, navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { t } = useTranslation();
  const [scanned, setScanned] = useState(!!route.params?.shopId);
  const [merchantData, setMerchantData] = useState(route.params?.shopId ? { shopId: route.params.shopId, businessName: route.params.shopName } : null);
  const [amount, setAmount] = useState('');
  const [processingMethod, setProcessingMethod] = useState(null);
  const [token, setToken] = useState(null);
  const [successData, setSuccessData] = useState(null);

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
            t('scan.alert.invalidTitle'),
            `${t('scan.alert.invalidDesc')}\n\nScanned: ${e.data?.substring(0, 80)}`,
            [{ text: t('scan.alert.tryAgain'), onPress: () => setScanned(false) }]
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
              'METROXIA Shop',
            type: data.type || 'MERCHANT_PAYMENT',
          });
        } else {
          Alert.alert(
            t('scan.alert.invalidTitle'),
            `${t('scan.alert.invalidDesc')}\n\nReceived: ${JSON.stringify(data).substring(0, 100)}`,
            [{ text: t('scan.alert.tryAgain'), onPress: () => setScanned(false) }]
          );
        }
      } catch (err) {
        Alert.alert(t('scan.alert.scanFailedTitle'), t('scan.alert.scanFailedDesc'), [
          { text: t('scan.alert.tryAgain'), onPress: () => setScanned(false) }
        ]);
      }
    }
  };

  const handlePayment = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert(t('scan.alert.errorTitle'), t('scan.alert.invalidAmount'));
      return;
    }

    setProcessingMethod('razorpay');

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
        name: 'METROXIA',
        order_id: orderData.orderId,
        prefill: {
          email: user?.email || 'user@punemetro.com',
          contact: user?.phone || '9999999999',
          name: user?.name || 'Metro User',
        },
        theme: { color: '#00C9A7' },
      };

      // If backend gave a mock order (due to test keys), delete the fake order_id 
      // so Razorpay SDK opens normally in test mode without failing validation.
      if (orderData.orderId && orderData.orderId.startsWith('order_mock_')) {
        delete options.order_id;
      }

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

      setProcessingMethod(null);
      setSuccessData({
        amount: amt,
        merchant: merchantData.businessName || 'Merchant',
        method: 'Razorpay Gateway'
      });
    } catch (error) {
      setProcessingMethod(null);
      console.log('Razorpay Error:', JSON.stringify(error));
      // Razorpay cancelled or failed
      const errDesc = error?.error?.description || error?.description || '';
      const errCode = error?.error?.code || error?.code || '';
      if (errCode === 'PAYMENT_CANCELLED' || errDesc.toLowerCase().includes('cancel')) {
        Alert.alert(t('scan.alert.paymentCancelledTitle'), t('scan.alert.paymentCancelledDesc'), [
          { text: t('scan.alert.tryAgain') }
        ]);
      } else {
        Alert.alert(
          t('scan.alert.paymentFailedTitle'),
          error?.response?.data?.message || errDesc || t('scan.alert.somethingWentWrong'),
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleWalletPayment = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert(t('scan.alert.errorTitle'), t('scan.alert.invalidAmount'));
      return;
    }

    const amt = parseFloat(amount);
    setProcessingMethod('wallet');

    try {
      await shopAPI.payShop(
        merchantData.shopId,
        amt,
        'wallet',
        `WALLET-PAY-${Date.now()}`
      );

      setProcessingMethod(null);
      setSuccessData({
        amount: amt,
        merchant: merchantData.businessName || 'Merchant',
        method: 'Metro Wallet'
      });
    } catch (error) {
      setProcessingMethod(null);
      Alert.alert(
        t('scan.alert.paymentFailedTitle'),
        error?.response?.data?.message || t('scan.alert.walletFailed'),
        [{ text: 'OK' }]
      );
    }
  };

  // Token success UI removed as payment is now direct

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scan.title')}</Text>
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
                <Text style={styles.scanText}>{t('scan.alignQR')}</Text>
              </View>
            </RNCamera>
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.paymentContainer}>
            <View style={styles.merchantCard}>
              <View style={styles.merchantIconWrap}>
                <Icon name="storefront" size={50} color="#9B59B6" />
              </View>
              <Text style={styles.merchantName}>{merchantData?.businessName || merchantData?.merchantName || t('scan.unknownMerchant')}</Text>
              <Text style={styles.merchantId}>{t('scan.merchantId')} {merchantData?.merchantId || merchantData?.shopId}</Text>
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#AAAAAA"
                keyboardType="number-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handlePayment}
              disabled={!!processingMethod}
            >
              <LinearGradient colors={processingMethod === 'razorpay' ? ['#555', '#444'] : [COLORS.secondary, COLORS.secondary]} style={styles.primaryButtonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {processingMethod === 'razorpay' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('scan.payWithRazorpay')}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.walletButton}
              onPress={handleWalletPayment}
              disabled={!!processingMethod}
            >
              <LinearGradient colors={processingMethod === 'wallet' ? ['#555', '#444'] : ['#8E44AD', '#9B59B6']} style={styles.primaryButtonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {processingMethod === 'wallet' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('scan.payWithWallet')}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setScanned(false);
                setMerchantData(null);
                setAmount('');
              }}
              disabled={!!processingMethod}
            >
              <Text style={styles.cancelButtonText}>{t('scan.cancel')}</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}
        
        {/* Premium Success Modal */}
        <Modal visible={!!successData} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconWrap}>
                <Icon name="check-decagram" size={70} color="#00C9A7" />
              </View>
              <Text style={styles.modalTitle}>{t('scan.successTitle')}</Text>
              <Text style={styles.modalAmount}>₹{successData?.amount?.toFixed(2)}</Text>
              <Text style={styles.modalMessage}>{t('scan.paidTo', { merchant: successData?.merchant })}</Text>
              
              <View style={styles.modalDivider} />
              <View style={styles.modalRow}>
                 <Text style={styles.modalLabel}>{t('scan.method')}</Text>
                 <Text style={styles.modalValue}>{successData?.method}</Text>
              </View>
              <View style={styles.modalRow}>
                 <Text style={styles.modalLabel}>{t('scan.date')}</Text>
                 <Text style={styles.modalValue}>{new Date().toLocaleString()}</Text>
              </View>

              <TouchableOpacity style={styles.modalBtn} onPress={() => {
                setSuccessData(null);
                navigation.navigate('Home');
              }}>
                <LinearGradient colors={['#00C9A7', '#00A88F']} style={styles.modalBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                   <Text style={styles.modalBtnText}>{t('scan.backToDashboard')}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  
  scannerContainer: { flex: 1, backgroundColor: COLORS.background, margin: 20, borderRadius: 32, overflow: 'hidden' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(10,10,26,0.6)', justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 280, height: 280, borderWidth: 3, borderColor: '#00C9A7', backgroundColor: 'transparent', borderRadius: 24 },
  scanText: { color: '#fff', marginTop: 24, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  
  paymentContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  merchantCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: COLORS.border },
  merchantIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(155,89,182,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  merchantName: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  merchantId: { fontSize: 14, color: COLORS.textLight, marginTop: 6 },
  
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 20, paddingHorizontal: 20, height: 80, marginBottom: 30, borderWidth: 1, borderColor: COLORS.border },
  currencySymbol: { fontSize: 40, color: '#00C9A7', fontWeight: '900', marginRight: 15 },
  amountInput: { flex: 1, fontSize: 36, color: COLORS.text, fontWeight: 'bold' },
  
  primaryButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 15 },
  walletButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  primaryButtonGrad: { height: 60, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  
  cancelButton: { height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  cancelButtonText: { color: COLORS.textLight, fontWeight: '700', fontSize: 16 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#ffffff', borderRadius: 28, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 15 },
  modalIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 10 },
  modalAmount: { fontSize: 40, fontWeight: '900', color: '#00C9A7', marginBottom: 10 },
  modalMessage: { fontSize: 16, color: '#555', marginBottom: 25, textAlign: 'center', fontWeight: '600' },
  
  modalDivider: { width: '100%', height: 1, backgroundColor: '#eee', marginBottom: 20 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  modalLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  modalValue: { fontSize: 14, color: '#333', fontWeight: '800' },
  
  modalBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 30 },
  modalBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successIconWrap: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#00C9A7', marginBottom: 12 },
  successDesc: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  tokenBox: { backgroundColor: COLORS.cardBg, paddingVertical: 24, paddingHorizontal: 40, borderRadius: 24, borderWidth: 2, borderColor: '#00C9A7', borderStyle: 'dashed', marginBottom: 40 },
  tokenText: { fontSize: 48, fontWeight: '900', color: COLORS.text, letterSpacing: 12 },
  homeBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' }
});
