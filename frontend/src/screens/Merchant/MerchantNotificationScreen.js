import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Platform, BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import ToastMessage from '../../components/ToastMessage';
import { useTheme } from '../../context/ThemeContext';

export default function MerchantNotificationScreen({ navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [toast, setToast]                 = useState({ visible: false, message: '', type: 'success' });

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/merchant/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    const onBack = () => { navigation.goBack(); return true; };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [navigation]);

  const showToast = (message, type) => setToast({ visible: true, message, type });

  const markAsRead = async (id) => {
    try {
      await api.put(`/merchant/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.isRead).map(n => api.put(`/merchant/notifications/${n._id}/read`))
      );
      fetchNotifications(true);
      showToast('All marked as read', 'success');
    } catch (_) {}
  };

  const getTimeAgo = (date) => {
    const min = Math.floor((new Date() - new Date(date)) / 60000);
    if (min < 1)  return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getIcon = (type) => {
    const map = {
      order:     { name: 'shopping-outline',       color: COLORS.aquaLine || '#00897B'   },
      payment:   { name: 'cash-check',             color: COLORS.success || '#2E7D32' },
      alert:     { name: 'alert-circle-outline',   color: COLORS.error || '#D32F2F' },
      info:      { name: 'information-outline',    color: COLORS.primary || '#0D47A1' },
      promo:     { name: 'ticket-percent-outline', color: COLORS.secondary || '#FF5722' },
    };
    return map[type] || { name: 'bell-ring-outline', color: COLORS.purpleLine || '#6A1B9A' };
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {toast.visible && (
          <ToastMessage
            message={toast.message}
            type={toast.type}
            onHide={() => setToast(t => ({ ...t, visible: false }))}
          />
        )}

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSub}>{unreadCount} unread</Text>
            )}
          </View>

          {notifications.length > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
              <MaterialCommunityIcons name="check-all" size={20} color={COLORS.primary} />
              <Text style={styles.markAllText}>Mark all</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Content ── */}
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifications(true); }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={notifications.length === 0 ? styles.emptyWrap : styles.scrollWrap}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : notifications.length === 0 ? (
            /* ── Empty State ── */
            <View style={styles.emptyBox}>
              <View style={styles.emptyCircle}>
                <MaterialCommunityIcons name="bell-off-outline" size={52} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySub}>You have no notifications right now.{'\n'}Pull down to refresh.</Text>
            </View>
          ) : (
            notifications.map((n, i) => {
              const { name: iconName, color: iconColor } = getIcon(n.type);
              return (
                <TouchableOpacity
                  key={n._id}
                  style={[styles.card, !n.isRead && styles.cardUnread]}
                  onPress={() => markAsRead(n._id)}
                  activeOpacity={0.8}
                >
                  {/* Unread indicator bar */}
                  {!n.isRead && <View style={styles.unreadBar} />}

                  <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
                    <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, !n.isRead && { color: COLORS.text, fontWeight: '800' }]} numberOfLines={1}>
                      {n.title || 'Notification'}
                    </Text>
                    <Text style={styles.cardMsg} numberOfLines={3}>{n.message}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.textLight} />
                      <Text style={styles.cardTime}> {getTimeAgo(n.createdAt)}</Text>
                      {!n.isRead && (
                        <View style={styles.unreadPill}>
                          <Text style={styles.unreadPillText}>NEW</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.4 },
  headerSub:   { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  markAllText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  // Scroll
  emptyWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollWrap: { padding: 16, paddingBottom: 40 },

  // Empty state
  emptyBox:    { alignItems: 'center' },
  emptyCircle: {
    width: 110, height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 10 },
  emptySub:   { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 },

  // Notification card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    padding: 16,
  },
  cardUnread: {
    borderColor: COLORS.primary + '35',
    backgroundColor: COLORS.primary + '08',
  },
  unreadBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3.5,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  iconWrap: {
    width: 48, height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  cardBody:  { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardMsg:   { fontSize: 13, color: COLORS.textLight, lineHeight: 20 },
  cardTime:  { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },

  unreadPill: {
    marginLeft: 'auto',
    backgroundColor: COLORS.primary + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  unreadPillText: { fontSize: 9, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.8 },
});
