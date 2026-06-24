import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform,
  Animated, Vibration
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function SmartCardScreen() {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Get user details from Redux auth state
  const user = useSelector((state) => state.auth?.user);
  const cardholderName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim().toUpperCase()
    : 'VAIBHAV PATIL';

  const [card, setCard] = useState({
    cardNumber: '8081402198765432',
    balance: 450,
    travelState: 'idle', // 'idle' or 'in_transit'
    entryStation: null
  });

  const [initLoading, setInitLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Animation values
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const laserAnim = useRef(new Animated.Value(0)).current;
  const scanAnimRef = useRef(null);

  useEffect(() => {
    loadCardData();
    return () => {
      if (scanAnimRef.current) {
        scanAnimRef.current.stop();
      }
    };
  }, []);

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

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('smartcard.title')}</Text>
            <View style={{ width: 44 }} />
          </View>

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
                      <View style={styles.cardHeader}>
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

                      <View style={styles.cardFooter}>
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
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  centered: { height: 300, justifyContent: 'center', alignItems: 'center' },
  
  cardContainer: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  cardWrapper: { width: '100%', height: '100%' },
  card: { width: '100%', height: '100%', borderRadius: 22, position: 'absolute', backfaceVisibility: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardFront: { zIndex: 1 },
  cardBack: { zIndex: 0 },
  
  cardGrad: { width: '100%', height: '100%', borderRadius: 22, padding: 20, justifyContent: 'space-between', overflow: 'hidden' },
  cardOverlayPattern: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.03)', opacity: 0.2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
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
  

});
