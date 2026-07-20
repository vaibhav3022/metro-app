import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import DatePickerModal from '../components/DatePickerModal';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../api/authAPI';
import { updateProfileSuccess, logout } from '../redux/slices/authSlice';
import { storage } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileScreen() {
  const { theme: COLORS, isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [dob, setDob] = useState(
    user?.dob ? new Date(user.dob) : new Date(2000, 0, 1)
  );
  const [dobText, setDobText] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync dobText with dob
  React.useEffect(() => {
    setDobText(formatDate(dob));
  }, [dob]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), 'Name field cannot be left blank.');
      return;
    }
    setLoading(true);
    try {
      // Ensure dob is updated from dobText if valid
      let finalDobStr = formatDate(dob);
      const parsedDob = new Date(dobText);
      if (!isNaN(parsedDob)) {
        finalDobStr = formatDate(parsedDob);
        setDob(parsedDob);
      }
      
      let updatedUser = { ...user, name, email, phone, gender, dob: finalDobStr };
      try {
        await authAPI.updateProfile({ name, email, phone, gender, dob: finalDobStr, language });
      } catch (e) {
        console.warn('API update failed, updating local state only.', e);
      }
      await storage.saveUser(updatedUser);
      dispatch(updateProfileSuccess(updatedUser));
      setIsEditing(false);
      Alert.alert(t('common.success'), 'Profile updated successfully.');
    } catch (error) {
      Alert.alert(t('common.error'), 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      'Are you sure you want to end your current session?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
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
    { icon: 'ticket-confirmation-outline', title: t('profile.myTickets'), subtitle: t('profile.myTicketsSub'), screen: 'TicketsTab' },
    { icon: 'wallet-outline', title: t('profile.wallet'), subtitle: t('profile.walletSub'), screen: 'Wallet' },
    { icon: 'bell-outline', title: t('profile.notifications'), subtitle: t('profile.notificationsSub'), screen: 'Notifications' },
    { icon: 'help-circle-outline', title: t('profile.helpSupport'), subtitle: t('profile.helpSupportSub'), screen: 'HelpSupport' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'MT';



  const languageOptions = [
    { key: 'mr', label: 'मराठी', nativeLabel: 'Marathi', icon: 'translate' },
    { key: 'hi', label: 'हिंदी', nativeLabel: 'Hindi', icon: 'translate' },
    { key: 'en', label: 'English', nativeLabel: 'English', icon: 'translate' },
  ];

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
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
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

              <View style={styles.infoBadgeRow}>
                <View style={styles.infoBadge}>
                  <Icon name="gender-male-female" size={14} color={COLORS.textLight} />
                  <Text style={styles.infoBadgeText}>{user?.gender || 'Male'}</Text>
                </View>
                <View style={styles.infoBadge}>
                  <Icon name="calendar-range" size={14} color={COLORS.textLight} />
                  <Text style={styles.infoBadgeText}>{user?.dob || '2000-01-01'}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.editButton, { marginTop: 24 }]}
                >
                  <Icon name="pencil" size={16} color="#fff" />
                  <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editForm}>
              {/* Name */}
              <Text style={styles.fieldLabel}>{t('profile.name')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#AAAAAA"
              />

              {/* Mobile */}
              <Text style={styles.fieldLabel}>{t('profile.mobile')}</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="Enter mobile number"
                placeholderTextColor="#AAAAAA"
              />

              {/* Email */}
              <Text style={styles.fieldLabel}>{t('profile.email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email address"
                placeholderTextColor="#AAAAAA"
              />



              {/* Language Selection */}
              <Text style={styles.fieldLabel}>{t('profile.language')}</Text>
              <View style={styles.optionRow}>
                {languageOptions.map(lang => {
                  const active = language === lang.key;
                  return (
                    <TouchableOpacity
                      key={lang.key}
                      style={[styles.optionBox, active && styles.optionBoxActive]}
                      onPress={() => setLanguage(lang.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkBoxSquare, active && styles.radioCircleActive]}>
                        {active && <View style={styles.checkIconWrapper}><Icon name="check" size={14} color={COLORS.primary} /></View>}
                      </View>
                      <Text style={[styles.optionLangMain, active && styles.optionLabelActive, { fontSize: 13 }]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date of Birth — Manual + Calendar Picker */}
              <Text style={styles.fieldLabel}>{t('profile.dob')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={dobText}
                  onChangeText={setDobText}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#AAAAAA"
                />
                <DatePickerModal
                  value={dob}
                  onChange={(picked) => {
                    setDob(picked);
                    setDobText(formatDate(picked));
                  }}
                  COLORS={COLORS}
                  hideText={true}
                />
              </View>

              {/* Actions */}
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setName(user?.name || '');
                    setPhone(user?.phone || '');
                    setEmail(user?.email || '');
                    setGender(user?.gender || 'Male');
                    setDob(user?.dob ? new Date(user.dob) : new Date(2000, 0, 1));
                  }}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveProfile} style={{ flex: 1 }}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>{t('profile.quickLinks')}</Text>
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
              <Icon name="chevron-right" size={22} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
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
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 16,
    marginTop: 16,
  },
  editButtonText: { color: '#fff', fontWeight: '800', marginLeft: 8, fontSize: 15 },

  // Edit Form
  editForm: { width: '100%' },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 18,
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
    fontWeight: '500',
  },

  // Radio Checkbox Option boxes (gender + language)
  optionRow: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 4 },
  optionBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 4,
  },
  optionBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '12',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  checkBoxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  checkIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    textAlign: 'center',
  },
  optionLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  optionLangMain: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textLight,
    textAlign: 'center',
  },
  optionLangSub: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
    opacity: 0.7,
  },

  // Date Picker
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.inputText,
    fontWeight: '600',
  },

  editActions: { flexDirection: 'row', gap: 14, marginTop: 26 },
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

  // Section titles
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 6,
  },

  // Menu
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
    marginRight: 14,
  },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: COLORS.textLight },

  // Language section inside preferences card
  langSection: { padding: 18 },
  langHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },

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
  infoBadgeRow: { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'center', marginBottom: 4 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 5, borderWidth: 1, borderColor: COLORS.border },
  infoBadgeText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
});
