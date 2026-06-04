import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { ALL_STATIONS } from '../constants/metroLines';
import StationPicker from '../components/StationPicker';

export default function FareCalculatorScreen() {
  const navigation = useNavigation();
  const [source, setSource] = useState(ALL_STATIONS[0]);
  const [destination, setDestination] = useState(ALL_STATIONS[10]);
  const [fareInfo, setFareInfo] = useState(null);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
    setFareInfo(null);
  };

  const calculateFare = () => {
    if (source === destination) {
      Alert.alert('Error', 'Source and destination cannot be the same.');
      return;
    }
    const idx1 = ALL_STATIONS.indexOf(source);
    const idx2 = ALL_STATIONS.indexOf(destination);
    const distance = Math.abs(idx1 - idx2);

    let baseFare = 10;
    if (distance > 5) baseFare = 20;
    if (distance > 10) baseFare = 30;
    if (distance > 15) baseFare = 35;

    const time = distance * 3 + 2;
    setFareInfo({ fare: baseFare, time, distance });
  };

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.gradient}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fare Calculator</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          <StationPicker
            label="From Station"
            value={source}
            onSelect={(val) => { setSource(val); setFareInfo(null); }}
            stations={ALL_STATIONS}
            placeholder="Select Source Station"
          />

          <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
            <View style={styles.swapIconWrap}>
              <Icon name="swap-vertical" size={24} color="#00C9A7" />
            </View>
          </TouchableOpacity>

          <StationPicker
            label="To Station"
            value={destination}
            onSelect={(val) => { setDestination(val); setFareInfo(null); }}
            stations={ALL_STATIONS}
            placeholder="Select Destination Station"
          />

          <TouchableOpacity onPress={calculateFare} style={styles.calcBtnContainer}>
            <LinearGradient colors={['#00C9A7', '#009980']} style={styles.calcButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.calcButtonText}>Calculate Fare</Text>
              <Icon name="calculator-variant-outline" size={20} color="#fff" style={{ marginLeft: 10 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {fareInfo && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Estimated Journey Details</Text>
            <View style={styles.resultGrid}>
              <View style={styles.resultItem}>
                <View style={[styles.resultIconWrap, { backgroundColor: 'rgba(0,201,167,0.15)' }]}>
                  <Icon name="currency-inr" size={32} color="#00C9A7" />
                </View>
                <Text style={styles.resultValue}>₹{fareInfo.fare}</Text>
                <Text style={styles.resultLabel}>Ticket Fare</Text>
              </View>

              <View style={[styles.resultItem, styles.resultItemBorder]}>
                <View style={[styles.resultIconWrap, { backgroundColor: 'rgba(155,89,182,0.15)' }]}>
                  <Icon name="clock-outline" size={32} color="#9B59B6" />
                </View>
                <Text style={styles.resultValue}>{fareInfo.time}</Text>
                <Text style={styles.resultLabel}>Mins Est.</Text>
              </View>

              <View style={styles.resultItem}>
                <View style={[styles.resultIconWrap, { backgroundColor: 'rgba(52,152,219,0.15)' }]}>
                  <Icon name="map-marker-distance" size={32} color="#3498DB" />
                </View>
                <Text style={styles.resultValue}>{fareInfo.distance}</Text>
                <Text style={styles.resultLabel}>Stops</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, paddingBottom: 50, paddingTop: Platform.OS === 'android' ? 50 : 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 28, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  swapButton: { alignSelf: 'center', marginVertical: -10, zIndex: 10 },
  swapIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#141432', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,201,167,0.4)' },
  
  calcBtnContainer: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  calcButton: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  calcButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  
  resultCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resultTitle: { fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
  resultGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  resultItem: { flex: 1, alignItems: 'center' },
  resultItemBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  resultIconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  resultValue: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
  resultLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
});
