import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, Modal, Image, Animated, Easing
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { authStart, authSuccess, authFailure, clearError } from '../redux/slices/authSlice';
import api from '../api/axiosConfig';
import { storage } from '../utils/storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const getTABS = (t) => [
  { key: 'passenger', label: t('login.tabPassenger'), icon: 'train-car' },
  { key: 'merchant', label: t('login.tabMerchant'), icon: 'storefront-outline' },
];

export default function LoginScreen() {
  const { theme: COLORS, isDark, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const t = i18n.getFixedT('en');
  const TABS = getTABS(t);
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  
  const [activeTab, setActiveTab] = useState('passenger');
  const [isRegister, setIsRegister] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Used for Merchant/Admin login and Merchant register
  const [name, setName] = useState(''); // Passenger/Merchant Name
  const [phone, setPhone] = useState(''); // Merchant Phone
  const [shopName, setShopName] = useState(''); // Merchant Shop
  const [address, setAddress] = useState(''); // Merchant Address

  const [showPassword, setShowPassword] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false); // Hidden Admin Login

  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [logoAnim]);

  const dispatch = useDispatch();
  const navigation = useNavigation();
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
        dispatch(authFailure(res.data.message || t('login.errorSendOtp', {defaultValue: 'Failed to send OTP'})));
        Alert.alert(t('common.error'), res.data.message || t('login.errorSendOtp', {defaultValue: 'Failed to send OTP'}));
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('login.errorSendOtp', {defaultValue: 'Could not send OTP'});
      dispatch(authFailure(msg));
      Alert.alert(t('common.error'), msg);
    }
  };

  const handlePasswordLogin = async (role) => {
    if (!email || !password) return Alert.alert(t('common.error'), t('login.errorEmpty', {defaultValue: 'Please enter email and password.'}));
    
    dispatch(authStart());
    try {
      const res = await api.post('/auth/login-password', { email, password });
      if (res.data.success) {
        const userRole = res.data.user?.role;
        if (role === 'admin' && userRole !== 'admin') {
          dispatch(authFailure(t('login.errorAdminOnly', {defaultValue: 'Access Denied. Admins only.'})));
          Alert.alert(t('common.error'), t('login.errorAdminOnly', {defaultValue: 'Access Denied. Admins only.'}));
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
        dispatch(authFailure(res.data.message || t('login.errorLoginFailed', {defaultValue: 'Login failed'})));
        Alert.alert(t('login.errorLoginFailed', {defaultValue: 'Login Failed'}), res.data.message || t('login.errorInvalid', {defaultValue: 'Invalid credentials'}));
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('login.errorInvalid', {defaultValue: 'Invalid credentials'});
      dispatch(authFailure(msg));
      Alert.alert(t('login.errorLoginFailed', {defaultValue: 'Login Failed'}), msg);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.gradient}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

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
              <View style={styles.logoBg}>
                <Animated.Image 
                  source={require('../assets/images/app_logo.png')} 
                  style={[
                    styles.logoImage,
                    { transform: [{ rotate: logoAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }
                  ]} 
                  resizeMode="contain" 
                />
              </View>
              <Text style={styles.title}><Text style={{ color: '#EF4444' }}>METRO</Text><Text style={{ color: '#000000' }}>XIA</Text></Text>
              <Text style={styles.subtitle}>{t('login.appSubtitle')}</Text>
            </TouchableOpacity>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isRegister ? t('login.register') : t('login.signIn')}</Text>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => { setActiveTab(tab.key); setIsRegister(false); }}
                >
                  <Icon name={tab.icon} size={16} color={activeTab === tab.key ? COLORS.primary : '#888888'} />
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Toggle Login/Register */}
            <View style={styles.toggleRow}>
              <TouchableOpacity onPress={() => setIsRegister(false)}>
                <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>{t('login.toggleLogin')}</Text>
              </TouchableOpacity>
              <View style={styles.toggleDivider} />
              <TouchableOpacity onPress={() => setIsRegister(true)}>
                <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>{t('login.toggleRegister')}</Text>
              </TouchableOpacity>
            </View>

            {/* Common Email Field */}
            <Text style={styles.label}>{t('login.emailLabel')}</Text>
            <View style={styles.inputRow}>
              <Icon name="email-outline" size={20} color="#00C9A7" />
              <TextInput
                style={styles.input}
                placeholder={t('login.emailPlaceholder')}
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
                <Text style={styles.label}>{t('login.nameLabel')}</Text>
                <View style={styles.inputRow}>
                  <Icon name="account-outline" size={20} color="#00C9A7" />
                  <TextInput
                    style={styles.input}
                    placeholder={t('login.namePlaceholder')}
                    placeholderTextColor="#AAAAAA"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                
                <Text style={styles.label}>{t('login.phoneLabel')}</Text>
                <View style={styles.inputRow}>
                  <Icon name="phone-outline" size={20} color="#00C9A7" />
                  <TextInput
                    style={styles.input}
                    placeholder={t('login.phonePlaceholder')}
                    placeholderTextColor="#AAAAAA"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={styles.label}>{t('login.passwordLabel')}</Text>
                <View style={styles.inputRow}>
                  <Icon name="lock-outline" size={20} color="#00C9A7" />
                  <TextInput
                    style={styles.input}
                    placeholder={t('login.passwordPlaceholder')}
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
                <Text style={styles.label}>{t('login.nameLabel')}</Text>
                <View style={styles.inputRow}>
                  <Icon name="account-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder={t('login.ownerNamePlaceholder')} placeholderTextColor="#AAAAAA" value={name} onChangeText={setName} />
                </View>
                <Text style={styles.label}>{t('login.shopNameLabel')}</Text>
                <View style={styles.inputRow}>
                  <Icon name="storefront-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder={t('login.shopNamePlaceholder')} placeholderTextColor="#AAAAAA" value={shopName} onChangeText={setShopName} />
                </View>
                <Text style={styles.label}>{t('login.phoneLabel')}</Text>
                <View style={styles.inputRow}>
                  <Icon name="phone-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder={t('login.phonePlaceholder')} placeholderTextColor="#AAAAAA" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                </View>
                <Text style={styles.label}>{t('login.setPasswordLabel')}</Text>
                <View style={styles.inputRow}>
                  <Icon name="lock-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder={t('login.passwordPlaceholder')} placeholderTextColor={COLORS.textLight} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} /></TouchableOpacity>
                </View>
                <Text style={styles.label}>{t('login.addressLabel')}</Text>
                <View style={styles.inputRow}>
                  <Icon name="map-marker-outline" size={20} color="#3498DB" />
                  <TextInput style={styles.input} placeholder="Shop Address" placeholderTextColor="#AAAAAA" value={address} onChangeText={setAddress} />
                </View>
              </>
            )}

            {/* Merchant Login Field */}
            {activeTab === 'merchant' && !isRegister && (
              <>
                <Text style={styles.label}>{t('login.adminPasswordLabel')}</Text>
                <View style={styles.inputRow}>
                  <Icon name="lock-outline" size={20} color="#3498DB" />
                  <TextInput
                    style={styles.input}
                    placeholder={t('login.passwordPlaceholder')}
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
                  {loading ? <ActivityIndicator color="#fff" /> : <><Icon name="login" size={18} color="#fff" /><Text style={styles.btnText}>{t('login.loginBtn')}</Text></>}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={loading}>
                <LinearGradient colors={activeTab === 'merchant' ? ['#1976D2', '#1565C0'] : [COLORS.secondary, COLORS.secondary]} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <><Icon name="message-text-outline" size={18} color="#fff" /><Text style={styles.btnText}>{t('login.sendOtpBtn')}</Text></>}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.footer}>{t('login.footer')}</Text>
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
              <Text style={styles.adminTitle}>{t('login.adminPortal')}</Text>
            </View>
            <Text style={styles.label}>{t('login.adminEmailLabel')}</Text>
            <View style={styles.inputRow}>
              <Icon name="email-outline" size={20} color="#9B59B6" />
              <TextInput style={styles.input} placeholder="admin@metro.com" placeholderTextColor="#AAAAAA" value={email} onChangeText={setEmail} autoCapitalize="none" />
            </View>
            <Text style={styles.label}>{t('login.adminPasswordLabel')}</Text>
            <View style={styles.inputRow}>
              <Icon name="lock-outline" size={20} color="#9B59B6" />
              <TextInput style={styles.input} placeholder={t('login.adminPasswordPlaceholder')} placeholderTextColor={COLORS.textLight} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => handlePasswordLogin('admin')} disabled={loading}>
              <LinearGradient colors={[COLORS.primary, COLORS.primary]} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Icon name="login" size={18} color="#fff" /><Text style={styles.btnText}>{t('login.adminAuthBtn')}</Text></>}
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
  logoBg: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, padding: 8 },
  logoImage: { width: '100%', height: '100%' },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: 3 },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 4, letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: COLORS.border, elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  cardTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 18, textAlign: 'center', letterSpacing: 0.5 },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: 12, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 5 },
  tabActive: { backgroundColor: 'rgba(13,71,161,0.12)' },
  tabText: { fontSize: 13, color: COLORS.textLight, fontWeight: '700' },
  tabTextActive: { color: COLORS.primary },
  
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
