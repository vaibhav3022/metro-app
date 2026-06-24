import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, ScrollView, RefreshControl, Platform, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../api/axiosConfig';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { t } = useTranslation();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const list = res.data.data || [];
      setNotifications(list);
      
      const hasUnread = list.some(item => !item.isRead);
      if (hasUnread) {
        // Double pulse vibration for new notifications
        Vibration.vibrate([0, 150, 100, 150]);
      }
    } catch (err) {
      console.log('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      Vibration.vibrate(80);
      fetchNotifications();
    } catch (err) {}
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      Vibration.vibrate(50);
      fetchNotifications();
    } catch (err) {}
  };

  const getIcon = (type) => {
    switch(type) {
      case 'transaction': return 'swap-horizontal';
      case 'alert': return 'alert-circle-outline';
      case 'promotion': return 'star-circle-outline';
      default: return 'bell-outline';
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          <TouchableOpacity onPress={markAllRead} style={styles.backButton}>
            <MaterialCommunityIcons name="check-all" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={COLORS.secondary} colors={[COLORS.secondary]} />} 
          contentContainerStyle={notifications.length === 0 ? styles.scrollContentEmpty : styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="bell-off-outline" size={48} color={COLORS.secondary} />
              </View>
              <Text style={styles.emptyTitle}>{t('notifications.noNew')}</Text>
              <Text style={styles.emptySubtitle}>{t('notifications.caughtUp')}</Text>
            </View>
          ) : (
            notifications.map(item => (
              <TouchableOpacity key={item._id} style={[styles.card, !item.isRead && styles.unreadCard]} onPress={() => markRead(item._id)}>
                <View style={[styles.iconBg, !item.isRead && { backgroundColor: 'rgba(0,137,123,0.15)' }]}>
                  <MaterialCommunityIcons name={getIcon(item.type)} size={24} color={!item.isRead ? COLORS.secondary : COLORS.textLight} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.time}>{moment(item.createdAt).fromNow()}</Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { padding: 10, backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  scrollContentEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  card: { flexDirection: 'row', backgroundColor: COLORS.cardBg, padding: 18, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  unreadCard: { backgroundColor: 'rgba(0,137,123,0.05)', borderColor: 'rgba(0,137,123,0.2)' },
  
  iconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  unreadText: { color: COLORS.secondary, fontWeight: '800' },
  message: { fontSize: 14, color: COLORS.textLight, lineHeight: 22 },
  time: { fontSize: 12, color: COLORS.textLight, marginTop: 8, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary, position: 'absolute', top: 24, right: 20 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: -50 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,137,123,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,137,123,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center' }
});
