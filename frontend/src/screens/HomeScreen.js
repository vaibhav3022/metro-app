import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Dimensions, Image, FlatList, Alert, Linking
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { ticketAPI } from '../api/ticketAPI';
import { fetchHistorySuccess, setCurrentTicket } from '../redux/slices/ticketSlice';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { theme: COLORS, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { user } = useSelector((state) => state.auth);
  const { balance, loading: walletLoading } = useSelector((state) => state.wallet);
  const { history } = useSelector((state) => state.tickets);
  const [greeting, setGreeting] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const sliderWidth = screenWidth; // full width

  const sliderImages = [
    { id: '1', source: require('../../assets/slider/metro_train.png'), title: t('home.slider1') },
    { id: '2', source: require('../../assets/slider/station_shop.png'), title: t('home.slider2') },
    { id: '3', source: require('../../assets/slider/qr_payment.png'), title: t('home.slider3') },
    { id: '4', source: require('../../assets/slider/digital_ticket.png'), title: t('home.slider4') },
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
    if (hour < 12) setGreeting(t('home.greeting_morning'));
    else if (hour < 17) setGreeting(t('home.greeting_afternoon'));
    else if (hour < 21) setGreeting(t('home.greeting_evening'));
    else setGreeting(t('home.greeting_night'));

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
  }, [dispatch, t]);

  const activeTicket = history?.find(t => t.ticketStatus === 'active' || t.ticketStatus === 'entered');
  const firstName = user?.name ? user.name.split(' ')[0] : t('home.passenger');

  const quickActions = [
    { title: t('home.bookTicket'), icon: 'ticket-outline', route: 'RouteSelection', color: '#FF5722' },
    { title: t('home.viewTickets'), icon: 'ticket-confirmation-outline', route: 'TicketsTab', color: '#2E7D32' },
    { title: t('home.fareCalc'), icon: 'calculator-variant-outline', route: 'FareCalculator', color: '#0D47A1' },
    { title: t('home.feederBus'), icon: 'bus', route: 'Feeder', color: '#F57C00' },
    { title: t('home.stationInfo'), icon: 'train', route: 'StationInfo', color: '#0288D1' },
    { title: t('home.touristPlaces'), icon: 'compass-outline', route: 'TouristPlaces', color: '#9C27B0' },
    { title: t('home.smartCard'), icon: 'card-account-details-outline', route: 'SmartCard', color: '#00796B' },
    { title: t('home.metroMap'), icon: 'map-outline', route: 'MetroMap', color: '#E64A19' },
  ];

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* ── STICKY TOP: Header + Slider ── */}
      <View style={styles.stickyTop}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 15 }}>
            <Image 
              source={require('../assets/images/pune_metro_logo.png')} 
              style={styles.headerLogo} 
              resizeMode="contain" 
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{t('home.puneMetro')}</Text>
              <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">{greeting}, {firstName}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
            <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggle, { marginRight: 10 }]}>
              <Icon name={isDark ? "weather-night" : "white-balance-sunny"} size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')} style={styles.avatarWrap}>
              <LinearGradient colors={[COLORS.secondary, COLORS.primary]} style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name || 'P')[0].toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
        <Text style={styles.sectionTitle}>{t('home.quickServices')}</Text>
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
          <Text style={styles.sectionTitle}>{t('home.recentTickets')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TicketsTab')}>
            <Text style={styles.viewAll}>{t('home.viewAll')}</Text>
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
                <Text style={styles.ticketStatusText}>{activeTicket.ticketStatus === 'entered' ? t('home.inTransit') : t('home.activeQR')}</Text>
              </View>
              <Icon name="qrcode-scan" size={28} color="#00C9A7" />
            </View>
            <View style={styles.ticketFooter}>
              <Text style={styles.ticketDetails}>{activeTicket.passengers} {t('home.passengersCount')}</Text>
              <Text style={styles.ticketFare}>₹{activeTicket.totalAmount || activeTicket.fare}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Icon name="ticket-confirmation-outline" size={44} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} />
            <Text style={styles.emptyText}>{t('home.noActiveTickets')}</Text>
            <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('RouteSelection')}>
              <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.bookBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.bookBtnText}>{t('home.bookNow')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* PMPML Bus Booking Card */}
        <TouchableOpacity style={styles.pmpmlCard} onPress={async () => {
          try {
            // Android 11+ requires explicit intents to launch other apps directly
            const intents = [
              'intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.chartr.pmpml;end;',
              'intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=org.pmpml.econnect;end;',
              'intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.amnex.pmpml;end;',
              'pmpml://'
            ];
            
            let opened = false;
            for (let intentUri of intents) {
              try {
                // We use openURL directly because canOpenURL fails on Android 11+ without Manifest <queries>
                await Linking.openURL(intentUri);
                opened = true;
                break;
              } catch (e) {
                // Ignore and try next intent
              }
            }
            
            if (!opened) {
               // Fallback ONLY if all intents fail
               Linking.openURL('https://play.google.com/store/search?q=PMPML&c=apps');
            }
          } catch (error) {
            Alert.alert('Error', 'Could not process request');
          }
        }}>
          <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.pmpmlIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Icon name="bus" size={24} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.pmpmlTitle}>{t('home.pmpmlTitle')}</Text>
            <Text style={styles.pmpmlSub}>{t('home.pmpmlSub')}</Text>
          </View>
          <Icon name="chevron-right" size={22} color="#888" />
        </TouchableOpacity>

        {/* EV Auto Rickshaws Card */}
        <TouchableOpacity style={styles.evAutoCard} onPress={() => Linking.openURL('https://play.google.com/store/search?q=Pune+EV+Auto&c=apps').catch(() => Alert.alert('Error', 'Could not open Play Store'))}>
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.evAutoIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Icon name="car-electric" size={24} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.evAutoTitle}>{t('home.evAutoTitle')}</Text>
            <Text style={styles.evAutoSub}>{t('home.evAutoSub')}</Text>
          </View>
          <Icon name="chevron-right" size={22} color="#888" />
        </TouchableOpacity>

        {/* Notifications shortcut */}
        <TouchableOpacity style={styles.notifCard} onPress={() => navigation.navigate('Notifications')}>
          <Icon name="bell-outline" size={22} color="#00C9A7" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.notifTitle}>{t('home.notifShortcutTitle')}</Text>
            <Text style={styles.notifSub}>{t('home.notifShortcutSub')}</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#555" />
        </TouchableOpacity>

      </ScrollView>

    </LinearGradient>
  );
}


const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  stickyTop: {
    paddingTop: 50,
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  scroll: { paddingTop: 10, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 22 },
  headerLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', padding: 2, borderWidth: 1, borderColor: '#E0E0E0' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  greeting: { fontSize: 13, color: COLORS.textLight, marginTop: 1 },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  themeToggle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border },
  avatarWrap: { borderRadius: 28, overflow: 'hidden' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },

  sliderContainer: { width: '100%', height: 190, marginBottom: 20, overflow: 'hidden', backgroundColor: COLORS.cardBg },
  slideWrap: { height: 190 },
  slideImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  slideOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, justifyContent: 'flex-end', padding: 16 },
  slideTitle: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  pagination: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 18, backgroundColor: '#00C9A7' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginHorizontal: 22, marginBottom: 14 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 22 },
  viewAll: { color: '#00C9A7', fontWeight: '700', fontSize: 13 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginBottom: 28 },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: 18, paddingHorizontal: 4 },
  iconBox: { width: 58, height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 7, borderWidth: 1, borderColor: COLORS.border },
  gridText: { fontSize: 11, color: COLORS.text, textAlign: 'center', fontWeight: '600' },

  emptyCard: { backgroundColor: COLORS.cardBg, marginHorizontal: 22, borderRadius: 18, padding: 28, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { color: COLORS.textLight, marginTop: 10, marginBottom: 16, fontSize: 14 },
  bookBtn: { borderRadius: 22, overflow: 'hidden' },
  bookBtnGrad: { paddingHorizontal: 28, paddingVertical: 11 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  notifCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, marginHorizontal: 22, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  notifTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  notifSub: { color: COLORS.textLight, fontSize: 12, marginTop: 2 },

  pmpmlCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, marginHorizontal: 22, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F57C00', marginBottom: 16 },
  pmpmlIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pmpmlTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  pmpmlSub: { color: '#F57C00', fontSize: 12, marginTop: 2, fontWeight: '600' },

  evAutoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, marginHorizontal: 22, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#3b82f6', marginBottom: 16 },
  evAutoIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  evAutoTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  evAutoSub: { color: '#3b82f6', fontSize: 12, marginTop: 2, fontWeight: '600' },

  activeTicketCard: { backgroundColor: COLORS.cardBg, marginHorizontal: 22, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  ticketIconWrap: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  ticketInfo: { flex: 1 },
  ticketRoute: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  ticketStatusText: { fontSize: 13, color: '#00C9A7', fontWeight: '700' },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 },
  ticketDetails: { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },
  ticketFare: { fontSize: 18, fontWeight: '900', color: COLORS.text },
});
