import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function CountryVerticalsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme: COLORS } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  // Selected country details passed from route params
  const { country } = route.params || {};
  const countryName = country?.name || 'Unknown Country';
  const countryCode = country?.code || 'IN';

  // Core verticals list mapping the homepage data
  const verticalsData = [
    {
      id: 'energia',
      name: 'Energeia',
      tagline: 'EV Car & Auto Charging Network',
      icon: 'lightning-bolt',
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
      gradient: ['#D4A574', '#8B5E3C'],
      bgColor: '#ECFCCB',
      color: '#8B5E3C',
      emoji: '☕',
      url: 'https://cybeorch.com/oasisone/index.html'
    },
    {
      id: 'eva',
      name: 'Eva Salon',
      tagline: 'Premium Beauty Salon & Cosmetics',
      icon: 'spa',
      gradient: ['#FCA5A5', '#E11D48'],
      bgColor: '#FEE2E2',
      color: '#E11D48',
      emoji: '✨',
      url: 'https://cybeorch.com/evaone'
    },
    {
      id: 'llbeauty',
      name: 'L.L. Beauty',
      tagline: 'Quick Grooming & Beauty Bar',
      icon: 'face-woman-shimmer',
      gradient: ['#F472B6', '#BE185D'],
      bgColor: '#FCE7F3',
      color: '#BE185D',
      emoji: '💄',
      url: 'https://cybeorch.com/lalyoraone/'
    },
    {
      id: 'coworking',
      name: 'Maytriya CoWork',
      tagline: 'Smart Work Pods & Meeting Rooms',
      icon: 'laptop',
      gradient: ['#34D399', '#355249'],
      bgColor: '#DCFCE7',
      color: '#059669',
      emoji: '🏢',
      url: 'https://cybeorch.com/coworking/index.html'
    },
    {
      id: 'events',
      name: 'Events',
      tagline: 'Explore exciting community events',
      icon: 'calendar-star',
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
      gradient: ['#DFBA73', '#9F7435'],
      bgColor: '#FDFBF7',
      color: '#9F7435',
      emoji: '🤝',
      url: 'https://cybeorch.com/nexusone'
    },
    {
      id: 'cybeorch',
      name: 'Cybeorch Labs',
      tagline: 'Software Solutions, Skills & Startups',
      icon: 'shield-check',
      gradient: ['#0EA5E9', '#2563EB'],
      bgColor: '#DBEAFE',
      color: '#2563EB',
      emoji: '🛡️',
      url: 'https://cybeorch.com/'
    }
  ];

  // Specific city mappings for each country where the verticals operate
  const getOperatingCities = (code) => {
    switch (code) {
      case 'IN':
        return ['Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Chennai'];
      case 'HK':
        return ['Kowloon', 'Central', 'Sha Tin', 'Tsim Sha Tsui', 'Wan Chai'];
      case 'SG':
        return ['Downtown Core', 'Jurong East', 'Tampines', 'Woodlands', 'Orchard'];
      case 'TH':
        return ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi'];
      case 'VN':
        return ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Nha Trang', 'Hue'];
      default:
        return ['Local Metro Station Hubs'];
    }
  };

  const cities = getOperatingCities(countryCode);

  const handleOpenLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open website link.'));
    } else {
      Alert.alert('Coming Soon', 'This website is currently under development.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, '#1976D2']}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Verticals</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Intro Section */}
        <View style={styles.introSection}>
          <Text style={styles.flagText}>{country?.flag}</Text>
          <Text style={styles.introTitle}>Operating in {countryName}</Text>
          <Text style={styles.introSub}>
            Discover our high-scale business verticals and active city services across {countryName}.
          </Text>
        </View>

        {/* Large Vertical Cards Stacked (Eka khali ek) */}
        {verticalsData.map((vertical) => (
          <View key={vertical.id} style={styles.card}>
            
            {/* Top row with vertical info */}
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={vertical.gradient}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Icon name={vertical.icon} size={28} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={styles.verticalTitleRow}>
                  <Text style={styles.verticalName}>{vertical.name}</Text>
                  <Text style={styles.verticalEmoji}>{vertical.emoji}</Text>
                </View>
                <Text style={styles.verticalTagline}>{vertical.tagline}</Text>
              </View>
            </View>

            {/* Operating Cities Segment */}
            <View style={styles.citiesSection}>
              <View style={styles.citiesLabelRow}>
                <Icon name="map-marker-multiple-outline" size={14} color={COLORS.primary} />
                <Text style={styles.citiesLabel}>Operating Cities:</Text>
              </View>
              <View style={styles.citiesTagContainer}>
                {cities.map((city, idx) => (
                  <View key={idx} style={styles.cityTag}>
                    <Text style={styles.cityTagText}>{city}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons inside Card */}
            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.cardLinkBtn}
                onPress={() => handleOpenLink(vertical.url)}
              >
                <Text style={[styles.cardLinkBtnText, { color: vertical.color }]}>
                  Visit Website
                </Text>
                <Icon name="open-in-new" size={14} color={vertical.color} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardEnquiryBtn}
                onPress={() => navigation.navigate('CountryEnquiry', { country, initialVertical: vertical.name })}
              >
                <Text style={styles.cardEnquiryBtnText}>Enquiry Now</Text>
                <Icon name="chevron-right" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  flagText: {
    fontSize: 48,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  introSub: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verticalName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  verticalEmoji: {
    fontSize: 16,
  },
  verticalTagline: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  citiesSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
    marginBottom: 14,
  },
  citiesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  citiesLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  citiesTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityTag: {
    backgroundColor: COLORS.border + '22',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cityTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  cardLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  cardLinkBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardEnquiryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  cardEnquiryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
