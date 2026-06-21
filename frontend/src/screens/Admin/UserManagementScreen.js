import React, { useState, useEffect } from 'react';
import COLORS from '../../constants/colors';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, Alert, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import EmptyState from '../../components/EmptyState';
import ToastMessage from '../../components/ToastMessage';

export default function UserManagementScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchUsers = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/admin/users?page=${pageNum}&limit=10`);
      const newUsers = res.data.data || [];
      if (append) {
        setUsers(prev => [...prev, ...newUsers]);
      } else {
        setUsers(newUsers);
      }
      setHasMore(newUsers.length === 10);
      setPage(pageNum);
    } catch (err) {
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchUsers(1, false); }, []);

  const showToast = (message, type) => setToast({ visible: true, message, type });

  const handleDelete = (id) => {
    Alert.alert('Delete User', 'Are you sure you want to permanently delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/admin/users/${id}`);
            showToast('User deleted successfully', 'success');
            setUsers(users.filter(u => u._id !== id));
          } catch (err) {
            showToast('Failed to delete user', 'error');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.name?.toLowerCase().includes(q)) || (u.phone?.includes(q)) || (u.email?.toLowerCase().includes(q));
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
          <Text style={styles.headerTitle}>Users Config</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or email..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={loading && page === 1} onRefresh={() => fetchUsers(1, false)} tintColor="#00C9A7" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading && page === 1 ? (
            <ActivityIndicator size="large" color="#00C9A7" style={{ marginTop: 20 }} />
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="account-search-outline" size={48} color="#00C9A7" />
              </View>
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search criteria.</Text>
            </View>
          ) : (
            filteredUsers.map((u) => (
              <View key={u._id} style={styles.userCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.name || 'Metro Traveler'}</Text>
                    <Text style={styles.userContact}>{u.phone} {u.email ? `• ${u.email}` : ''}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(u._id)} style={styles.deleteBtn}>
                    <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.balancesContainer}>
                  <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>Wallet</Text>
                    <Text style={styles.balanceValue}>₹{u.walletBalance || 0}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>Tokens</Text>
                    <Text style={[styles.balanceValue, {color: '#9B59B6'}]}>{u.tokenBalance || 0}</Text>
                  </View>
                </View>
                
                <Text style={styles.joinDate}>Joined: {new Date(u.createdAt).toLocaleDateString()}</Text>
              </View>
            ))
          )}

          {hasMore && filteredUsers.length > 0 && !searchQuery && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={() => fetchUsers(page + 1, true)} disabled={loadingMore}>
              {loadingMore ? <ActivityIndicator size="small" color="#00C9A7" /> : <Text style={styles.loadMoreText}>Load More</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 14, marginLeft: 10, fontSize: 16, color: '#fff' },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  userCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  avatarText: { color: '#00C9A7', fontSize: 20, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  userContact: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  
  deleteBtn: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  
  balancesContainer: { flexDirection: 'row', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  balanceBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: COLORS.cardBg },
  balanceLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 6, fontWeight: '600' },
  balanceValue: { fontSize: 18, fontWeight: '900', color: '#00C9A7' },
  
  joinDate: { fontSize: 12, color: COLORS.textLight, textAlign: 'right', fontWeight: '600' },
  
  loadMoreBtn: { paddingVertical: 16, alignItems: 'center', marginVertical: 10, backgroundColor: COLORS.cardBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  loadMoreText: { color: '#00C9A7', fontWeight: '800', fontSize: 16 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center' }
});
