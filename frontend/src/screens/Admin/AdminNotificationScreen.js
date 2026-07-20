import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import EmptyState from '../../components/EmptyState';
import ToastMessage from '../../components/ToastMessage';

export default function AdminNotificationScreen({ navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications'); 
      setNotifications(res.data.data || []);
    } catch (err) {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    const onBackPress = () => {
      navigation.goBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation]);

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
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Alerts</Text>
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <MaterialCommunityIcons name="check-all" size={24} color="#00C9A7" />
          </TouchableOpacity>
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor="#00C9A7" />} contentContainerStyle={notifications.length === 0 ? styles.scrollContentEmpty : styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="#00C9A7" style={{ marginTop: 20 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="bell-check-outline" size={48} color="#00C9A7" />
              </View>
              <Text style={styles.emptyTitle}>All Good!</Text>
              <Text style={styles.emptySubtitle}>No pending alerts or notifications.</Text>
            </View>
          ) : (
            notifications.map(n => (
              <TouchableOpacity key={n._id} style={[styles.card, !n.isRead && styles.unreadCard]} onPress={() => markAsRead(n._id)}>
                <View style={[styles.iconContainer, !n.isRead && { backgroundColor: 'rgba(0,201,167,0.15)' }]}>
                  <MaterialCommunityIcons name="shield-alert-outline" size={24} color={!n.isRead ? '#00C9A7' : COLORS.textLight} />
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

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { padding: 10, backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  markAllBtn: { padding: 10, backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  
  scrollContentEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  card: { flexDirection: 'row', backgroundColor: COLORS.cardBg, padding: 18, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  unreadCard: { backgroundColor: 'rgba(0,201,167,0.05)', borderColor: 'rgba(0,201,167,0.2)' },
  
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardContent: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  unreadText: { color: '#00C9A7', fontWeight: '800' },
  message: { fontSize: 14, color: COLORS.textLight, lineHeight: 22 },
  time: { fontSize: 12, color: COLORS.textLight, marginTop: 8, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C9A7', alignSelf: 'center', marginLeft: 10 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: -50 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center' }
});
