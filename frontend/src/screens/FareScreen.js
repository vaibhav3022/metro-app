import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { ticketAPI } from '../api/ticketAPI';
import { setCurrentTicket } from '../redux/slices/ticketSlice';
import RazorpayCheckout from 'react-native-razorpay';
import { useTranslation } from 'react-i18next';

export default function FareScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const bookingDetails = useSelector((state) => state.tickets.bookingDetails);
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const { t } = useTranslation();

  if (!bookingDetails) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.gradient}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <View style={styles.centered}>
          <Icon name="ticket-outline" size={60} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} />
          <Text style={styles.emptyText}>{t('fare.noDetails')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
            <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.goBackBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.goBackBtnText}>{t('fare.goBack')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const { source, destination, passengers, isReturn, distance, farePerPerson, totalAmount, discountApplied } = bookingDetails;

  const handlePaymentSuccess = async (paymentId, method, razorpayData = {}) => {
    setLoading(true);
    setLoadingMsg(t('fare.generatingTicket'));
    try {
      const ticketResult = await ticketAPI.createTicket({ source, destination, distance, fare: farePerPerson, passengers, totalAmount });
      const { ticket } = ticketResult;
      const paymentResult = await ticketAPI.processPayment(ticket.ticketId, {
        paymentId, paymentMethod: method, paymentStatus: 'success', ...razorpayData
      });

      setLoading(false);
      dispatch(setCurrentTicket(paymentResult.ticket));
      navigation.navigate('QRTicket');
    } catch (error) {
      setLoading(false);
      // If error occurs, check if it's just a network timeout but ticket was saved.
      if (error.response) {
        Alert.alert(t('fare.alert.noticeTitle'), t('fare.alert.paymentReceived'));
        navigation.navigate('TicketHistory'); // Or redirect to history to see it
      } else {
        Alert.alert(t('fare.alert.errorTitle'), t('fare.alert.failedTicket'));
      }
    }
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setLoadingMsg(t('fare.initiatingTransaction'));
    try {
      const orderRes = await ticketAPI.createRazorpayOrder(totalAmount);
      setLoading(false);
      
      const options = {
        description: 'ENERGEIA METRO Ticket Booking',
        image: 'https://cdn.pixabay.com/photo/2021/08/11/11/15/train-6538260_960_720.png',
        currency: orderRes.currency,
        key: 'rzp_test_St6f7LZjydxbQ0', // Using the test key from backend env
        amount: orderRes.amount,
        name: 'ENERGEIA METRO',
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
      if (orderRes.orderId.startsWith('order_mock_')) {
        delete options.order_id;
      }

      RazorpayCheckout.open(options).then((data) => {
        handlePaymentSuccess(data.razorpay_payment_id, 'razorpay', data);
      }).catch((error) => {
        // Suppress "Something went wrong" generic errors if it might be a cancellation
        if (error.code !== 0) {
           console.log('Payment Failed', `Code: ${error.code} | Description: ${error.description}`);
        }
      });
    } catch (e) {
      setLoading(false);
      console.log('Error initiating payment', e);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.gradient}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00C9A7" />
          <Text style={styles.loadingMsg}>{loadingMsg}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('fare.fareBreakdown')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Journey Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('fare.journeyDetails')}</Text>
          <View style={styles.journeyRow}>
            <View style={styles.stationInfo}>
              <View style={styles.dot} />
              <Text style={styles.stationLabel}>{t('fare.source')}</Text>
              <Text style={styles.stationName}>{source}</Text>
            </View>
            <View style={styles.distanceWrap}>
              <Text style={styles.distanceText}>{Number(distance).toFixed(1)} KM</Text>
              <View style={styles.distanceLine} />
              <Icon name="chevron-double-right" size={20} color="#00C9A7" />
            </View>
            <View style={[styles.stationInfo, { alignItems: 'flex-end' }]}>
              <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.stationLabel}>{t('fare.destination')}</Text>
              <Text style={styles.stationName}>{destination}</Text>
            </View>
          </View>
        </View>

        {/* Fare Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('fare.fareCalculation')}</Text>
          <View style={styles.fareRow}>
            <Text style={styles.fareItemLabel}>{t('fare.farePerPassenger')}</Text>
            <Text style={styles.fareItemValue}>₹{farePerPerson}</Text>
          </View>
          {discountApplied && (
            <View style={styles.fareRow}>
              <Text style={styles.fareItemLabel}>{t('fare.discountApplied')}</Text>
              <Text style={[styles.fareItemValue, { color: '#22c55e' }]}>{discountApplied}</Text>
            </View>
          )}
          <View style={styles.fareRow}>
            <Text style={styles.fareItemLabel}>{t('fare.totalPassengers')}</Text>
            <Text style={styles.fareItemValue}>{passengers}</Text>
          </View>
          <View style={[styles.fareRow, { borderBottomWidth: 0, marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }]}>
            <Text style={styles.totalLabel}>{t('fare.totalPayable')}</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Payment Actions */}
        <View style={styles.paymentActions}>
          <TouchableOpacity onPress={handleRazorpayPayment} disabled={loading} style={styles.payBtnContainer}>
            <LinearGradient colors={[COLORS.primary, COLORS.primary]} style={styles.payBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Icon name="credit-card-outline" size={22} color="#fff" />
              <Text style={styles.payBtnText}>{t('fare.payNow')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, paddingBottom: 50, paddingTop: Platform.OS === 'android' ? 50 : 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: COLORS.textLight, marginTop: 16, fontSize: 16, fontWeight: '600' },
  goBackBtn: { paddingHorizontal: 30, paddingVertical: 14, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  goBackBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,26,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100, gap: 16 },
  loadingMsg: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  card: { backgroundColor: COLORS.cardBg, borderRadius: 28, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },
  
  journeyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stationInfo: { flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#00C9A7', marginBottom: 8, borderWidth: 2, borderColor: COLORS.cardBg },
  stationLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, marginBottom: 4 },
  stationName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  
  distanceWrap: { alignItems: 'center', paddingHorizontal: 12, gap: 4 },
  distanceText: { fontSize: 12, fontWeight: '800', color: '#00C9A7' },
  distanceLine: { height: 2, width: 40, backgroundColor: 'rgba(0,201,167,0.3)', borderRadius: 1 },
  
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  fareItemLabel: { fontSize: 15, color: COLORS.textLight, fontWeight: '600' },
  fareItemValue: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  
  totalLabel: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  totalValue: { fontSize: 28, fontWeight: '900', color: '#00C9A7' },
  
  paymentActions: { marginTop: 8 },
  payBtnContainer: { borderRadius: 16, overflow: 'hidden' },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 12 },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
