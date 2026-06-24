import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, SafeAreaView, Platform, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL } from '../api/axiosConfig';
import { useTranslation } from 'react-i18next';

const API_BASE = BASE_URL || 'http://10.0.2.2:5000';
const CATEGORIES = ['Grievance', 'Lost & Found', 'Suggestion', 'Other'];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const { t } = useTranslation();
  
  // Localized categories
  const localizedCategories = [
    t('help.categories.grievance'),
    t('help.categories.lostFound'),
    t('help.categories.suggestion'),
    t('help.categories.other')
  ];

  const [tab, setTab] = useState('New');
  const [category, setCategory] = useState(localizedCategories[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (tab === 'MyTickets') fetchComplaints();
  }, [tab]);

  const fetchComplaints = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_BASE}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMyComplaints(data.complaints);
    } catch (e) {
      setMyComplaints([
        { _id: '1', category: 'Lost & Found', description: 'Left umbrella on aqua line', status: 'Pending', createdAt: new Date().toISOString() },
        { _id: '2', category: 'Suggestion', description: 'Add more seats at Vanaz', status: 'Resolved', createdAt: new Date(Date.now() - 86400000).toISOString() }
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert(t('help.alert.validation'), t('help.alert.enterDesc'));
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_BASE}/api/complaints/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, description })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert(t('help.alert.success'), data.message || t('help.alert.submitted'));
        setDescription('');
        setTab('MyTickets');
      } else {
        Alert.alert(t('help.alert.error'), data.message || t('help.alert.failedSubmit'));
      }
    } catch (e) {
      Alert.alert(t('help.alert.success'), t('help.alert.mockSubmit'));
      setDescription('');
      setTab('MyTickets');
    }
    setLoading(false);
  };

  const getStatusColor = (status) =>
    status?.toLowerCase() === 'resolved' ? '#00C9A7' : '#f97316';
  const getStatusBg = (status) =>
    status?.toLowerCase() === 'resolved' ? 'rgba(0,201,167,0.1)' : 'rgba(249,115,22,0.1)';

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('help.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            {['New', 'MyTickets'].map(t_item => (
              <TouchableOpacity
                key={t_item}
                style={[styles.tab, tab === t_item && styles.tabActive]}
                onPress={() => setTab(t_item)}
              >
                <Text style={[styles.tabText, tab === t_item && styles.tabTextActive]}>
                  {t_item === 'New' ? t('help.newTicket') : t('help.myTickets')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {tab === 'New' ? (
            <View style={styles.card}>
              <View style={styles.headerIconWrap}>
                <Icon name="headset" size={32} color="#9B59B6" />
              </View>
              <Text style={styles.cardTitle}>{t('help.howCanWeHelp')}</Text>
              
              <Text style={styles.fieldLabel}>{t('help.selectCategory')}</Text>
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.categorySelectorText}>{category}</Text>
                <Icon name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={24} color={COLORS.textLight} />
              </TouchableOpacity>
              
              {showCategoryPicker && (
                <View style={styles.categoryOptions}>
                  {localizedCategories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryOption, cat === category && styles.categoryOptionActive]}
                      onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}
                    >
                      <Text style={[styles.categoryOptionText, cat === category && styles.categoryOptionTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.fieldLabel, { marginTop: 24 }]}>{t('help.description')}</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                placeholder={t('help.descriptionPlaceholder')}
                placeholderTextColor="#AAAAAA"
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitBtnWrap, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.submitBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <Text style={styles.submitBtnText}>{t('help.submitTicket')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {myComplaints.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Icon name="ticket-confirmation-outline" size={40} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'} />
                  </View>
                  <Text style={styles.emptyText}>{t('help.noTickets')}</Text>
                </View>
              ) : (
                myComplaints.map(c => (
                  <View key={c._id} style={styles.complaintCard}>
                    <View style={styles.complaintHeader}>
                      <View style={styles.categoryBadge}>
                        <Icon name="tag-outline" size={14} color="#00C9A7" style={{marginRight: 4}} />
                        <Text style={styles.categoryBadgeText}>{c.category}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBg(c.status) }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(c.status) }]}>
                          {c.status || t('help.pending')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.complaintDesc}>{c.description}</Text>
                    <View style={styles.complaintFooter}>
                      <Icon name="clock-outline" size={14} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'} style={{marginRight: 6}} />
                      <Text style={styles.complaintDate}>
                        {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  tabsContainer: { paddingHorizontal: 20, marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: 'rgba(0,201,167,0.2)' },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.textLight },
  tabTextActive: { color: '#00C9A7' },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  headerIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(155,89,182,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(155,89,182,0.3)' },
  cardTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 24 },
  
  fieldLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  categorySelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16 },
  categorySelectorText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  categoryOptions: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, marginTop: 8, overflow: 'hidden' },
  categoryOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  categoryOptionActive: { backgroundColor: 'rgba(0,201,167,0.15)' },
  categoryOptionText: { fontSize: 15, color: COLORS.textLight },
  categoryOptionTextActive: { color: '#00C9A7', fontWeight: '800' },
  
  textArea: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, fontSize: 16, color: COLORS.text, height: 150, marginBottom: 24 },
  submitBtnWrap: { borderRadius: 16, overflow: 'hidden' },
  submitBtnGrad: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 16, color: COLORS.textLight, fontWeight: '600' },
  
  complaintCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  complaintHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  categoryBadgeText: { fontSize: 12, fontWeight: '800', color: COLORS.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statusBadgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  complaintDesc: { fontSize: 15, color: COLORS.text, marginBottom: 16, lineHeight: 22 },
  complaintFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  complaintDate: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
});
