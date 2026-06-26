import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

export default function WalletCard({ balance = 0, onAddMoney, onScanQR }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  return (
    <LinearGradient
      colors={[COLORS.primary, '#004A99']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.leftInfo}>
          <MaterialCommunityIcons name="wallet" size={24} color={COLORS.white} />
          <Text style={styles.title}>METROGEIA Wallet</Text>
        </View>
        <MaterialCommunityIcons name="nfc" size={24} color="rgba(255, 255, 255, 0.4)" />
      </View>

      <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
      <View style={styles.balanceContainer}>
        <Text style={styles.currency}>₹</Text>
        <Text style={styles.balance}>{balance.toFixed(2)}</Text>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.cardHolder}>SMART PASS</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddMoney}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus-circle" size={16} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { marginLeft: 8 }]}
            onPress={onScanQR}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={16} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  balanceLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  currency: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: '700',
    marginRight: 4,
  },
  balance: {
    fontSize: 36,
    color: COLORS.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHolder: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
});
