import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { authAPI } from '../api/authAPI';
import { updateProfileSuccess, logout } from '../redux/slices/authSlice';
import { storage } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const { theme: COLORS, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name field cannot be left blank.');
      return;
    }
    setLoading(true);
    try {
      let updatedUser = { ...user, name, email, phone };
      try {
        await authAPI.updateProfile({ name, email, phone });
      } catch (e) {
        console.warn('API update failed, updating local state only.', e);
      }
      await storage.saveUser(updatedUser);
      dispatch(updateProfileSuccess(updatedUser));
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to end your current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await storage.clearAll();
              dispatch(logout());
            } catch (err) {
              console.error('Error during logout', err);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    { icon: 'ticket-confirmation-outline', title: 'My Tickets', subtitle: 'View booking history and QR codes', screen: 'TicketsTab' },
    { icon: 'wallet-outline', title: 'Wallet Balances', subtitle: 'Recharge card or check statements', screen: 'WalletTab' },
    { icon: 'bell-outline', title: 'Notifications', subtitle: 'Check metro updates and announcements', screen: 'Notifications' },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Reach out for billing or transit inquiries', screen: 'HelpSupport' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'MT';

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00C9A7" />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <LinearGradient
            colors={[COLORS.secondary, COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>

          {!isEditing ? (
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || 'Metro Traveler'}</Text>
              <Text style={styles.userPhone}>+91 {user?.phone || '9999999999'}</Text>
              {user?.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <LinearGradient
                  colors={[COLORS.secondary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.editButton}
                >
                  <Icon name="pencil" size={16} color="#fff" />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editForm}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#AAAAAA"
              />
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="Enter mobile number"
                placeholderTextColor="#AAAAAA"
              />
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email address"
                placeholderTextColor="#AAAAAA"
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setName(user?.name || '');
                    setPhone(user?.phone || '');
                    setEmail(user?.email || '');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveProfile} style={{ flex: 1 }}>
                  <LinearGradient
                    colors={[COLORS.secondary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuIconWrap}>
                <Icon name={item.icon} size={22} color="#00C9A7" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Icon name="chevron-right" size={22} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
            <View style={[styles.menuIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(106,27,154,0.15)' }]}>
              <Icon name={isDark ? "weather-sunny" : "weather-night"} size={22} color={isDark ? "#F59E0B" : "#6A1B9A"} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Theme Mode</Text>
              <Text style={styles.menuSubtitle}>Currently: {isDark ? 'Dark Mode' : 'Light Mode'}</Text>
            </View>
            <Icon name="chevron-right" size={22} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out of Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 40 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,26,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  avatarCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '900' },
  profileInfo: { alignItems: 'center', width: '100%' },
  userName: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  userPhone: { fontSize: 16, fontWeight: '600', color: COLORS.textLight, marginBottom: 2 },
  userEmail: { fontSize: 14, color: COLORS.textLight, marginBottom: 20 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  editButtonText: { color: '#fff', fontWeight: '800', marginLeft: 8, fontSize: 14 },
  editForm: { width: '100%' },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.inputText,
    fontWeight: '500'
  },
  editActions: { flexDirection: 'row', gap: 14, marginTop: 24 },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: { fontWeight: '800', color: COLORS.textLight, fontSize: 15 },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  menuCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,201,167,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  menuSubtitle: { fontSize: 13, color: COLORS.textLight },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 20,
    paddingVertical: 18,
    backgroundColor: 'rgba(239,68,68,0.1)',
    gap: 10,
  },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 16 },
});
