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
import { TOURIST_PLACES } from '../data/touristPlacesData';

export default function TouristPlacesScreen() {
  const navigation = useNavigation();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { t } = useTranslation();

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
          {TOURIST_PLACES.map((place, i) => (
            <TouchableOpacity 
              key={place.id} 
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PlaceDetails', { place })}
            >
              <Image source={place.images[0]} style={styles.cardImage} resizeMode="cover" />
              
              <View style={styles.cardBody}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeDesc} numberOfLines={2}>{place.shortDesc}</Text>
                
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

              </View>
            </TouchableOpacity>
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
