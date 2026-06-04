import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Dimensions, Image, FlatList
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ticketAPI } from '../api/ticketAPI';
import { fetchHistorySuccess, setCurrentTicket } from '../redux/slices/ticketSlice';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { balance, loading: walletLoading } = useSelector((state) => state.wallet);
  const { history } = useSelector((state) => state.tickets);
  const [greeting, setGreeting] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const sliderWidth = screenWidth; // full width

  const sliderImages = [
    { id: '1', source: require('../../assets/slider/metro_train.png'), title: 'Smart Metro Travel' },
    { id: '2', source: require('../../assets/slider/station_shop.png'), title: 'Station Retail Shops' },
    { id: '3', source: require('../../assets/slider/qr_payment.png'), title: 'Cashless Payments' },
    { id: '4', source: require('../../assets/slider/digital_ticket.png'), title: 'Digital QR Tickets' },
  ];

  const flatListRef = useRef(null);
  const currentSlideRef = useRef(0);

  const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index;
      setCurrentSlide(idx);
      currentSlideRef.current = idx;
    }
  }).current;
  const viewabilityConfig = React.useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Auto-scroll slider every 3 seconds
    const autoScroll = setInterval(() => {
      const nextIndex = (currentSlideRef.current + 1) % sliderImages.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      currentSlideRef.current = nextIndex;
      setCurrentSlide(nextIndex);
    }, 3000);

    // Fetch tickets for recent tickets section
    const fetchTickets = async () => {
      try {
        const data = await ticketAPI.getTicketHistory();
        if (data.tickets) {
          dispatch(fetchHistorySuccess(data.tickets));
        }
      } catch (err) {
        console.log('Failed to fetch recent tickets in home');
      }
    };
    fetchTickets();

    return () => clearInterval(autoScroll);
  }, [dispatch]);

  const activeTicket = history?.find(t => t.ticketStatus === 'active' || t.ticketStatus === 'entered');

  const quickActions = [
    { title: 'Book Ticket', icon: 'ticket-outline', route: 'RouteSelection', color: '#00C9A7' },
    { title: 'Recharge', icon: 'wallet-plus-outline', route: 'WalletTab', color: '#9B59B6' },
    { title: 'Metro Map', icon: 'map-outline', route: 'MetroMap', color: '#3498DB' },
    { title: 'Fare Calc', icon: 'calculator-variant-outline', route: 'FareCalculator', color: '#F39C12' },
    { title: 'Shops', icon: 'storefront-outline', route: 'ShopsTab', color: '#E74C3C' },
    { title: 'Scan & Pay', icon: 'qrcode-scan', route: 'ScanAndPay', color: '#1ABC9C' },
    { title: 'Smart Card', icon: 'card-account-details-outline', route: 'SmartCard', color: '#E91E63' },
    { title: 'Feeder Bus', icon: 'bus', route: 'Feeder', color: '#FF6B35' },
  ];

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── STICKY TOP: Header + Slider ── */}
      <View style={styles.stickyTop}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user?.name || 'Passenger'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')} style={styles.avatarWrap}>
            <LinearGradient colors={['#00C9A7', '#9B59B6']} style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'P')[0].toUpperCase()}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Image Slider */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={sliderImages}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
              <View style={[styles.slideWrap, { width: sliderWidth }]}>
                <Image source={item.source} style={styles.slideImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.slideOverlay}>
                  <Text style={styles.slideTitle}>{item.title}</Text>
                </LinearGradient>
              </View>
            )}
          />
          <View style={styles.pagination}>
            {sliderImages.map((_, i) => (
              <View key={i} style={[styles.dot, currentSlide === i && styles.activeDot]} />
            ))}
          </View>
        </View>
      </View>

      {/* ── SCROLLABLE CONTENT below ── */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Services</Text>
        <View style={styles.grid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.gridItem}
              onPress={() => navigation.navigate(action.route)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: action.color + '22' }]}>
                <Icon name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.gridText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Tickets */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Tickets</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TicketsTab')}>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>


        {activeTicket ? (
          <TouchableOpacity style={styles.activeTicketCard} onPress={() => {
            dispatch(setCurrentTicket(activeTicket));
            navigation.navigate('QRTicket');
          }}>
            <View style={styles.ticketHeader}>
              <View style={styles.ticketIconWrap}>
                <Icon name="ticket-confirmation-outline" size={26} color="#00C9A7" />
              </View>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketRoute}>{activeTicket.source} → {activeTicket.destination}</Text>
                <Text style={styles.ticketStatusText}>{activeTicket.ticketStatus === 'entered' ? 'In Transit' : 'Active QR'}</Text>
              </View>
              <Icon name="qrcode-scan" size={28} color="#00C9A7" />
            </View>
            <View style={styles.ticketFooter}>
              <Text style={styles.ticketDetails}>{activeTicket.passengers} Passenger(s)</Text>
              <Text style={styles.ticketFare}>₹{activeTicket.totalAmount || activeTicket.fare}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Icon name="ticket-confirmation-outline" size={44} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No active tickets found</Text>
            <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('RouteSelection')}>
              <LinearGradient colors={['#00C9A7', '#009980']} style={styles.bookBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.bookBtnText}>Book Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications shortcut */}
        <TouchableOpacity style={styles.notifCard} onPress={() => navigation.navigate('Notifications')}>
          <Icon name="bell-outline" size={22} color="#00C9A7" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.notifTitle}>Notifications</Text>
            <Text style={styles.notifSub}>Check your latest alerts & offers</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#555" />
        </TouchableOpacity>

      </ScrollView>

    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyTop: {
    paddingTop: 50,
    backgroundColor: '#0A0A1A',
    zIndex: 10,
  },
  scroll: { paddingTop: 10, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, marginBottom: 22 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  avatarWrap: { borderRadius: 28, overflow: 'hidden' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },

  sliderContainer: { width: '100%', height: 190, marginBottom: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  slideWrap: { height: 190 },
  slideImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  slideOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, justifyContent: 'flex-end', padding: 16 },
  slideTitle: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  pagination: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 18, backgroundColor: '#00C9A7' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginHorizontal: 22, marginBottom: 14 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 22 },
  viewAll: { color: '#00C9A7', fontWeight: '700', fontSize: 13 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginBottom: 28 },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: 18, paddingHorizontal: 4 },
  iconBox: { width: 58, height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  gridText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontWeight: '600' },

  emptyCard: { backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 22, borderRadius: 18, padding: 28, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyText: { color: 'rgba(255,255,255,0.4)', marginTop: 10, marginBottom: 16, fontSize: 14 },
  bookBtn: { borderRadius: 22, overflow: 'hidden' },
  bookBtnGrad: { paddingHorizontal: 28, paddingVertical: 11 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  notifCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 22, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  notifTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  notifSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },

  activeTicketCard: { backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 22, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  ticketIconWrap: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  ticketInfo: { flex: 1 },
  ticketRoute: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  ticketStatusText: { fontSize: 13, color: '#00C9A7', fontWeight: '700' },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 14 },
  ticketDetails: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  ticketFare: { fontSize: 18, fontWeight: '900', color: '#fff' },
});
