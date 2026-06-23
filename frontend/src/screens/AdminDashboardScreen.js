import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, Image, SafeAreaView, RefreshControl, StatusBar
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { logout } from '../redux/slices/authSlice';
import api from '../api/axiosConfig';
import { storage } from '../utils/storage';

const StatCard = ({ title, value, iconName, iconColor, bgColor, onPress, styles }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress}>
    <View style={[styles.statIconWrap, { backgroundColor: bgColor }]}>
      <Icon name={iconName} size={28} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

export default function AdminDashboardScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setDashboardData(res.data.stats);
      setRecentBookings(res.data.recentBookings || []);
      setRecentTransactions(res.data.recentTransactions || []);
    } catch (err) {
      setDashboardData({
        totalRevenue: 245000,
        activeUsers: 1250,
        totalMerchants: 45,
        pendingMerchantRequests: 3
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of the admin panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout', style: 'destructive', onPress: async () => {
            await storage.clearAll();
            dispatch(logout());
          }
        }
      ]
    );
  };

  const NavCard = ({ title, iconName, iconColor, screen }) => (
    <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate(screen)}>
      <View style={[styles.navIconWrap, { backgroundColor: iconColor + '20' }]}>
        <Icon name={iconName} size={26} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.navCardTitle}>{title}</Text>
        <Text style={styles.navCardSubtitle}>Manage & view details</Text>
      </View>
      <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSubtitle}>Pune Metro Control Center</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={onRefresh}>
              <Icon name="refresh" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('AdminNotifications')}>
              <Icon name="bell-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: 'rgba(239,68,68,0.2)' }]} onPress={handleLogout}>
              <Icon name="logout" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#00C9A7" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C9A7" colors={['#00C9A7']} />}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats */}
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard styles={styles} title="Total Revenue" value={`₹${dashboardData?.totalRevenue?.toLocaleString() || 0}`} iconName="currency-inr" iconColor="#00C9A7" bgColor="rgba(0,201,167,0.15)" onPress={() => navigation.navigate('RevenueAnalytics')} />
              <StatCard styles={styles} title="Active Users" value={dashboardData?.activeUsers?.toLocaleString() || 0} iconName="account-group-outline" iconColor="#9B59B6" bgColor="rgba(155,89,182,0.15)" onPress={() => navigation.navigate('UserManagement')} />
            </View>
            <View style={styles.statsGrid}>
              <StatCard styles={styles} title="Merchants" value={dashboardData?.totalMerchants || 0} iconName="storefront-outline" iconColor="#3498DB" bgColor="rgba(52,152,219,0.15)" onPress={() => navigation.navigate('MerchantManagement')} />
              <StatCard styles={styles} title="Pending Shops" value={dashboardData?.pendingMerchantRequests || 0} iconName="clock-outline" iconColor="#F39C12" bgColor="rgba(243,156,18,0.15)" onPress={() => navigation.navigate('MerchantManagement')} />
            </View>

            {/* Management Modules */}
            <Text style={styles.sectionTitle}>Management Modules</Text>
            <NavCard title="Revenue Analytics" iconName="chart-line" iconColor="#00C9A7" screen="RevenueAnalytics" />
            <NavCard title="Merchant Management" iconName="storefront-outline" iconColor="#9B59B6" screen="MerchantManagement" />
            <NavCard title="User Management" iconName="account-group-outline" iconColor="#3498DB" screen="UserManagement" />
            <NavCard title="Station Management" iconName="train-variant" iconColor="#F39C12" screen="StationManagement" />

            {/* Recent Bookings */}
            <Text style={styles.sectionTitle}>Recent Ticket Bookings</Text>
            {recentBookings.length === 0 ? (
              <View style={styles.emptyBox}><Text style={styles.emptyBoxText}>No recent bookings found.</Text></View>
            ) : recentBookings.map((bk, i) => (
              <TouchableOpacity key={bk._id || i} style={styles.listItem} onPress={() => setSelectedItem({ type: 'booking', data: bk })}>
                <View style={styles.listItemIcon}>
                  <Icon name="ticket-confirmation-outline" size={24} color="#00C9A7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{bk.userId?.name || 'Unknown User'}</Text>
                  <Text style={styles.listItemSub}>{(bk.source || bk.sourceStation)} → {(bk.destination || bk.destinationStation)}</Text>
                </View>
                <Text style={styles.listItemAmount}>₹{bk.fare}</Text>
              </TouchableOpacity>
            ))}

            {/* Recent Transactions */}
            <Text style={styles.sectionTitle}>Recent Shop Payments</Text>
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyBox}><Text style={styles.emptyBoxText}>No recent transactions found.</Text></View>
            ) : recentTransactions.map((tx, i) => (
              <TouchableOpacity key={tx._id || i} style={styles.listItem} onPress={() => setSelectedItem({ type: 'transaction', data: tx })}>
                <View style={[styles.listItemIcon, { backgroundColor: 'rgba(155,89,182,0.15)' }]}>
                  <Icon name="swap-horizontal" size={24} color="#9B59B6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{tx.userId?.name || 'User'} at {tx.merchantId?.businessName || 'Shop'}</Text>
                  <Text style={styles.listItemSub}>{new Date(tx.createdAt).toLocaleDateString()} • {tx.paymentMethod}</Text>
                </View>
                <Text style={[styles.listItemAmount, { color: '#00C9A7' }]}>
                  +{tx.paymentMethod === 'Token' ? `Rs. ${tx.amount}` : `₹${tx.amount}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Detail Modal */}
        <Modal visible={!!selectedItem} transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedItem(null)}>
            <View style={styles.modalCard}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedItem(null)}>
                <Icon name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>

              {selectedItem?.type === 'booking' && (
                <>
                  <View style={styles.modalIconWrap}>
                    <Icon name="train-variant" size={40} color="#00C9A7" />
                  </View>
                  <Text style={styles.modalTitle}>Ticket Booking Details</Text>
                  <View style={styles.modalBody}>
                    {[
                      ['User', selectedItem.data.userId?.name || 'Unknown'],
                      ['Email', selectedItem.data.userId?.email || 'N/A'],
                      ['Route', `${selectedItem.data.source || selectedItem.data.sourceStation} → ${selectedItem.data.destination || selectedItem.data.destinationStation}`],
                      ['Fare', `₹${selectedItem.data.fare}`],
                      ['Status', selectedItem.data.status?.toUpperCase()],
                      ['Date', new Date(selectedItem.data.createdAt).toLocaleString()],
                    ].map(([label, val]) => (
                      <View key={label} style={styles.modalRow}>
                        <Text style={styles.modalLabel}>{label}:</Text>
                        <Text style={styles.modalValue}>{val}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {selectedItem?.type === 'transaction' && (
                <>
                  <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(155,89,182,0.15)' }]}>
                    <Icon name="swap-horizontal" size={40} color="#9B59B6" />
                  </View>
                  <Text style={styles.modalTitle}>Order Payment Details</Text>
                  <View style={styles.modalBody}>
                    {[
                      ['User', selectedItem.data.userId?.name || 'Unknown'],
                      ['Merchant', selectedItem.data.merchantId?.businessName || 'N/A'],
                      ['Method', selectedItem.data.paymentMethod],
                      ['Amount', selectedItem.data.paymentMethod === 'Token' ? `${selectedItem.data.amount} Tokens` : `₹${selectedItem.data.amount}`],
                      ['Date', new Date(selectedItem.data.createdAt).toLocaleString()],
                    ].map(([label, val]) => (
                      <View key={label} style={styles.modalRow}>
                        <Text style={styles.modalLabel}>{label}:</Text>
                        <Text style={styles.modalValue}>{val}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 14, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerBtn: { backgroundColor: COLORS.cardBg, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textLight, marginTop: 20, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', marginHorizontal: -6, marginBottom: 12 },
  statCard: { flex: 1, marginHorizontal: 6, backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, alignItems: 'flex-start' },
  statIconWrap: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statValue: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  statTitle: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  navCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  navIconWrap: { width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  navCardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  navCardSubtitle: { fontSize: 13, color: COLORS.textLight },
  emptyBox: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  emptyBoxText: { color: COLORS.textLight, fontWeight: '600', fontSize: 14 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  listItemIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  listItemTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  listItemSub: { fontSize: 13, color: COLORS.textLight },
  listItemAmount: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: COLORS.cardBg, borderRadius: 32, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: COLORS.border },
  modalClose: { position: 'absolute', top: 20, right: 20, zIndex: 1, padding: 8, backgroundColor: COLORS.cardBg, borderRadius: 16 },
  modalIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 20 },
  modalBody: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalLabel: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  modalValue: { fontSize: 14, fontWeight: '800', color: COLORS.text, maxWidth: '60%', textAlign: 'right' },
});
