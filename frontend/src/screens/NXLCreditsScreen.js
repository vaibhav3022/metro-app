import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, RefreshControl, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axiosConfig';

const TYPE_META = {
  cashback: { icon: 'cash-refund',     color: '#10B981', label: 'Cashback',  sign: '+' },
  credit:   { icon: 'plus-circle',     color: '#10B981', label: 'Credit',    sign: '+' },
  debit:    { icon: 'minus-circle',    color: '#EF4444', label: 'Debit',     sign: '-' },
  refund:   { icon: 'refresh',         color: '#6366F1', label: 'Refund',    sign: '+' },
  default:  { icon: 'circle',          color: '#9CA3AF', label: 'Transaction', sign: '' },
};

function getTypeMeta(tx) {
  const desc = (tx.description || '').toLowerCase();
  if (desc.includes('cashback')) return TYPE_META.cashback;
  if (tx.type === 'credit')     return TYPE_META.credit;
  if (tx.type === 'debit')      return TYPE_META.debit;
  if (tx.type === 'refund')     return TYPE_META.refund;
  return TYPE_META.default;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function NXLCreditsScreen() {
  const { theme: COLORS, isDark } = useTheme();
  const navigation = useNavigation();
  const styles = getStyles(COLORS, isDark);

  const user = useSelector(state => state.auth.user);

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history,    setHistory]    = useState([]);
  const [error,      setError]      = useState(null);

  const nxlBalance     = user?.nxlCredits     || 0;
  const lifetimeEarned = user?.lifetimeCashback || 0;

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/wallet/cashback-history');
      const txs = res.data?.transactions || [];
      setHistory(txs);
    } catch (e) {
      console.log('NXL history fetch error:', e?.message);
      setError('Could not load history. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const onRefresh = () => { setRefreshing(true); fetchHistory(); };

  /* ── Render Transaction Row ── */
  const renderItem = ({ item }) => {
    const meta = getTypeMeta(item);
    return (
      <View style={styles.txCard}>
        {/* Icon circle */}
        <View style={[styles.txIconCircle, { backgroundColor: meta.color + '20' }]}>
          <Icon name={meta.icon} size={22} color={meta.color} />
        </View>

        {/* Info */}
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>
            {item.description || meta.label}
          </Text>
          <Text style={styles.txDate}>{formatDate(item.date || item.createdAt)}</Text>
        </View>

        {/* Amount */}
        <Text style={[styles.txAmount, { color: meta.color }]}>
          {meta.sign}₹{Math.abs(item.amount || 0)}
        </Text>
      </View>
    );
  };

  /* ── Header ── */
  const ListHeader = (
    <>
      {/* Balance Card */}
      <LinearGradient
        colors={['#F59E0B', '#D97706', '#B45309']}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.balanceCardTop}>
          <Image
            source={require('../assets/images/app_logo.png')}
            style={styles.cardLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.cardBrandLabel}>NXL CREDITS</Text>
            <Text style={styles.cardSubLabel}>METROGEIA</Text>
          </View>
        </View>

        <Text style={styles.balanceAmount}>{'\u20B9'}{nxlBalance}</Text>
        <Text style={styles.balanceLabel}>Available Balance</Text>

        <View style={styles.cardDivider} />

        <View style={styles.lifetimeRow}>
          <Icon name="trophy-outline" size={16} color="rgba(255,255,255,0.85)" />
          <Text style={styles.lifetimeText}>
            Lifetime Earned: <Text style={{ fontWeight: '900' }}>₹{lifetimeEarned}</Text>
          </Text>
        </View>
      </LinearGradient>

      {/* How to earn hint */}
      <View style={styles.hintCard}>
        <Icon name="information-outline" size={18} color="#F59E0B" />
        <Text style={styles.hintText}>
          You earn NXL cashback on every ticket purchase & shop transaction at METROGEIA.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Cashback History</Text>
    </>
  );

  const ListEmpty = !loading ? (
    <View style={styles.emptyContainer}>
      <Icon name="cash-refund" size={56} color={COLORS.textLight} />
      <Text style={styles.emptyText}>No cashback yet</Text>
      <Text style={styles.emptySub}>
        Book a ticket to earn your first NXL cashback!
      </Text>
      {error && <Text style={[styles.emptySub, { color: '#EF4444', marginTop: 6 }]}>{error}</Text>}
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.background}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>NXL CREDITS</Text>
        <View style={{ width: 42 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={[styles.emptySub, { marginTop: 12 }]}>Loading your credits…</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, i) => (item._id || item.id || i).toString()}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F59E0B"
              colors={['#F59E0B']}
            />
          }
        />
      )}
    </View>
  );
}

const getStyles = (COLORS, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 50, paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.cardBg,
  },
  topTitle: { fontSize: 15, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },

  listContent: { padding: 16, paddingBottom: 40 },

  /* Balance card */
  balanceCard: {
    borderRadius: 24, padding: 22, marginBottom: 14,
    elevation: 8, shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10,
  },
  balanceCardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  cardLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', padding: 2 },
  cardBrandLabel: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  cardSubLabel:   { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1 },
  balanceAmount: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: 1 },
  balanceLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  cardDivider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 14,
  },
  lifetimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lifetimeText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },

  /* Hint */
  hintCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.07)',
    borderRadius: 14, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  hintText: { flex: 1, color: COLORS.textLight, fontSize: 12, lineHeight: 18 },

  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 12,
  },

  /* Transaction row */
  txCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  txIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  txDate: { fontSize: 11, color: COLORS.textLight, marginTop: 3 },
  txAmount: { fontSize: 16, fontWeight: '900' },

  /* Empty */
  emptyContainer: {
    alignItems: 'center', paddingVertical: 50,
  },
  emptyText: {
    fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 14,
  },
  emptySub: {
    fontSize: 13, color: COLORS.textLight,
    textAlign: 'center', marginTop: 6, paddingHorizontal: 28, lineHeight: 20,
  },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
