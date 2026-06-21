import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, Dimensions, StatusBar, TouchableOpacity, Modal, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useDispatch } from 'react-redux';
import COLORS from '../../constants/colors';
import api from '../../api/axiosConfig';
import { logout } from '../../redux/slices/authSlice';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const EmptyState = ({ icon, title, message }) => (
  <View style={styles.emptyBox}>
    <MaterialCommunityIcons name={icon} size={48} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
    <Text style={styles.emptyBoxTitle}>{title}</Text>
    <Text style={styles.emptyBoxText}>{message}</Text>
  </View>
);

export default function MerchantDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [txModalVisible, setTxModalVisible] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statusRes = await api.get('/merchant/status');
      const merchantStatus = statusRes.data.status;
      setStatus(merchantStatus);
      if (statusRes.data.rejectionReason) setRejectionReason(statusRes.data.rejectionReason);

      if (merchantStatus === 'approved') {
        const [dashRes, txRes, notifRes] = await Promise.all([
          api.get('/merchant/dashboard'),
          api.get('/merchant/transactions?limit=50'),
          api.get('/merchant/notifications')
        ]);
        setDashboardData(dashRes.data);
        setTransactions(txRes.data.data || []);
        setUnreadCount(notifRes.data.data?.filter(n => !n.isRead).length || 0);
      }
    } catch (err) {
      console.log('Error fetching merchant data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => { await require('../../utils/storage').storage.clearAll(); dispatch(logout()); };

  const renderStatusScreen = (icon, title, message, color) => (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Merchant Portal</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.statusContainer}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: color + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <MaterialCommunityIcons name={icon} size={60} color={color} />
          </View>
          <Text style={[styles.statusTitle, { color }]}>{title}</Text>
          <Text style={styles.statusMessage}>{message}</Text>
          <TouchableOpacity onPress={fetchData}>
            <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.refreshBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.refreshBtnText}>Refresh Status</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.background]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color="#00C9A7" />
      </LinearGradient>
    );
  }

  if (status === 'pending') {
    return renderStatusScreen('clock-outline', 'Pending Approval', 'Your application is under review. You will be notified once approved.', '#F39C12');
  } else if (status === 'suspended') {
    return renderStatusScreen('cancel', 'Account Suspended', rejectionReason || 'Your merchant account has been suspended by the admin.', '#EF4444');
  } else if (status === 'rejected') {
    return renderStatusScreen('close-circle-outline', 'Application Rejected', rejectionReason || 'Your merchant application was rejected.', 'rgba(255,255,255,0.7)');
  }

  // Approved Dashboard
  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Merchant Portal</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MerchantNotification')}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }]}>
              <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#00C9A7" colors={['#00C9A7']} />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.statsRow}>
            <StatCard title="Total Sales" value={`₹${dashboardData?.stats?.totalSales || 0}`} icon="currency-inr" color="#00C9A7" onPress={() => setTxModalVisible(true)} />
            <StatCard title="Total Orders" value={dashboardData?.stats?.totalOrders || 0} icon="shopping-outline" color="#3498DB" onPress={() => setTxModalVisible(true)} />
          </View>
          <View style={styles.statsRow}>
            <StatCard title="Customers" value={dashboardData?.stats?.totalCustomers || 0} icon="account-group-outline" color="#9B59B6" onPress={() => setTxModalVisible(true)} />
            <StatCard title="Tokens Accepted" value={dashboardData?.stats?.tokensAccepted || 0} icon="ticket-percent-outline" color="#F39C12" onPress={() => setTxModalVisible(true)} />
          </View>

          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Official Merchant QR</Text>
            <Text style={styles.qrSubtitle}>Customers can scan this to pay you directly</Text>
            <View style={styles.qrWrapper}>
              {dashboardData?.shopId ? (
                <QRCode
                  value={JSON.stringify({ type: 'merchant', shopId: dashboardData.shopId, merchantId: dashboardData.merchantId, businessName: dashboardData.businessName })}
                  size={180}
                  color="#141432"
                  backgroundColor="#fff"
                />
              ) : (
                <View style={{ width: 180, height: 180, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#00C9A7" />
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7-Day Sales Growth</Text>
            <View style={styles.chartWrapper}>
              <LineChart
                data={{
                  labels: dashboardData?.chartData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [{ data: dashboardData?.chartData?.data || [0, 0, 0, 0, 0, 0, 0] }]
                }}
                width={width - 80} height={200}
                chartConfig={{
                  backgroundColor: 'transparent', backgroundGradientFrom: 'rgba(255,255,255,0)', backgroundGradientTo: 'rgba(255,255,255,0)',
                  decimalPlaces: 0, color: (o = 1) => `rgba(0, 201, 167, ${o})`, labelColor: () => 'rgba(255,255,255,0.6)',
                  style: { borderRadius: 16 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#00C9A7", fill: "#141432" },
                  propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.05)', strokeDasharray: "" }
                }}
                bezier style={{ borderRadius: 16 }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length === 0 ? (
              <EmptyState icon="history" title="No Transactions" message="You haven't received any orders yet." />
            ) : (
              transactions.slice(0, 5).map((tx, idx) => (
                <View key={tx._id || idx} style={styles.txCard}>
                  <View style={styles.txLeft}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="arrow-down-left" size={24} color="#00C9A7" />
                    </View>
                    <View style={styles.txDetails}>
                      <Text style={styles.txType}>{tx.userId?.name || 'Customer'}</Text>
                      <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()} • {tx.paymentMethod}</Text>
                    </View>
                  </View>
                  <Text style={styles.txAmount}>+{tx.paymentMethod === 'Token' ? `Rs. ${tx.amount}` : `₹${tx.amount}`}</Text>
                </View>
              ))
            )}
            {transactions.length > 5 && (
              <TouchableOpacity style={styles.viewAllBtn} onPress={() => setTxModalVisible(true)}>
                <Text style={styles.viewAllText}>View All Transactions</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Transactions Modal */}
        <Modal visible={txModalVisible} transparent animationType="slide" onRequestClose={() => setTxModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>All Transactions</Text>
                <TouchableOpacity onPress={() => setTxModalVisible(false)} style={styles.modalCloseBtn}>
                  <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={transactions}
                keyExtractor={(item, index) => item._id || index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item: tx }) => (
                  <View style={styles.txCard}>
                    <View style={styles.txLeft}>
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="arrow-down-left" size={24} color="#00C9A7" />
                      </View>
                      <View style={styles.txDetails}>
                        <Text style={styles.txType}>{tx.userId?.name || 'Customer'}</Text>
                        <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()} • {tx.paymentMethod}</Text>
                      </View>
                    </View>
                    <Text style={styles.txAmount}>+{tx.paymentMethod === 'Token' ? `Rs. ${tx.amount}` : `₹${tx.amount}`}</Text>
                  </View>
                )}
                ListEmptyComponent={<EmptyState icon="history" title="No Transactions" message="You haven't received any orders yet." />}
              />
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 10, backgroundColor: COLORS.cardBg, borderRadius: 12, position: 'relative', borderWidth: 1, borderColor: COLORS.border },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#141432' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statCard: { flex: 1, marginHorizontal: 6, backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, alignItems: 'flex-start' },
  statIconWrap: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  statTitle: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  
  statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  statusTitle: { fontSize: 26, fontWeight: '900', marginBottom: 16, letterSpacing: 0.5 },
  statusMessage: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', lineHeight: 26, marginBottom: 36 },
  refreshBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 20 },
  refreshBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  
  section: { backgroundColor: COLORS.cardBg, padding: 22, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 20 },
  chartWrapper: { alignItems: 'center', marginLeft: -20 },
  
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txDetails: { marginLeft: 14, flex: 1 },
  txType: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
  txDate: { fontSize: 12, color: COLORS.textLight },
  txAmount: { fontSize: 16, fontWeight: '900', color: '#00C9A7' },
  
  qrContainer: { backgroundColor: COLORS.cardBg, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginBottom: 20, marginTop: 10 },
  qrTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 6 },
  qrSubtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 24, textAlign: 'center' },
  qrWrapper: { padding: 16, backgroundColor: '#fff', borderRadius: 20, elevation: 8 },
  
  emptyBox: { alignItems: 'center', paddingVertical: 30 },
  emptyBoxTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  emptyBoxText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center' },
  
  viewAllBtn: { marginTop: 16, paddingVertical: 12, backgroundColor: COLORS.cardBg, borderRadius: 16, alignItems: 'center' },
  viewAllText: { color: '#00C9A7', fontWeight: '800', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBg, width: '100%', height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  modalCloseBtn: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 8 }
});
