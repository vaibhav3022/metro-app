import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../constants/colors';

export default function EmptyState({ icon, title, message }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={60} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0, 102, 204, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 10, textAlign: 'center' },
  message: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22 }
});
