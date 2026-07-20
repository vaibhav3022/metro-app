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
import Svg, { Polygon, Image as SvgImage, Defs, ClipPath, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
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
  const [rideModal, setRideModal] = useState({ visible: false, service: null });
  const [tourismMenuModal, setTourismMenuModal] = useState(false);
  const [selectedCountryModal, setSelectedCountryModal] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;
  const rideModalAnim = useRef(new Animated.Value(0)).current;
  const tourismMenuAnim = useRef(new Animated.Value(0)).current;
  const countryModalAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  const countriesData = [
    { 
      code: 'IN', 
      flag: '🇮🇳', 
      name: 'India', 
      fullName: 'Republic of India',
      description: 'India is a land of rich cultural heritage, vibrant colors, and rapid technological innovation. From the iconic Taj Mahal to the bustling tech hubs of Bangalore and Pune, it is a key growth region for transit infrastructure and business integration.',
      image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&auto=format&fit=crop&q=60'
    },
    { 
      code: 'HK', 
      flag: '🇭🇰', 
      name: 'Hong Kong', 
      fullName: 'Hong Kong S.A.R.',
      description: 'Hong Kong is a leading global financial center and metropolitan hub, characterized by its iconic skyscraper-studded skyline, deep natural harbor, and seamless integration of traditional Asian heritage with modern international commerce.',
      image: 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=400&auto=format&fit=crop&q=60'
    },
    { 
      code: 'SG', 
      flag: '🇸🇬', 
      name: 'Singapore', 
      fullName: 'Republic of Singapore',
      description: 'Singapore is a global hub for education, finance, and transport. Known as the "Garden City", it is famous for its hyper-efficient mass transit systems, pristine urban planning, and futuristic landmarks like the Marina Bay Sands.',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&auto=format&fit=crop&q=60'
    },
    { 
      code: 'TH', 
      flag: '🇹🇭', 
      name: 'Thailand', 
      fullName: 'Kingdom of Thailand',
      description: 'Thailand is renowned for its ornate temples, tropical beaches, and world-famous hospitality. As a major tourism and industrial gateway in Southeast Asia, it hosts a fast-growing network of urban transit projects and shopping hubs.',
      image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&auto=format&fit=crop&q=60'
    },
    { 
      code: 'VN', 
      flag: '🇻🇳', 
      name: 'Vietnam', 
      fullName: 'Socialist Republic of Vietnam',
      description: 'Vietnam is a country with rich history, breathtaking natural landscapes, and a fast-developing digital economy. Cities like Hanoi and Ho Chi Minh City are undergoing major urban transit expansions, creating huge business opportunities.',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&auto=format&fit=crop&q=60'
    }
  ];

  const flagsScrollRef = useRef(null);
  const flagsOffsetRef = useRef(0);
  const isFlagsDragging = useRef(false);
  const [flagsContentWidth, setFlagsContentWidth] = useState(0);

  // Spring animation for Country Modal
  useEffect(() => {
    if (selectedCountryModal) {
      setImageLoading(true);
      Animated.spring(countryModalAnim, {
        toValue: 1,
        tension: 80,
        friction: 9,
        useNativeDriver: true
      }).start();
    } else {
      countryModalAnim.setValue(0);
      setImageLoading(false);
    }
  }, [selectedCountryModal]);

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
      image: require('../assets/slider/energia.png'),
      gradient: ['#F59E0B', '#B45309'],
      bgColor: '#FEF3C7',
      color: '#B45309',
      emoji: '⚡',
      url: 'https://cybeorch.com/energeiaone/index.html'
    },
    {
      id: 'oasis',
      name: 'Oasis T-cafe',
      tagline: 'Premium Tea & Snacks',
      icon: 'coffee',
      image: require('../assets/slider/Oasis.jpeg'),
      gradient: ['#D4A574', '#8B5E3C'],
      bgColor: '#ECFCCB',
      color: '#8B5E3C',
      emoji: '☕',
      url: 'https://cybeorch.com/oasisone/index.html'
    },
     {
      id: 'eva',
      name: 'Eva',
      tagline: 'Premium Beauty Salon & Products',
      icon: 'spa',
      image: require('../../assets/slider/eva_salon.png'),
      gradient: ['#FCA5A5', '#E11D48'],
      bgColor: '#FEE2E2',
      color: '#E11D48',
      emoji: '✨',
      url: 'https://cybeorch.com/evaone'
    },
    {
      id: 'llbeauty',
      name: 'L.L. Beauty',
      tagline: 'Quick Grooming & Beauty Services',
      icon: 'face-woman-shimmer',
      image: require('../../assets/slider/ll_beauty.png'),
      gradient: ['#F472B6', '#BE185D'],
      bgColor: '#FCE7F3',
      color: '#BE185D',
      emoji: '💄',
      url: 'https://cybeorch.com/lalyoraone/'
    },
    {
      id: 'coworking',
      name: 'Maytriya CoWork',
      tagline: 'Work Pods & Meeting Rooms ',
      icon: 'laptop',
      image: require('../../assets/slider/maitriya.png'),
      gradient: ['#34D399', '#355249ff'],
      bgColor: '#DCFCE7',
      color: '#059669',
      emoji: '🏢',
      url: 'https://cybeorch.com/coworking/index.html'
    },
   {
      id: 'events',
      name: 'Events',
      tagline: 'Explore exciting events ',
      icon: 'calendar-star',
      image: require('../assets/slider/events.jpeg'),
      gradient: ['#A78BFA', '#6D28D9'],
      bgColor: '#EDE9FE',
      color: '#6D28D9',
      emoji: '🎟️',
      url: 'https://cybeorch.com/eventsone/'
    },
    {
      id: 'nexus',
      name: 'Nexus',
      tagline: 'Premium B2B Business Summit',
      icon: 'handshake',
      image: require('../../assets/slider/nexus.jpg'),
      gradient: ['#DFBA73', '#9F7435'],
      bgColor: '#FDFBF7',
      color: '#9F7435',
      emoji: '🤝',
      url: 'https://cybeorch.com/nexusone'
    },
    {
      id: 'cybeorch',
      name: 'Cybeorch labs',
      tagline: 'Software.Solutions. Skills.Startups. ',
      icon: 'shield-check',
      image: require('../assets/slider/cybeorch.jpg'),
      gradient: ['#0EA5E9', '#2563EB'],
      bgColor: '#DBEAFE',
      color: '#2563EB',
      emoji: '🛡️',
      url: 'https://cybeorch.com/'
    },
    {
      id: 'tourism',
      name: 'Tourism',
      tagline: 'Explore beautiful global destinations',
      icon: 'airplane',
      image: { uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80' },
      gradient: ['#2DD4BF', '#0F766E'],
      bgColor: '#CCFBF1',
      color: '#0F766E',
      emoji: '✈️',
      url: ''
    },
    {
      id: 'matrimonial',
      name: 'Maytriya Matrimonial',
      tagline: 'Find your perfect match',
      icon: 'heart',
      image: { uri: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop&q=80' },
      gradient: ['#F43F5E', '#BE123C'],
      bgColor: '#FFE4E6',
      color: '#BE123C',
      emoji: '💍',
      url: ''
    },
    {
      id: 'pronexa',
      name: 'ProNexa',
      tagline: 'Premium Real Estate Properties',
      icon: 'office-building',
      image: { uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80' },
      gradient: ['#6366F1', '#4338CA'],
      bgColor: '#E0E7FF',
      color: '#4338CA',
      emoji: '🏢',
      url: ''
    },
    {
      id: 'fleetx',
      name: 'FleetX',
      tagline: 'Smart Fleet Management',
      icon: 'car-multiple',
      image: require('../assets/slider/fleetx.jpg'),
      gradient: ['#F97316', '#C2410C'],
      bgColor: '#FFEDD5',
      color: '#C2410C',
      emoji: '🚚',
      url: ''
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

  const showRideModal = (service) => {
    setRideModal({ visible: true, service });
    Animated.spring(rideModalAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }).start();
  };

  const hideRideModal = () => {
    Animated.timing(rideModalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setRideModal({ visible: false, service: null });
    });
  };

  const showTourismMenu = () => {
    setTourismMenuModal(true);
    Animated.spring(tourismMenuAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }).start();
  };

  const hideTourismMenu = () => {
    Animated.timing(tourismMenuAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setTourismMenuModal(false);
    });
  };

  const sliderImages = [
    { id: 's1', source: require('../../assets/slider/metro_train.png'), title: t('home.slider1'), isVertical: false },
    { id: 'v1', source: require('../assets/slider/energia.png'), title: 'Energia', displayTitle: 'Energia', isVertical: true, vertical: verticalsData[0] },
    { id: 'v2', source: require('../assets/slider/Oasis.jpeg'), title: 'Oasis T-Cafe', isVertical: true, vertical: verticalsData[1] },
    { id: 'v3', source: require('../../assets/slider/ll_beauty.png'), title: 'LL Beauty', isVertical: true, vertical: verticalsData[3] },
    { id: 'v5', source: require('../../assets/slider/maitriya.png'), title: 'Maytriya CoWork', isVertical: true, vertical: verticalsData[4] },
    { id: 'v6', source: require('../../assets/slider/eva_salon.png'), title: 'EVA', isVertical: true, vertical: verticalsData[2] },
    { id: 'v_nexus', source: require('../../assets/slider/nexus.jpg'), title: 'Nexus', isVertical: true, vertical: verticalsData[6] },
    { id: 'v7', source: require('../assets/slider/events.jpeg'), title: 'Events', isVertical: true, vertical: verticalsData[5] },
    // Use the provided Cybeorch image in src/assets/slider
    { id: 'v8', source: require('../assets/slider/cybeorch.jpg'), title: 'Cybeorch Labs', isVertical: true, vertical: verticalsData[7] },
    { id: 'v9', source: { uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80' }, title: 'Tourism', isVertical: true, vertical: verticalsData[8] },
    { id: 'v10', source: { uri: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop&q=80' }, title: 'Maytriya Matrimonial', isVertical: true, vertical: verticalsData[9] },
    { id: 'v11', source: { uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80' }, title: 'ProNexa', isVertical: true, vertical: verticalsData[10] },
    { id: 'v12', source: require('../assets/slider/fleetx.jpg'), title: 'FleetX', isVertical: true, vertical: verticalsData[11] },
    { id: 's3', source: require('../assets/slider/GSA.jpeg'), title: '', isVertical: false, url: 'https://energeia369.com/events/', imageResizeMode: 'contain' },
    { id: 's4', source: require('../assets/slider/metroxia.jpeg'), title: '', isVertical: false },
  ];

  const flatListRef = useRef(null);
  const currentSlideRef = useRef(0);
  const verticalsScrollRef = useRef(null);
  const verticalsOffsetRef = useRef(0);
  const isDragging = useRef(false);

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

  useEffect(() => {
    const CARD_WIDTH = 130;
    const GAP = 10;
    const ONE_SET_WIDTH = verticalsData.length * (CARD_WIDTH + GAP);

    const scrollInterval = setInterval(() => {
      if (verticalsScrollRef.current && !isDragging.current) {
        let nextOffset = verticalsOffsetRef.current + 0.6; // slow and smooth scroll
        if (nextOffset >= ONE_SET_WIDTH) {
          nextOffset = 0;
          verticalsScrollRef.current.scrollTo({ x: 0, animated: false });
        } else {
          verticalsScrollRef.current.scrollTo({ x: nextOffset, animated: false });
        }
        verticalsOffsetRef.current = nextOffset;
      }
    }, 20); // ~50 FPS for buttery smooth movement

    return () => clearInterval(scrollInterval);
  }, [verticalsData.length]);

  useEffect(() => {
    const scrollInterval = setInterval(() => {
      if (flagsScrollRef.current && !isFlagsDragging.current && flagsContentWidth > 0) {
        let nextOffset = flagsOffsetRef.current + 0.8; // smooth horizontal scrolling speed
        if (nextOffset >= flagsContentWidth) {
          nextOffset = 0;
          flagsScrollRef.current.scrollTo({ x: 0, animated: false });
        } else {
          flagsScrollRef.current.scrollTo({ x: nextOffset, animated: false });
        }
        flagsOffsetRef.current = nextOffset;
      }
    }, 20); // buttery smooth panning

    return () => clearInterval(scrollInterval);
  }, [flagsContentWidth]);

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
    { title: 'Gift Cards', icon: 'gift-outline', route: 'GiftCard', color: '#FF6B6B' },
    { title: 'Tourism', icon: 'earth', isTourismMenu: true, color: '#8B5CF6' },
    { title: 'Airplane', icon: 'airplane', isRideService: true, type: 'airplane', color: '#0EA5E9', eta: '15 mins to boarding', fare: '₹2,500 - ₹5,000', desc: 'Book direct airport flight transits or helicopter shuttle rides directly from the nearest station terminal.' },
    { title: 'Auto Ride', icon: 'rickshaw', isRideService: true, type: 'auto', color: '#F59E0B', eta: '4 mins away', fare: '₹40 - ₹75', desc: 'Convenient and pocket-friendly three-wheeler rides. Ideal for daily commuting.' },
    { title: 'Car Cab', icon: 'car', isRideService: true, type: 'car', color: '#3B82F6', eta: '5 mins away', fare: '₹90 - ₹180', desc: 'Premium, air-conditioned cabs for comfort-focused and hassle-free travel.' },
    { title: 'Bus Transit', icon: 'bus', isRideService: true, type: 'bus', color: '#EF4444', eta: '7 mins away', fare: '₹10 - ₹25', desc: 'Feeder and scheduled city buses linking metro stations to major localities.' },
    { title: 'Boats', icon: 'ferry', isRideService: true, type: 'boat', color: '#008080', eta: '10 mins away', fare: '₹120 - ₹250', desc: 'Book high-speed electric boats or luxury marine EV ferry transits across the coastal and river routes.' },
  ];

  const tourismOptions = [
    { title: 'Airplane', icon: 'airplane', isRideService: true, type: 'airplane', color: '#0EA5E9', eta: '15 mins to boarding', fare: '₹2,500 - ₹5,000', desc: 'Book direct airport flight transits or helicopter shuttle rides directly from the nearest station terminal.' },
    { title: 'Auto Ride', icon: 'rickshaw', isRideService: true, type: 'auto', color: '#F59E0B', eta: '4 mins away', fare: '₹40 - ₹75', desc: 'Convenient and pocket-friendly three-wheeler rides. Ideal for daily commuting.' },
    { title: 'Car Cab', icon: 'car', isRideService: true, type: 'car', color: '#3B82F6', eta: '5 mins away', fare: '₹90 - ₹180', desc: 'Premium, air-conditioned cabs for comfort-focused and hassle-free travel.' },
    { title: 'Bus Transit', icon: 'bus', isRideService: true, type: 'bus', color: '#EF4444', eta: '7 mins away', fare: '₹10 - ₹25', desc: 'Feeder and scheduled city buses linking metro stations to major localities.' },
    { title: 'Boats', icon: 'ferry', isRideService: true, type: 'boat', color: '#008080', eta: '10 mins away', fare: '₹120 - ₹250', desc: 'Book high-speed electric boats or luxury marine EV ferry transits across the coastal and river routes.' },
  ];

  const marqueeData = [...verticalsData, ...verticalsData, ...verticalsData];

  const getGradient = (type) => {
    switch (type) {
      case 'airplane': return ['#0EA5E9', '#0284C7'];
      case 'auto': return ['#F59E0B', '#D97706'];
      case 'car': return ['#3B82F6', '#1D4ED8'];
      case 'bus': return ['#EF4444', '#B91C1C'];
      case 'boat': return ['#008080', '#004D40'];
      case 'tour': return ['#8B5CF6', '#6D28D9'];
      default: return ['#8B5CF6', '#6D28D9'];
    }
  };

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
              <Text style={styles.headerTitle}><Text style={{ color: '#EF4444' }}>METRO</Text><Text style={{ color: '#000000' }}>X</Text><Text style={{ color: '#EF4444' }}>I</Text><Text style={{ color: '#000000' }}>A</Text></Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Icon name="map-marker" size={14} color="#EF4444" style={{ marginRight: 2, marginLeft: -2 }} />
                <Text style={[styles.greeting, { marginTop: 0, marginLeft: 0 }]} numberOfLines={1} ellipsizeMode="tail">Pune, Maharashtra</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
            <TouchableOpacity onPress={() => navigation.navigate('NXLCredits')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 90, backgroundColor: '#000000', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 28, borderWidth: 2, borderColor: '#F59E0B' }}>
              <Animated.View style={{ width: 30, height: 30, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FF5722', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: '#FF5722', fontWeight: '900', fontSize: 12 }}>NXL</Text>
              </Animated.View>
              <Text style={{ color: '#FBBF24', fontWeight: '900', fontSize: 16 }}>999 Credits</Text>
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
            // Provide getItemLayout so scrollToIndex can compute offsets for offscreen items
            getItemLayout={(data, index) => ({ length: sliderWidth, offset: sliderWidth * index, index })}
            // Fallback when scrollToIndex cannot find measured item (prevents invariant)
            onScrollToIndexFailed={({ index, highestMeasuredFrameIndex, averageItemLength }) => {
              const safeIndex = Math.max(0, Math.min(index, sliderImages.length - 1));
              try {
                flatListRef.current?.scrollToOffset({ offset: sliderWidth * safeIndex, animated: true });
              } catch (e) {
                // swallow — best-effort fallback
              }
            }}
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
        <ScrollView 
          ref={verticalsScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.verticalsScroll}
          onScroll={(e) => {
            if (isDragging.current) {
              verticalsOffsetRef.current = e.nativeEvent.contentOffset.x;
            }
          }}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            isDragging.current = true;
          }}
          onScrollEndDrag={() => {
            isDragging.current = false;
          }}
          onMomentumScrollEnd={(e) => {
            isDragging.current = false;
            verticalsOffsetRef.current = e.nativeEvent.contentOffset.x;
          }}
        >
          {marqueeData.map((v, idx) => {
            const hexWidth = 122;
            const hexHeight = 140;
            const points = "61,0 122,35 122,105 61,140 0,105 0,35";
            const imageUrl = v.image?.uri ? v.image.uri : Image.resolveAssetSource(v.image).uri;
            
            return (
            <TouchableOpacity key={`${v.id}-${idx}`} activeOpacity={0.85} onPress={() => handleVerticalPress(v)}>
              <View style={{ width: hexWidth, height: hexHeight, marginRight: 15, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                <Svg width={hexWidth} height={hexHeight} viewBox={`0 0 ${hexWidth} ${hexHeight}`}>
                  <Defs>
                    <ClipPath id={`hexClip-${idx}`}>
                      <Polygon points={points} />
                    </ClipPath>
                    <SvgLinearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0.3" stopColor="transparent" stopOpacity="0" />
                      <Stop offset="0.7" stopColor="rgba(0,0,0,0.6)" stopOpacity="1" />
                      <Stop offset="1" stopColor="rgba(0,0,0,1)" stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>
                  
                  <SvgImage 
                    href={imageUrl} 
                    width={hexWidth} 
                    height={hexHeight} 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath={`url(#hexClip-${idx})`}
                  />
                  
                  <Rect 
                    x="0" y="0" 
                    width={hexWidth} height={hexHeight} 
                    fill={`url(#grad-${idx})`} 
                    clipPath={`url(#hexClip-${idx})`}
                  />

                  {/* Outer border */}
                  <Polygon 
                    points={points} 
                    fill="none" 
                    stroke={v.gradient ? v.gradient[0] : (v.color || COLORS.primary)} 
                    strokeWidth="3.5" 
                  />
                </Svg>
                
                <View style={{ position: 'absolute', bottom: 38, width: '90%', alignItems: 'center', paddingHorizontal: 2 }}>
                  <Text style={[styles.verticalCardName, { color: '#FFFFFF', textAlign: 'center', fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,1)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 4 }]} numberOfLines={1}>{v.name}</Text>
                  <Text style={[styles.verticalCardTag, { color: '#E2E8F0', textAlign: 'center', fontSize: 9, fontWeight: '600', textShadowColor: 'rgba(0,0,0,1)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3, marginTop: 1 }]} numberOfLines={1}>{v.tagline}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )})}
        </ScrollView>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('home.quickServices')}</Text>
        <View style={styles.grid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.gridItem}
              onPress={() => {
                if (action.isRideService) {
                  showRideModal(action);
                } else if (action.isTourismMenu) {
                  showTourismMenu();
                } else {
                  navigation.navigate(action.route, action.params);
                }
              }}
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
              <Icon name="qrcode" size={28} color="#00C9A7" />
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

        {/* Dynamic Country Flags Auto-Scrolling Ticker */}
        <View style={{ marginVertical: 18, backgroundColor: 'transparent' }}>
          <ScrollView
            ref={flagsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}
            onContentSizeChange={(w) => {
              setFlagsContentWidth(w / 3);
            }}
            onScroll={(e) => {
              if (isFlagsDragging.current) {
                flagsOffsetRef.current = e.nativeEvent.contentOffset.x;
              }
            }}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => { isFlagsDragging.current = true; }}
            onScrollEndDrag={() => { isFlagsDragging.current = false; }}
            onMomentumScrollEnd={(e) => {
              isFlagsDragging.current = false;
              flagsOffsetRef.current = e.nativeEvent.contentOffset.x;
            }}
          >
            {[...countriesData, ...countriesData, ...countriesData].map((country, idx) => (
              <TouchableOpacity 
                key={idx} 
                onPress={() => setSelectedCountryModal(country)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: COLORS.cardBg, 
                  borderWidth: 1.2, 
                  borderColor: COLORS.border, 
                  borderRadius: 16, 
                  paddingHorizontal: 14, 
                  paddingVertical: 8, 
                  gap: 8,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 }
                }}
              >
                <Text style={{ fontSize: 20 }}>{country.flag}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.text }}>{country.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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

      {/* ── Ride Booking Modal ── */}
      <Modal
        visible={rideModal.visible}
        transparent
        animationType="none"
        onRequestClose={hideRideModal}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={hideRideModal}>
          <Animated.View style={[
            styles.modalContent,
            {
              transform: [{ scale: rideModalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              opacity: rideModalAnim,
            }
          ]}>
            {rideModal.service && (() => {
              const serviceGradient = getGradient(rideModal.service.type);
              return (
                <>
                  <LinearGradient
                    colors={serviceGradient}
                    style={styles.modalIconCircle}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Icon name={rideModal.service.icon} size={40} color="#fff" />
                  </LinearGradient>

                  <Text style={[styles.modalTitle, { marginTop: 10 }]}>
                    <Text style={{ color: '#EF4444' }}>METRO</Text>
                    <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>X</Text>
                    <Text style={{ color: '#EF4444' }}>I</Text>
                    <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>A</Text>
                    <Text style={{ color: COLORS.text }}>{` ${rideModal.service.title}`}</Text>
                  </Text>
                  <Text style={styles.modalTagline}>{rideModal.service.tagline}</Text>

                  <View style={styles.modalDivider} />

                  <Text style={[styles.modalDesc, { marginBottom: 12 }]}>
                    {rideModal.service.desc}
                  </Text>

                  <View style={styles.rideDetailsRow}>
                    <View style={styles.rideDetailCard}>
                      <Icon name="clock-outline" size={20} color={rideModal.service.color} />
                      <Text style={styles.rideDetailVal}>{rideModal.service.eta}</Text>
                      <Text style={styles.rideDetailLabel}>EST. PICKUP</Text>
                    </View>
                    
                    <View style={styles.rideDetailCard}>
                      <Icon name="cash" size={20} color={rideModal.service.color} />
                      <Text style={styles.rideDetailVal}>{rideModal.service.fare}</Text>
                      <Text style={styles.rideDetailLabel}>EST. FARE</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.modalCloseBtn} 
                    onPress={() => {
                      Alert.alert(
                        "Booking Request Sent!",
                        `Your METROXIA ${rideModal.service.title} booking has been successfully initiated. Searching for nearby drivers...`,
                        [{ text: "Okay", onPress: hideRideModal }]
                      );
                    }}
                  >
                    <LinearGradient
                      colors={serviceGradient}
                      style={styles.modalCloseBtnGrad}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.modalCloseBtnText}>
                        {rideModal.service.type === 'airplane' ? 'Book a Flight 🚀' :
                         rideModal.service.type === 'auto' ? 'Book an Auto 🚀' :
                         rideModal.service.type === 'car' ? 'Book a Cab 🚀' :
                         rideModal.service.type === 'bus' ? 'Book a Bus 🚀' :
                         rideModal.service.type === 'boat' ? 'Book a Boat 🚀' :
                         rideModal.service.type === 'tour' ? 'Book a Tour 🚀' : 'Book a Ride 🚀'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.modalSecondaryBtn} onPress={hideRideModal}>
                    <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ── Tourism Menu Modal ── */}
      <Modal
        visible={tourismMenuModal}
        transparent
        animationType="none"
        onRequestClose={hideTourismMenu}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={hideTourismMenu}>
          <Animated.View style={[
            styles.modalContent,
            {
              transform: [{ scale: tourismMenuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              opacity: tourismMenuAnim,
            }
          ]}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.modalIconCircle}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Icon name="earth" size={40} color="#fff" />
            </LinearGradient>
            
            <Text style={[styles.modalTitle, { marginTop: 10 }]}>Tourism Services</Text>
            <Text style={styles.modalTagline}>Select a travel mode to book</Text>
            
            <View style={styles.modalDivider} />
            
            <ScrollView style={{ width: '100%', maxHeight: 350 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12, paddingBottom: 10 }}>
                {tourismOptions.map((opt, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: opt.color + '15', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: opt.color + '33' }}
                    onPress={() => {
                      hideTourismMenu();
                      setTimeout(() => showRideModal(opt), 300);
                    }}
                  >
                    <Icon name={opt.icon} size={28} color={opt.color} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>{opt.title}</Text>
                      <Text style={{ fontSize: 12, color: COLORS.textLight }}>{opt.eta}</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color={opt.color} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.modalSecondaryBtn, { marginTop: 10 }]} onPress={hideTourismMenu}>
              <Text style={styles.modalSecondaryBtnText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ── Country Flag Interaction Modal ── */}
      <Modal
        visible={!!selectedCountryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCountryModal(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedCountryModal(null)}
        >
          <Animated.View style={[
            styles.countryModalContent,
            {
              transform: [{ scale: countryModalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              opacity: countryModalAnim
            }
          ]}>
            {selectedCountryModal && (
              <>
                <View style={styles.countryModalBannerContainer}>
                  <Image 
                    source={{ uri: selectedCountryModal.image }} 
                    style={styles.countryModalBanner} 
                    resizeMode="cover"
                    onLoadEnd={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <ActivityIndicator 
                      size="small" 
                      color="#fff" 
                      style={StyleSheet.absoluteFill} 
                    />
                  )}
                  {/* Banner overlay gradient */}
                  <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Header text OVER the banner */}
                  <View style={styles.countryModalHeaderOverlay}>
                    <Text style={styles.countryModalFlagOverlay}>{selectedCountryModal.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.countryModalTitleOverlay}>{selectedCountryModal.name}</Text>
                      <Text style={styles.countryModalSubOverlay}>{selectedCountryModal.fullName}</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.countryModalCloseIcon} 
                    onPress={() => setSelectedCountryModal(null)}
                  >
                    <Icon name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.countryModalBody}>
                  <Text style={styles.countryModalDesc}>{selectedCountryModal.description}</Text>

                  <View style={styles.countryModalDivider} />

                  {/* Stats details for country */}
                  <View style={styles.countryModalInfoGrid}>
                    <View style={styles.countryModalInfoItem}>
                      <Icon name="city-variant-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.countryModalInfoValue}>{verticalsData.length} Verticals</Text>
                      <Text style={styles.countryModalInfoLabel}>Services</Text>
                    </View>
                    <View style={styles.countryModalInfoItem}>
                      <Icon name="map-marker-radius-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.countryModalInfoValue}>5 Cities</Text>
                      <Text style={styles.countryModalInfoLabel}>Locations</Text>
                    </View>
                    <View style={styles.countryModalInfoItem}>
                      <Icon name="check-circle-outline" size={18} color="#00C9A7" />
                      <Text style={[styles.countryModalInfoValue, { color: '#00C9A7' }]}>Active</Text>
                      <Text style={styles.countryModalInfoLabel}>Status</Text>
                    </View>
                  </View>

                  <View style={styles.countryModalDivider} />

                  <View style={styles.countryModalButtons}>
                    <TouchableOpacity 
                      style={styles.countryBtn} 
                      onPress={() => {
                        const country = selectedCountryModal;
                        setSelectedCountryModal(null);
                        navigation.navigate('CountryEnquiry', { country });
                      }}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, '#1976D2']}
                        style={styles.countryBtnGrad}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      >
                        <Icon name="email-outline" size={16} color="#fff" />
                        <Text style={styles.countryBtnText}>Enquiry Now</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.countryBtn} 
                      onPress={() => {
                        const country = selectedCountryModal;
                        setSelectedCountryModal(null);
                        navigation.navigate('CountryVerticals', { country });
                      }}
                    >
                      <LinearGradient
                        colors={[COLORS.secondary, '#E64A19']}
                        style={styles.countryBtnGrad}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      >
                        <Icon name="web" size={16} color="#fff" />
                        <Text style={styles.countryBtnText}>Website</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
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
  scroll: { paddingTop: 0, paddingBottom: 30 },
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
  sliderContainer: { marginHorizontal: 16, height: 135, marginBottom: 12, overflow: 'hidden', backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 2, borderColor: '#D97706', elevation: 8, shadowColor: '#D97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  slideWrap: { height: 135 },
  slideImage: { width: '100%', height: '100%' },
  slideImageContain: { backgroundColor: '#000' },
  slideOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, justifyContent: 'flex-end', padding: 16 },
  slideTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  slideSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2, fontWeight: '500' },
  exploreBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  exploreBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  pagination: { position: 'absolute', bottom: 12, right: 16, flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 18, backgroundColor: '#00C9A7' },

  verticalSlideContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
  verticalSlideEmoji: { fontSize: 36, marginBottom: 6 },
  verticalSlideName: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  verticalSlideTagline: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center' },
  tapToExplore: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  tapToExploreText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  verticalsScroll: { paddingHorizontal: 18, gap: 10, marginBottom: 18 },
  verticalCard: { width: 130, height: 150, borderRadius: 16, padding: 10, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  verticalCardIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  verticalCardName: { fontSize: 13, fontWeight: '900', color: '#fff', marginTop: 4, textAlign: 'center' },
  verticalCardTag: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.95)', lineHeight: 11, textAlign: 'center', marginTop: 1 },
  verticalBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  verticalBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginHorizontal: 22, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 22 },
  viewAll: { color: '#00C9A7', fontWeight: '700', fontSize: 13 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginBottom: 10 },
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

  // Ride Modal
  rideDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 18 },
  rideDetailCard: { alignItems: 'center', backgroundColor: COLORS.border + '22', borderRadius: 16, padding: 12, flex: 1, marginHorizontal: 5, borderWidth: 1, borderColor: COLORS.border },
  rideDetailVal: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  rideDetailLabel: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },
  modalSecondaryBtn: { width: '100%', alignItems: 'center', marginTop: 12, paddingVertical: 10 },
  modalSecondaryBtnText: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },

  // Country Modal Styles
  countryModalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 28,
    width: '90%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    overflow: 'hidden',
  },
  countryModalBannerContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  countryModalBanner: {
    width: '100%',
    height: '100%',
  },
  countryModalCloseIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  countryModalHeaderOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryModalFlagOverlay: {
    fontSize: 40,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countryModalTitleOverlay: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  countryModalSubOverlay: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  countryModalBody: {
    padding: 20,
  },
  countryModalDesc: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
    textAlign: 'justify',
  },
  countryModalInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  countryModalInfoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  countryModalInfoValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  countryModalInfoLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countryModalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  countryModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
  },
  countryBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  countryBtnGrad: {
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  countryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
