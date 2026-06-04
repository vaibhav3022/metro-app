import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TicketCard({ ticket, onPress }) {
  if (!ticket) return null;

  const { ticketId, source, destination, passengers, totalAmount, ticketStatus, travelDate } = ticket;

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return { bg: '#dcfce7', text: '#16a34a', icon: 'check-circle' };
      case 'entered': return { bg: '#dbeafe', text: '#2563eb', icon: 'check-circle' };
      case 'used': return { bg: '#f3f4f6', text: '#6b7280', icon: 'check-circle' };
      case 'expired': return { bg: '#fee2e2', text: '#dc2626', icon: 'alert-circle' };
      default: return { bg: '#fef9c3', text: '#d97706', icon: 'help-circle' };
    }
  };

  const statusStyle = getStatusStyle(ticketStatus);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Top Row: ID + Status */}
      <View style={styles.topRow}>
        <View style={styles.idRow}>
          <Icon name="train" size={16} color="#0066CC" style={{ marginRight: 6 }} />
          <Text style={styles.ticketId} numberOfLines={1}>{ticketId || 'PMA-MOCK'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Icon name={statusStyle.icon} size={12} color={statusStyle.text} style={{ marginRight: 4 }} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {ticketStatus?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
      </View>

      {/* Route Row */}
      <View style={styles.routeRow}>
        <View style={styles.stationWrap}>
          <Text style={styles.stationLabel}>FROM</Text>
          <Text style={styles.stationName} numberOfLines={1}>{source}</Text>
        </View>
        <View style={styles.arrowWrap}>
          <Icon name="arrow-right-circle" size={24} color="#0066CC" style={{ opacity: 0.4 }} />
          <Text style={styles.passengersText}>{passengers} Pass</Text>
        </View>
        <View style={[styles.stationWrap, { alignItems: 'flex-end' }]}>
          <Text style={styles.stationLabel}>TO</Text>
          <Text style={styles.stationName} numberOfLines={1}>{destination}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bottom Row: Date + Fare */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.bottomLabel}>TRAVEL DATE</Text>
          <Text style={styles.dateText}>{formatDate(travelDate)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.bottomLabel}>TOTAL FARE</Text>
          <Text style={styles.fareText}>₹{totalAmount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  idRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ticketId: { fontSize: 13, fontWeight: '700', color: '#111', maxWidth: 160 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  stationWrap: { flex: 1 },
  stationLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 4 },
  stationName: { fontSize: 18, fontWeight: '800', color: '#111' },
  arrowWrap: { alignItems: 'center', paddingHorizontal: 10 },
  passengersText: { fontSize: 10, color: '#6b7280', marginTop: 4, fontWeight: '500' },
  divider: { borderTopWidth: 1, borderTopColor: '#F3F4F6', borderStyle: 'dashed', marginBottom: 14 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bottomLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, marginBottom: 4 },
  dateText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  fareText: { fontSize: 18, fontWeight: '800', color: '#0066CC' },
});
