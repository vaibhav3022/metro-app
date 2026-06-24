import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, SafeAreaView, Platform, StatusBar
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ALL_STATIONS, METRO_LINES } from '../constants/metroLines';
import { setBookingDetails } from '../redux/slices/ticketSlice';
import { ticketAPI } from '../api/ticketAPI';
import StationPicker from '../components/StationPicker';

export default function RouteSelectionScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { theme: COLORS, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [isReturn, setIsReturn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleCalculateFare = async () => {
    if (!source || !destination) {
      setError(t('route.errorBoth'));
      return;
    }
    if (source === destination) {
      setError(t('route.errorSame'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await ticketAPI.calculateFare(source, destination, passengers, isReturn);
      dispatch(setBookingDetails({
        source, destination, passengers, isReturn,
        distance: data.distance,
        farePerPerson: data.farePerPerson,
        totalAmount: data.totalFare,
        discountApplied: data.discountApplied,
      }));
      navigation.navigate('Fare');
    } catch (err) {
      setError(err.response?.data?.message || t('route.errorCalc'));
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.headerTitle}>{t('route.title')}</Text>
            <View style={{ width: 44 }} />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={20} color="#EF4444" style={{ marginRight: 10 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            {/* Station Pickers */}
            <StationPicker
              label={t('route.fromLabel')}
              value={source}
              onSelect={setSource}
              stations={ALL_STATIONS}
              sections={Object.values(METRO_LINES).map(line => ({ title: line.name, data: line.stations, color: line.color }))}
              placeholder={t('route.selectSource')}
            />

            {/* Swap Button */}
            <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
              <View style={styles.swapIconWrap}>
                <Icon name="swap-vertical" size={24} color="#00C9A7" />
              </View>
            </TouchableOpacity>

            <StationPicker
              label={t('route.toLabel')}
              value={destination}
              onSelect={setDestination}
              stations={ALL_STATIONS.filter(s => s !== source)}
              sections={Object.values(METRO_LINES).map(line => ({ 
                title: line.name, 
                data: line.stations.filter(s => s !== source), 
                color: line.color 
              }))}
              placeholder={t('route.selectDest')}
            />

            <View style={styles.divider} />

            {/* Passengers */}
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.rowLabel}>{t('route.passengers')}</Text>
                <Text style={styles.rowSub}>{t('route.maxPassengers')}</Text>
              </View>
              <View style={styles.counterWrap}>
                <TouchableOpacity
                  style={[styles.counterBtn, passengers === 1 && styles.counterBtnDisabled]}
                  onPress={() => passengers > 1 && setPassengers(passengers - 1)}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{passengers}</Text>
                <TouchableOpacity
                  style={[styles.counterBtn, passengers === 6 && styles.counterBtnDisabled]}
                  onPress={() => passengers < 6 && setPassengers(passengers + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.calcButtonContainer, loading && styles.calcButtonDisabled]}
              onPress={handleCalculateFare}
              disabled={loading}
            >
              <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.calcButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.calcButtonText}>{t('route.proceedFare')}</Text>
                    <Icon name="arrow-right" size={20} color="#fff" style={{ marginLeft: 10 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 16, borderRadius: 16, marginBottom: 16 },
  errorText: { flex: 1, color: '#EF4444', fontSize: 14, fontWeight: '600' },
  
  card: { backgroundColor: COLORS.cardBg, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  
  swapButton: { alignSelf: 'center', marginVertical: -10, zIndex: 10 },
  swapIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,201,167,0.4)' },
  
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.border, marginVertical: 20 },
  
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  rowLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  rowSub: { fontSize: 13, color: COLORS.textLight, marginTop: 4, fontWeight: '500' },
  
  counterWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 6 },
  counterBtn: { width: 44, height: 44, backgroundColor: COLORS.cardBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  counterBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.02)', opacity: 0.5 },
  counterBtnText: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: -2 },
  counterValue: { width: 40, textAlign: 'center', fontSize: 20, fontWeight: '800', color: COLORS.text },
  
  journeyTypeWrap: { flexDirection: 'row', backgroundColor: COLORS.cardBg, padding: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  journeyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  journeyBtnActive: { backgroundColor: 'rgba(0,201,167,0.2)' },
  journeyBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textLight },
  journeyBtnTextActive: { color: '#00C9A7' },
  
  calcButtonContainer: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  calcButton: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  calcButtonDisabled: { opacity: 0.7 },
  calcButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
