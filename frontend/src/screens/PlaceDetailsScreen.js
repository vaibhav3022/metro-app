import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Linking,
  SafeAreaView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function PlaceDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS, isDark), [COLORS, isDark]);

  const place = route.params?.place;

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Place details not found.</Text>
      </SafeAreaView>
    );
  }

  const handleOpenMaps = () => {
    Linking.openURL(place.mapsUrl).catch(err => console.error('Error opening maps:', err));
  };

  const handleBookTicket = () => {
    // Navigate to Route Selection and prefill the destination station
    navigation.navigate('RouteSelection', {
      toStation: place.station.split(' / ')[0] // Pick the first station if multiple
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header Action Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Image Carousel */}
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.carouselContainer}
        >
          {place.images && place.images.map((imgSrc, index) => (
            <Image 
              key={index}
              source={imgSrc} 
              style={styles.carouselImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <View style={styles.contentContainer}>
          {/* Title & Station Info */}
          <Text style={styles.title}>{place.name}</Text>
          <Text style={styles.shortDesc}>{place.shortDesc}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <Icon name="subway-variant" size={18} color={place.lineColor} />
              <Text style={styles.infoPillText}>{place.station}</Text>
            </View>
            <View style={styles.infoPill}>
              <Icon name="walk" size={18} color={COLORS.primary} />
              <Text style={styles.infoPillText}>{place.distance}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <Icon name="clock-outline" size={18} color="#f59e0b" />
              <Text style={styles.infoPillText}>{place.timings}</Text>
            </View>
            <View style={styles.infoPill}>
              <Icon name="ticket-percent" size={18} color="#10b981" />
              <Text style={styles.infoPillText}>{place.entryFee}</Text>
            </View>
          </View>

          {/* History Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>History & Details</Text>
            <Text style={styles.historyText}>{place.history}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#4285F4' }]} 
              onPress={handleOpenMaps}
            >
              <Icon name="google-maps" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Get Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: COLORS.primary }]} 
              onPress={handleBookTicket}
            >
              <Icon name="ticket-confirmation" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Book Metro Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 8,
  },
  carouselContainer: {
    height: 300,
  },
  carouselImage: {
    width: width,
    height: 300,
  },
  contentContainer: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.background,
    marginTop: -25, // overlap the image slightly
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  shortDesc: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: COLORS.textLight,
    marginBottom: 20,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    flexWrap: 'wrap',
    gap: 10,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  infoPillText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    marginLeft: 6,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  historyText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: COLORS.text,
    lineHeight: 24,
    textAlign: 'justify',
  },
  actionButtonsContainer: {
    marginTop: 30,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  }
});
