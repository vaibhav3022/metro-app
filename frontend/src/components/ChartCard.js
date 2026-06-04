import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import COLORS from '../constants/colors';

export default function ChartCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, padding: 16, borderRadius: 16, elevation: 2, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  chartContainer: { alignItems: 'center', justifyContent: 'center' }
});
