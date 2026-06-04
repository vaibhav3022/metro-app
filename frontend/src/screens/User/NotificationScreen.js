import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../../constants/colors';
import api from '../../api/axiosConfig';
import EmptyState from '../../components/EmptyState';
import ToastMessage from '../../components/ToastMessage';

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications'); // Assumes generic or /user/notifications
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
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(notifications.filter(n => !n.isRead).map(n => api.put(`/notifications/${n._id}/read`)));
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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} />} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : notifications.length === 0 ? (
          <EmptyState icon="bell-off-outline" title="All Caught Up!" message="You have no notifications right now." />
        ) : (
          notifications.map(n => (
            <TouchableOpacity key={n._id} style={[styles.card, !n.isRead && styles.unreadCard]} onPress={() => markAsRead(n._id)}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="bell-ring" size={24} color={!n.isRead ? COLORS.primary : COLORS.textLight} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.message}>{n.message}</Text>
                <Text style={styles.time}>{getTimeAgo(n.createdAt)}</Text>
              </View>
              {!n.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  markAllText: { color: COLORS.white, fontWeight: '600' },
  scrollContent: { padding: 15, paddingBottom: 50 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', elevation: 1 },
  unreadCard: { backgroundColor: 'rgba(0, 102, 204, 0.05)', elevation: 2, borderColor: COLORS.primary, borderWidth: 1 },
  iconContainer: { marginRight: 15, marginTop: 2 },
  cardContent: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  message: { fontSize: 14, color: COLORS.textLight, lineHeight: 20, marginBottom: 8 },
  time: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, alignSelf: 'center', marginLeft: 10 }
});
