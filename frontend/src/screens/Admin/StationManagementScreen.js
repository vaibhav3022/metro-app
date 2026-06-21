import React, { useState, useEffect } from 'react';
import COLORS from '../../constants/colors';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, Alert, Modal, StatusBar, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import EmptyState from '../../components/EmptyState';
import ToastMessage from '../../components/ToastMessage';

export default function StationManagementScreen({ navigation }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [modalVisible, setModalVisible] = useState(false);
  
  const [form, setForm] = useState({ _id: null, name: '', code: '', metroLine: 'Line 1', latitude: '', longitude: '', isActive: true });

  const fetchStations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stations');
      setStations(res.data.data || []);
    } catch (err) {
      showToast('Failed to fetch stations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStations(); }, []);

  const showToast = (message, type) => setToast({ visible: true, message, type });

  const resetForm = () => setForm({ _id: null, name: '', code: '', metroLine: 'Line 1', latitude: '', longitude: '', isActive: true });

  const handleSave = async () => {
    const { _id, name, code, metroLine, latitude, longitude, isActive } = form;
    if (!name || !code || !latitude || !longitude) return showToast('All fields are required', 'error');
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) return showToast('Latitude must be between -90 and 90', 'error');
    if (isNaN(lng) || lng < -180 || lng > 180) return showToast('Longitude must be between -180 and 180', 'error');

    try {
      setLoading(true);
      const payload = { name, code: code.toUpperCase().slice(0, 5), metroLine, latitude: lat, longitude: lng, isActive };
      if (_id) {
        await api.put(`/stations/${_id}`, payload);
        showToast('Station updated', 'success');
      } else {
        await api.post('/stations', payload);
        showToast('Station added', 'success');
      }
      setModalVisible(false);
      resetForm();
      fetchStations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save station', 'error');
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Station', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/stations/${id}`);
            showToast('Station deleted', 'success');
            fetchStations();
          } catch (err) {
            showToast('Failed to delete station', 'error');
            setLoading(false);
          }
        }
      }
    ]);
  };

  const filteredStations = stations.filter(s => {
    if (filter !== 'All' && s.metroLine !== filter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Station Config</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
            <MaterialCommunityIcons name="plus" size={24} color="#00C9A7" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterTabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {['All', 'Line 1', 'Line 2', 'Line 3'].map(f => (
              <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.activeTab]} onPress={() => setFilter(f)}>
                <Text style={[styles.tabText, filter === f && styles.activeTabText]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStations} tintColor="#00C9A7" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="#00C9A7" style={{ marginTop: 20 }} />
          ) : filteredStations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="train" size={48} color="#00C9A7" />
              </View>
              <Text style={styles.emptyTitle}>No Stations Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters or add a new station.</Text>
            </View>
          ) : (
            filteredStations.map((s) => (
              <View key={s._id} style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.stationName}>{s.name} <Text style={{color: COLORS.textLight, fontSize:14}}>({s.code})</Text></Text>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: 'rgba(155,89,182,0.2)', borderColor: '#9B59B6' }]}>
                      <Text style={[styles.badgeText, { color: '#9B59B6' }]}>{s.metroLine}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: s.isActive ? 'rgba(0,201,167,0.2)' : 'rgba(239,68,68,0.2)', borderColor: s.isActive ? '#00C9A7' : '#EF4444' }]}>
                      <Text style={[styles.badgeText, { color: s.isActive ? '#00C9A7' : '#EF4444' }]}>{s.isActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => {
                    setForm({ _id: s._id, name: s.name, code: s.code, metroLine: s.metroLine, latitude: s.latitude.toString(), longitude: s.longitude.toString(), isActive: s.isActive });
                    setModalVisible(true);
                  }}>
                    <MaterialCommunityIcons name="pencil-outline" size={24} color="#F59E0B" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(s._id)}>
                    <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{form._id ? 'Edit Station' : 'Add Station'}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Station Name" value={form.name} onChangeText={(t) => setForm({...form, name: t})} />
                <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Station Code (Max 5)" maxLength={5} autoCapitalize="characters" value={form.code} onChangeText={(t) => setForm({...form, code: t})} />
                
                <View style={styles.lineSelector}>
                  {['Line 1', 'Line 2', 'Line 3'].map(l => (
                    <TouchableOpacity key={l} style={[styles.lineOption, form.metroLine === l && styles.lineOptionActive]} onPress={() => setForm({...form, metroLine: l})}>
                      <Text style={[styles.lineOptionText, form.metroLine === l && styles.lineOptionTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Latitude (-90 to 90)" keyboardType="numeric" value={form.latitude} onChangeText={(t) => setForm({...form, latitude: t})} />
                <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Longitude (-180 to 180)" keyboardType="numeric" value={form.longitude} onChangeText={(t) => setForm({...form, longitude: t})} />
                
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Station Active</Text>
                  <Switch value={form.isActive} onValueChange={(v) => setForm({...form, isActive: v})} trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0,201,167,0.5)' }} thumbColor={form.isActive ? '#00C9A7' : 'rgba(255,255,255,0.5)'} />
                </View>
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handleSave}>
                  <Text style={styles.modalSubmitText}>Save Station</Text>
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
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  addBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,201,167,0.15)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 14, marginLeft: 10, fontSize: 16, color: '#fff' },
  
  filterTabs: { paddingVertical: 10, marginBottom: 5 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginHorizontal: 6, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border },
  activeTab: { backgroundColor: 'rgba(0,201,167,0.15)', borderColor: '#00C9A7' },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.textLight },
  activeTabText: { color: '#00C9A7' },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  card: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cardInfo: { flex: 1 },
  stationName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  
  cardActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8, backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.cardBg, width: '100%', maxHeight: '85%', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 20 },
  modalInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 16, fontSize: 16, color: '#fff' },
  
  lineSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  lineOption: { flex: 1, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', borderRadius: 14, backgroundColor: COLORS.cardBg },
  lineOptionActive: { backgroundColor: 'rgba(155,89,182,0.2)', borderColor: '#9B59B6' },
  lineOptionText: { color: COLORS.textLight, fontWeight: '700' },
  lineOptionTextActive: { color: '#9B59B6', fontWeight: '800' },
  
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  switchLabel: { fontSize: 16, color: '#fff', fontWeight: '700' },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 12 },
  modalCancel: { paddingVertical: 14, paddingHorizontal: 20, backgroundColor: COLORS.cardBg, borderRadius: 14 },
  modalCancelText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalSubmit: { backgroundColor: '#00C9A7', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
  modalSubmitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center' }
});
