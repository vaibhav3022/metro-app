import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions, StatusBar, Modal, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import ToastMessage from '../../components/ToastMessage';

const { width } = Dimensions.get('window');

// Simple local StatCard to replace imported one and inject dark mode styles
const StatCard = ({ title, value, icon, color, styles }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: `${color}20` }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

// Simple local ChartCard
const ChartCard = ({ title, children, styles }) => (
  <View style={styles.chartCard}>
    <Text style={styles.chartTitle}>{title}</Text>
    <View style={styles.chartWrapper}>
      {children}
    </View>
  </View>
);

export default function RevenueAnalyticsScreen({ navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [summary, setSummary] = useState({});
  const [period, setPeriod] = useState('weekly');
  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const [rankings, setRankings] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [merchantOrders, setMerchantOrders] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const handleMerchantClick = async (merchant) => {
    setSelectedMerchant(merchant);
    setModalLoading(true);
    try {
      const res = await api.get(`/revenue/merchant-orders/${merchant._id}`);
      setMerchantOrders(res.data.data || []);
    } catch (err) {
      showToast('Failed to load merchant orders', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchData = async (currentPeriod = period) => {
    setLoading(true);
    try {
      const [sumRes, rankRes] = await Promise.all([
        api.get(`/revenue/summary?type=${currentPeriod}`),
        api.get('/revenue/merchant-rankings')
      ]);
      setSummary(sumRes.data || {});
      setRankings(rankRes.data.data || []);
      fetchChartData(currentPeriod);
    } catch (err) {
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (type) => {
    setChartLoading(true);
    try {
      const res = await api.get(`/revenue/chart?type=${type}`);
      setChartData(res.data);
    } catch (err) {
      showToast('Failed to load chart', 'error');
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => { fetchData(period); }, []);
  
  const handlePeriodChange = (type) => {
    setPeriod(type);
    fetchData(type);
  };

  const showToast = (message, type) => setToast({ visible: true, message, type });

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: '#1A0A3E', 
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: '#1A0A3E',
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0, 
    color: (opacity = 1) => `rgba(0, 201, 167, ${opacity})`, 
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 }, 
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#9B59B6' }
  };

  const pieData = [
    { name: 'Ticket Sales', revenue: summary.totalRevenue - summary.tokenSalesRevenue || 0, color: '#00C9A7', legendFontColor: 'rgba(255,255,255,0.7)', legendFontSize: 12 },
    { name: 'Token Sales', revenue: summary.tokenSalesRevenue || 0, color: '#9B59B6', legendFontColor: 'rgba(255,255,255,0.7)', legendFontSize: 12 },
  ];

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revenue Analytics</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#00C9A7" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.summaryRow}>
            <StatCard styles={styles} title="Total Revenue" value={`₹${summary.totalRevenue || 0}`} icon="cash-multiple" color="#00C9A7" />
            <StatCard styles={styles} title="Token Sales" value={`₹${summary.tokenSalesRevenue || 0}`} icon="ticket" color="#9B59B6" />
          </View>
          <View style={styles.summaryRow}>
            <StatCard styles={styles} title="Commission" value={`₹${summary.platformCommission || 0}`} icon="percent" color="#F59E0B" />
            <StatCard styles={styles} title="Payouts" value={`₹${summary.merchantPayouts || 0}`} icon="bank-transfer-out" color="#EF4444" />
          </View>

          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, period === 'weekly' && styles.toggleBtnActive]} onPress={() => handlePeriodChange('weekly')}>
              <Text style={[styles.toggleBtnText, period === 'weekly' && styles.toggleBtnTextActive]}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, period === 'monthly' && styles.toggleBtnActive]} onPress={() => handlePeriodChange('monthly')}>
              <Text style={[styles.toggleBtnText, period === 'monthly' && styles.toggleBtnTextActive]}>Monthly</Text>
            </TouchableOpacity>
          </View>

          {chartLoading ? <ActivityIndicator size="large" color="#00C9A7" style={{ marginVertical: 30 }} /> : (
            <>
              <ChartCard styles={styles} title="Revenue Over Time (Last 7 Days)">
                {chartData.labels?.length > 0 ? (
                  <LineChart
                    data={{ 
                      labels: chartData.labels.map((val, idx) => (period === 'monthly' && idx % 6 !== 0) ? "" : val), 
                      datasets: [{ data: chartData.data }] 
                    }}
                    width={width - 80} height={220} chartConfig={chartConfig} bezier style={{ borderRadius: 16 }}
                    formatXLabel={(value) => {
                      if (value && value.includes('-')) {
                        const parts = value.split('-');
                        if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                      }
                      return value;
                    }}
                    verticalLabelRotation={-30}
                  />
                ) : <Text style={styles.noDataText}>No Data Available</Text>}
              </ChartCard>

              <ChartCard styles={styles} title="Revenue Breakdown">
                <PieChart
                  data={pieData} width={width - 80} height={200}
                  chartConfig={chartConfig} accessor={"revenue"} backgroundColor={"transparent"} paddingLeft={"15"}
                  absolute
                />
              </ChartCard>
            </>
          )}

          <View style={styles.rankingSection}>
            <Text style={styles.sectionTitle}>Top Merchant Performers</Text>
            {rankings.map((m, idx) => (
              <TouchableOpacity key={m._id} style={styles.rankingCard} onPress={() => handleMerchantClick(m)}>
                <View style={styles.rankBadge}>
                  {idx === 0 ? <MaterialCommunityIcons name="medal" size={28} color="#FFD700" /> :
                   idx === 1 ? <MaterialCommunityIcons name="medal" size={28} color="#C0C0C0" /> :
                   idx === 2 ? <MaterialCommunityIcons name="medal" size={28} color="#CD7F32" /> :
                   <Text style={styles.rankNum}>{idx + 1}</Text>}
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{m.businessName}</Text>
                  <Text style={styles.rankSubtitle}>{m.totalOrders} Orders</Text>
                </View>
                <Text style={styles.rankRevenue}>₹{m.totalEarnings}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>

        {/* Orders Modal */}
        {selectedMerchant && (
          <Modal transparent animationType="slide" visible={!!selectedMerchant} onRequestClose={() => setSelectedMerchant(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedMerchant.businessName} Orders</Text>
                  <TouchableOpacity onPress={() => setSelectedMerchant(null)} style={{ padding: 5, backgroundColor: COLORS.cardBg, borderRadius: 20 }}>
                    <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                {modalLoading ? (
                  <ActivityIndicator size="large" color="#00C9A7" style={{ marginVertical: 30 }} />
                ) : (
                  <FlatList
                    data={merchantOrders}
                    keyExtractor={(item) => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={<Text style={styles.noDataText}>No orders found.</Text>}
                    renderItem={({ item }) => (
                      <View style={styles.orderCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orderUser}>{item.userId?.name || 'Unknown User'}</Text>
                          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleString()} • {item.paymentMethod}</Text>
                        </View>
                        <Text style={[styles.orderAmount, { color: '#00C9A7' }]}>
                          +{item.paymentMethod === 'Token' ? `${item.amount} Tokens` : `₹${item.amount}`}
                        </Text>
                      </View>
                    )}
                  />
                )}
              </View>
            </View>
          </Modal>
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  statCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, marginHorizontal: 6, borderWidth: 1, borderColor: COLORS.border },
  statIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statTitle: { fontSize: 13, color: COLORS.textLight, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 20, color: COLORS.text, fontWeight: '900' },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: -6 },
  
  toggleRow: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 6, marginVertical: 20 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  toggleBtnText: { color: COLORS.textLight, fontWeight: '700' },
  toggleBtnTextActive: { color: COLORS.white },
  
  chartCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  chartTitle: { fontSize: 16, color: COLORS.text, fontWeight: '800', marginBottom: 20, letterSpacing: 0.5 },
  chartWrapper: { alignItems: 'center' },
  
  noDataText: { marginVertical: 40, color: COLORS.textLight, fontStyle: 'italic', textAlign: 'center' },
  
  rankingSection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16, letterSpacing: 0.5 },
  rankingCard: { backgroundColor: COLORS.cardBg, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  rankBadge: { width: 44, alignItems: 'center' },
  rankNum: { fontSize: 20, fontWeight: '900', color: COLORS.textLight },
  rankInfo: { flex: 1, marginLeft: 12 },
  rankName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  rankSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4, fontWeight: '600' },
  rankRevenue: { fontSize: 18, fontWeight: '900', color: '#00C9A7' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '75%', borderWidth: 1, borderColor: COLORS.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  
  orderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  orderUser: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  orderDate: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  orderAmount: { fontSize: 18, fontWeight: '900' }
});
