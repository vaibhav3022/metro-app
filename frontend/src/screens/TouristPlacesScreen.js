import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, Platform, Image, Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const TOURIST_PLACES = [
  {
    name: 'Shaniwar Wada (शनिवार वाडा)',
    station: 'Budhwar Peth / PMC',
    line: 'Purple Line / Aqua Line',
    lineColor: '#6A1B9A',
    distance: '500 meters',
    desc: 'Historic fortification built in 1732. It served as the seat of the Peshwas of the Maratha Empire until 1818.',
    img: require('../assets/images/shaniwar_wada.png'),
    mapsUrl: 'https://maps.google.com/?q=Shaniwar+Wada+Pune'
  },
  {
    name: 'Dagdusheth Ganpati (दगडूशेठ गणपती)',
    station: 'Budhwar Peth',
    line: 'Purple Line',
    lineColor: '#6A1B9A',
    distance: '400 meters',
    desc: 'One of the most famous Ganesh temples in Maharashtra, known for its beautiful deity and grand Ganeshotsav celebrations.',
    img: require('../assets/images/dagdusheth_ganpati.png'),
    mapsUrl: 'https://maps.google.com/?q=Dagdusheth+Halwai+Ganpati+Temple+Pune'
  },
  {
    name: 'Aga Khan Palace (आगाखान पॅलेस)',
    station: 'Kalyani Nagar',
    line: 'Aqua Line',
    lineColor: '#00897B',
    distance: '1.5 km',
    desc: 'Built in 1892, this Italian-style palace has historical significance. Mahatma Gandhi and Kasturba Gandhi were interned here during the Quit India movement.',
    img: require('../assets/images/aga_khan_palace.png'),
    mapsUrl: 'https://maps.google.com/?q=Aga+Khan+Palace+Pune'
  },
  {
    name: 'Sambhaji Park (संभाजी उद्यान)',
    station: 'Chhatrapati Sambhaji Udyan',
    line: 'Aqua Line',
    lineColor: '#00897B',
    distance: '100 meters',
    desc: 'A gorgeous central park on JM Road featuring a small aquarium, children playground, and beautiful flower beds.',
    img: require('../assets/images/metro_station.png'),
    mapsUrl: 'https://maps.google.com/?q=Chhatrapati+Sambhaji+Udyan+Pune'
  },
  {
    name: 'Saras Baug (सारस बाग)',
    station: 'Swargate',
    line: 'Purple Line',
    lineColor: '#6A1B9A',
    distance: '1.2 km',
    desc: 'A scenic park and temple of Talyatla Ganapati (Ganesh on a pond), popular for evening walks and street food stalls.',
    img: require('../assets/images/metro_inside.png'),
    mapsUrl: 'https://maps.google.com/?q=Saras+Baug+Pune'
  },
  {
    name: 'Raja Dinkar Kelkar Museum (राजा केळकर संग्रहालय)',
    station: 'Mandai',
    line: 'Purple Line',
    lineColor: '#6A1B9A',
    distance: '900 meters',
    desc: 'Houses a massive, fascinating collection of Indian arts, crafts, musical instruments, and sculptures accumulated by Dr. Kelkar.',
    img: require('../assets/images/metro_hero.png'),
    mapsUrl: 'https://maps.google.com/?q=Raja+Dinkar+Kelkar+Museum+Pune'
  }
];

export default function TouristPlacesScreen() {
  const navigation = useNavigation();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { t } = useTranslation();

  const localizedTouristPlaces = [
    {
      ...TOURIST_PLACES[0],
      name: t('tourist.places.shaniwar_wada.name'),
      station: t('tourist.places.shaniwar_wada.station'),
      desc: t('tourist.places.shaniwar_wada.desc')
    },
    {
      ...TOURIST_PLACES[1],
      name: t('tourist.places.dagdusheth.name'),
      station: t('tourist.places.dagdusheth.station'),
      desc: t('tourist.places.dagdusheth.desc')
    },
    {
      ...TOURIST_PLACES[2],
      name: t('tourist.places.agakhan.name'),
      station: t('tourist.places.agakhan.station'),
      desc: t('tourist.places.agakhan.desc')
    },
    {
      ...TOURIST_PLACES[3],
      name: t('tourist.places.sambhaji.name'),
      station: t('tourist.places.sambhaji.station'),
      desc: t('tourist.places.sambhaji.desc')
    },
    {
      ...TOURIST_PLACES[4],
      name: t('tourist.places.saras.name'),
      station: t('tourist.places.saras.station'),
      desc: t('tourist.places.saras.desc')
    },
    {
      ...TOURIST_PLACES[5],
      name: t('tourist.places.kelkar.name'),
      station: t('tourist.places.kelkar.station'),
      desc: t('tourist.places.kelkar.desc')
    }
  ];

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('tourist.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Top Banner */}
          <View style={styles.banner}>
            <Icon name="map-legend" size={32} color="#FFFFFF" style={{ marginRight: 10 }} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={styles.bannerTitle}>{t('tourist.bannerTitle')}</Text>
              <Text style={styles.bannerSub}>{t('tourist.bannerSubtitle')}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('tourist.landmarks')}</Text>

          {/* Places Cards */}
          {localizedTouristPlaces.map((place, i) => (
            <View key={i} style={styles.card}>
              <Image source={place.img} style={styles.cardImage} resizeMode="cover" />
              
              <View style={styles.cardBody}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeDesc}>{place.desc}</Text>
                
                {/* Station Info Row */}
                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <View style={styles.badgeRow}>
                      <Icon name="subway" size={16} color={place.lineColor} />
                      <Text style={[styles.badgeText, { color: place.lineColor }]}>{place.line}</Text>
                    </View>
                    <Text style={styles.stationName}>{place.station}</Text>
                  </View>

                  <View style={styles.infoColRight}>
                    <View style={styles.walkBadge}>
                      <Icon name="walk" size={14} color={COLORS.secondary} />
                      <Text style={styles.walkText}>{place.distance}</Text>
                    </View>
                  </View>
                </View>

                {/* Maps Button */}
                <TouchableOpacity 
                  style={styles.mapBtn} 
                  onPress={() => Linking.openURL(place.mapsUrl).catch(() => alert(t('tourist.mapError')))}
                >
                  <Icon name="google-maps" size={18} color="#FFFFFF" />
                  <Text style={styles.mapBtnText}>{t('tourist.getDirections')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 40 : 10, 
    paddingBottom: 16 
  },
  backButton: { 
    width: 44, 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 22, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  banner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary, 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 26, 
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 10, 
    elevation: 6 
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  bannerSub: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4, lineHeight: 18 },
  
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16, letterSpacing: 0.5 },
  
  card: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 24, 
    overflow: 'hidden', 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 20 },
  placeName: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  placeDesc: { fontSize: 13, color: COLORS.textLight, lineHeight: 20, marginBottom: 16 },
  
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border, 
    paddingTop: 14, 
    marginBottom: 16 
  },
  infoCol: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  stationName: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
  
  infoColRight: { alignItems: 'flex-end' },
  walkBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(255,87,34,0.1)', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  walkText: { fontSize: 12, color: COLORS.secondary, fontWeight: '800' },
  
  mapBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: COLORS.secondary, 
    paddingVertical: 12, 
    borderRadius: 12, 
    gap: 8 
  },
  mapBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 }
});
