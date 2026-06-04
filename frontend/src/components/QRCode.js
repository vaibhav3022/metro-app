import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import QRCodeSVG from 'react-native-qrcode-svg';
import COLORS from '../constants/colors';

export default function QRCode({
  value,
  size = 200,
  logoSize = 40,
  loading = false
}) {
  if (loading) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!value) {
    return (
      <View style={[styles.container, { width: size, height: size, backgroundColor: '#E0E0E0' }]}>
        <Text style={styles.errorText}>No Data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <QRCodeSVG
        value={value}
        size={size}
        color={COLORS.text}
        backgroundColor={COLORS.white}
        enableLinearGradient={true}
        linearGradient={['#000000', COLORS.primary]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
});
