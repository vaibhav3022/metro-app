import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl,
  TextInput, ActivityIndicator, Alert, Modal, StatusBar, Switch, Platform, Image, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import ToastMessage from '../../components/ToastMessage';
import { useTheme } from '../../context/ThemeContext';

export default function AdminContentManagementScreen({ navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);

  const [form, setForm] = useState({ title: '', imageUrl: '', linkUrl: '', isActive: true });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/banners');
      setBanners(res.data.data || []);
    } catch (err) {
      showToast('Failed to fetch banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
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

  const handleSave = async () => {
    const { title, imageUrl, linkUrl, isActive } = form;
    if (!title || !imageUrl) return showToast('Title and Image URL are required', 'error');

    setLoading(true);
    try {
      if (selectedBanner) {
        await api.put(`/admin/banners/${selectedBanner._id}`, { title, imageUrl, linkUrl, isActive });
        showToast('Banner updated successfully', 'success');
      } else {
        await api.post('/admin/banners', { title, imageUrl, linkUrl, isActive });
        showToast('Banner created successfully', 'success');
      }
      setModalVisible(false);
      setForm({ title: '', imageUrl: '', linkUrl: '', isActive: true });
      setSelectedBanner(null);
      fetchBanners();
    } catch (err) {
      showToast('Failed to save banner', 'error');
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Banner', 'Are you sure you want to permanently delete this banner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            await api.delete(`/admin/banners/${id}`);
            showToast('Banner deleted successfully', 'success');
            fetchBanners();
          } catch (err) {
            showToast('Failed to delete banner', 'error');
            setLoading(false);
          }
        }
      }
    ]);
  };

  const openForm = (banner = null) => {
    if (banner) {
      setSelectedBanner(banner);
      setForm({
        title: banner.title,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl || '',
        isActive: banner.isActive !== false
      });
    } else {
      setSelectedBanner(null);
      setForm({ title: '', imageUrl: '', linkUrl: '', isActive: true });
    }
    setModalVisible(true);
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
          <Text style={styles.headerTitle}>Promo CMS Banners</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => openForm(null)}>
            <MaterialCommunityIcons name="plus" size={24} color="#00C9A7" />
          </TouchableOpacity>
        </View>

        {/* Banners List */}
        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBanners} tintColor="#00C9A7" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading && banners.length === 0 ? (
            <ActivityIndicator size="large" color="#00C9A7" style={{ marginTop: 20 }} />
          ) : banners.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="image-multiple-outline" size={48} color="#00C9A7" />
              </View>
              <Text style={styles.emptyTitle}>No Promo Banners</Text>
              <Text style={styles.emptySubtitle}>Click '+' above to design dynamic slides for users.</Text>
            </View>
          ) : (
            banners.map((item) => (
              <View key={item._id} style={styles.bannerCard}>
                {item.imageUrl.startsWith('http') ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.bannerImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.bannerImg, styles.bannerPlaceholder]}>
                    <MaterialCommunityIcons name="image-broken" size={32} color={COLORS.textLight} />
                  </View>
                )}
                
                <View style={styles.bannerInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.statusBadge, {
                      backgroundColor: item.isActive ? 'rgba(0,201,167,0.15)' : 'rgba(239,68,68,0.15)',
                      borderColor: item.isActive ? '#00C9A7' : '#EF4444'
                    }]}>
                      <Text style={[styles.statusText, { color: item.isActive ? '#00C9A7' : '#EF4444' }]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  {item.linkUrl ? <Text style={styles.bannerLink} numberOfLines={1}>Url: {item.linkUrl}</Text> : null}
                  
                  <View style={styles.bannerActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openForm(item)}>
                      <MaterialCommunityIcons name="pencil-outline" size={20} color="#F59E0B" />
                      <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
                      <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Create/Edit Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedBanner ? 'Edit Banner' : 'Create Banner'}</Text>
              
              <Text style={styles.inputLabel}>Banner Title</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="#AAAAAA" placeholder="Enter Banner Title" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />

              <Text style={styles.inputLabel}>Image URL link</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="#AAAAAA" placeholder="http://example.com/image.png" value={form.imageUrl} onChangeText={(t) => setForm({ ...form, imageUrl: t })} />

              <Text style={styles.inputLabel}>Redirect URL link (Optional)</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="#AAAAAA" placeholder="http://pune-metro.com/event" value={form.linkUrl} onChangeText={(t) => setForm({ ...form, linkUrl: t })} />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Active status</Text>
                <Switch value={form.isActive} onValueChange={(v) => setForm({ ...form, isActive: v })} />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handleSave}>
                  <Text style={styles.modalSubmitText}>Save Banner</Text>
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
  addBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,201,167,0.15)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  bannerCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  bannerImg: { width: '100%', height: 160, backgroundColor: COLORS.background },
  bannerPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  bannerInfo: { padding: 18 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bannerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text, flex: 0.7 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  bannerLink: { fontSize: 12, color: COLORS.textLight, marginBottom: 16 },
  
  bannerActions: { flexDirection: 'row', gap: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '800' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.cardBg, width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 13, color: COLORS.textLight, marginBottom: 6, marginTop: 10, fontWeight: '600' },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14, padding: 4 },
  switchLabel: { fontSize: 15, color: COLORS.text, fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 12 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  modalCancelText: { color: COLORS.text, fontWeight: '700' },
  modalSubmit: { backgroundColor: '#00C9A7', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalSubmitText: { color: '#fff', fontWeight: '800' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 30 }
});
