import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axiosConfig';

export default function CountryEnquiryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme: COLORS } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  // Selected country details passed from route params
  const { country, initialVertical } = route.params || {};
  const countryName = country?.name || 'Unknown Country';

  // Get logged-in user profile from Redux to pre-fill
  const { user } = useSelector((state) => state.auth);

  const ENQUIRY_TYPES = [
    'General Enquiry',
    'Franchise for Energeia',
    'Franchise for Oasis T-cafe',
    'Franchise for Eva Salon',
    'Franchise for L.L. Beauty',
    'Franchise for Maytriya CoWork',
    'Franchise for Events',
    'Franchise for Nexus',
    'Franchise for Cybeorch Labs'
  ];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [enquiryType, setEnquiryType] = useState(
    initialVertical ? `Franchise for ${initialVertical}` : 'General Enquiry'
  );
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone.replace(/^\+91/, '')); // strip country code if present
    }
  }, [user]);

  const handleSubmit = async () => {
    // Basic validations
    if (!name.trim()) return Alert.alert('Validation Error', 'Please enter your name.');
    if (!email.trim() || !email.includes('@')) return Alert.alert('Validation Error', 'Please enter a valid email address.');
    if (!phone.trim() || phone.length < 8) return Alert.alert('Validation Error', 'Please enter a valid phone number.');
    if (!message.trim()) return Alert.alert('Validation Error', 'Please enter your enquiry message.');

    setLoading(true);
    try {
      const res = await api.post('/enquiries', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country: countryName,
        enquiryType: enquiryType,
        message: message.trim()
      });

      if (res.data.success) {
        Alert.alert(
          'Enquiry Submitted 🎉',
          res.data.message || 'Thank you for your enquiry. We will get back to you shortly!',
          [
            {
              text: 'Okay',
              onPress: () => {
                // Navigate back to the home screen
                navigation.navigate('Home');
              }
            }
          ]
        );
      } else {
        Alert.alert('Submission Failed', res.data.message || 'Failed to submit enquiry.');
      }
    } catch (error) {
      console.error('Enquiry Submission Error:', error);
      const errMsg = error.response?.data?.message || 'Failed to connect to the server. Please try again.';
      Alert.alert('Submission Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Premium Header */}
      <LinearGradient
        colors={[COLORS.primary, '#1976D2']}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enquiry Form</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Target Country Badge Card */}
          <View style={styles.countryCard}>
            <Text style={styles.flagText}>{country?.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.countryLabel}>Selected Country</Text>
              <Text style={styles.countryVal}>{countryName}</Text>
            </View>
            <Icon name="earth" size={32} color={COLORS.primary} style={{ opacity: 0.15 }} />
          </View>

          {/* Form Fields Card */}
          <View style={styles.formCard}>
            <Text style={styles.formInstruction}>Please fill out the details below to submit your enquiry.</Text>

            {/* Name Input */}
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Icon name="account-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textLight + '99'}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email Input */}
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Icon name="email-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor={COLORS.textLight + '99'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Phone Input */}
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Icon name="phone-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                placeholderTextColor={COLORS.textLight + '99'}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Enquiry Type Dropdown Selector */}
            <Text style={styles.fieldLabel}>Type of Enquiry</Text>
            <TouchableOpacity 
              style={styles.dropdownBtn} 
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Icon name="tag-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <Text style={styles.dropdownBtnText}>
                {enquiryType}
              </Text>
              <Icon name={showTypeDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textLight} />
            </TouchableOpacity>

            {showTypeDropdown && (
              <View style={styles.dropdownList}>
                {ENQUIRY_TYPES.map((type) => (
                  <TouchableOpacity 
                    key={type} 
                    style={[
                      styles.dropdownItem,
                      enquiryType === type && styles.dropdownItemActive
                    ]}
                    onPress={() => {
                      setEnquiryType(type);
                      setShowTypeDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      enquiryType === type && styles.dropdownItemTextActive
                    ]}>
                      {type}
                    </Text>
                    {enquiryType === type && (
                      <Icon name="check" size={16} color={COLORS.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Message Input */}
            <Text style={styles.fieldLabel}>Enquiry Message</Text>
            <View style={[styles.inputWrapper, styles.messageWrapper]}>
              <Icon name="message-text-outline" size={20} color={COLORS.textLight} style={[styles.inputIcon, { marginTop: 12 }]} />
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="How can we help you? Explain your query..."
                placeholderTextColor={COLORS.textLight + '99'}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primary, '#1976D2']}
                style={styles.submitGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="send" size={18} color="#fff" />
                    <Text style={styles.submitText}>Submit Enquiry</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  countryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    gap: 14,
  },
  flagText: {
    fontSize: 36,
  },
  countryLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countryVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  formInstruction: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg || '#F5F5F5',
    borderWidth: 1,
    borderColor: COLORS.inputBorder || '#DDDDDD',
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: COLORS.inputText || '#212121',
  },
  messageWrapper: {
    alignItems: 'flex-start',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  submitGrad: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg || '#F5F5F5',
    borderWidth: 1,
    borderColor: COLORS.inputBorder || '#DDDDDD',
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    justifyContent: 'space-between',
  },
  dropdownBtnText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.inputText || '#212121',
  },
  dropdownList: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 6,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '33',
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primary + '0c',
  },
  dropdownItemText: {
    fontSize: 13.5,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
