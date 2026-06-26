import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Dimensions, Image, FlatList, Alert, Linking, Modal, Animated, ImageBackground, Easing
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { ticketAPI } from '../api/ticketAPI';
import api from '../api/axiosConfig';
import { fetchHistorySuccess, setCurrentTicket } from '../redux/slices/ticketSlice';
import { setNotifications } from '../redux/slices/notificationSlice';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { theme: COLORS, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { user } = useSelector((state) => state.auth);
  const { balance, loading: walletLoading } = useSelector((state) => state.wallet);
  const { history } = useSelector((state) => state.tickets);
  const { unreadCount } = useSelector((state) => state.notification);
  const [greeting, setGreeting] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [comingSoonModal, setComingSoonModal] = useState({ visible: false, vertical: null });
  const modalAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  // Header logo slow continuous rotation
  useEffect(() => {
    Animated.loop(
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 15000, // Very slow continuous spin
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [logoAnim]);

  const nxlAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(nxlAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(nxlAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, [nxlAnim]);

  const screenWidth = Dimensions.get('window').width;
  const sliderWidth = screenWidth - 36; // inset (16 margin each side + 2 border each side)

  const verticalsData = [
    {
      id: 'energia',
      name: 'Energeia',
      tagline: 'EV Car & Auto Charging',
      icon: 'lightning-bolt',
      gradient: ['#F59E0B', '#B45309'],
      bgColor: '#FEF3C7',
      color: '#B45309',
      emoji: '⚡',
      url: 'https://energeia369.com/'
    },
    {
      id: 'oasis',
      name: 'Oasis T-cafe',
      tagline: 'Premium Tea & Snacks at Every Station',
      icon: 'coffee',
      gradient: ['#D4A574', '#8B5E3C'],
      bgColor: '#ECFCCB',
      color: '#8B5E3C',
      emoji: '☕',
      url: 'https://energeia369.com/oasis'
    },
    {
      id: 'llbeauty',
      name: 'LL Beauty',
      tagline: 'Quick Grooming & Beauty Services',
      icon: 'face-woman-shimmer',
      gradient: ['#F472B6', '#BE185D'],
      bgColor: '#FCE7F3',
      color: '#BE185D',
      emoji: '💄',
      url: 'https://lalyora.energeia369.com/'
    },
    {
      id: 'coworking',
      name: 'Maytriya CoWork',
      tagline: 'Work Pods & Meeting Rooms ',
      icon: 'laptop',
      gradient: ['#34D399', '#059669'],
      bgColor: '#DCFCE7',
      color: '#059669',
      emoji: '🏢',
      url: null
    },
    {
      id: 'eva',
      name: 'Eva',
      tagline: 'Premium Beauty Salon & Products',
      icon: 'spa',
      gradient: ['#FCA5A5', '#E11D48'],
      bgColor: '#FEE2E2',
      color: '#E11D48',
      emoji: '✨',
      url: null
    },
    {
      id: 'events',
      name: 'Events',
      tagline: 'Explore exciting events ',
      icon: 'calendar-star',
      gradient: ['#A78BFA', '#6D28D9'],
      bgColor: '#EDE9FE',
      color: '#6D28D9',
      emoji: '🎟️',
      url: 'https://energeia369.com/events'
    },
    {
      id: 'cybeorch',
      name: 'Cybeorch labs',
      tagline: 'Innovate, Build & Secure ',
      icon: 'shield-check',
      gradient: ['#0EA5E9', '#2563EB'],
      bgColor: '#DBEAFE',
      color: '#2563EB',
      emoji: '🛡️',
      url: 'https://cybeorch.com/'
    },
  ];

  const handleVerticalPress = (vertical) => {
    if (vertical.url) {
      Linking.openURL(vertical.url).catch(() => Alert.alert('Error', 'Could not open link.'));
    } else {
      showComingSoon(vertical);
    }
  };

  const showComingSoon = (vertical) => {
    setComingSoonModal({ visible: true, vertical });
    Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }).start();
  };

  const hideComingSoon = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setComingSoonModal({ visible: false, vertical: null });
    });
  };

  const sliderImages = [
    { id: 's1', source: require('../../assets/slider/metro_train.png'), title: t('home.slider1'), isVertical: false },
    { id: 'v1', source: require('../assets/slider/energia.png'), title: 'Energia', displayTitle: 'Energia', isVertical: true, vertical: verticalsData[0] },
    { id: 'v2', source: require('../assets/slider/Oasis.jpeg'), title: 'Oasis T-Cafe', isVertical: true, vertical: verticalsData[1] },
    { id: 'v3', source: require('../../assets/slider/ll_beauty.png'), title: 'LL Beauty', isVertical: true, vertical: verticalsData[2] },
    { id: 'v5', source: require('../../assets/slider/coworking.png'), title: 'Maytriya CoWork', isVertical: true, vertical: verticalsData[3] },
    { id: 'v6', source: require('../../assets/slider/eva_salon.png'), title: 'EVA', isVertical: true, vertical: verticalsData[4] },
    { id: 'v7', source: require('../assets/slider/events.jpeg'), title: 'Events', isVertical: true, vertical: verticalsData[5] },
    // Use the provided Cybeorch image in src/assets/slider
    { id: 'v8', source: require('../assets/slider/cybeorch.jpg'), title: 'Cybeorch Labs', isVertical: true, vertical: verticalsData[6] },
    { id: 's2', source: require('../assets/slider/Maytriya_Logo.jpeg'), title: '', isVertical: false },
    { id: 's3', source: require('../assets/slider/GSA.jpeg'), title: '', isVertical: false, url: 'https://energeia369.com/events/', imageResizeMode: 'contain' },
    { id: 's4', source: require('../assets/slider/metroxia.jpeg'), title: '', isVertical: false },
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

    return () => clearInterval(autoScroll);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
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

      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          const list = res.data.data || [];
          dispatch(setNotifications(list));
        } catch (err) {
          console.log('Failed to fetch notifications in home');
        }
      };

      fetchTickets();
      fetchNotifications();
    }, [dispatch])
  );

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
    { title: 'Wallet', icon: 'wallet-outline', route: 'Wallet', color: '#00C9A7' },
    { title: 'Help & Support', icon: 'help-circle-outline', route: 'HelpSupport', color: '#EC4899' },
    { title: 'Metro Alerts', icon: 'bell-alert-outline', route: 'Notifications', color: '#FF9800' },
    { title: 'Gift Cards', icon: 'gift-outline', route: 'GiftCard', color: '#FF6B6B' },
  ];

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* ── STICKY TOP: Header + Slider ── */}
      <View style={styles.stickyTop}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 15 }}>
            <Animated.Image 
              source={require('../assets/images/app_logo.png')} 
              style={[
                styles.headerLogo, 
                { 
                  transform: [{ 
                    rotate: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    }) 
                  }] 
                }
              ]} 
              resizeMode="contain" 
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}><Text style={{ color: '#EF4444' }}>METRO</Text><Text style={{ color: '#000000' }}>XIA</Text></Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Icon name="map-marker" size={14} color="#EF4444" style={{ marginRight: 2, marginLeft: -2 }} />
                <Text style={[styles.greeting, { marginTop: 0, marginLeft: 0 }]} numberOfLines={1} ellipsizeMode="tail">Pune, Maharashtra</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
            <TouchableOpacity onPress={() => navigation.navigate('NXLCredits')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 90, backgroundColor: '#000000', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 28, borderWidth: 2, borderColor: '#F59E0B' }}>
              <Animated.View style={{ width: 30, height: 30, borderRadius: 16, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>NXL</Text>
              </Animated.View>
              <Text style={{ color: '#FBBF24', fontWeight: '900', fontSize: 16 }}>{'\u20B9'}999</Text>
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
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.slideWrap, { width: sliderWidth }]}
                onPress={() => {
                  if (item.isVertical && item.vertical) {
                    handleVerticalPress(item.vertical);
                  } else if (item.url) {
                    Linking.openURL(item.url).catch(() => Alert.alert('Error', 'Could not open link.'));
                  }
                }}
              >
                <Image source={item.source} style={[styles.slideImage, item.imageResizeMode === 'contain' && styles.slideImageContain]} resizeMode={item.imageResizeMode || 'cover'} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.slideOverlay}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slideTitle}>{item.displayTitle || (item.isVertical ? item.vertical.name : item.title)}</Text>
                      {item.isVertical && <Text style={styles.slideSubtitle}>{item.vertical.tagline}</Text>}
                    </View>
                    {item.isVertical && (
                      <View style={styles.exploreBadge}>
                        <Text style={styles.exploreBadgeText}>Explore ➔</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
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

        {/* ── Our Verticals ── */}
        <Text style={styles.sectionTitle}>Our Verticals</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.verticalsScroll}>
          {verticalsData.map((v) => (
            <TouchableOpacity key={v.id} activeOpacity={0.85} onPress={() => handleVerticalPress(v)}>
              <View style={[styles.verticalCard, { 
                backgroundColor: v.bgColor || (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,1)'), 
                borderWidth: 1.5, 
                borderColor: v.gradient ? v.gradient[0] : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                elevation: 4,
                shadowOpacity: 0.15,
                shadowColor: v.gradient ? v.gradient[0] : '#000',
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 }
              }]}>
                <View style={[styles.verticalCardIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <Icon name={v.icon} size={30} color={v.gradient ? v.gradient[0] : COLORS.primary} />
                </View>
                <Text style={[styles.verticalCardName, { color: COLORS.text }]}>{v.name}</Text>
                <Text style={[styles.verticalCardTag, { color: COLORS.textLight }]} numberOfLines={2}>{v.tagline}</Text>
                <View style={[styles.verticalBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <Text style={[styles.verticalBadgeText, { color: COLORS.text }]}>Explore ➔</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('home.quickServices')}</Text>
        <View style={styles.grid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.gridItem}
              onPress={() => navigation.navigate(action.route, action.params)}
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
                <Text style={styles.ticketRoute}>{activeTicket.source} ➔ {activeTicket.destination}</Text>
                <Text style={styles.ticketStatusText}>{activeTicket.ticketStatus === 'entered' ? t('home.inTransit') : t('home.activeQR')}</Text>
              </View>
              <Icon name="qrcode-scan" size={28} color="#00C9A7" />
            </View>
            <View style={styles.ticketFooter}>
              <Text style={styles.ticketDetails}>{activeTicket.passengers} {t('home.passengersCount')}</Text>
              <Text style={styles.ticketFare}>{'\u20B9'}{activeTicket.totalAmount || activeTicket.fare}</Text>
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

      </ScrollView>

      {/* ── Coming Soon Modal ── */}
      <Modal
        visible={comingSoonModal.visible}
        transparent
        animationType="none"
        onRequestClose={hideComingSoon}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={hideComingSoon}>
          <Animated.View style={[
            styles.modalContent,
            {
              transform: [{ scale: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              opacity: modalAnim,
            }
          ]}>
            {comingSoonModal.vertical && (
              <>
                <LinearGradient
                  colors={comingSoonModal.vertical.gradient}
                  style={styles.modalIconCircle}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Icon name={comingSoonModal.vertical.icon} size={40} color="#fff" />
                </LinearGradient>

                <Text style={styles.modalEmoji}>{comingSoonModal.vertical.emoji}</Text>
                <Text style={styles.modalTitle}>{comingSoonModal.vertical.name}</Text>
                <Text style={styles.modalTagline}>{comingSoonModal.vertical.tagline}</Text>

                <View style={styles.modalDivider} />

                <View style={styles.modalBadge}>
                  <Icon name="clock-outline" size={18} color="#f59e0b" />
                  <Text style={styles.modalBadgeText}>Coming Soon</Text>
                </View>

                <Text style={styles.modalDesc}>
                  We're working hard to bring {comingSoonModal.vertical.name} to every METROXIA station. Stay tuned for an amazing experience!
                </Text>

                <TouchableOpacity style={styles.modalCloseBtn} onPress={hideComingSoon}>
                  <LinearGradient
                    colors={comingSoonModal.vertical.gradient}
                    style={styles.modalCloseBtnGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.modalCloseBtnText}>Got it! 👍</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>

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
  headerLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', padding: 2 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  greeting: { fontSize: 13, color: COLORS.textLight, marginTop: 1 },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  themeToggle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border },
  avatarWrap: { borderRadius: 28, overflow: 'hidden' },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  notifIconHeader: { marginRight: 12, position: 'relative', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 0, right: 2, width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: COLORS.cardBg },
  sliderContainer: { marginHorizontal: 16, height: 190, marginBottom: 24, overflow: 'hidden', backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 2, borderColor: '#D97706', elevation: 8, shadowColor: '#D97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  slideWrap: { height: 190 },
  slideImage: { width: '100%', height: '100%' },
  slideImageContain: { backgroundColor: '#000' },
  slideOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, justifyContent: 'flex-end', padding: 16 },
  slideTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  slideSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4, fontWeight: '500' },
  exploreBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginLeft: 10 },
  exploreBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  pagination: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 18, backgroundColor: '#00C9A7' },

  verticalSlideContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  verticalSlideEmoji: { fontSize: 42, marginBottom: 8 },
  verticalSlideName: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  verticalSlideTagline: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center' },
  tapToExplore: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  tapToExploreText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  verticalsScroll: { paddingHorizontal: 18, gap: 14, marginBottom: 26 },
  verticalCard: { width: 150, height: 180, borderRadius: 22, padding: 16, justifyContent: 'space-between', elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  verticalCardIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  verticalCardName: { fontSize: 15, fontWeight: '900', color: '#fff', marginTop: 8 },
  verticalCardTag: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.95)', lineHeight: 16 },
  verticalBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  verticalBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

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

  // Coming Soon Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { backgroundColor: COLORS.cardBg, borderRadius: 28, padding: 30, alignItems: 'center', width: '100%', maxWidth: 340, borderWidth: 1, borderColor: COLORS.border, elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  modalIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  modalEmoji: { fontSize: 32, marginBottom: 6 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5, textAlign: 'center' },
  modalTagline: { fontSize: 13, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
  modalDivider: { width: 50, height: 3, backgroundColor: COLORS.border, borderRadius: 2, marginVertical: 18 },
  modalBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, marginBottom: 14 },
  modalBadgeText: { fontSize: 16, fontWeight: '900', color: '#f59e0b' },
  modalDesc: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  modalCloseBtn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  modalCloseBtnGrad: { paddingVertical: 14, alignItems: 'center', borderRadius: 16 },
  modalCloseBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
