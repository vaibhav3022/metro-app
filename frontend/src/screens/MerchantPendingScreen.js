// MerchantPendingScreen.js – Shown when a merchant's account is pending approval
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

export default function MerchantPendingScreen({ navigation }) {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await require('../utils/storage').storage.clearAll();
    dispatch(logout());
  };

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Merchant Account Pending</Text>
        <Text style={styles.message}>
          Your merchant registration is under review. Once approved by an admin, you will be able to access the merchant dashboard.
        </Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: width * 0.85,
    backgroundColor: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  message: { fontSize: 16, color: '#e0e0e0', textAlign: 'center', marginBottom: 24 },
  logoutBtn: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
