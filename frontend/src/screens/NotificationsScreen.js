import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, ScrollView, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../api/axiosConfig';
import moment from 'moment';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
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
      fetchNotifications();
    } catch (err) {}
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
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
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead} style={styles.backButton}>
            <MaterialCommunityIcons name="check-all" size={24} color="#00C9A7" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor="#00C9A7" colors={['#00C9A7']} />} 
          contentContainerStyle={notifications.length === 0 ? styles.scrollContentEmpty : styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="bell-off-outline" size={48} color="#00C9A7" />
              </View>
              <Text style={styles.emptyTitle}>No New Notifications</Text>
              <Text style={styles.emptySubtitle}>You're all caught up!</Text>
            </View>
          ) : (
            notifications.map(item => (
              <TouchableOpacity key={item._id} style={[styles.card, !item.isRead && styles.unreadCard]} onPress={() => markRead(item._id)}>
                <View style={[styles.iconBg, !item.isRead && { backgroundColor: 'rgba(0,201,167,0.15)' }]}>
                  <MaterialCommunityIcons name={getIcon(item.type)} size={24} color={!item.isRead ? '#00C9A7' : 'rgba(255,255,255,0.4)'} />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { padding: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  
  scrollContentEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  card: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', padding: 18, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  unreadCard: { backgroundColor: 'rgba(0,201,167,0.05)', borderColor: 'rgba(0,201,167,0.2)' },
  
  iconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  unreadText: { color: '#00C9A7', fontWeight: '800' },
  message: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
  time: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C9A7', position: 'absolute', top: 24, right: 20 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: -50 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }
});
