import React from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, SafeAreaView, StatusBar, Platform, Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';

export default function FeederServicesScreen() {
  const navigation = useNavigation();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { t } = useTranslation();

  const services = [
    {
      icon: 'bus',
      iconBg: 'rgba(219,39,119,0.15)',
      iconColor: '#db2777',
      title: t('feeder.services.pmpml.title'),
      description: t('feeder.services.pmpml.desc'),
      buttonLabel: t('feeder.services.pmpml.button'),
      gradient: ['#db2777', '#be185d'],
      playStoreUrl: 'https://play.google.com/store/apps/details?id=in.chartr.pmpml'
    },
    {
      icon: 'bicycle',
      iconBg: 'rgba(34,197,94,0.15)',
      iconColor: '#22c55e',
      title: t('feeder.services.ebike.title'),
      description: t('feeder.services.ebike.desc'),
      buttonLabel: t('feeder.services.ebike.button'),
      gradient: ['#22c55e', '#16a34a'],
      playStoreUrl: 'https://play.google.com/store/apps/details?id=app.yulu.bike'
    },
    {
      icon: 'map-marker',
      iconBg: 'rgba(234,88,12,0.15)',
      iconColor: '#ea580c',
      title: t('feeder.services.cabs.title'),
      description: t('feeder.services.cabs.desc'),
      buttonLabel: t('feeder.services.cabs.button'),
      gradient: ['#ea580c', '#c2410c'],
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ubercab'
    },
    {
      icon: 'car-electric',
      iconBg: 'rgba(59,130,246,0.15)',
      iconColor: '#3b82f6',
      title: t('feeder.services.evauto.title'),
      description: t('feeder.services.evauto.desc'),
      buttonLabel: t('feeder.services.evauto.button'),
      gradient: ['#3b82f6', '#2563eb'],
      playStoreUrl: 'https://play.google.com/store/search?q=Pune+EV+Auto&c=apps'
    },
  ];

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('feeder.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <LinearGradient colors={['rgba(0,201,167,0.15)', 'rgba(0,153,128,0.1)']} style={styles.banner} start={{x:0,y:0}} end={{x:1,y:1}}>
            <View style={styles.bannerIcon}>
              <Icon name="transit-connection-variant" size={40} color="#00C9A7" />
            </View>
            <Text style={styles.bannerTitle}>{t('feeder.bannerTitle')}</Text>
            <Text style={styles.bannerSubtitle}>
              {t('feeder.bannerSubtitle')}
            </Text>
          </LinearGradient>

          <Text style={styles.sectionTitle}>{t('feeder.availableServices')}</Text>

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

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  banner: { borderRadius: 28, padding: 24, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  bannerIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,201,167,0.5)' },
  bannerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 8, letterSpacing: 0.5 },
  bannerSubtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16, letterSpacing: 0.5 },
  
  serviceCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  serviceIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: COLORS.border },
  serviceTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, flex: 1 },
  serviceDesc: { fontSize: 14, color: COLORS.textLight, lineHeight: 22, marginBottom: 20 },
  
  serviceButtonWrap: { borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-start' },
  serviceButtonGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  serviceButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
