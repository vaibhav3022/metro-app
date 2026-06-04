import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../constants/colors';

export default function ToastMessage({ message, type = 'success', onHide }) {
  const translateY = new Animated.Value(-100);

  useEffect(() => {
    Animated.timing(translateY, { toValue: 50, duration: 300, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }).start(() => {
        if (onHide) onHide();
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const bgColor = type === 'success' ? COLORS.success : type === 'error' ? COLORS.danger : COLORS.primary;
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'information';

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], backgroundColor: bgColor }]}>
      <MaterialCommunityIcons name={icon} size={24} color={COLORS.white} style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 20, right: 20, zIndex: 1000,
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84
  },
  icon: { marginRight: 12 },
  message: { color: COLORS.white, fontSize: 14, fontWeight: '600', flex: 1 }
});
