import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, ActivityIndicator, Alert, Modal, StatusBar, Platform, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import ToastMessage from '../../components/ToastMessage';
import { useTheme } from '../../context/ThemeContext';

export default function AdminWithdrawalManagementScreen({ navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTxId, setSelectedTxId] = useState(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/withdrawals');
      setWithdrawals(res.data.data || []);
    } catch (err) {
      showToast('Failed to fetch payouts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
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

  const handleAction = async (id, status, rejectionReason = '') => {
    setLoading(true);
    try {
      await api.put(`/admin/withdrawals/${id}`, { status, rejectionReason });
      showToast(`Payout request ${status === 'SUCCESS' ? 'Approved' : 'Rejected'}`, 'success');
      fetchWithdrawals();
    } catch (err) {
      showToast('Action failed', 'error');
      setLoading(false);
    }
  };

  const confirmApprove = (id, amount) => {
    Alert.alert('Approve Payout', `Are you sure you want to approve ₹${amount} payout?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => handleAction(id, 'SUCCESS') }
    ]);
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payout Approvals</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* List */}
        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWithdrawals} tintColor="#00C9A7" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading && withdrawals.length === 0 ? (
            <ActivityIndicator size="large" color="#00C9A7" style={{ marginTop: 20 }} />
          ) : withdrawals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="wallet-giftcard" size={48} color="#00C9A7" />
              </View>
              <Text style={styles.emptyTitle}>No Payout Requests</Text>
              <Text style={styles.emptySubtitle}>All merchant withdrawal requests are currently processed.</Text>
            </View>
          ) : (
            withdrawals.map((item) => (
              <View key={item._id} style={styles.withdrawalCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.businessName}>{item.merchantId?.businessName || 'Merchant'}</Text>
                    <Text style={styles.ownerText}>Owner: {item.userId?.name || 'N/A'} • {item.merchantId?.phone || 'N/A'}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'SUCCESS' ? 'rgba(0,201,167,0.15)' : item.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    borderColor: item.status === 'SUCCESS' ? '#00C9A7' : item.status === 'PENDING' ? '#F59E0B' : '#EF4444'
                  }]}>
                    <Text style={[styles.statusText, { color: item.status === 'SUCCESS' ? '#00C9A7' : item.status === 'PENDING' ? '#F59E0B' : '#EF4444' }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountBox}>
                  <Text style={styles.amtLabel}>Requested Payout Amount:</Text>
                  <Text style={styles.amtVal}>₹{item.amount}</Text>
                </View>

                {item.bankDetails && (
                  <View style={styles.bankBox}>
                    <Text style={styles.bankTitle}>Bank Account details:</Text>
                    <Text style={styles.bankText}>Bank: {item.bankDetails.bankName || 'N/A'}</Text>
                    <Text style={styles.bankText}>Account: {item.bankDetails.accountNumber || 'N/A'}</Text>
                    <Text style={styles.bankText}>IFSC: {item.bankDetails.ifscCode || 'N/A'}</Text>
                  </View>
                )}

                {item.status === 'PENDING' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00C9A7' }]} onPress={() => confirmApprove(item._id, item.amount)}>
                      <Text style={styles.actionBtnText}>Approve Payout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: '#EF4444' }]} onPress={() => { setSelectedTxId(item._id); setRejectModalVisible(true); }}>
                      <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Reject Modal */}
        <Modal visible={rejectModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reject Payout</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Reason for rejection (required)"
                placeholderTextColor="#AAAAAA"
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => { setRejectModalVisible(false); setRejectReason(''); }}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={() => {
                  if (!rejectReason.trim()) return showToast('Reason is required', 'error');
                  setRejectModalVisible(false);
                  handleAction(selectedTxId, 'FAILED', rejectReason);
                  setRejectReason('');
                }}>
                  <Text style={styles.modalSubmitText}>Confirm Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  withdrawalCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  businessName: { fontSize: 17, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  ownerText: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  amountBox: { marginVertical: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amtLabel: { fontSize: 14, color: COLORS.textLight, fontWeight: '600' },
  amtVal: { fontSize: 20, fontWeight: '900', color: '#00C9A7' },

  bankBox: { backgroundColor: COLORS.background, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  bankTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  bankText: { fontSize: 12, color: COLORS.textLight, marginBottom: 2, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.cardBg, width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  modalInput: { backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 14, color: COLORS.inputText, fontSize: 16, marginBottom: 24, marginTop: 16, borderWidth: 1, borderColor: COLORS.inputBorder },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: COLORS.cardBg },
  modalCancelText: { color: COLORS.text, fontWeight: '700' },
  modalSubmit: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalSubmitText: { color: '#fff', fontWeight: '800' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 30 }
});
