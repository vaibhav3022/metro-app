import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function LoadingSpinner({ visible = false, message = 'Loading...' }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: COLORS.cardBg,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    minWidth: 140,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
});
