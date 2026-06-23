import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, FlatList, Dimensions, StatusBar, BackHandler
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

export default function QRTicketScreen() {
  const navigation = useNavigation();
  const ticket = useSelector((state) => state.tickets.currentTicket);
  const { theme: COLORS, isDark } = useTheme();
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
            <Icon name="ticket-confirmation-outline" size={70} color="rgba(255,255,255,0.2)" style={{ marginBottom: 20 }} />
            <Text style={styles.noTicketText}>No active ticket selected.</Text>
            <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('HomeTab')}>
              <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.homeBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.homeBtnText}>Go to Dashboard</Text>
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

  const handleScroll = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / width);
    setCurrentIndex(index);
  };

  const renderTicketCard = ({ item, index }) => {
    // Unique QR for each passenger
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket.ticketId || ticket.id}_${index + 1}&color=000000&bgcolor=FFFFFF`;

    return (
      <View style={{ width: width, alignItems: 'center', paddingHorizontal: 20 }}>
        <View style={styles.card}>
          
          {/* Top Row: Price, Type, Close */}
          <View style={styles.cardTopRow}>
            <Text style={styles.priceText}>₹{ticket.totalAmount || ticket.fare}</Text>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{isReturn ? 'Return' : 'Outward'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('HomeTab')} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#777" />
            </TouchableOpacity>
          </View>

          {/* Ticket Counter */}
          <View style={styles.counterRow}>
            {passengersCount > 1 ? (
              <TouchableOpacity 
                disabled={index === 0} 
                onPress={() => flatListRef.current?.scrollToOffset({ offset: (index - 1) * width, animated: true })}
                style={{ padding: 10, opacity: index === 0 ? 0.3 : 1 }}
              >
                <Icon name="chevron-left-circle" size={32} color="#00C9A7" />
              </TouchableOpacity>
            ) : <View style={{ width: 52 }} />}
            
            <Text style={styles.counterText}>Ticket {index + 1} of {passengersCount}</Text>

            {passengersCount > 1 ? (
              <TouchableOpacity 
                disabled={index === passengersCount - 1} 
                onPress={() => flatListRef.current?.scrollToOffset({ offset: (index + 1) * width, animated: true })}
                style={{ padding: 10, opacity: index === passengersCount - 1 ? 0.3 : 1 }}
              >
                <Icon name="chevron-right-circle" size={32} color="#00C9A7" />
              </TouchableOpacity>
            ) : <View style={{ width: 52 }} />}
          </View>

          {/* QR Code */}
          <View style={styles.qrWrapper}>
            <Image
              source={{ uri: qrUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
            {isInvalid && (
              <View style={styles.invalidOverlay}>
                 <Text style={styles.invalidOverlayText}>{ticket.ticketStatus?.charAt(0).toUpperCase() + ticket.ticketStatus?.slice(1)}</Text>
              </View>
            )}
          </View>

          {/* Eco-Friendly Badge */}
          <View style={styles.ecoBadge}>
            <Icon name="leaf" size={16} color="#22c55e" />
            <Text style={styles.ecoText}>You saved ~{(ticket.distance * 0.14 || 1.2).toFixed(2)} kg of CO₂</Text>
          </View>

          {/* Ticket ID */}
          <Text style={styles.ticketId}>Ticket No: {ticket.ticketId || ticket.id}-{index + 1}</Text>

          {/* From -> To */}
          <View style={styles.routeRow}>
             <View style={styles.stationInfo}>
                <Text style={styles.stationLabel}>From</Text>
                <Text style={styles.stationName}>{ticket.source || ticket.sourceStation}</Text>
             </View>
             <Icon name="arrow-right" size={24} color="#777" style={{ marginHorizontal: 10 }} />
             <View style={styles.stationInfo}>
                <Text style={styles.stationLabel}>To</Text>
                <Text style={styles.stationName}>{ticket.destination || ticket.destinationStation}</Text>
             </View>
          </View>

        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={isDark ? ['#1a1a2e', '#16213e'] : ['#5b2c6f', '#8e44ad']} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
        
        <View style={{ height: 600, justifyContent: 'center' }}>
          <FlatList
            ref={flatListRef}
            data={ticketsArray}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            renderItem={renderTicketCard}
            getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
          />
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
