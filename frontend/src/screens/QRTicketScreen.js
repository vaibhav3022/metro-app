import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, Platform, StatusBar, BackHandler
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

export default function QRTicketScreen() {
  const navigation = useNavigation();
  const ticket = useSelector((state) => state.tickets.currentTicket);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('HomeTab');
        return true; // prevent default behavior
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  if (!ticket) {
    return (
      <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.centered}>
            <Icon name="ticket-confirmation-outline" size={70} color="rgba(255,255,255,0.2)" style={{ marginBottom: 20 }} />
            <Text style={styles.noTicketText}>No active ticket selected.</Text>
            <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('HomeTab')}>
              <LinearGradient colors={['#00C9A7', '#009980']} style={styles.homeBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.homeBtnText}>Go to Dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticket.ticketId || ticket.id}&color=0A0A1A&bgcolor=FFFFFF`;
  const isInvalid = ['expired', 'used', 'failed'].includes(ticket.ticketStatus?.toLowerCase());

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('HomeTab')}>
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Digital Ticket</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              <Icon name="qrcode-scan" size={36} color="#9B59B6" />
            </View>
            <Text style={styles.cardTitle}>Ready to Scan</Text>
            <Text style={styles.cardSubtitle}>Scan this QR code at the AFC gate</Text>

            {/* QR Code */}
            <View style={[styles.qrWrapper, isInvalid && { borderColor: '#EF4444', opacity: 0.5 }]}>
              <Image
                source={{ uri: qrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              {isInvalid && (
                <View style={styles.invalidOverlay}>
                   <Icon name="close-octagon-outline" size={60} color="#EF4444" />
                   <Text style={styles.invalidOverlayText}>{ticket.ticketStatus?.toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Ticket ID */}
            <Text style={styles.ticketId}>TICKET ID: {ticket.ticketId || ticket.id}</Text>

            {/* Route Info */}
            <View style={styles.routeRow}>
              <View style={styles.stationInfo}>
                <Text style={styles.stationLabel}>From</Text>
                <Text style={styles.stationName}>{ticket.source || ticket.sourceStation}</Text>
              </View>
              <View style={styles.routeArrow}>
                <Icon name="arrow-right-thick" size={20} color="#00C9A7" />
              </View>
              <View style={[styles.stationInfo, { alignItems: 'flex-end' }]}>
                <Text style={styles.stationLabel}>To</Text>
                <Text style={styles.stationName}>{ticket.destination || ticket.destinationStation}</Text>
              </View>
            </View>

            {/* Ticket Details */}
            <View style={styles.detailsRow}>
              {ticket.passengers && (
                <View style={styles.detailChip}>
                  <Icon name="account-group" size={18} color="#00C9A7" />
                  <Text style={styles.detailText}>{ticket.passengers} Pax</Text>
                </View>
              )}
              {ticket.totalAmount && (
                <View style={styles.detailChip}>
                  <Icon name="currency-inr" size={18} color="#00C9A7" />
                  <Text style={styles.detailText}>{ticket.totalAmount}</Text>
                </View>
              )}
              {ticket.ticketStatus && (
                <View style={[styles.detailChip, ticket.ticketStatus === 'active' && styles.activeChip, isInvalid && styles.invalidChip]}>
                  <Icon name={isInvalid ? "alert-circle" : "check-decagram"} size={18} color={ticket.ticketStatus === 'active' ? '#22c55e' : (isInvalid ? '#EF4444' : 'rgba(255,255,255,0.4)')} />
                  <Text style={[styles.detailText, ticket.ticketStatus === 'active' && { color: '#22c55e', fontWeight: '800' }, isInvalid && { color: '#EF4444', fontWeight: '900' }]}>
                    {ticket.ticketStatus?.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 50, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noTicketText: { fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 24, fontWeight: '600' },
  homeBtn: { borderRadius: 16, overflow: 'hidden' },
  homeBtnGrad: { paddingHorizontal: 30, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  homeBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 32, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  iconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(155,89,182,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(155,89,182,0.3)' },
  cardTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontWeight: '500' },
  
  qrWrapper: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#00C9A7', borderStyle: 'dashed', borderRadius: 24, padding: 20, marginBottom: 16 },
  qrImage: { width: 220, height: 220 },
  invalidOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  invalidOverlayText: { color: '#EF4444', fontWeight: '900', fontSize: 24, marginTop: 10, letterSpacing: 2 },
  
  ticketId: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontWeight: '700', letterSpacing: 1 },
  
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: 20, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  stationInfo: { flex: 1 },
  stationLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  stationName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  routeArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  detailsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  detailChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  activeChip: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
  invalidChip: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
  detailText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
});
