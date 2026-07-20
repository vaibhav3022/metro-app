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

export default function AdminComplaintManagementScreen({ navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [statusFilter, setStatusFilter] = useState('All');
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Resolved');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/complaints');
      setComplaints(res.data.data || []);
    } catch (err) {
      showToast('Failed to fetch tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
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

  const handleResolve = async () => {
    if (!replyText.trim()) return showToast('Resolution reply is required', 'error');

    setLoading(true);
    try {
      await api.put(`/admin/complaints/${selectedTicket._id}`, {
        status: selectedStatus,
        adminReply: replyText
      });
      showToast('Complaint status updated successfully', 'success');
      setReplyModalVisible(false);
      setReplyText('');
      setSelectedTicket(null);
      fetchComplaints();
    } catch (err) {
      showToast('Failed to resolve complaint', 'error');
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (statusFilter === 'All') return true;
    return c.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved': return '#00C9A7';
      case 'in progress': return '#3498DB';
      case 'open':
      case 'pending': return '#F59E0B';
      default: return COLORS.textLight;
    }
  };

  return (
    <View style={{ flex: 1 }}>
        {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Support Moderation</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {['All', 'Open', 'In Progress', 'Resolved', 'Pending'].map(f => (
              <TouchableOpacity key={f} style={[styles.tab, statusFilter === f && styles.activeTab]} onPress={() => setStatusFilter(f)}>
                <Text style={[styles.tabText, statusFilter === f && styles.activeTabText]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List */}
        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchComplaints} tintColor="#00C9A7" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading && complaints.length === 0 ? (
            <ActivityIndicator size="large" color="#00C9A7" style={{ marginTop: 20 }} />
          ) : filteredComplaints.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="comment-check-outline" size={48} color="#00C9A7" />
              </View>
              <Text style={styles.emptyTitle}>No Support Tickets</Text>
              <Text style={styles.emptySubtitle}>No complaints match the filter "{statusFilter}".</Text>
            </View>
          ) : (
            filteredComplaints.map((item) => (
              <View key={item._id} style={styles.complaintCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject || 'Support Ticket'}</Text>
                    <Text style={styles.userText}>
                      By: {item.userId?.name || 'N/A'} • {item.userId?.role?.toUpperCase() || 'USER'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: getStatusColor(item.status) + '15',
                    borderColor: getStatusColor(item.status)
                  }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.contentBox}>
                  <Text style={styles.categoryLabel}>Category: {item.category}</Text>
                  <Text style={styles.descText}>{item.description}</Text>
                </View>

                {item.adminReply ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyTitle}>Your Response:</Text>
                    <Text style={styles.replyTextContent}>{item.adminReply}</Text>
                  </View>
                ) : null}

                {item.status !== 'Resolved' && item.status !== 'Closed' && (
                  <TouchableOpacity style={styles.resolveBtn} onPress={() => { setSelectedTicket(item); setReplyModalVisible(true); }}>
                    <MaterialCommunityIcons name="reply" size={18} color="#fff" />
                    <Text style={styles.resolveBtnText}>Respond & Update</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Reply/Update Modal */}
        <Modal visible={replyModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Resolve Ticket</Text>

              <Text style={styles.inputLabel}>Select Status</Text>
              <View style={styles.statusRow}>
                {['In Progress', 'Resolved', 'Closed'].map(st => (
                  <TouchableOpacity key={st} style={[styles.statusOption, selectedStatus === st && styles.statusOptionActive]} onPress={() => setSelectedStatus(st)}>
                    <Text style={[styles.statusOptionText, selectedStatus === st && styles.statusOptionTextActive]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Admin Response Message</Text>
              <TextInput
                style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Enter resolution details or reply to user..."
                placeholderTextColor="#AAAAAA"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => { setReplyModalVisible(false); setReplyText(''); }}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handleResolve}>
                  <Text style={styles.modalSubmitText}>Submit Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  filterTabs: { paddingVertical: 10, marginBottom: 5 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginHorizontal: 6, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border },
  activeTab: { backgroundColor: 'rgba(0,201,167,0.15)', borderColor: '#00C9A7' },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.textLight },
  activeTabText: { color: '#00C9A7' },

  scrollContent: { padding: 20, paddingBottom: 50 },
  complaintCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ticketSubject: { fontSize: 16, fontWeight: '900', color: COLORS.text, flex: 0.7, marginBottom: 4 },
  userText: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  contentBox: { marginVertical: 14, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  categoryLabel: { fontSize: 12, color: '#00C9A7', fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' },
  descText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },

  replyBox: { backgroundColor: 'rgba(0,201,167,0.06)', borderLeftWidth: 3, borderLeftColor: '#00C9A7', padding: 12, borderRadius: 10, marginTop: 10, marginBottom: 6 },
  replyTitle: { fontSize: 11, fontWeight: '900', color: '#00C9A7', marginBottom: 4 },
  replyTextContent: { fontSize: 13, color: COLORS.text, lineHeight: 18 },

  resolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00C9A7', paddingVertical: 12, borderRadius: 12, gap: 6, marginTop: 14 },
  resolveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.cardBg, width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 13, color: COLORS.textLight, marginBottom: 8, marginTop: 10, fontWeight: '600' },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 12, padding: 14, color: COLORS.text, fontSize: 15, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 16 },
  statusOption: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.background },
  statusOptionActive: { borderColor: '#3498DB', backgroundColor: 'rgba(52,152,219,0.1)' },
  statusOptionText: { fontSize: 12, color: COLORS.textLight, fontWeight: '700' },
  statusOptionTextActive: { color: '#3498DB', fontWeight: '800' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  modalCancelText: { color: COLORS.text, fontWeight: '700' },
  modalSubmit: { backgroundColor: '#00C9A7', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalSubmitText: { color: '#fff', fontWeight: '800' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 30 }
});
