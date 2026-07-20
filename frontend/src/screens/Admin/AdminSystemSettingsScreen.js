import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, ActivityIndicator, Alert, StatusBar, Platform, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import ToastMessage from '../../components/ToastMessage';
import { useTheme } from '../../context/ThemeContext';

export default function AdminSystemSettingsScreen({ navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [settings, setSettings] = useState({ commissionRate: 2, cashbackRate: 5, ticketValidityMins: 20, journeyValidityMins: 90 });
  const [dbStats, setDbStats] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, statsRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/db-stats')
      ]);
      if (settingsRes.data.data) setSettings(settingsRes.data.data);
      setDbStats(statsRes.data.data);
    } catch (err) {
      showToast('Failed to fetch configurations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      navigation.goBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation]);

  const showToast = (message, type) => setToast({ visible: true, message, type });

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      showToast('System settings updated successfully', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to update configurations', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
        {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>System Configurations</Text>
        </View>

        {loading && !dbStats ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#00C9A7" />
          </View>
        ) : (
          <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Database Statistics */}
            <Text style={styles.sectionTitle}>System Database Monitor</Text>
            {dbStats && (
              <View style={styles.statsGrid}>
                {[
                  { label: 'Total Users', count: dbStats.users, icon: 'account-group-outline', color: '#3498DB' },
                  { label: 'Merchants', count: dbStats.merchants, icon: 'storefront-outline', color: '#9B59B6' },
                  { label: 'Active Shops', count: dbStats.shops, icon: 'store-outline', color: '#00C9A7' },
                  { label: 'Stations', count: dbStats.stations, icon: 'train-variant', color: '#F1C40F' },
                  { label: 'QR Tickets', count: dbStats.tickets, icon: 'ticket-outline', color: '#E67E22' },
                  { label: 'Transactions', count: dbStats.transactions, icon: 'swap-horizontal', color: '#1ABC9C' },
                  { label: 'Support Tickets', count: dbStats.complaints, icon: 'help-circle-outline', color: '#E74C3C' },
                  { label: 'Active Banners', count: dbStats.banners, icon: 'image-outline', color: '#34495E' }
                ].map((stat, idx) => (
                  <View key={idx} style={styles.statBox}>
                    <View style={[styles.statIconCircle, { backgroundColor: stat.color + '15' }]}>
                      <MaterialCommunityIcons name={stat.icon} size={22} color={stat.color} />
                    </View>
                    <Text style={styles.statCount}>{stat.count || 0}</Text>
                    <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Platform Settings Form */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Configure Rates & validity</Text>
            <View style={styles.settingsForm}>
              <Text style={styles.inputLabel}>Platform Commission Rate (%)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={settings.commissionRate.toString()}
                  onChangeText={(t) => setSettings({ ...settings, commissionRate: parseFloat(t) || 0 })}
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>

              <Text style={styles.inputLabel}>Passenger Wallet Cashback (%)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={settings.cashbackRate.toString()}
                  onChangeText={(t) => setSettings({ ...settings, cashbackRate: parseFloat(t) || 0 })}
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>

              <Text style={styles.inputLabel}>Unused Ticket Validity (Minutes)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={settings.ticketValidityMins.toString()}
                  onChangeText={(t) => setSettings({ ...settings, ticketValidityMins: parseInt(t) || 0 })}
                />
                <Text style={styles.inputSuffix}>Mins</Text>
              </View>

              <Text style={styles.inputLabel}>Max Single Journey Duration (Minutes)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={settings.journeyValidityMins.toString()}
                  onChangeText={(t) => setSettings({ ...settings, journeyValidityMins: parseInt(t) || 0 })}
                />
                <Text style={styles.inputSuffix}>Mins</Text>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={saving}>
                <LinearGradient colors={['#00C9A7', '#00b894']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Apply Platform Configurations</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textLight, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },

  // Database stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  statBox: { width: '46%', marginHorizontal: '2%', backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  statIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statCount: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 2 },
  statLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },

  // Form settings
  settingsForm: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  inputLabel: { fontSize: 13, color: COLORS.textLight, marginBottom: 8, marginTop: 14, fontWeight: '600' },
  inputWrap: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', paddingHorizontal: 12 },
  textInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.text, fontWeight: '800' },
  inputSuffix: { color: COLORS.textLight, fontWeight: '800', fontSize: 13 },

  saveBtn: { marginTop: 28, borderRadius: 14, overflow: 'hidden' },
  btnGrad: { height: 50, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }
});
