import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform,
  Animated, Vibration, Modal, Share, Dimensions, FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Gift card gradient themes
const GIFT_THEMES = [
  { id: 'sunset', colors: ['#FF6B6B', '#EE5A24'], icon: 'gift-outline', emoji: '🎁' },
  { id: 'ocean', colors: ['#0652DD', '#1289A7'], icon: 'gift-outline', emoji: '🌊' },
  { id: 'forest', colors: ['#009432', '#A3CB38'], icon: 'leaf', emoji: '🌿' },
  { id: 'royal', colors: ['#6F1E51', '#B33771'], icon: 'crown', emoji: '👑' },
  { id: 'gold', colors: ['#F79F1F', '#EE5A24'], icon: 'star-four-points', emoji: '⭐' },
  { id: 'metro', colors: ['#1A2A6C', '#275E9B'], icon: 'train', emoji: '🚇' },
];

export default function SmartCardScreen() {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Get user details from Redux auth state
  const user = useSelector((state) => state.auth?.user);
  const { balance: walletBalance } = useSelector((state) => state.wallet);
  const cardholderName = user?.name
    ? user.name.toUpperCase()
    : 'VAIBHAV PATIL';

  // --- Tab State ---
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'gift'

  // --- Smart Card State ---
  const [card, setCard] = useState({
    cardNumber: '8081402198765432',
    balance: 450,
    travelState: 'idle',
    entryStation: null
  });
  const [initLoading, setInitLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // --- Gift Card State ---
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [giftAmount, setGiftAmount] = useState('');
  const [giftEmail, setGiftEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(GIFT_THEMES[0]);
  const [redeemCode, setRedeemCode] = useState('');
  const [sentGifts, setSentGifts] = useState([]);
  const [receivedGifts, setReceivedGifts] = useState([]);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftSubTab, setGiftSubTab] = useState('send'); // 'send' | 'sent' | 'received'

  // Animation values
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const laserAnim = useRef(new Animated.Value(0)).current;
  const scanAnimRef = useRef(null);
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const giftCardPulse = useRef(new Animated.Value(1)).current;

  // Gift card pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(giftCardPulse, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
        Animated.timing(giftCardPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    loadCardData();
    return () => {
      if (scanAnimRef.current) {
        scanAnimRef.current.stop();
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'gift') {
        fetchGiftCards();
      }
    }, [activeTab])
  );

  // --- Smart Card Functions ---
  const loadCardData = async () => {
    setInitLoading(true);
    try {
      const savedCard = await AsyncStorage.getItem('@pune_metro_smartcard');
      if (savedCard) {
        setCard(JSON.parse(savedCard));
      } else {
        const defaultCard = {
          cardNumber: '8081402198765432',
          balance: 450,
          travelState: 'idle',
          entryStation: null
        };
        await AsyncStorage.setItem('@pune_metro_smartcard', JSON.stringify(defaultCard));
        setCard(defaultCard);
      }
    } catch (e) {
      console.error('Error loading smart card details', e);
    } finally {
      setInitLoading(false);
    }
  };

  const saveCardData = async (updatedCard) => {
    try {
      setCard(updatedCard);
      await AsyncStorage.setItem('@pune_metro_smartcard', JSON.stringify(updatedCard));
    } catch (e) {
      console.error('Error saving smart card details', e);
    }
  };

  // 3D Card Flip logic
  const toggleFlip = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const rotateFront = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const rotateBack = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const opacityFront = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const opacityBack = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Laser scanner animation
  const startLaserScan = () => {
    laserAnim.setValue(0);
    scanAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    );
    scanAnimRef.current.start();
  };

  // Simulated entry/exit gate scan
  const handleGateScan = () => {
    if (card.balance < 20 && card.travelState === 'idle') {
      Vibration.vibrate(400);
      Alert.alert(
        t('smartcard.alert.insufficientTitle'),
        t('smartcard.alert.insufficientDesc')
      );
      return;
    }

    setIsScanning(true);
    
    // Auto flip to back to show barcode if it's on front
    if (!isFlipped) {
      toggleFlip();
    }

    startLaserScan();

    setTimeout(() => {
      setIsScanning(false);
      if (scanAnimRef.current) {
        scanAnimRef.current.stop();
      }
      Vibration.vibrate([100, 80, 100]); // double haptic feedback for scan success

      if (card.travelState === 'idle') {
        const updatedCard = {
          ...card,
          travelState: 'in_transit',
          entryStation: 'PMC'
        };
        saveCardData(updatedCard);
        Alert.alert(
          t('smartcard.alert.entrySuccessTitle'),
          t('smartcard.alert.entrySuccessDesc')
        );
      } else {
        const fare = 20;
        const newBalance = card.balance - fare;
        const updatedCard = {
          ...card,
          balance: newBalance,
          travelState: 'idle',
          entryStation: null
        };
        saveCardData(updatedCard);
        Alert.alert(
          t('smartcard.alert.exitSuccessTitle'),
          t('smartcard.alert.exitSuccessDesc', { fare: fare, newBalance: newBalance })
        );
      }
    }, 2500);
  };

  const formatCardNumber = (num) => {
    return num.replace(/(\d{4})/g, '$1 ').trim();
  };

  const renderBarcode = () => {
    const pattern = [
      2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 2, 1, 4, 1, 2, 1
    ];
    return (
      <View style={styles.barcodeLines}>
        {pattern.map((width, idx) => (
          <View
            key={idx}
            style={{
              width: width,
              height: 55,
              backgroundColor: '#000000',
              marginRight: idx % 3 === 0 ? 2 : 1,
            }}
          />
        ))}
      </View>
    );
  };

  const translateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 55],
  });

  // --- Gift Card Functions ---
  const fetchGiftCards = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        api.get('/giftcard/sent'),
        api.get('/giftcard/received'),
      ]);
      setSentGifts(sentRes.data?.giftCards || []);
      setReceivedGifts(receivedRes.data?.giftCards || []);
    } catch (err) {
      console.log('Failed to fetch gift cards:', err.message);
    }
  };

  const openSendModal = () => {
    setGiftAmount('');
    setGiftEmail('');
    setGiftMessage('');
    setSelectedTheme(GIFT_THEMES[0]);
    setSendModalVisible(true);
    Animated.spring(modalScaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }).start();
  };

  const closeSendModal = () => {
    Animated.timing(modalScaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSendModalVisible(false);
    });
  };

  const openRedeemModal = () => {
    setRedeemCode('');
    setRedeemModalVisible(true);
    Animated.spring(modalScaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }).start();
  };

  const closeRedeemModal = () => {
    Animated.timing(modalScaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setRedeemModalVisible(false);
    });
  };

  const handleSendGiftCard = async () => {
    const amount = parseInt(giftAmount);
    if (!amount || amount < 50) {
      Alert.alert('Invalid Amount', 'Minimum gift amount is ₹50');
      return;
    }
    if (amount > 5000) {
      Alert.alert('Limit Exceeded', 'Maximum gift amount is ₹5,000');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!giftEmail || !emailRegex.test(giftEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setGiftLoading(true);
    try {
      const res = await api.post('/giftcard/create', {
        amount,
        receiverEmail: giftEmail,
        message: giftMessage || `🎁 Here's a gift from ${user?.name || 'your friend'}!`,
      });

      Vibration.vibrate([100, 100, 200]);
      const giftCode = res.data?.giftCard?.code || 'XXXX-XXXX-XXXX';

      closeSendModal();

      setTimeout(() => {
        Alert.alert(
          '🎉 Gift Card Sent!',
          `Your gift card of ₹${amount} has been created!\n\nCode: ${giftCode}\n\nShare this code with your friend.`,
          [
            { text: 'Share Code', onPress: () => shareGiftCode(giftCode, amount) },
            { text: 'OK', style: 'cancel' }
          ]
        );
        fetchGiftCards();
      }, 300);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create gift card';
      Alert.alert('Error', msg);
    } finally {
      setGiftLoading(false);
    }
  };

  const shareGiftCode = async (code, amount) => {
    try {
      await Share.share({
        message: `🎁 तुम्हाला Pune Metro Gift Card मिळाले आहे!\n\n💰 Amount: ₹${amount}\n🔑 Code: ${code}\n\nPune Metro App मध्ये हा code redeem करा! 🚇`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const handleRedeemGiftCard = async () => {
    const cleanCode = redeemCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 10) {
      Alert.alert('Invalid Code', 'Please enter a valid gift card code');
      return;
    }

    setGiftLoading(true);
    try {
      const res = await api.post('/giftcard/redeem', { code: cleanCode });
      Vibration.vibrate([100, 100, 200, 200, 300]);
      closeRedeemModal();

      const redeemedAmount = res.data?.giftCard?.amount || 0;
      setTimeout(() => {
        Alert.alert(
          '🎊 Gift Card Redeemed!',
          `₹${redeemedAmount} has been added to your wallet!\n\nYou can use it for metro tickets or at station shops.`
        );
        fetchGiftCards();
      }, 300);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to redeem gift card';
      Alert.alert('Error', msg);
    } finally {
      setGiftLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#00C9A7';
      case 'redeemed': return '#8B5CF6';
      case 'expired': return '#EF4444';
      default: return '#888';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Quick amount buttons
  const quickAmounts = [100, 200, 500, 1000, 2000];

  // --- RENDER ---
  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('smartcard.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'card' && styles.tabBtnActive]}
            onPress={() => setActiveTab('card')}
          >
            <Icon name="credit-card-outline" size={18} color={activeTab === 'card' ? '#fff' : COLORS.textLight} />
            <Text style={[styles.tabText, activeTab === 'card' && styles.tabTextActive]}>My Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'gift' && styles.tabBtnActive]}
            onPress={() => { setActiveTab('gift'); fetchGiftCards(); }}
          >
            <Icon name="gift-outline" size={18} color={activeTab === 'gift' ? '#fff' : COLORS.textLight} />
            <Text style={[styles.tabText, activeTab === 'gift' && styles.tabTextActive]}>Gift Cards</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'card' ? (
            // =================== MY CARD TAB ===================
            <>
              {initLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color="#00C9A7" />
                </View>
              ) : (
                <>
                  {/* 3D Flip Card Container */}
                  <View style={styles.cardContainer}>
                    <TouchableOpacity activeOpacity={0.95} onPress={toggleFlip} style={styles.cardWrapper}>
                      
                      {/* CARD FRONT */}
                      <Animated.View style={[
                        styles.card, 
                        styles.cardFront, 
                        { transform: [{ rotateY: rotateFront }], opacity: opacityFront }
                      ]}>
                        <LinearGradient colors={['#1A2A6C', '#275E9B', '#4C1B6E']} style={styles.cardGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                          <View style={styles.cardOverlayPattern} />
                          <View style={styles.cardHeader2}>
                            <View>
                              <Text style={styles.cardBrandText}>{t('smartcard.onePune')}</Text>
                              <Text style={styles.cardSubText}>{t('smartcard.subtitle')}</Text>
                            </View>
                            <View style={styles.ncmcLogoWrap}>
                              <Icon name="contactless-payment" size={26} color="rgba(255,255,255,0.9)" />
                              <View style={styles.ncmcBadge}>
                                <Text style={styles.ncmcText}>{t('smartcard.ncmc')}</Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.cardChipRow}>
                            <View style={styles.cardChip}>
                              <View style={styles.chipInner} />
                            </View>
                            {card.travelState === 'in_transit' && (
                              <View style={styles.inTransitBadge}>
                                <Icon name="train" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                <Text style={styles.inTransitText}>{t('smartcard.inTransit')}</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.cardNumber}>{formatCardNumber(card.cardNumber)}</Text>

                          <View style={styles.cardFooter2}>
                            <View>
                              <Text style={styles.labelMuted}>{t('smartcard.cardholder')}</Text>
                              <Text style={styles.cardHolderName}>{cardholderName}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.labelMuted}>{t('smartcard.balance')}</Text>
                              <Text style={styles.cardBalance}>₹{card.balance.toFixed(2)}</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </Animated.View>

                      {/* CARD BACK */}
                      <Animated.View style={[
                        styles.card, 
                        styles.cardBack, 
                        { transform: [{ rotateY: rotateBack }], opacity: opacityBack }
                      ]}>
                        <View style={styles.cardBackContainer}>
                          <View style={styles.magStripe} />
                          
                          <View style={styles.signatureRow}>
                            <View style={styles.signaturePanel}>
                              <Text style={styles.signatureText}>{cardholderName}</Text>
                            </View>
                            <View style={styles.cvvBox}>
                              <Text style={styles.cvvLabel}>{t('smartcard.cvv')}</Text>
                              <Text style={styles.cvvText}>081</Text>
                            </View>
                          </View>

                          {/* Barcode representation */}
                          <View style={styles.barcodeSection}>
                            <View style={styles.barcodeContainer}>
                              {renderBarcode()}
                              {isScanning && (
                                <Animated.View style={[styles.laserLine, { transform: [{ translateY: translateY }] }]} />
                              )}
                            </View>
                            <Text style={styles.barcodeId}>* NCMC{card.cardNumber} *</Text>
                          </View>

                          <View style={styles.backFooter}>
                            <Text style={styles.backInstructions}>
                              {t('smartcard.instructions')}
                            </Text>
                            <Text style={styles.backHelpline}>{t('smartcard.helpline')}</Text>
                          </View>
                        </View>
                      </Animated.View>

                    </TouchableOpacity>
                  </View>

                  <Text style={styles.hintText}>
                    <Icon name="rotate-3d-variant" size={16} /> {t('smartcard.hintText')}
                  </Text>

                  {/* Gate Simulator Action */}
                  <View style={styles.actionCard}>
                    <Text style={styles.actionTitle}>{t('smartcard.simulatorTitle')}</Text>
                    <Text style={styles.actionDesc}>
                      {t('smartcard.simulatorDesc')}
                    </Text>
                    
                    <TouchableOpacity
                      style={[styles.scanBtn, isScanning && styles.scanBtnDisabled]}
                      onPress={handleGateScan}
                      disabled={isScanning}
                    >
                      <LinearGradient colors={['#FF5722', '#E64A19']} style={styles.scanBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        {isScanning ? (
                          <>
                            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.scanBtnText}>{t('smartcard.scanning')}</Text>
                          </>
                        ) : (
                          <>
                            <Icon name="cellphone-nfc" size={22} color="#fff" />
                            <Text style={styles.scanBtnText}>
                              {card.travelState === 'idle' ? t('smartcard.tapToEnter') : t('smartcard.tapToExit')}
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.infoBox}>
                      <Icon name="information-outline" size={16} color={COLORS.textLight} />
                      <Text style={styles.infoBoxText}>
                        {card.travelState === 'idle' 
                          ? t('smartcard.statusIdle')
                          : t('smartcard.statusInTransit', { station: card.entryStation || 'PMC' })}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </>
          ) : (
            // =================== GIFT CARDS TAB ===================
            <>
              {/* Hero Gift Card Preview */}
              <Animated.View style={{ transform: [{ scale: giftCardPulse }] }}>
                <LinearGradient
                  colors={['#FF6B6B', '#EE5A24']}
                  style={styles.giftHeroCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.giftHeroPattern}>
                    {[...Array(6)].map((_, i) => (
                      <View
                        key={i}
                        style={[styles.giftCircleDecor, {
                          top: (i % 3) * 60 - 20,
                          right: (i % 2) * 80 - 30,
                          width: 60 + (i * 10),
                          height: 60 + (i * 10),
                          borderRadius: 30 + (i * 5),
                        }]}
                      />
                    ))}
                  </View>
                  <View style={styles.giftHeroTop}>
                    <View>
                      <Text style={styles.giftHeroTitle}>🎁 Gift Card</Text>
                      <Text style={styles.giftHeroSub}>Pune Metro Digital Gift</Text>
                    </View>
                    <View style={styles.giftHeroIconWrap}>
                      <Icon name="gift" size={36} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.giftHeroBottom}>
                    <Text style={styles.giftHeroDesc}>
                      तुमच्या मित्रांना Gift Card पाठवा!{'\n'}Tickets, Shops आणि बरंच काही...
                    </Text>
                    <View style={styles.giftHeroBadge}>
                      <Text style={styles.giftHeroBadgeText}>₹50 – ₹5,000</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Action Buttons */}
              <View style={styles.giftActionsRow}>
                <TouchableOpacity style={styles.giftActionBtn} onPress={openSendModal}>
                  <LinearGradient colors={['#FF6B6B', '#EE5A24']} style={styles.giftActionIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Icon name="send" size={24} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.giftActionText}>Send Gift</Text>
                  <Text style={styles.giftActionSub}>मित्राला पाठवा</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.giftActionBtn} onPress={openRedeemModal}>
                  <LinearGradient colors={['#00C9A7', '#00B894']} style={styles.giftActionIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Icon name="qrcode-scan" size={24} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.giftActionText}>Redeem</Text>
                  <Text style={styles.giftActionSub}>Code वापरा</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.giftActionBtn} onPress={() => {
                  shareGiftCode('XXXX-XXXX-XXXX', 0);
                }}>
                  <LinearGradient colors={['#6F1E51', '#B33771']} style={styles.giftActionIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Icon name="share-variant" size={24} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.giftActionText}>Share</Text>
                  <Text style={styles.giftActionSub}>Share करा</Text>
                </TouchableOpacity>
              </View>

              {/* How It Works */}
              <View style={styles.howItWorksCard}>
                <Text style={styles.howItWorksTitle}>How It Works</Text>
                <View style={styles.howItWorksStep}>
                  <View style={[styles.stepNumber, { backgroundColor: '#FF6B6B22' }]}>
                    <Text style={[styles.stepNumberText, { color: '#FF6B6B' }]}>1</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Gift Card तयार करा</Text>
                    <Text style={styles.stepDesc}>Amount निवडा, मित्राचा email टाका</Text>
                  </View>
                </View>
                <View style={styles.howItWorksStep}>
                  <View style={[styles.stepNumber, { backgroundColor: '#00C9A722' }]}>
                    <Text style={[styles.stepNumberText, { color: '#00C9A7' }]}>2</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Code शेअर करा</Text>
                    <Text style={styles.stepDesc}>WhatsApp, SMS किंवा कोणत्याही app ने पाठवा</Text>
                  </View>
                </View>
                <View style={styles.howItWorksStep}>
                  <View style={[styles.stepNumber, { backgroundColor: '#6F1E5122' }]}>
                    <Text style={[styles.stepNumberText, { color: '#6F1E51' }]}>3</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>Redeem करा</Text>
                    <Text style={styles.stepDesc}>Code टाकून पैसे Wallet मध्ये add करा</Text>
                  </View>
                </View>
              </View>

              {/* Sent & Received Sub-tabs */}
              <View style={styles.giftSubTabRow}>
                <TouchableOpacity
                  style={[styles.giftSubTabBtn, giftSubTab === 'sent' && styles.giftSubTabActive]}
                  onPress={() => setGiftSubTab('sent')}
                >
                  <Icon name="arrow-up-bold" size={16} color={giftSubTab === 'sent' ? '#FF6B6B' : COLORS.textLight} />
                  <Text style={[styles.giftSubTabText, giftSubTab === 'sent' && { color: '#FF6B6B' }]}>
                    Sent ({sentGifts.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.giftSubTabBtn, giftSubTab === 'received' && styles.giftSubTabActive]}
                  onPress={() => setGiftSubTab('received')}
                >
                  <Icon name="arrow-down-bold" size={16} color={giftSubTab === 'received' ? '#00C9A7' : COLORS.textLight} />
                  <Text style={[styles.giftSubTabText, giftSubTab === 'received' && { color: '#00C9A7' }]}>
                    Received ({receivedGifts.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Gift Card List */}
              {(giftSubTab === 'sent' ? sentGifts : receivedGifts).length === 0 ? (
                <View style={styles.emptyGiftCard}>
                  <Icon name={giftSubTab === 'sent' ? 'gift-open-outline' : 'inbox-arrow-down-outline'} size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyGiftText}>
                    {giftSubTab === 'sent' ? 'No gift cards sent yet' : 'No gift cards received yet'}
                  </Text>
                  <Text style={styles.emptyGiftSub}>
                    {giftSubTab === 'sent' ? 'मित्रांना gift card पाठवा! 🎁' : 'कोणी gift card पाठवेल तेव्हा दिसेल! ✨'}
                  </Text>
                </View>
              ) : (
                (giftSubTab === 'sent' ? sentGifts : receivedGifts).map((gift, index) => (
                  <TouchableOpacity
                    key={gift._id || index}
                    style={styles.giftListItem}
                    onPress={() => {
                      if (gift.code && gift.status === 'active' && giftSubTab === 'sent') {
                        Alert.alert(
                          '🎁 Gift Card Code',
                          `Code: ${gift.code}\nAmount: ₹${gift.amount}\nTo: ${gift.receiverEmail || 'N/A'}`,
                          [
                            { text: 'Share', onPress: () => shareGiftCode(gift.code, gift.amount) },
                            { text: 'OK' }
                          ]
                        );
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={gift.status === 'redeemed' ? ['#8B5CF6', '#6D28D9'] : gift.status === 'expired' ? ['#6B7280', '#4B5563'] : ['#FF6B6B', '#EE5A24']}
                      style={styles.giftListIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Icon
                        name={gift.status === 'redeemed' ? 'check-circle' : gift.status === 'expired' ? 'clock-alert' : 'gift'}
                        size={20}
                        color="#fff"
                      />
                    </LinearGradient>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.giftListAmount}>₹{gift.amount}</Text>
                        <View style={[styles.giftStatusBadge, { backgroundColor: getStatusColor(gift.status) + '22' }]}>
                          <Text style={[styles.giftStatusText, { color: getStatusColor(gift.status) }]}>
                            {gift.status?.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.giftListPhone}>
                        {giftSubTab === 'sent' ? `To: ${gift.receiverEmail || '—'}` : `From: ${gift.senderName || '—'}`}
                      </Text>
                      {gift.message && <Text style={styles.giftListMsg} numberOfLines={1}>💬 {gift.message}</Text>}
                      <Text style={styles.giftListDate}>{formatDate(gift.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ============ SEND GIFT MODAL ============ */}
      <Modal visible={sendModalVisible} transparent animationType="none" onRequestClose={closeSendModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeSendModal}>
          <Animated.View style={[
            styles.giftModalContent,
            {
              transform: [{ scale: modalScaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              opacity: modalScaleAnim,
            }
          ]}>
            <TouchableOpacity activeOpacity={1}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
                <View style={styles.giftModalHeader}>
                  <Text style={styles.giftModalTitle}>🎁 Send Gift Card</Text>
                  <TouchableOpacity onPress={closeSendModal}>
                    <Icon name="close-circle" size={28} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>

                {/* Theme Selection */}
                <Text style={styles.giftModalLabel}>Choose Theme</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {GIFT_THEMES.map(theme => (
                    <TouchableOpacity
                      key={theme.id}
                      onPress={() => setSelectedTheme(theme)}
                      style={[styles.themeCircle, selectedTheme.id === theme.id && styles.themeCircleSelected]}
                    >
                      <LinearGradient colors={theme.colors} style={styles.themeCircleInner}>
                        <Text style={{ fontSize: 18 }}>{theme.emoji}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Amount */}
                <Text style={styles.giftModalLabel}>Amount (₹)</Text>
                <View style={styles.quickAmountsRow}>
                  {quickAmounts.map(amt => (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.quickAmountBtn, giftAmount === String(amt) && styles.quickAmountBtnActive]}
                      onPress={() => setGiftAmount(String(amt))}
                    >
                      <Text style={[styles.quickAmountText, giftAmount === String(amt) && styles.quickAmountTextActive]}>
                        ₹{amt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.giftInput}
                  placeholder="Enter custom amount"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                  value={giftAmount}
                  onChangeText={setGiftAmount}
                  maxLength={5}
                />

                {/* Email Address */}
                <Text style={styles.giftModalLabel}>Friend's Email Address</Text>
                <TextInput
                  style={styles.giftInput}
                  placeholder="friend@email.com"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={giftEmail}
                  onChangeText={setGiftEmail}
                />

                {/* Message */}
                <Text style={styles.giftModalLabel}>Personal Message (Optional)</Text>
                <TextInput
                  style={[styles.giftInput, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Write a personal message..."
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  value={giftMessage}
                  onChangeText={setGiftMessage}
                  maxLength={200}
                />

                {/* Wallet Balance Info */}
                <View style={styles.walletInfoRow}>
                  <Icon name="wallet" size={18} color="#00C9A7" />
                  <Text style={styles.walletInfoText}>Wallet Balance: ₹{walletBalance || 0}</Text>
                </View>

                {/* Send Button */}
                <TouchableOpacity
                  onPress={handleSendGiftCard}
                  disabled={giftLoading}
                  style={{ borderRadius: 16, overflow: 'hidden', marginTop: 10 }}
                >
                  <LinearGradient colors={selectedTheme.colors} style={styles.giftSendBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {giftLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Icon name="gift-outline" size={22} color="#fff" />
                        <Text style={styles.giftSendBtnText}>Send Gift Card 🎁</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ============ REDEEM MODAL ============ */}
      <Modal visible={redeemModalVisible} transparent animationType="none" onRequestClose={closeRedeemModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeRedeemModal}>
          <Animated.View style={[
            styles.giftModalContent,
            {
              transform: [{ scale: modalScaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              opacity: modalScaleAnim,
            }
          ]}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.giftModalHeader}>
                <Text style={styles.giftModalTitle}>🎊 Redeem Gift Card</Text>
                <TouchableOpacity onPress={closeRedeemModal}>
                  <Icon name="close-circle" size={28} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.redeemIllustration}>
                <LinearGradient colors={['#00C9A7', '#00B894']} style={styles.redeemIconBig}>
                  <Icon name="gift-open" size={48} color="#fff" />
                </LinearGradient>
                <Text style={styles.redeemHeroText}>Gift Card Code टाका</Text>
                <Text style={styles.redeemSubText}>
                  तुम्हाला मिळालेला 12-digit code खाली enter करा
                </Text>
              </View>

              <TextInput
                style={[styles.giftInput, styles.redeemInput]}
                placeholder="XXXX-XXXX-XXXX"
                placeholderTextColor={COLORS.textLight}
                value={redeemCode}
                onChangeText={(text) => {
                  // Auto-format with dashes
                  const clean = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                  const formatted = clean.match(/.{1,4}/g)?.join('-') || clean;
                  setRedeemCode(formatted);
                }}
                maxLength={14}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                onPress={handleRedeemGiftCard}
                disabled={giftLoading}
                style={{ borderRadius: 16, overflow: 'hidden', marginTop: 16 }}
              >
                <LinearGradient colors={['#00C9A7', '#00B894']} style={styles.giftSendBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {giftLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="check-decagram" size={22} color="#fff" />
                      <Text style={styles.giftSendBtnText}>Redeem Now 🎊</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, marginBottom: 10 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  // Tab Switcher
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, gap: 6 },
  tabBtnActive: { backgroundColor: '#00C9A7' },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.textLight },
  tabTextActive: { color: '#fff' },

  centered: { height: 300, justifyContent: 'center', alignItems: 'center' },
  
  cardContainer: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  cardWrapper: { width: '100%', height: '100%' },
  card: { width: '100%', height: '100%', borderRadius: 22, position: 'absolute', backfaceVisibility: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardFront: { zIndex: 1 },
  cardBack: { zIndex: 0 },
  
  cardGrad: { width: '100%', height: '100%', borderRadius: 22, padding: 20, justifyContent: 'space-between', overflow: 'hidden' },
  cardOverlayPattern: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.03)', opacity: 0.2 },
  cardHeader2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrandText: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  cardSubText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.5 },
  ncmcLogoWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ncmcBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ncmcText: { fontSize: 9, fontWeight: '900', color: '#000' },
  
  cardChipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardChip: { width: 44, height: 32, borderRadius: 6, backgroundColor: '#E5C158', padding: 4, justifyContent: 'center' },
  chipInner: { flex: 1, borderWidth: 1, borderColor: '#A27B13', borderRadius: 4, opacity: 0.5 },
  inTransitBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00C9A7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  inTransitText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },

  cardNumber: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginVertical: 10 },
  
  cardFooter2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  labelMuted: { fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  cardHolderName: { fontSize: 13, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  cardBalance: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  
  // Card Back Layout
  cardBackContainer: { width: '100%', height: '100%', borderRadius: 22, backgroundColor: '#E0E0E0', paddingVertical: 14, justifyContent: 'space-between' },
  magStripe: { width: '100%', height: 35, backgroundColor: '#1A1A1A', marginTop: 4 },
  signatureRow: { flexDirection: 'row', paddingHorizontal: 20, alignItems: 'center', gap: 10 },
  signaturePanel: { flex: 1, height: 32, backgroundColor: '#FFF', justifyContent: 'center', paddingHorizontal: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#BBB' },
  signatureText: { fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif', fontStyle: 'italic', fontSize: 13, color: '#333', fontWeight: '600' },
  cvvBox: { width: 50, height: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderStyle: 'solid', borderWidth: 1, borderColor: '#BBB' },
  cvvLabel: { fontSize: 7, color: '#666', fontWeight: '700' },
  cvvText: { fontSize: 12, color: '#1A1A1A', fontWeight: '800' },
  
  barcodeSection: { alignItems: 'center', paddingHorizontal: 20 },
  barcodeContainer: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, width: '100%', alignItems: 'center', height: 68, justifyContent: 'center', overflow: 'hidden' },
  barcodeLines: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  barcodeId: { fontSize: 9, color: '#444', letterSpacing: 1, marginTop: 4, fontWeight: '700' },
  laserLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: 'red', shadowColor: 'red', shadowOpacity: 0.8, shadowRadius: 3, elevation: 5 },
  
  backFooter: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backInstructions: { fontSize: 7, color: '#555', fontWeight: '600', flex: 0.7 },
  backHelpline: { fontSize: 7, color: '#333', fontWeight: '700' },
  
  hintText: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginTop: 12, marginBottom: 20, fontWeight: '600' },
  
  actionCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  actionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionDesc: { fontSize: 13, color: COLORS.textLight, marginBottom: 16, lineHeight: 18 },
  
  scanBtn: { borderRadius: 16, overflow: 'hidden', elevation: 3 },
  scanBtnGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  scanBtnDisabled: { opacity: 0.7 },
  scanBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: 12, borderRadius: 12, marginTop: 12, gap: 8 },
  infoBoxText: { fontSize: 12, color: COLORS.textLight, flex: 1, fontWeight: '500', lineHeight: 16 },

  // ============ GIFT CARD STYLES ============
  giftHeroCard: {
    borderRadius: 24, padding: 24, marginBottom: 20, overflow: 'hidden',
    elevation: 8, shadowColor: '#FF6B6B', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  giftHeroPattern: { ...StyleSheet.absoluteFillObject },
  giftCircleDecor: {
    position: 'absolute', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  giftHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  giftHeroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  giftHeroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  giftHeroIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  giftHeroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  giftHeroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20, flex: 1, fontWeight: '500' },
  giftHeroBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, marginLeft: 12 },
  giftHeroBadgeText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  // Gift Action Buttons
  giftActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  giftActionBtn: {
    flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,
  },
  giftActionIconWrap: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  giftActionText: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  giftActionSub: { fontSize: 10, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },

  // How It Works
  howItWorksCard: { backgroundColor: COLORS.cardBg, borderRadius: 22, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  howItWorksTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 16, letterSpacing: 0.5 },
  howItWorksStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 14 },
  stepNumber: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { fontSize: 16, fontWeight: '900' },
  stepTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  stepDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  // Gift Sub-tabs
  giftSubTabRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  giftSubTabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 14, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
  },
  giftSubTabActive: { borderColor: '#00C9A7', backgroundColor: COLORS.cardBg },
  giftSubTabText: { fontSize: 13, fontWeight: '700', color: COLORS.textLight },

  // Empty Gift State
  emptyGiftCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  emptyGiftText: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 14 },
  emptyGiftSub: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },

  // Gift List Items
  giftListItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  giftListIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  giftListAmount: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  giftStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  giftStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  giftListPhone: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '600' },
  giftListMsg: { fontSize: 11, color: COLORS.textLight, marginTop: 2, fontStyle: 'italic' },
  giftListDate: { fontSize: 10, color: COLORS.textLight, marginTop: 4 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  giftModalContent: {
    backgroundColor: COLORS.cardBg, borderRadius: 28, padding: 24, width: '100%', maxWidth: 380,
    borderWidth: 1, borderColor: COLORS.border, elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
  },
  giftModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  giftModalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  giftModalLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 },

  // Theme Selection
  themeCircle: { marginRight: 10, borderRadius: 24, padding: 3, borderWidth: 2, borderColor: 'transparent' },
  themeCircleSelected: { borderColor: '#00C9A7' },
  themeCircleInner: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },

  // Quick Amount Buttons
  quickAmountsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  quickAmountBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  quickAmountBtnActive: { backgroundColor: '#00C9A7', borderColor: '#00C9A7' },
  quickAmountText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  quickAmountTextActive: { color: '#fff' },

  // Gift Input
  giftInput: {
    backgroundColor: COLORS.background, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14, fontWeight: '600',
  },

  // Wallet Info
  walletInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: COLORS.background, borderRadius: 12 },
  walletInfoText: { fontSize: 13, color: '#00C9A7', fontWeight: '700' },

  // Send Button
  giftSendBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 10, borderRadius: 16 },
  giftSendBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  // Redeem Styles
  redeemIllustration: { alignItems: 'center', marginBottom: 20 },
  redeemIconBig: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  redeemHeroText: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  redeemSubText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center' },
  redeemInput: { textAlign: 'center', fontSize: 22, fontWeight: '900', letterSpacing: 4, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
});
