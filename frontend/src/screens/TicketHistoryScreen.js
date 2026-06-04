import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, ScrollView, Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { ticketAPI } from '../api/ticketAPI';
import { fetchHistorySuccess, setCurrentTicket } from '../redux/slices/ticketSlice';

export default function TicketHistoryScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const history = useSelector((state) => state.tickets.history);

  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await ticketAPI.getTicketHistory();
      dispatch(fetchHistorySuccess(data.tickets));
    } catch (e) {
      console.error('Error fetching ticket history', e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadHistory(true);
  }, [loadHistory]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'used', label: 'Used' },
    { id: 'expired', label: 'Expired' },
    { id: 'failed', label: 'Failed' },
  ];

  const filteredTickets = filter === 'all'
    ? history
    : history.filter((t) => t.ticketStatus?.toLowerCase() === filter);

  const handleTicketPress = (ticket) => {
    dispatch(setCurrentTicket(ticket));
    navigation.navigate('QRTicket');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#00C9A7';
      case 'used': return '#3498DB';
      case 'expired': return '#9ca3af';
      case 'failed': return '#EF4444';
      default: return '#6b7280';
    }
  };

  const renderTicket = ({ item: ticket }) => (
    <TouchableOpacity style={styles.ticketCard} onPress={() => handleTicketPress(ticket)}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketIconWrap}>
          <Icon name="ticket-confirmation-outline" size={26} color="#00C9A7" />
        </View>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketRoute}>{ticket.source} → {ticket.destination}</Text>
          <Text style={styles.ticketId}>ID: {ticket.ticketId?.substring(0, 12)}...</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.ticketStatus) + '15', borderColor: getStatusColor(ticket.ticketStatus) + '30' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(ticket.ticketStatus) }]}>
            {ticket.ticketStatus || 'Unknown'}
          </Text>
        </View>
      </View>
      <View style={styles.ticketFooter}>
        <Text style={styles.ticketFare}>₹{ticket.totalAmount || ticket.fare}</Text>
        <Text style={styles.ticketDate}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.gradient}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>My Tickets</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Tabs */}
        <View style={{ height: 50, marginBottom: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
            {filters.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
                onPress={() => setFilter(f.id)}
              >
                <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#00C9A7" />
            <Text style={styles.loadingText}>Fetching your trip logs...</Text>
          </View>
        ) : filteredTickets.length > 0 ? (
          <FlatList
            data={filteredTickets}
            keyExtractor={(item) => item.ticketId || item._id}
            renderItem={renderTicket}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Icon name="ticket-confirmation-outline" size={44} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={styles.emptyTitle}>No Trips Found</Text>
            <Text style={styles.emptySubtitle}>
              No tickets matched the "{filter.toUpperCase()}" filter. Book a new ticket now.
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RouteSelection')} style={styles.bookBtn}>
              <LinearGradient colors={['#00C9A7', '#009980']} style={styles.bookButtonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.bookButtonText}>Book Metro Ticket</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  screenTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  
  filterScroll: { flex: 1 },
  filterContainer: { gap: 10, paddingHorizontal: 4, alignItems: 'center' },
  filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterChipActive: { backgroundColor: '#00C9A7', borderColor: '#00C9A7' },
  filterChipText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  filterChipTextActive: { color: '#fff' },
  
  listContainer: { paddingBottom: 40 },
  ticketCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  ticketIconWrap: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  ticketInfo: { flex: 1 },
  ticketRoute: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  ticketId: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 14 },
  ticketFare: { fontSize: 18, fontWeight: '900', color: '#00C9A7' },
  ticketDate: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 15 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 10 },
  emptySubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  bookBtn: { borderRadius: 16, overflow: 'hidden' },
  bookButtonGrad: { paddingHorizontal: 30, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  bookButtonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
