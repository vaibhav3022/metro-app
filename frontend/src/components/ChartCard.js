import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ChartCard({ title, children }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {children}
      </View>
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  card: { backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 16, elevation: 2, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  chartContainer: { alignItems: 'center', justifyContent: 'center' }
});
