import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, Modal
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, clearError } from '../redux/slices/authSlice';
import api from '../api/axiosConfig';
import { storage } from '../utils/storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const TABS = [
  { key: 'passenger', label: 'Passenger', icon: 'account-outline' },
  { key: 'merchant', label: 'Merchant', icon: 'storefront-outline' },
];

export default function LoginScreen({ navigation }) {
  const { theme: COLORS, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  
  const [activeTab, setActiveTab] = useState('passenger');
  const [isRegister, setIsRegister] = useState(false); // Toggle between Login and Register
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Used for Merchant/Admin login and Merchant register
  const [name, setName] = useState(''); // Passenger/Merchant Name
  const [phone, setPhone] = useState(''); // Merchant Phone
  const [shopName, setShopName] = useState(''); // Merchant Shop
  const [address, setAddress] = useState(''); // Merchant Address

  const [showPassword, setShowPassword] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false); // Hidden Admin Login

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleSendOTP = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email.');
    if (isRegister) {
      if (activeTab === 'passenger' && (!name || !phone || !password)) return Alert.alert('Error', 'Please fill all fields (Name, Phone, Password).');
      if (activeTab === 'merchant' && (!name || !shopName || !phone || !password)) {
        return Alert.alert('Error', 'Please fill all merchant fields.');
      }
    }

    dispatch(authStart());
    try {
      const res = await api.post('/auth/send-otp', { email, isRegister });
      if (res.data.success) {
        dispatch(authFailure(null));
        navigation.navigate('OTP', { 
          email, name, phone, shopName, password, address, 
          role: activeTab === 'passenger' ? 'user' : activeTab, isRegister 
        });
      } else {
        dispatch(authFailure(res.data.message || 'Failed to send OTP'));
        Alert.alert('Error', res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not send OTP';
      dispatch(authFailure(msg));
      Alert.alert('Error', msg);
    }
  };

  const handlePasswordLogin = async (role) => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password.');
    
    dispatch(authStart());
    try {
      const res = await api.post('/auth/login-password', { email, password });
      if (res.data.success) {
        const userRole = res.data.user?.role;
        if (role === 'admin' && userRole !== 'admin') {
          dispatch(authFailure('Access Denied. Admins only.'));
          Alert.alert('Error', 'Access Denied. Admins only.');
          return;
        }
        await storage.saveToken(res.data.token);
        if (res.data.refreshToken) await storage.saveRefreshToken(res.data.refreshToken);
        await storage.saveUser(res.data.user);

        dispatch(authSuccess({ 
          user: res.data.user, 
          token: res.data.token, 
          refreshToken: res.data.refreshToken 
        }));
        setAdminModalVisible(false);
      } else {
        dispatch(authFailure(res.data.message || 'Login failed'));
        Alert.alert('Login Failed', res.data.message || 'Invalid credentials');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      dispatch(authFailure(msg));
      Alert.alert('Login Failed', msg);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.gradient}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
        <Icon name={isDark ? 'weather-sunny' : 'weather-night'} size={22} color={COLORS.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo Area - Long press for Admin Login */}
          <View style={styles.logoArea}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onLongPress={() => setAdminModalVisible(true)} 
              delayLongPress={1000}
              style={{ alignItems: 'center' }}
            >
              <LinearGradient colors={[COLORS.secondary, COLORS.primary]} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Icon name="subway-variant" size={44} color="#fff" />
              </LinearGradient>
              <Text style={styles.title}>PUNE METRO</Text>
              <Text style={styles.subtitle}>आली आपली मेट्रो 🚇</Text>
            </TouchableOpacity>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isRegister ? 'Register' : 'Sign In'}</Text>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => { setActiveTab(tab.key); setIsRegister(false); }}
                >
                  <Icon name={tab.icon} size={16} color={activeTab === tab.key ? '#00897B' : '#888888'} />
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Toggle Login/Register */}
            <View style={styles.toggleRow}>
              <TouchableOpacity onPress={() => setIsRegister(false)}>
                <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>Login</Text>
              </TouchableOpacity>
              <View style={styles.toggleDivider} />
              <TouchableOpacity onPress={() => setIsRegister(true)}>
                <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Common Email Field */}
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Icon name="email-outline" size={20} color="#00C9A7" />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#AAAAAA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Passenger Register Fields */}
            {activeTab === 'passenger' && isRegister && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Icon name="account-outline" size={20} color="#00C9A7" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#AAAAAA"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputRow}>
                  <Icon name="phone-outline" size={20} color="#00C9A7" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter mobile number"
                    placeholderTextColor="#AAAAAA"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={styles.label}>Create Password</Text>
                <View style={styles.inputRow}>
                  <Icon name="lock-outline" size={20} color="#00C9A7" />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor={COLORS.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Merchant Register Fields */}
            {activeTab === 'merchant' && isRegister && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Icon name="account-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder="Owner Name" placeholderTextColor="#AAAAAA" value={name} onChangeText={setName} />
                </View>
                <Text style={styles.label}>Shop Name</Text>
                <View style={styles.inputRow}>
                  <Icon name="storefront-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder="Business Name" placeholderTextColor="#AAAAAA" value={shopName} onChangeText={setShopName} />
                </View>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputRow}>
                  <Icon name="phone-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#AAAAAA" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                </View>
                <Text style={styles.label}>Set Password</Text>
                <View style={styles.inputRow}>
                  <Icon name="lock-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder="Create password" placeholderTextColor={COLORS.textLight} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} /></TouchableOpacity>
                </View>
                <Text style={styles.label}>Address (Optional)</Text>
                <View style={styles.inputRow}>
                  <Icon name="map-marker-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder="Shop Address" placeholderTextColor="#AAAAAA" value={address} onChangeText={setAddress} />
                </View>
              </>
            )}

            {/* Merchant Login Field */}
            {activeTab === 'merchant' && !isRegister && (
              <>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputRow}>
                  <Icon name="lock-outline" size={20} color="#3498DB" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor={COLORS.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Action Buttons */}
            {(!isRegister && activeTab === 'merchant') ? (
              <TouchableOpacity style={styles.btn} onPress={() => handlePasswordLogin('merchant')} disabled={loading}>
                <LinearGradient colors={['#1976D2', '#1565C0']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <><Icon name="login" size={18} color="#fff" /><Text style={styles.btnText}>Login</Text></>}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={loading}>
                <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <><Icon name="message-text-outline" size={18} color="#fff" /><Text style={styles.btnText}>Send OTP</Text></>}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.footer}>Pune Metro Rail Corporation Ltd.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Admin Login Modal (Hidden) */}
      <Modal visible={adminModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.adminCard}>
            <TouchableOpacity style={styles.closeAdmin} onPress={() => setAdminModalVisible(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.adminHeader}>
              <Icon name="shield-lock-outline" size={40} color="#9B59B6" />
              <Text style={styles.adminTitle}>Admin Portal</Text>
            </View>
            <Text style={styles.label}>Admin Email</Text>
            <View style={styles.inputRow}>
              <Icon name="email-outline" size={20} color="#9B59B6" />
              <TextInput style={styles.input} placeholder="admin@metro.com" placeholderTextColor="#AAAAAA" value={email} onChangeText={setEmail} autoCapitalize="none" />
            </View>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Icon name="lock-outline" size={20} color="#9B59B6" />
              <TextInput style={styles.input} placeholder="Enter admin password" placeholderTextColor={COLORS.textLight} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => handlePasswordLogin('admin')} disabled={loading}>
              <LinearGradient colors={[COLORS.primary, COLORS.primary]} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Icon name="login" size={18} color="#fff" /><Text style={styles.btnText}>Authenticate</Text></>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 65, paddingBottom: 30 },
  themeToggle: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 35,
    right: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 14, elevation: 12 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: 3 },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4, letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: COLORS.border, elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  cardTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 18, textAlign: 'center', letterSpacing: 0.5 },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: 12, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 5 },
  tabActive: { backgroundColor: 'rgba(0,137,123,0.15)' },
  tabText: { fontSize: 13, color: COLORS.textLight, fontWeight: '700' },
  tabTextActive: { color: COLORS.secondary },
  
  toggleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, gap: 15 },
  toggleText: { fontSize: 15, color: COLORS.textLight, fontWeight: '700' },
  toggleTextActive: { color: COLORS.text, fontWeight: '900' },
  toggleDivider: { width: 2, height: 16, backgroundColor: COLORS.border },

  label: { fontSize: 13, color: COLORS.textLight, marginBottom: 6, marginTop: 14, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 12, paddingHorizontal: 14, height: 52, gap: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.inputText },
  btn: { marginTop: 24, borderRadius: 14, overflow: 'hidden', elevation: 5 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  footer: { textAlign: 'center', color: COLORS.textLight, marginTop: 28, fontSize: 12, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  adminCard: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(155,89,182,0.3)', position: 'relative' },
  closeAdmin: { position: 'absolute', top: 15, right: 15, zIndex: 10, padding: 5 },
  adminHeader: { alignItems: 'center', marginBottom: 20 },
  adminTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 10, letterSpacing: 1 }
});
