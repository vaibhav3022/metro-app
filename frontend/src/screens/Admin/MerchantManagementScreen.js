import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, Alert, Modal, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import EmptyState from '../../components/EmptyState';
import ToastMessage from '../../components/ToastMessage';

export default function MerchantManagementScreen({ route, navigation }) {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(route.params?.filter ? (route.params.filter.charAt(0).toUpperCase() + route.params.filter.slice(1)) : 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState(null);
  const [selectedMerchantDetails, setSelectedMerchantDetails] = useState(null);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/merchants');
      setMerchants(res.data.data || []);
    } catch (err) {
      showToast('Failed to fetch merchants', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMerchants(); }, []);

  const showToast = (message, type) => setToast({ visible: true, message, type });

  const handleAction = async (id, action, additionalData = {}) => {
    try {
      setLoading(true);
      if (action === 'delete') {
        await api.delete(`/admin/merchants/${id}`);
      } else {
        await api.put(`/admin/merchants/${id}/${action}`, additionalData);
      }
      showToast(`Merchant ${action}d successfully`, 'success');
      fetchMerchants();
    } catch (err) {
      showToast(`Failed to ${action} merchant`, 'error');
      setLoading(false);
    }
  };

  const confirmAction = (id, action, title, msg) => {
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: action === 'delete' ? 'destructive' : 'default', onPress: () => handleAction(id, action) }
    ]);
  };

  const filteredMerchants = merchants.filter(m => {
    if (filter !== 'All' && m.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (searchQuery && !m.businessName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#00C9A7';
      case 'pending': return '#F59E0B';
      case 'suspended': return '#EF4444';
      case 'rejected': return 'rgba(255,255,255,0.4)';
      default: return '#9B59B6';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'approved': return 'rgba(0,201,167,0.15)';
      case 'pending': return 'rgba(245,158,11,0.15)';
      case 'suspended': return 'rgba(239,68,68,0.15)';
      case 'rejected': return 'rgba(255,255,255,0.05)';
      default: return 'rgba(155,89,182,0.15)';
    }
  };

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Merchant Config</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search business name..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterTabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {['All', 'Pending', 'Approved', 'Suspended', 'Rejected'].map(f => (
              <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.activeTab]} onPress={() => setFilter(f)}>
                <Text style={[styles.tabText, filter === f && styles.activeTabText]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMerchants} tintColor="#00C9A7" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="#00C9A7" style={{ marginTop: 20 }} />
          ) : filteredMerchants.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="store-off-outline" size={48} color="#00C9A7" />
              </View>
              <Text style={styles.emptyTitle}>No Merchants Found</Text>
              <Text style={styles.emptySubtitle}>No merchants match the filter "{filter}".</Text>
            </View>
          ) : (
            filteredMerchants.map((m) => (
              <View key={m._id} style={styles.merchantCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.businessName}>{m.businessName}</Text>
                    <Text style={styles.ownerName}>{m.userId?.name} • {m.phone}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: getStatusBgColor(m.status), borderColor: getStatusColor(m.status) }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(m.status) }]}>{m.status}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setSelectedMerchantDetails(m)}>
                    <Text style={styles.actionText}>Details</Text>
                  </TouchableOpacity>

                  {m.status === 'pending' && (
                    <>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00C9A7' }]} onPress={() => handleAction(m._id, 'approve')}><Text style={[styles.actionText, {color: '#fff'}]}>Approve</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444' }]} onPress={() => { setSelectedMerchantId(m._id); setRejectModalVisible(true); }}><Text style={[styles.actionText, {color: '#EF4444'}]}>Reject</Text></TouchableOpacity>
                    </>
                  )}
                  {m.status === 'approved' && (
                    <>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: '#F59E0B' }]} onPress={() => confirmAction(m._id, 'suspend', 'Suspend Merchant', 'Are you sure you want to suspend this merchant?')}><Text style={[styles.actionText, {color: '#F59E0B'}]}>Suspend</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444' }]} onPress={() => confirmAction(m._id, 'delete', 'Delete Merchant', 'Are you sure you want to delete this merchant permanently?')}><Text style={[styles.actionText, {color: '#EF4444'}]}>Delete</Text></TouchableOpacity>
                    </>
                  )}
                  {m.status === 'suspended' && (
                    <>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00C9A7' }]} onPress={() => handleAction(m._id, 'reactivate')}><Text style={[styles.actionText, {color: '#fff'}]}>Reactivate</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444' }]} onPress={() => confirmAction(m._id, 'delete', 'Delete Merchant', 'Are you sure you want to delete this merchant permanently?')}><Text style={[styles.actionText, {color: '#EF4444'}]}>Delete</Text></TouchableOpacity>
                    </>
                  )}
                  {m.status === 'rejected' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#EF4444' }]} onPress={() => confirmAction(m._id, 'delete', 'Delete Merchant', 'Are you sure you want to delete this merchant permanently?')}><Text style={[styles.actionText, {color: '#EF4444'}]}>Delete</Text></TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Merchant Details Modal */}
        <Modal visible={!!selectedMerchantDetails} transparent animationType="slide" onRequestClose={() => setSelectedMerchantDetails(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Merchant Details</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMerchantDetails(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {selectedMerchantDetails && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Business Name</Text>
                    <Text style={styles.detailValue}>{selectedMerchantDetails.businessName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Owner Name</Text>
                    <Text style={styles.detailValue}>{selectedMerchantDetails.userId?.name || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{selectedMerchantDetails.userId?.email || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{selectedMerchantDetails.phone || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Business Type</Text>
                    <Text style={styles.detailValue}>{selectedMerchantDetails.businessType || 'Retail'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{selectedMerchantDetails.address || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Earnings</Text>
                    <Text style={styles.detailValue}>Tokens: {selectedMerchantDetails.totalEarnings || 0}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Joined Date</Text>
                    <Text style={styles.detailValue}>{new Date(selectedMerchantDetails.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusBgColor(selectedMerchantDetails.status), borderColor: getStatusColor(selectedMerchantDetails.status) }]}>
                      <Text style={[styles.badgeText, { color: getStatusColor(selectedMerchantDetails.status) }]}>{selectedMerchantDetails.status}</Text>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Reject Modal */}
        <Modal visible={rejectModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reject Merchant</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Reason for rejection (required)"
                placeholderTextColor="rgba(255,255,255,0.4)"
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
                  handleAction(selectedMerchantId, 'reject', { reason: rejectReason });
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInput: { flex: 1, paddingVertical: 14, marginLeft: 10, fontSize: 16, color: '#fff' },
  
  filterTabs: { paddingVertical: 10, marginBottom: 5 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginHorizontal: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeTab: { backgroundColor: 'rgba(0,201,167,0.15)', borderColor: '#00C9A7' },
  tabText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  activeTabText: { color: '#00C9A7' },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  merchantCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  businessName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 6 },
  ownerName: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  
  actionRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#141432', width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  closeBtn: { padding: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20 },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  detailLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600', flex: 1 },
  detailValue: { fontSize: 15, color: '#fff', fontWeight: '800', flex: 1.5, textAlign: 'right' },
  
  modalInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, height: 120, textAlignVertical: 'top', color: '#fff', fontSize: 16, marginBottom: 24, marginTop: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  modalCancelText: { color: '#fff', fontWeight: '700' },
  modalSubmit: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalSubmitText: { color: '#fff', fontWeight: '800' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }
});
