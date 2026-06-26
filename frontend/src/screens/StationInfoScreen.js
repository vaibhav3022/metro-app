import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Platform, Modal, Image, Dimensions, Animated, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import StationPicker from '../components/StationPicker';
import { ALL_STATIONS, METRO_LINES } from '../constants/metroLines';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATION_DATA = {
  "PCMC": { line: "Purple Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Pimpri Chinchwad Municipal Corporation, Finolex Chowk", hasParking: true },
  "Sant Tukaram Nagar": { line: "Purple Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "YCM Hospital, DY Patil College", hasParking: true },
  "Nashik Phata": { line: "Purple Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Nashik Phata, Kasarwadi Railway Station", hasParking: false },
  "Kasarwadi": { line: "Purple Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Kasarwadi Railway Station, Vallabh Nagar ST Stand", hasParking: false },
  "Phugewadi": { line: "Purple Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Phugewadi, Dapodi", hasParking: true },
  "Dapodi": { line: "Purple Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "CME, Dapodi Railway Station", hasParking: false },
  "Bopodi": { line: "Purple Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Bopodi, Khadki Railway Station", hasParking: true },
  "Khadki": { line: "Purple Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Khadki Cantonment, Ordnance Factory", hasParking: false },
  "Range Hills": { line: "Purple Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Range Hills Estate", hasParking: false },
  "Shivajinagar": { line: "Purple Line", type: "Underground Station", layout: "Island Platform", landmarks: "Shivajinagar Railway Station, ST Stand, COEP", hasParking: true },
  "District Court": { line: "Interchange (Purple & Aqua)", type: "Underground & Elevated", layout: "Island Platforms", landmarks: "District Court, RTO, Pune PMC", hasParking: true },
  "Kasba Peth": { line: "Purple Line", type: "Underground Station", layout: "Island Platform", landmarks: "Dagdusheth Halwai Temple, Shaniwar Wada, Appa Balwant Chowk", hasParking: false },
  "Mahatma Phule Mandai": { line: "Purple Line", type: "Underground Station", layout: "Island Platform", landmarks: "Mahatma Phule Mandai, Tulshibaug", hasParking: false },
  "Swargate": { line: "Purple Line", type: "Underground Station", layout: "Island Platform", landmarks: "Swargate ST Stand, Nehru Stadium, Saras Baug", hasParking: true },
  
  "Vanaz": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Kothrud Depot, Paud Road", hasParking: false },
  "Anand Nagar": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Kothrud, Ideal Colony", hasParking: false },
  "Paud Phata": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Ideal Colony, MIT College", hasParking: true },
  "SNDT": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "SNDT College, Law College Road, Karve Road", hasParking: false },
  "Garware College": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "MES Garware College, Deccan Gymkhana", hasParking: false },
  "Deccan Gymkhana": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Deccan Gymkhana, Fergusson College Road", hasParking: false },
  "Chhatrapati Sambhaji Udyan": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Sambhaji Park, Balgandharva Rangamandir, JM Road", hasParking: false },
  "Pune Municipal Corporation": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Pune Municipal Corporation, Dengle Bridge", hasParking: false },
  "RTO": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "RTO, Juna Bazar", hasParking: true },
  "Pune Railway Station": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Pune Junction Railway Station, Sassoon Hospital", hasParking: false },
  "Ruby Hall Clinic": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Ruby Hall Clinic, Jehangir Hospital, Wadia College", hasParking: false },
  "Bund Garden": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Bund Garden, Council Hall", hasParking: false },
  "Yerawada": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Yerawada, Deccan College", hasParking: false },
  "Kalyani Nagar": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Kalyani Nagar, Bishop's School", hasParking: false },
  "Ramwadi": { line: "Aqua Line", type: "Elevated Station", layout: "Side Platforms", landmarks: "Ramwadi, Viman Nagar, Phoenix Mall", hasParking: false }
};

// Real Station Details
const getStationDetails = (stationName) => {
  const data = STATION_DATA[stationName];
  if (!data) return { type: "", line: "", lineColor: ['#8B5CF6', '#6D28D9'], layout: "", landmarks: "" };
  
  const isAqua = data.line === "Aqua Line";
  const isInterchange = data.line.includes("Interchange");
  const lineColor = isInterchange ? ['#6F1E51', '#0097e6'] : (isAqua ? ['#00a8ff', '#0097e6'] : ['#8B5CF6', '#6D28D9']);
  
  return {
    type: data.type,
    line: data.line,
    lineColor: lineColor,
    layout: data.layout,
    landmarks: data.landmarks
  };
};

const getPlatformDirections = (stationName) => {
  const data = STATION_DATA[stationName];
  if (!data) return [];
  if (data.line === "Purple Line" || data.line.includes("Purple")) {
    return ["Platform 1: Towards PCMC", "Platform 2: Towards Swargate"];
  } else if (data.line === "Aqua Line") {
    return ["Platform 1: Towards Vanaz", "Platform 2: Towards Ramwadi"];
  }
  return [];
};

const stationImages = [
  require('../../assets/stations/station1.png'),
  require('../../assets/stations/station2.png'),
  require('../../assets/stations/station3.png')
];

const getFacilities = (stationName, t) => {
  const data = STATION_DATA[stationName];
  const isInterchange = stationName === "Civil Court";
  const hasParking = data ? data.hasParking : false;
  
  return [
    { 
      id: '1', name: t('station.parking', 'Parking'), icon: 'parking', status: hasParking,
      desc: 'Spacious and secure parking facility available for 2-wheelers and 4-wheelers. EV charging stations are also available.',
      location: 'Ground Level, Entry Gate A & B',
      timings: '06:00 AM - 10:30 PM',
      images: [
        require('../../assets/facilities/parking.png')
      ]
    },
    { 
      id: '2', name: t('station.elevators', 'Elevators'), icon: 'elevator', status: true,
      desc: 'Modern glass elevators connecting Ground, Concourse, and Platform levels. Priority given to senior citizens and specially-abled passengers.',
      location: 'All Levels',
      timings: '06:00 AM - 10:00 PM',
      images: [
        require('../../assets/facilities/elevator.png')
      ]
    },
    { 
      id: '3', name: t('station.escalators', 'Escalators'), icon: 'escalator', status: true,
      desc: 'High-capacity escalators available for quick transit between Ground, Concourse, and Platforms. Equipped with safety sensors.',
      location: 'Concourse to Platforms',
      timings: '06:00 AM - 10:00 PM',
      images: [
        require('../../assets/facilities/escalator.png')
      ]
    },
    { 
      id: '4', name: t('station.water', 'Drinking Water'), icon: 'water', status: true,
      desc: 'RO purified, chilled drinking water available for free. Touchless sensors and spotless hygiene maintained.',
      location: 'Concourse Level (Near Washrooms)',
      timings: '06:00 AM - 10:00 PM',
      images: [
        require('../../assets/facilities/water.png')
      ]
    },
    { 
      id: '5', name: t('station.washrooms', 'Washrooms'), icon: 'toilet', status: true,
      desc: 'Premium, ultra-clean washrooms for Men, Women, and specially-abled passengers. Maintained hourly for maximum hygiene.',
      location: 'Concourse Level',
      timings: '06:00 AM - 10:00 PM',
      images: [
        require('../../assets/facilities/washroom.png')
      ]
    },
    { 
      id: '6', name: t('station.interchange', 'Interchange'), icon: 'transit-connection', status: isInterchange,
      desc: 'Seamless interchange between Purple Line (PCMC-Swargate) and Aqua Line (Vanaz-Ramwadi). Follow the color-coded signs on the floor.',
      location: 'Interchange Concourse',
      timings: '06:00 AM - 10:00 PM',
      images: [
        require('../../assets/facilities/interchange.png')
      ]
    }
  ];
};

export default function StationInfoScreen({ navigation }) {
  const { t } = useTranslation();
  const [station, setStation] = useState(ALL_STATIONS[9]); // default to Shivajinagar
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFac, setSelectedFac] = useState(null);
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  const facilities = getFacilities(station, t);
  const stationDetails = getStationDetails(station);

  const openFacility = (fac) => {
    if (!fac.status) return;
    setSelectedFac(fac);
    setModalVisible(true);
    Animated.spring(modalScaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }).start();
  };

  const closeModal = () => {
    Animated.timing(modalScaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      setSelectedFac(null);
    });
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('home.stationInfo', 'Station Info')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* STATION IMAGES SLIDER */}
          <View style={styles.sliderContainer}>
            <FlatList
              data={stationImages}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Image source={item} style={styles.sliderImage} resizeMode="cover" />
              )}
            />
          </View>

          {/* STATION SELECTOR */}
          <View style={[styles.card, { padding: 20 }]}>
            <StationPicker
              label={t('station.selectStation', 'Select Station')}
              value={station}
              onSelect={setStation}
              stations={ALL_STATIONS}
              sections={Object.values(METRO_LINES).map(line => ({ title: line.name, data: line.stations, color: line.color }))}
              placeholder={t('station.selectStation', 'Select Station')}
            />
          </View>

          {/* STATION OVERVIEW (NEW) */}
          <Text style={styles.sectionTitle}>Station Overview</Text>
          <View style={styles.overviewCard}>
            <LinearGradient colors={stationDetails.lineColor} style={styles.overviewLineBand} start={{x:0, y:0}} end={{x:1, y:0}}>
              <Text style={styles.overviewLineText}>{stationDetails.line}</Text>
            </LinearGradient>
            
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <View style={styles.overviewIconWrap}><MaterialCommunityIcons name="home-city-outline" size={20} color={COLORS.primary} /></View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.overviewItemLabel}>Type</Text>
                  <Text style={styles.overviewItemValue}>{stationDetails.type}</Text>
                </View>
              </View>
              <View style={styles.overviewItem}>
                <View style={styles.overviewIconWrap}><MaterialCommunityIcons name="train-car" size={20} color={COLORS.primary} /></View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.overviewItemLabel}>Platform</Text>
                  <Text style={styles.overviewItemValue}>{stationDetails.layout}</Text>
                  {getPlatformDirections(station).map((dir, idx) => (
                    <Text key={idx} style={[styles.overviewItemValue, { fontSize: 12, marginTop: 2, color: COLORS.textLight }]}>{dir}</Text>
                  ))}
                </View>
              </View>
              <View style={[styles.overviewItem, { width: '100%', marginTop: 10 }]}>
                <View style={styles.overviewIconWrap}><MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.overviewItemLabel}>Landmarks</Text>
                  <Text style={styles.overviewItemValue}>{stationDetails.landmarks}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* FACILITIES GRID */}
          <Text style={styles.sectionTitle}>{t('station.facilitiesAt', { station: station }) || `Facilities at ${station}`}</Text>
          <View style={styles.facilitiesGrid}>
            {facilities.map((fac) => (
              <TouchableOpacity 
                key={fac.id} 
                style={[styles.facCard, { opacity: fac.status ? 1 : 0.6 }]}
                activeOpacity={fac.status ? 0.8 : 1}
                onPress={() => openFacility(fac)}
              >
                <View style={[styles.facIconBg, !fac.status && { backgroundColor: COLORS.cardBg }]}>
                  <MaterialCommunityIcons name={fac.icon} size={32} color={fac.status ? COLORS.primary : COLORS.border} />
                </View>
                <Text style={[styles.facText, !fac.status && { color: COLORS.textLight }]}>{fac.name}</Text>
                {!fac.status ? (
                  <View style={styles.notAvailableBadge}>
                    <Text style={styles.notAvailable}>{t('station.unavailable', 'Not Available')}</Text>
                  </View>
                ) : (
                  <Text style={styles.facActionText}>View Details &rsaquo;</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* FACILITY DETAILS MODAL */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <Animated.View style={[
            styles.modalContent,
            {
              transform: [{ scale: modalScaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              opacity: modalScaleAnim,
            }
          ]}>
            <TouchableOpacity activeOpacity={1}>
              {selectedFac && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <View style={styles.modalIconWrap}>
                        <MaterialCommunityIcons name={selectedFac.icon} size={24} color={COLORS.primary} />
                      </View>
                      <Text style={styles.modalTitle}>{selectedFac.name}</Text>
                    </View>
                    <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                      <MaterialCommunityIcons name="close" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Image Carousel */}
                  <View style={styles.carouselContainer}>
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carouselScroll}>
                      {selectedFac.images.map((imgSrc, idx) => (
                        <Image 
                          key={idx}
                          source={imgSrc}
                          style={styles.carouselImage}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                    {selectedFac.images.length > 1 && (
                      <View style={styles.paginationDots}>
                        {selectedFac.images.map((_, idx) => (
                          <View key={idx} style={[styles.dot, idx === 0 ? styles.dotActive : null]} />
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Info Section */}
                  <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1, marginTop: 16 }}>
                    <Text style={styles.modalDesc}>{selectedFac.desc}</Text>
                    
                    <View style={styles.modalInfoRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.primary} style={{ marginTop: 2 }} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.modalInfoLabel}>Location</Text>
                        <Text style={styles.modalInfoValue}>{selectedFac.location}</Text>
                      </View>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#F59E0B" style={{ marginTop: 2 }} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.modalInfoLabel}>Operating Hours</Text>
                        <Text style={styles.modalInfoValue}>{selectedFac.timings}</Text>
                      </View>
                    </View>
                  </ScrollView>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  
  content: { paddingBottom: 100 },
  sliderContainer: {
    width: '100%',
    height: 220,
    marginBottom: -15, // to let the station picker card overlap slightly
  },
  sliderImage: {
    width: SCREEN_WIDTH,
    height: 220,
  },
  
  card: { marginHorizontal: 20, backgroundColor: COLORS.cardBg, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(13,71,161,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(13,71,161,0.2)' },
  label: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  dropdownWrap: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16 },
  
  sectionTitle: { marginHorizontal: 20, fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16, letterSpacing: 0.5 },
  
  // Overview Card
  overviewCard: { marginHorizontal: 20, backgroundColor: COLORS.cardBg, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 30, overflow: 'hidden' },
  overviewLineBand: { paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' },
  overviewLineText: { color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, justifyContent: 'space-between' },
  overviewItem: { width: '48%', flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  overviewIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: COLORS.border },
  overviewItemLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  overviewItemValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },

  // Facilities
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginHorizontal: 20 },
  facCard: { width: '48%', backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  facIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(13,71,161,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  facText: { fontSize: 14, fontWeight: '800', color: COLORS.text, textAlign: 'center', lineHeight: 20 },
  facActionText: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginTop: 10 },
  
  notAvailableBadge: { backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  notAvailable: { fontSize: 10, color: '#EF4444', fontWeight: '800', textTransform: 'uppercase' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.cardBg, borderRadius: 28, width: '100%', maxWidth: 400, maxHeight: '85%', overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, elevation: 10, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  modalIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(13,71,161,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  
  // Carousel
  carouselContainer: { width: '100%', height: 200, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
  carouselScroll: { width: '100%', height: '100%' },
  carouselImage: { width: SCREEN_WIDTH - 88, height: 200, backgroundColor: '#333' }, // SCREEN_WIDTH - padding (20*2 outside, 24*2 inside)
  paginationDots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#fff', width: 24 },

  // Info
  modalDesc: { fontSize: 14, color: COLORS.textLight, lineHeight: 22, marginBottom: 20, fontWeight: '500' },
  modalInfoRow: { flexDirection: 'row', backgroundColor: COLORS.background, padding: 14, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  modalInfoLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  modalInfoValue: { fontSize: 14, color: COLORS.text, fontWeight: '800' }
});
