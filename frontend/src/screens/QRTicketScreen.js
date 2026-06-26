import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, FlatList, Dimensions, StatusBar, BackHandler
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

export default function QRTicketScreen() {
  const navigation = useNavigation();
  const ticket = useSelector((state) => state.tickets.currentTicket);
  const { theme: COLORS, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(COLORS, isDark), [COLORS, isDark]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('HomeTab');
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  if (!ticket) {
    return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.centered}>
            <Icon name="ticket-confirmation-outline" size={70} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} style={{ marginBottom: 20 }} />
            <Text style={styles.noTicketText}>{t('qrticket.noActiveTicket')}</Text>
            <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('HomeTab')}>
              <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.homeBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.homeBtnText}>{t('qrticket.goToDash')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const isInvalid = ['expired', 'used', 'failed'].includes(ticket.ticketStatus?.toLowerCase());
  const passengersCount = ticket.passengers || 1;
  const ticketsArray = Array.from({ length: passengersCount });
  const isReturn = ticket.isReturn;

  const QR_SIZE = 240;

  const handleScroll = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / QR_SIZE);
    if (index >= 0 && index < passengersCount) {
      setCurrentIndex(index);
    }
  };

  const renderQRItem = ({ index }) => {
    // Use encrypted qrData from backend if available, otherwise fallback to ticketId
    const qrPayload = ticket.qrData 
      ? ticket.qrData
      : `${ticket.ticketId || ticket.id}_${index + 1}`;

    return (
      <View style={{ width: QR_SIZE, height: QR_SIZE, position: 'relative', overflow: 'hidden', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <QRCode
          value={qrPayload}
          size={QR_SIZE - 20}
          color="black"
          backgroundColor="white"
        />
        {isInvalid && (
          <View style={styles.invalidOverlay}>
             <Text style={styles.invalidOverlayText}>{ticket.ticketStatus?.charAt(0).toUpperCase() + ticket.ticketStatus?.slice(1)}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={isDark ? ['#0B132B', '#1C2541'] : [COLORS.primary, '#1976D2']} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            
            {/* Top Row: Price, Type, Close */}
            <View style={styles.cardTopRow}>
              <Text style={styles.priceText}>₹{ticket.totalAmount || ticket.fare}</Text>
              <View style={styles.typeChip}>
                <Text style={styles.typeChipText}>{isReturn ? t('qrticket.return') : t('qrticket.outward')}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('HomeTab')} style={styles.closeBtn}>
                <Icon name="close" size={20} color="#777" />
              </TouchableOpacity>
            </View>

            {/* Ticket Counter */}
            <View style={styles.counterRow}>
              {passengersCount > 1 ? (
                <TouchableOpacity 
                  disabled={currentIndex === 0} 
                  onPress={() => flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true })}
                  style={{ padding: 10, opacity: currentIndex === 0 ? 0.3 : 1 }}
                >
                  <Icon name="chevron-left-circle" size={32} color="#00C9A7" />
                </TouchableOpacity>
              ) : <View style={{ width: 52 }} />}
              
              <Text style={styles.counterText}>{t('qrticket.ticketOf', { current: currentIndex + 1, total: passengersCount })}</Text>

              {passengersCount > 1 ? (
                <TouchableOpacity 
                  disabled={currentIndex === passengersCount - 1} 
                  onPress={() => flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })}
                  style={{ padding: 10, opacity: currentIndex === passengersCount - 1 ? 0.3 : 1 }}
                >
                  <Icon name="chevron-right-circle" size={32} color="#00C9A7" />
                </TouchableOpacity>
              ) : <View style={{ width: 52 }} />}
            </View>

            {/* QR Code */}
            <View style={[styles.qrWrapper, { width: QR_SIZE, height: QR_SIZE, marginBottom: 20 }]}>
              <FlatList
                ref={flatListRef}
                data={ticketsArray}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                renderItem={renderQRItem}
                getItemLayout={(data, index) => ({ length: QR_SIZE, offset: QR_SIZE * index, index })}
              />
            </View>

            {/* Eco-Friendly Badge */}
            <View style={styles.ecoBadge}>
              <Icon name="leaf" size={16} color="#2E7D32" />
              <Text style={styles.ecoText}>{t('qrticket.ecoFriendly', { co2: ((ticket.distance || 5) * 140).toFixed(0) })}</Text>
            </View>

            {/* Ticket ID */}
            <Text style={[styles.ticketId, { color: COLORS.primary }]}>{t('qrticket.ticketNo')} {ticket.ticketId || ticket.id}-{currentIndex + 1}</Text>

            {/* From -> To */}
            <View style={styles.routeRow}>
               <View style={styles.stationInfo}>
                  <Text style={styles.stationLabel}>{t('qrticket.from')}</Text>
                  <Text style={styles.stationName}>{ticket.source || ticket.sourceStation}</Text>
               </View>
               <Icon name="arrow-right" size={24} color="#777" style={{ marginHorizontal: 10 }} />
               <View style={styles.stationInfo}>
                  <Text style={styles.stationLabel}>{t('qrticket.to')}</Text>
                  <Text style={styles.stationName}>{ticket.destination || ticket.destinationStation}</Text>
               </View>
            </View>

          </View>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS, isDark) => StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noTicketText: { fontSize: 18, color: COLORS.textLight, marginBottom: 24, fontWeight: '600' },
  homeBtn: { borderRadius: 16, overflow: 'hidden' },
  homeBtnGrad: { paddingHorizontal: 30, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  homeBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cardContainer: {
    width: width - 40,
    alignItems: 'center',
  },
  card: { 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 20, 
    alignItems: 'center', 
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10
  },
  
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  priceText: { fontSize: 20, fontWeight: '900', color: '#111' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#ccc' },
  typeChipText: { color: '#333', fontWeight: '700', fontSize: 13 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },

  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  counterText: { fontSize: 16, fontWeight: '800', color: '#111', marginHorizontal: 15 },
  
  qrWrapper: { position: 'relative', width: 250, height: 250, marginBottom: 15, borderRadius: 12, overflow: 'hidden' },
  qrImage: { width: '100%', height: '100%' },
  
  invalidOverlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.75)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  invalidOverlayText: { color: '#ffffff', fontWeight: '900', fontSize: 32, letterSpacing: 1 },
  
  ecoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' },
  ecoText: { color: '#22c55e', fontWeight: '800', fontSize: 13, marginLeft: 6 },

  ticketId: { fontSize: 13, color: '#3b82f6', marginBottom: 25, fontWeight: '700' },
  
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 10, paddingBottom: 25 },
  stationInfo: { flex: 1, alignItems: 'center' },
  stationLabel: { fontSize: 11, color: '#888', marginBottom: 4, fontWeight: '600' },
  stationName: { fontSize: 14, fontWeight: '800', color: '#222' }
});
