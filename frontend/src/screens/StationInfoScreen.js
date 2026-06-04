import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomDropdown from '../components/CustomDropdown';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

const STATIONS = [
  "PCMC", "Sant Tukaram Nagar", "Bhosari (Nashik Phata)", "Kasarwadi",
  "Phugewadi", "Dapodi", "Bopodi", "Khadki", "Range Hills",
  "Shivaji Nagar", "Civil Court", "Budhwar Peth", "Mandai", "Swargate",
  "Vanaz", "Anand Nagar", "Ideal Colony", "Nal Stop",
  "Garware College", "Deccan Gymkhana", "Chhatrapati Sambhaji Udyan",
  "PMC", "Mangalwar Peth", "Pune Railway Station",
  "Ruby Hall Clinic", "Bund Garden", "Yerawada", "Kalyani Nagar", "Ramwadi"
];

// Mock data
const getFacilities = (stationName) => {
  const isInterchange = stationName === "Civil Court";
  const hasParking = stationName === "PCMC" || stationName === "Swargate" || stationName === "Vanaz" || stationName === "Ramwadi";
  return [
    { id: '1', name: 'Parking Available', icon: 'parking', status: hasParking },
    { id: '2', name: 'Elevators / Lifts', icon: 'elevator', status: true },
    { id: '3', name: 'Escalators', icon: 'escalator', status: true },
    { id: '4', name: 'Drinking Water', icon: 'water', status: true },
    { id: '5', name: 'Washrooms', icon: 'toilet', status: true },
    { id: '6', name: 'Interchange', icon: 'transit-connection', status: isInterchange }
  ];
};

export default function StationInfoScreen({ navigation }) {
  const { t } = useTranslation();
  const [station, setStation] = useState(STATIONS[10]);

  const facilities = getFacilities(station);

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('home.stationInfo') || 'Station Info'}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="train" size={24} color="#9B59B6" />
              </View>
              <Text style={styles.label}>Select Station</Text>
            </View>
            <View style={styles.dropdownWrap}>
              <CustomDropdown
                data={STATIONS}
                selectedValue={station}
                onValueChange={(val) => setStation(val)}
                placeholder="Select Station"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Facilities at {station}</Text>
          <View style={styles.facilitiesGrid}>
            {facilities.map((fac) => (
              <View key={fac.id} style={[styles.facCard, { opacity: fac.status ? 1 : 0.6 }]}>
                <View style={[styles.facIconBg, !fac.status && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <MaterialCommunityIcons name={fac.icon} size={32} color={fac.status ? '#00C9A7' : 'rgba(255,255,255,0.4)'} />
                </View>
                <Text style={[styles.facText, !fac.status && { color: 'rgba(255,255,255,0.5)' }]}>{fac.name}</Text>
                {!fac.status && (
                  <View style={styles.notAvailableBadge}>
                    <Text style={styles.notAvailable}>Unavailable</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  content: { padding: 20, paddingBottom: 40 },
  
  card: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 24, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 30 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(155,89,182,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(155,89,182,0.3)' },
  label: { fontSize: 16, fontWeight: '800', color: '#fff' },
  dropdownWrap: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 20, letterSpacing: 0.5 },
  
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  facCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', padding: 20, borderRadius: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  facIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,201,167,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  facText: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 18 },
  
  notAvailableBadge: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  notAvailable: { fontSize: 10, color: '#EF4444', fontWeight: '800', textTransform: 'uppercase' }
});
