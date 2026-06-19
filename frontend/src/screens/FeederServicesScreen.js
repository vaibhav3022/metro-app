import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, SafeAreaView, StatusBar, Platform, Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

export default function FeederServicesScreen() {
  const navigation = useNavigation();

  const services = [
    {
      icon: 'bus',
      iconBg: 'rgba(219,39,119,0.15)',
      iconColor: '#db2777',
      title: 'PMPML Metro Shuttle',
      description: 'Frequent bus services available from major metro stations including Civil Court, Shivaji Nagar, and Swargate. Connect directly to IT parks and hubs.',
      buttonLabel: 'View Bus Routes',
      gradient: ['#db2777', '#be185d'],
      playStoreUrl: 'https://play.google.com/store/apps/details?id=in.chartr.pmpml'
    },
    {
      icon: 'bicycle',
      iconBg: 'rgba(34,197,94,0.15)',
      iconColor: '#22c55e',
      title: 'E-Bike Rentals',
      description: 'Rent an E-bike from outside any metro station. Scan and unlock using partner apps to easily reach home or office.',
      buttonLabel: 'Find E-Bikes',
      gradient: ['#22c55e', '#16a34a'],
      playStoreUrl: 'https://play.google.com/store/apps/details?id=app.yulu.bike'
    },
    {
      icon: 'map-marker',
      iconBg: 'rgba(234,88,12,0.15)',
      iconColor: '#ea580c',
      title: 'Partner Cabs/Autos',
      description: 'Prepaid and app-based autos and cabs are stationed directly at designated pick-up zones outside busy stations.',
      buttonLabel: 'Book a Ride',
      gradient: ['#ea580c', '#c2410c'],
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ubercab'
    },
  ];

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feeder Services</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <LinearGradient colors={['rgba(0,201,167,0.15)', 'rgba(0,153,128,0.1)']} style={styles.banner} start={{x:0,y:0}} end={{x:1,y:1}}>
            <View style={styles.bannerIcon}>
              <Icon name="transit-connection-variant" size={40} color="#00C9A7" />
            </View>
            <Text style={styles.bannerTitle}>Last Mile Connectivity</Text>
            <Text style={styles.bannerSubtitle}>
              Pune Metro provides seamless feeder services to help you reach your final destination easily.
            </Text>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Available Services</Text>

          {services.map((s, i) => (
            <View key={i} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={[styles.serviceIcon, { backgroundColor: s.iconBg }]}>
                  <Icon name={s.icon} size={28} color={s.iconColor} />
                </View>
                <Text style={styles.serviceTitle}>{s.title}</Text>
              </View>
              <Text style={styles.serviceDesc}>{s.description}</Text>
              <TouchableOpacity
                style={styles.serviceButtonWrap}
                onPress={() => Linking.openURL(s.playStoreUrl).catch(err => console.error("Couldn't open URL", err))}
              >
                <LinearGradient colors={s.gradient} style={styles.serviceButtonGrad} start={{x:0, y:0}} end={{x:1, y:0}}>
                  <Text style={styles.serviceButtonText}>{s.buttonLabel}</Text>
                  <Icon name="arrow-right" size={16} color="#fff" style={{marginLeft: 6}} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  banner: { borderRadius: 28, padding: 24, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  bannerIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,201,167,0.5)' },
  bannerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 8, letterSpacing: 0.5 },
  bannerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 16, letterSpacing: 0.5 },
  
  serviceCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  serviceIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  serviceTitle: { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1 },
  serviceDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 20 },
  
  serviceButtonWrap: { borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-start' },
  serviceButtonGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  serviceButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
