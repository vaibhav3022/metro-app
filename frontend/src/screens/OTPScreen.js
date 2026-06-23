import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, clearError } from '../redux/slices/authSlice';
import api from '../api/axiosConfig';
import { storage } from '../utils/storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function OTPScreen({ route, navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  
  const { email, name, phone, shopName, password, address, role, isRegister } = route.params || {};
  const [otp, setOtp] = useState('');
  
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP.');
      return;
    }
    
    dispatch(authStart());
    try {
      const payload = { email, otp, name, phone, shopName, password, address, role, isRegister };
      const res = await api.post('/auth/verify-otp', payload);
      
      if (res.data.success) {
        await storage.saveToken(res.data.token);
        if (res.data.refreshToken) await storage.saveRefreshToken(res.data.refreshToken);
        await storage.saveUser(res.data.user);
        
        dispatch(authSuccess({ 
          user: res.data.user, 
          token: res.data.token, 
          refreshToken: res.data.refreshToken 
        }));
        // Redux will update auth state and App.js will navigate to Home automatically
      } else {
        dispatch(authFailure(res.data.message || 'Invalid OTP'));
        Alert.alert('Verification Failed', res.data.message || 'Invalid OTP');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      dispatch(authFailure(msg));
      Alert.alert('Verification Failed', msg);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <LinearGradient colors={[COLORS.secondary, COLORS.primary]} style={styles.iconContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Icon name="message-processing-outline" size={50} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>We sent a 6-digit verification code to</Text>
          <Text style={styles.emailText}>{email}</Text>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Enter Code</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor="#AAAAAA"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={loading}>
              <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.primaryButtonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 50 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 20 },
  iconContainer: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 8 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 10, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', fontWeight: '500' },
  emailText: { fontSize: 16, fontWeight: '800', color: '#00C9A7', marginBottom: 30, marginTop: 5 },
  formContainer: { width: '100%', backgroundColor: COLORS.cardBg, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textLight, marginBottom: 12, textAlign: 'center' },
  inputContainer: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 16, height: 70, justifyContent: 'center' },
  input: { fontSize: 32, color: COLORS.inputText, fontWeight: '900' },
  primaryButton: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  primaryButtonGrad: { height: 55, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 }
});
