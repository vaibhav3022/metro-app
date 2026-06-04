import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import EmptyState from '../../components/EmptyState';
import ToastMessage from '../../components/ToastMessage';

export default function MerchantNotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/merchant/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const showToast = (message, type) => setToast({ visible: true, message, type });

  const markAsRead = async (id) => {
    try {
      await api.put(`/merchant/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(notifications.filter(n => !n.isRead).map(n => api.put(`/merchant/notifications/${n._id}/read`)));
      fetchNotifications();
    } catch (err) { }
  };

  const getTimeAgo = (date) => {
    const min = Math.floor((new Date() - new Date(date)) / 60000);
    if (min < 60) return `${min} mins ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <MaterialCommunityIcons name="check-all" size={24} color="#9B59B6" />
          </TouchableOpacity>
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor="#9B59B6" />} contentContainerStyle={notifications.length === 0 ? styles.scrollContentEmpty : styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="#9B59B6" style={{ marginTop: 20 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="bell-off-outline" size={48} color="#9B59B6" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySubtitle}>You have no notifications right now.</Text>
            </View>
          ) : (
            notifications.map(n => (
              <TouchableOpacity key={n._id} style={[styles.card, !n.isRead && styles.unreadCard]} onPress={() => markAsRead(n._id)}>
                <View style={[styles.iconContainer, !n.isRead && { backgroundColor: 'rgba(155,89,182,0.15)' }]}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={24} color={!n.isRead ? '#9B59B6' : 'rgba(255,255,255,0.4)'} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.title, !n.isRead && styles.unreadText]}>{n.title}</Text>
                  <Text style={styles.message}>{n.message}</Text>
                  <Text style={styles.time}>{getTimeAgo(n.createdAt)}</Text>
                </View>
                {!n.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { padding: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  markAllBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  scrollContentEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  card: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', padding: 18, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  unreadCard: { backgroundColor: 'rgba(155,89,182,0.05)', borderColor: 'rgba(155,89,182,0.2)' },
  
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardContent: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  unreadText: { color: '#9B59B6', fontWeight: '800' },
  message: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
  time: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9B59B6', alignSelf: 'center', marginLeft: 10 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: -50 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(155,89,182,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(155,89,182,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }
});
