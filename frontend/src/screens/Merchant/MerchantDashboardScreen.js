import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, RefreshControl,
  ActivityIndicator, Dimensions, StatusBar, TouchableOpacity,
  Modal, FlatList, Platform, TextInput, Switch, Alert, BackHandler, Share, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useDispatch } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';
import DocumentPicker from 'react-native-document-picker';
import api, { API_BASE_URL } from '../../api/axiosConfig';
import { logout } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon, color, onPress, styles }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

export default function MerchantDashboardScreen({ navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const dispatch = useDispatch();

  // Core UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState('pending');
  const [hasDocs, setHasDocs] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, products, coupons, withdrawals, support, settings

  // Data states
  const [merchantProfile, setMerchantProfile] = useState(null);
  const [shopDetails, setShopDetails] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);

  // Modal / Form states
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', description: '', isAvailable: true });
  const [productImageFile, setProductImageFile] = useState(null);

  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [couponForm, setCouponForm] = useState({ title: '', discount: '', validUntil: '', applicableProducts: [] });
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [tempDate, setTempDate] = useState({ day: new Date().getDate(), month: new Date().getMonth(), year: new Date().getFullYear() });

  const [withdrawalForm, setWithdrawalForm] = useState({ amount: '', bankName: '', accountNumber: '', ifscCode: '' });
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [withdrawalStep, setWithdrawalStep] = useState(0);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [recentTxDetails, setRecentTxDetails] = useState(null);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [customerHistoryVisible, setCustomerHistoryVisible] = useState(false);
  const [salesHistoryVisible, setSalesHistoryVisible] = useState(false);
  const [ordersHistoryVisible, setOrdersHistoryVisible] = useState(false);
  const [chartTab, setChartTab] = useState('week');

  const [supportForm, setSupportForm] = useState({ subject: '', description: '', category: 'Merchant Support' });
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // Settings section modal: null | 'shopConfig' | 'account' | 'support'
  const [settingsModal, setSettingsModal] = useState(null);

  // File upload states for KYC
  const [aadharFile, setAadharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);

  // Shop banner image upload
  const [shopImageFile, setShopImageFile] = useState(null); // { uri, name, type }
  const [uploadingShopImage, setUploadingShopImage] = useState(false);

  const fetchData = async () => {
    try {
      const statusRes = await api.get('/merchant/status');
      setStatus(statusRes.data.status);
      setHasDocs(statusRes.data.hasDocuments);
      setMerchantProfile(statusRes.data.merchant);
      if (statusRes.data.rejectionReason) setRejectionReason(statusRes.data.rejectionReason);

      if (statusRes.data.status === 'approved') {
        const [dashRes, txRes, shopRes, withdrawalsRes, supportRes] = await Promise.all([
          api.get('/merchant/dashboard'),
          api.get('/merchant/transactions?limit=50'),
          api.get('/merchant/shop'),
          api.get('/merchant/withdrawals'),
          api.get('/merchant/support')
        ]);
        
        setDashboardData(dashRes.data);
        setTransactions(txRes.data.data || []);
        setShopDetails(shopRes.data.shop || shopRes.data.data);
        setWithdrawals(withdrawalsRes.data.data || []);
        setSupportTickets(supportRes.data.data || []);
      }
    } catch (err) {
      console.log('Error fetching merchant data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      // 1. If a settings sub-section modal is open, close it → stay on Settings
      if (settingsModal) {
        setSettingsModal(null);
        return true;
      }
      // 2. If on a non-home tab, go back to Home tab
      if (activeTab !== 'overview') {
        setActiveTab('overview');
        return true;
      }
      // 3. Otherwise let the OS handle it (navigate back / exit)
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [activeTab, settingsModal]);


  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await require('../../utils/storage').storage.clearAll();
    dispatch(logout());
  };

  // KYC File Selection
  const selectFile = async (type) => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf]
      });
      if (type === 'aadhar') setAadharFile(res);
      if (type === 'pan') setPanFile(res);
      if (type === 'photo') setPhotoFile(res);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick file');
      }
    }
  };

  // KYC Submit
  const handleKycSubmit = async () => {
    if (!aadharFile || !panFile || !photoFile) {
      return Alert.alert('Missing Documents', 'Please select all three KYC documents.');
    }

    setUploadingKyc(true);
    try {
      const formData = new FormData();
      formData.append('aadhar', {
        uri: aadharFile.uri,
        type: aadharFile.type || 'image/jpeg',
        name: aadharFile.name || 'aadhar.jpg'
      });
      formData.append('pan', {
        uri: panFile.uri,
        type: panFile.type || 'image/jpeg',
        name: panFile.name || 'pan.jpg'
      });
      formData.append('photo', {
        uri: photoFile.uri,
        type: photoFile.type || 'image/jpeg',
        name: photoFile.name || 'store.jpg'
      });

      const res = await api.post('/merchant/upload-kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        Alert.alert('Success', 'KYC documents uploaded successfully! Your profile is now under review.');
        fetchData();
      }
    } catch (err) {
      console.log('KYC Upload Error:', err);
      Alert.alert('Upload Failed', err.response?.data?.message || 'Failed to upload KYC documents.');
    } finally {
      setUploadingKyc(false);
    }
  };

  // Product Actions
  const openProductForm = (product = null) => {
    setProductImageFile(null); // reset image selection
    if (product) {
      setSelectedProduct(product);
      setProductForm({
        name: product.name,
        price: product.price.toString(),
        description: product.description || '',
        isAvailable: product.isAvailable !== false
      });
    } else {
      setSelectedProduct(null);
      setProductForm({ name: '', price: '', description: '', isAvailable: true });
    }
    setProductModalVisible(true);
  };

  const handleSaveProduct = async () => {
    const { name, price, description, isAvailable } = productForm;
    if (!name || !price) return Alert.alert('Validation Error', 'Name and price are required.');

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) return Alert.alert('Validation Error', 'Enter a valid price.');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', priceNum);
      if (description) formData.append('description', description);
      formData.append('isAvailable', isAvailable ? 'true' : 'false');
      
      if (productImageFile) {
        formData.append('productImage', {
          uri: productImageFile.uri,
          type: productImageFile.type || 'image/jpeg',
          name: productImageFile.name || 'product.jpg'
        });
      }

      if (selectedProduct) {
        await api.put(`/merchant/shop/product/${selectedProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/merchant/shop/product', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setProductModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to save product.');
      setLoading(false);
    }
  };

  const pickProductImage = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
      });
      setProductImageFile(res[0]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick image.');
      }
    }
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            await api.delete(`/merchant/shop/product/${productId}`);
            fetchData();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete product.');
            setLoading(false);
          }
        }
      }
    ]);
  };

  const openDatePicker = () => {
    const existing = couponForm.validUntil ? new Date(couponForm.validUntil) : new Date();
    setTempDate({ day: existing.getDate(), month: existing.getMonth(), year: existing.getFullYear() });
    setShowDatePickerModal(true);
  };

  const confirmDatePick = () => {
    const d = new Date(tempDate.year, tempDate.month, tempDate.day);
    setCouponForm(prev => ({ ...prev, validUntil: d.toISOString() }));
    setShowDatePickerModal(false);
  };

  // Coupon Actions
  const handleSaveCoupon = async () => {
    const { title, discount, validUntil, applicableProducts } = couponForm;
    if (!title || !discount) return Alert.alert('Error', 'Title and discount percentage are required.');

    setLoading(true);
    try {
      await api.post('/merchant/shop/offer', { title, discount, validUntil: validUntil || undefined, applicableProducts });
      setCouponModalVisible(false);
      setCouponForm({ title: '', discount: '', validUntil: '', applicableProducts: [] });
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create coupon.');
      setLoading(false);
    }
  };

  const handleDeleteCoupon = (couponId) => {
    Alert.alert('Delete Coupon', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            await api.delete(`/merchant/shop/offer/${couponId}`);
            fetchData();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete coupon.');
            setLoading(false);
          }
        }
      }
    ]);
  };

  // Withdrawal Submit
  const handleWithdrawalSubmit = async () => {
    const { amount, bankName, accountNumber, ifscCode } = withdrawalForm;
    if (!amount || !bankName || !accountNumber || !ifscCode) {
      return Alert.alert('Error', 'Please fill all banking fields.');
    }

    if (accountNumber !== confirmAccountNumber) {
      return Alert.alert('Mismatch', 'Account numbers do not match.');
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) return Alert.alert('Error', 'Enter a valid amount.');

    if (merchantProfile.balance < amtNum) {
      return Alert.alert('Insufficient Funds', `You only have ₹${merchantProfile.balance || 0} in your wallet.`);
    }

    setSubmittingWithdrawal(true);
    try {
      await api.post('/merchant/withdrawals', {
        amount: amtNum,
        bankDetails: { bankName, accountNumber, ifscCode }
      });
      setRecentTxDetails({ amount: amtNum, bankName, accountNumber, date: new Date() });
      setWithdrawalForm({ amount: '', bankName: '', accountNumber: '', ifscCode: '' });
      setConfirmAccountNumber('');
      setSelectedBank(null);
      setAccountHolderName('');
      setWithdrawalStep(3);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handleShareReceipt = async (tx) => {
    try {
      const amt = tx.amount;
      const bank = tx.bankName || tx.bankDetails?.bankName || 'Bank Transfer';
      const acc = tx.accountNumber || tx.bankDetails?.accountNumber || '';
      const maskedAcc = acc ? `•••• ${acc.slice(-4)}` : 'N/A';
      const refId = tx._id || `METRO-TXN-${Date.now()}`;
      const time = new Date(tx.createdAt || tx.date).toLocaleString();

      const message = `--- PUNE METRO BUSINESS TRANSACTION RECEIPT ---
Status: SUCCESSFUL
Amount Transfer: ₹${amt}
Destination Bank: ${bank}
Account No: ${maskedAcc}
Reference ID: ${refId}
Timestamp: ${time}

Powered by METROXIA.`;

      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt.');
    }
  };

  // Support Submit
  const handleSupportSubmit = async () => {
    const { subject, description, category } = supportForm;
    if (!subject || !description) return Alert.alert('Error', 'Subject and description are required.');

    setSubmittingSupport(true);
    try {
      await api.post('/merchant/support', { subject, description, category });
      Alert.alert('Success', 'Your support ticket has been submitted to Pune Metro Admins.');
      setSupportForm({ subject: '', description: '', category: 'Merchant Support' });
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to submit ticket.');
    } finally {
      setSubmittingSupport(false);
    }
  };

  // Shop Details Update
  const handleUpdateShop = async () => {
    if (!shopDetails.shopName) return Alert.alert('Error', 'Shop name is required.');
    setLoading(true);
    try {
      await api.put('/merchant/shop', {
        shopName: shopDetails.shopName,
        description: shopDetails.description,
        category: shopDetails.category,
        imageUrl: shopDetails.imageUrl
      });
      Alert.alert('Success', 'Shop configurations updated.');
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update shop configuration.');
      setLoading(false);
    }
  };

  // Shop Banner Image Upload from Device
  const handleShopImagePick = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      setShopImageFile(result);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Could not open image picker.');
      }
    }
  };

  const handleUploadShopImage = async () => {
    if (!shopImageFile) return Alert.alert('No Image', 'Please select an image first.');
    setUploadingShopImage(true);
    try {
      const formData = new FormData();
      formData.append('shopImage', {
        uri: shopImageFile.fileCopyUri || shopImageFile.uri,
        type: shopImageFile.type || 'image/jpeg',
        name: shopImageFile.name || 'shop_banner.jpg',
      });
      const res = await api.post('/merchant/shop/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setShopDetails(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
        setShopImageFile(null);
        Alert.alert('✅ Success', 'Shop banner image updated successfully!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingShopImage(false);
    }
  };


  // Rendering KYC Document Upload Screen
  const renderKycUploadScreen = () => (
    <ScrollView contentContainerStyle={styles.kycScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.kycHeader}>
        <MaterialCommunityIcons name="shield-account-outline" size={60} color="#3498DB" />
        <Text style={styles.kycTitle}>Submit KYC Documents</Text>
        <Text style={styles.kycSubtitle}>Upload proof of verification to start accepting customer payments.</Text>
      </View>

      <View style={styles.kycCard}>
        <Text style={styles.kycLabel}>1. Aadhar Card (PDF or Image)</Text>
        <TouchableOpacity style={[styles.kycPicker, aadharFile && styles.kycPickerSuccess]} onPress={() => selectFile('aadhar')}>
          <MaterialCommunityIcons name={aadharFile ? 'check-circle' : 'file-upload-outline'} size={24} color={aadharFile ? '#00C9A7' : '#888888'} />
          <Text style={[styles.kycPickerText, aadharFile && { color: COLORS.text }]}>
            {aadharFile ? aadharFile.name : 'Select Aadhar Card Document'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.kycLabel}>2. PAN Card (PDF or Image)</Text>
        <TouchableOpacity style={[styles.kycPicker, panFile && styles.kycPickerSuccess]} onPress={() => selectFile('pan')}>
          <MaterialCommunityIcons name={panFile ? 'check-circle' : 'file-upload-outline'} size={24} color={panFile ? '#00C9A7' : '#888888'} />
          <Text style={[styles.kycPickerText, panFile && { color: COLORS.text }]}>
            {panFile ? panFile.name : 'Select PAN Card Document'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.kycLabel}>3. Storefront Image</Text>
        <TouchableOpacity style={[styles.kycPicker, photoFile && styles.kycPickerSuccess]} onPress={() => selectFile('photo')}>
          <MaterialCommunityIcons name={photoFile ? 'check-circle' : 'camera-outline'} size={24} color={photoFile ? '#00C9A7' : '#888888'} />
          <Text style={[styles.kycPickerText, photoFile && { color: COLORS.text }]}>
            {photoFile ? photoFile.name : 'Take/Select Shop Photo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kycSubmitBtn} onPress={handleKycSubmit} disabled={uploadingKyc}>
          <LinearGradient colors={['#3498DB', '#2980B9']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {uploadingKyc ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Verification Docs</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStatusScreen = (icon, title, message, color) => (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Merchant Portal</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.statusContainer}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: color + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <MaterialCommunityIcons name={icon} size={60} color={color} />
          </View>
          <Text style={[styles.statusTitle, { color }]}>{title}</Text>
          <Text style={styles.statusMessage}>{message}</Text>
          <TouchableOpacity onPress={fetchData}>
            <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} style={styles.refreshBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.refreshBtnText}>Refresh Status</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.background]} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color="#00C9A7" />
      </LinearGradient>
    );
  }

  // Handle Pendings without uploaded files
  if (status === 'pending' && !hasDocs) {
    return (
      <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>KYC Verification</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
              <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
          {renderKycUploadScreen()}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (status === 'pending') {
    return renderStatusScreen('clock-outline', 'Pending Approval', 'Your application is under review. You will be notified once approved.', '#F39C12');
  } else if (status === 'suspended') {
    return renderStatusScreen('cancel', 'Account Suspended', rejectionReason || 'Your merchant account has been suspended by the admin.', '#EF4444');
  } else if (status === 'rejected') {
    // If rejected, allow uploading documents again!
    return (
      <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Application Rejected</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
              <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <View style={styles.rejectionBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.rejectionText}>Reason: {rejectionReason || 'Invalid documents.'}</Text>
          </View>
          {renderKycUploadScreen()}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const getUniqueCustomers = () => {
    const customerMap = {};
    transactions.forEach(t => {
      const uId = t.userId?._id || t.userId || 'Guest';
      const uName = t.userId?.name || 'Walk-in Customer';
      if (!customerMap[uId]) {
        customerMap[uId] = {
          id: uId,
          name: uName,
          totalSpent: 0,
          visits: 0,
          lastVisit: t.createdAt
        };
      }
      const displayAmt = t.paymentMethod === 'QR Scan' ? (t.grossAmount || t.amount) : t.amount;
      customerMap[uId].totalSpent += displayAmt;
      customerMap[uId].visits += 1;
      if (new Date(t.createdAt) > new Date(customerMap[uId].lastVisit)) {
        customerMap[uId].lastVisit = t.createdAt;
      }
    });
    return Object.values(customerMap);
  };

  // tab rendering helper
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard styles={styles} title="Total Sales" value={`₹${dashboardData?.stats?.totalSales || 0}`} icon="currency-inr" color="#00C9A7" onPress={() => setSalesHistoryVisible(true)} />
              <StatCard styles={styles} title="Total Orders" value={dashboardData?.stats?.totalOrders || 0} icon="shopping-outline" color="#3498DB" onPress={() => setOrdersHistoryVisible(true)} />
            </View>
            <View style={styles.statsRow}>
              <StatCard styles={styles} title="Wallet Balance" value={`₹${merchantProfile?.balance || 0}`} icon="wallet-outline" color="#9B59B6" onPress={() => setActiveTab('withdrawals')} />
              <StatCard styles={styles} title="Total Customers" value={dashboardData?.stats?.totalCustomers || 0} icon="account-group" color="#F39C12" onPress={() => setCustomerHistoryVisible(true)} />
            </View>

            {/* Official QR Code */}
            <View style={styles.qrContainer}>
              <Text style={styles.qrTitle}>Official Merchant QR</Text>
              <Text style={styles.qrSubtitle}>Customers can scan this to pay you directly</Text>
              <View style={styles.qrWrapper}>
                {dashboardData?.shopId ? (
                  <QRCode
                    value={JSON.stringify({ type: 'merchant', shopId: dashboardData.shopId, merchantId: dashboardData.merchantId, businessName: dashboardData.businessName })}
                    size={180}
                    color="#141432"
                    backgroundColor="#fff"
                  />
                ) : (
                  <View style={{ width: 180, height: 180, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#00C9A7" />
                  </View>
                )}
              </View>
            </View>

            {/* ===== Analytics Charts Section ===== */}
            {(() => {
              // --- Compute chart data from real transactions ---
              const now = new Date();

              // 7-Day: last 7 days, group by day
              const weekLabels = [];
              const weekFullLabels = [];
              const weekData = [];
              const fullDayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
              const fullMonthNamesShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                weekLabels.push(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]);
                weekFullLabels.push(`${fullDayNames[d.getDay()]}, ${fullMonthNamesShort[d.getMonth()]} ${d.getDate()}`);
                const dayTotal = transactions.reduce((sum, tx) => {
                  const txDate = new Date(tx.createdAt);
                  if (
                    txDate.getDate() === d.getDate() &&
                    txDate.getMonth() === d.getMonth() &&
                    txDate.getFullYear() === d.getFullYear()
                  ) {
                    const amt = tx.paymentMethod === 'QR Scan' ? (tx.grossAmount || tx.amount) : tx.amount;
                    return sum + (amt || 0);
                  }
                  return sum;
                }, 0);
                weekData.push(dayTotal);
              }

              // Monthly: last 6 months, group by month
              const monthLabels = [];
              const monthFullLabels = [];
              const monthData = [];
              const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const fullMonthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
              for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                monthLabels.push(monthNames[d.getMonth()]);
                monthFullLabels.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
                const monthTotal = transactions.reduce((sum, tx) => {
                  const txDate = new Date(tx.createdAt);
                  if (txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear()) {
                    const amt = tx.paymentMethod === 'QR Scan' ? (tx.grossAmount || tx.amount) : tx.amount;
                    return sum + (amt || 0);
                  }
                  return sum;
                }, 0);
                monthData.push(monthTotal);
              }

              // Yearly: last 4 years
              const yearLabels = [];
              const yearFullLabels = [];
              const yearData = [];
              for (let i = 3; i >= 0; i--) {
                const y = now.getFullYear() - i;
                yearLabels.push(String(y));
                yearFullLabels.push(`Year ${y}`);
                const yearTotal = transactions.reduce((sum, tx) => {
                  if (new Date(tx.createdAt).getFullYear() === y) {
                    const amt = tx.paymentMethod === 'QR Scan' ? (tx.grossAmount || tx.amount) : tx.amount;
                    return sum + (amt || 0);
                  }
                  return sum;
                }, 0);
                yearData.push(yearTotal);
              }

              const safeData = (arr) => arr.map(v => (isNaN(v) || v === null ? 0 : v));
              const chartW = width - 64;

              const charts = [
                {
                  key: 'week',
                  label: '7-Day',
                  icon: 'calendar-week',
                  color: '#00C9A7',
                  labels: weekLabels,
                  fullLabels: weekFullLabels,
                  data: safeData(weekData),
                  total: safeData(weekData).reduce((a, b) => a + b, 0),
                  type: 'line',
                },
                {
                  key: 'month',
                  label: '6-Month',
                  icon: 'calendar-month',
                  color: '#9B59B6',
                  labels: monthLabels,
                  fullLabels: monthFullLabels,
                  data: safeData(monthData),
                  total: safeData(monthData).reduce((a, b) => a + b, 0),
                  type: 'bar',
                },
                {
                  key: 'year',
                  label: '4-Year',
                  icon: 'calendar-star',
                  color: '#F39C12',
                  labels: yearLabels,
                  fullLabels: yearFullLabels,
                  data: safeData(yearData),
                  total: safeData(yearData).reduce((a, b) => a + b, 0),
                  type: 'bar',
                },
              ];

              const active = charts.find(c => c.key === chartTab);

              return (
                <View style={{ marginBottom: 24 }}>
                  {/* Section Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <Text style={styles.sectionTitle}>Sales Analytics</Text>
                    <View style={{ flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' }}>
                      {charts.map(c => (
                        <TouchableOpacity
                          key={c.key}
                          onPress={() => setChartTab(c.key)}
                          style={{
                            paddingVertical: 6, paddingHorizontal: 12,
                            backgroundColor: chartTab === c.key ? c.color : 'transparent',
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '900', color: chartTab === c.key ? '#fff' : COLORS.textLight }}>
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Chart Card */}
                  <View style={{ backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }}>
                    {/* Top Stats Strip */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 20, alignItems: 'center' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: active.color + '20', justifyContent: 'center', alignItems: 'center' }}>
                        <MaterialCommunityIcons name={active.icon} size={20} color={active.color} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>₹{active.total.toFixed(0)}</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textLight, fontWeight: '600' }}>Total • {active.label} Period</Text>
                      </View>
                    </View>

                    {/* Chart */}
                    <View style={{ paddingBottom: 12 }}>
                      {active.type === 'line' ? (
                        <LineChart
                          data={{ labels: active.labels, datasets: [{ data: active.data.length > 0 ? active.data : [0] }] }}
                          width={chartW + 32}
                          height={180}
                          chartConfig={{
                            backgroundColor: 'transparent',
                            backgroundGradientFrom: COLORS.cardBg,
                            backgroundGradientTo: COLORS.cardBg,
                            decimalPlaces: 0,
                            color: (o = 1) => `rgba(0,201,167,${o})`,
                            labelColor: () => COLORS.textLight,
                            style: { borderRadius: 0 },
                            propsForDots: { r: '4', strokeWidth: '2', stroke: '#00C9A7', fill: COLORS.cardBg },
                            propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: '4' },
                          }}
                          bezier
                          style={{ marginLeft: -10 }}
                          withShadow={false}
                          withInnerLines={true}
                          withOuterLines={false}
                        />
                      ) : (
                        <BarChart
                          data={{ labels: active.labels, datasets: [{ data: active.data.length > 0 ? active.data : [0] }] }}
                          width={chartW + 32}
                          height={180}
                          chartConfig={{
                            backgroundColor: 'transparent',
                            backgroundGradientFrom: COLORS.cardBg,
                            backgroundGradientTo: COLORS.cardBg,
                            decimalPlaces: 0,
                            color: (o = 1) => `rgba(${active.key === 'month' ? '155,89,182' : '243,156,18'},${o})`,
                            labelColor: () => COLORS.textLight,
                            style: { borderRadius: 0 },
                            propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: '4' },
                            barPercentage: 0.6,
                          }}
                          style={{ marginLeft: -10 }}
                          withInnerLines={true}
                          showValuesOnTopOfBars={false}
                          withCustomBarColorFromData={false}
                        />
                      )}
                    </View>

                    {/* Period Breakdown Table */}
                    {(() => {
                      const maxVal = Math.max(...active.data, 1);
                      return (
                        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                          {/* Table header */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 4 }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.textLight, letterSpacing: 0.5, textTransform: 'uppercase' }}>Period</Text>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.textLight, letterSpacing: 0.5, textTransform: 'uppercase' }}>Sales</Text>
                          </View>
                          {active.fullLabels.map((fullLbl, i) => {
                            const val = active.data[i] || 0;
                            const fillPct = (val / maxVal) * 100;
                            const hasData = val > 0;
                            return (
                              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border + '50' }}>
                                {/* Label */}
                                <View style={{ flex: 1, marginRight: 10 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '700', color: hasData ? COLORS.text : COLORS.textLight }}>{fullLbl}</Text>
                                </View>
                                {/* Bar fill */}
                                <View style={{ width: 80, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginRight: 10, overflow: 'hidden' }}>
                                  <View style={{ width: `${fillPct}%`, height: '100%', backgroundColor: active.color, borderRadius: 3, opacity: hasData ? 1 : 0.2 }} />
                                </View>
                                {/* Amount */}
                                <Text style={{ fontSize: 13, fontWeight: '900', color: hasData ? active.color : COLORS.textLight, minWidth: 64, textAlign: 'right' }}>
                                  {hasData ? `₹${val.toLocaleString('en-IN')}` : '—'}
                                </Text>
                              </View>
                            );
                          })}
                          {/* Total row */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1.5, borderTopColor: active.color + '40' }}>
                            <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.textLight, letterSpacing: 0.5, textTransform: 'uppercase' }}>Total</Text>
                            <Text style={{ fontSize: 15, fontWeight: '900', color: active.color }}>₹{active.total.toLocaleString('en-IN')}</Text>
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              );
            })()}

            {/* Recent Payments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Payments</Text>
              {transactions.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No transactions yet.</Text>
                </View>
              ) : (
                transactions.slice(0, 8).map((tx, idx) => {
                  const isQR = tx.paymentMethod === 'QR Scan';
                  const displayAmt = isQR ? (tx.grossAmount || tx.amount) : tx.amount;
                  return (
                    <View key={tx._id || idx} style={[styles.txCard, { paddingVertical: 14 }]}>
                      <View style={styles.txLeft}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="arrow-down-left" size={24} color="#00C9A7" />
                        </View>
                        <View style={styles.txDetails}>
                          <Text style={styles.txType}>{tx.userId?.name || 'Customer'}</Text>
                          <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()} • {tx.paymentMethod}</Text>
                          {isQR && (tx.grossAmount !== undefined) && (
                            <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 4, fontWeight: '600' }}>
                              Paid: ₹{tx.grossAmount} • Fee: ₹{tx.commissionFee} • Net: ₹{tx.amount}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Text style={styles.txAmount}>+{tx.paymentMethod === 'Token' ? `Rs. ${tx.amount}` : `₹${displayAmt}`}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        );

      case 'qr':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.qrContainer, { paddingVertical: 36, marginTop: 20 }]}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons name="qrcode-scan" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.qrTitle}>Official Merchant QR</Text>
              <Text style={styles.qrSubtitle}>Customers can scan this to pay you directly</Text>
              
              <View style={[styles.qrWrapper, { padding: 20, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }]}>
                {dashboardData?.shopId ? (
                  <QRCode
                    value={JSON.stringify({
                      type: 'merchant',
                      shopId: dashboardData.shopId,
                      merchantId: dashboardData.merchantId,
                      businessName: dashboardData.businessName
                    })}
                    size={220}
                    color="#141432"
                    backgroundColor="#fff"
                  />
                ) : (
                  <View style={{ width: 220, height: 220, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                )}
              </View>

              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text, marginTop: 24 }}>
                {dashboardData?.businessName || 'METROXIA Merchant'}
              </Text>
              
              <Text style={{ fontSize: 13, color: COLORS.textLight, marginTop: 6, fontWeight: '600' }}>
                UPI: {merchantProfile?.phone || 'merchant'}@metroxia
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '08', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 28, borderWidth: 1, borderColor: COLORS.primary + '20' }}>
                <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.primary} />
                <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '700' }}>
                  Payments will be credited instantly to your wallet.
                </Text>
              </View>
            </View>
          </ScrollView>
        );

      case 'products':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tabHeaderRow}>
              <Text style={styles.tabSectionTitle}>Products & Services</Text>
              <TouchableOpacity style={styles.tabAddBtn} onPress={() => openProductForm(null)}>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.tabAddBtnText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {!shopDetails?.products || shopDetails.products.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="storefront-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No products added yet. Put items in your digital catalog.</Text>
              </View>
            ) : (
              shopDetails.products.map((item) => (
                <View key={item._id} style={styles.productCard}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${API_BASE_URL.replace('/api', '')}${item.imageUrl}` }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: COLORS.cardBg }} />
                  ) : (
                    <View style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="image-off-outline" size={24} color={COLORS.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.productName}>{item.name}</Text>
                      {!item.isAvailable && (
                        <View style={styles.unavailableBadge}>
                          <Text style={styles.unavailableText}>Unavailable</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.productPrice}>₹{item.price}</Text>
                    {item.description ? <Text style={styles.productDesc}>{item.description}</Text> : null}
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity style={styles.prodActionBtn} onPress={() => openProductForm(item)}>
                      <MaterialCommunityIcons name="pencil" size={20} color="#F59E0B" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.prodActionBtn} onPress={() => handleDeleteProduct(item._id)}>
                      <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        );

      case 'coupons':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tabHeaderRow}>
              <Text style={styles.tabSectionTitle}>Active Shop Coupons</Text>
              <TouchableOpacity style={styles.tabAddBtn} onPress={() => setCouponModalVisible(true)}>
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.tabAddBtnText}>Create Coupon</Text>
              </TouchableOpacity>
            </View>

            {!shopDetails?.offers || shopDetails.offers.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="ticket-percent-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No promotional coupons running. Drive sales by creating one.</Text>
              </View>
            ) : (
              shopDetails.offers.map((offer) => (
                <View key={offer._id} style={styles.couponCard}>
                  <View style={styles.couponIcon}>
                    <MaterialCommunityIcons name="sale" size={28} color="#00C9A7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.couponTitle}>
                      {offer.applicableProducts?.length > 0 
                        ? offer.applicableProducts.map(id => shopDetails.products?.find(p => p._id === id)?.name).filter(Boolean).join(', ')
                        : (offer.title?.trim().toLowerCase() === offer.discount?.trim().toLowerCase() || offer.title?.includes(offer.discount) ? 'Store-wide Offer' : offer.title)}
                    </Text>
                    <Text style={styles.couponDiscount}>{offer.discount}</Text>
                    {offer.validUntil ? (
                      <Text style={styles.couponExpiry}>Expires: {new Date(offer.validUntil).toLocaleDateString()}</Text>
                    ) : null}
                    <View style={{ marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: offer.applicableProducts?.length > 0 ? COLORS.primary + '15' : COLORS.textLight + '15' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: offer.applicableProducts?.length > 0 ? COLORS.primary : COLORS.textLight }}>
                        {offer.applicableProducts?.length > 0 
                          ? 'Specific Product Offer' 
                          : 'Store-wide'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteCoupon(offer._id)} style={styles.couponDelete}>
                    <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        );

      case 'withdrawals':
        const ALL_INDIAN_BANKS = [
          { name: 'State Bank of India', code: 'SBI', icon: 'bank', color: '#0A84FF' },
          { name: 'HDFC Bank', code: 'HDFC', icon: 'bank', color: '#1C3F94' },
          { name: 'ICICI Bank', code: 'ICICI', icon: 'bank', color: '#F25C07' },
          { name: 'Axis Bank', code: 'AXIS', icon: 'bank', color: '#840046' },
          { name: 'Kotak Mahindra Bank', code: 'KOTAK', icon: 'bank', color: '#EC1C24' },
          { name: 'Bank of Baroda', code: 'BOB', icon: 'bank', color: '#F37021' },
          { name: 'Punjab National Bank', code: 'PNB', icon: 'bank', color: '#800000' },
          { name: 'Union Bank of India', code: 'UNION', icon: 'bank', color: '#0054A6' },
          { name: 'Canara Bank', code: 'CANARA', icon: 'bank', color: '#0091FF' },
          { name: 'IndusInd Bank', code: 'INDUSIND', icon: 'bank', color: '#842629' },
          { name: 'IDFC First Bank', code: 'IDFC', icon: 'bank', color: '#902229' },
          { name: 'Yes Bank', code: 'YES', icon: 'bank', color: '#0054A6' },
          { name: 'Bank of India', code: 'BOI', icon: 'bank', color: '#0054A6' },
          { name: 'Central Bank of India', code: 'CBI', icon: 'bank', color: '#007FFF' },
          { name: 'Indian Bank', code: 'INDIAN', icon: 'bank', color: '#0054A6' },
          { name: 'UCO Bank', code: 'UCO', icon: 'bank', color: '#0054A6' },
          { name: 'Federal Bank', code: 'FEDERAL', icon: 'bank', color: '#004A8F' },
          { name: 'South Indian Bank', code: 'SIB', icon: 'bank', color: '#D4AF37' },
          { name: 'RBL Bank', code: 'RBL', icon: 'bank', color: '#0A84FF' },
          { name: 'Bandhan Bank', code: 'BANDHAN', icon: 'bank', color: '#0054A6' },
          { name: 'Saraswat Bank', code: 'SARASWAT', icon: 'bank', color: '#007062' },
          { name: 'Standard Chartered', code: 'SCB', icon: 'bank', color: '#008543' },
          { name: 'DBS Bank', code: 'DBS', icon: 'bank', color: '#FF0000' },
          { name: 'Other Bank', code: 'OTHER', icon: 'bank-plus', color: '#00C9A7' }
        ];

        const filteredBanks = ALL_INDIAN_BANKS.filter(b => 
          b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
          b.code.toLowerCase().includes(bankSearchQuery.toLowerCase())
        );

        const renderWizardStep = () => {
          switch (withdrawalStep) {
            case 0: // Step 0: Select Bank
              const popularList = ALL_INDIAN_BANKS.slice(0, 8);
              return (
                <View style={styles.wizardCard}>
                  <Text style={styles.wizardCardTitle}>Select Bank Account</Text>
                  <Text style={styles.wizardCardSub}>Choose the destination bank for transfer</Text>

                  {/* Search Bar */}
                  <View style={styles.phonepeSearchWrap}>
                    <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textLight} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.phonepeSearchInput}
                      placeholder="Search by Bank Name"
                      placeholderTextColor="#AAAAAA"
                      value={bankSearchQuery}
                      onChangeText={setBankSearchQuery}
                    />
                    {bankSearchQuery ? (
                      <TouchableOpacity onPress={() => setBankSearchQuery('')}>
                        <MaterialCommunityIcons name="close" size={20} color={COLORS.text} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {!bankSearchQuery ? (
                    <>
                      {/* Popular Banks */}
                      <Text style={styles.bankSectionTitle}>POPULAR BANKS</Text>
                      <View style={styles.bankGrid}>
                        {popularList.map((b) => (
                          <TouchableOpacity
                            key={b.code}
                            style={styles.bankGridItem}
                            onPress={() => {
                              setSelectedBank(b.code);
                              if (b.code !== 'OTHER') {
                                setWithdrawalForm({ ...withdrawalForm, bankName: b.name });
                              } else {
                                setWithdrawalForm({ ...withdrawalForm, bankName: '' });
                              }
                              setWithdrawalStep(1); // Proceed to step 1
                            }}
                          >
                            <View style={[styles.bankLogoCircle, { backgroundColor: b.color + '15' }]}>
                              <MaterialCommunityIcons name={b.icon} size={24} color={b.color} />
                            </View>
                            <Text style={styles.bankGridText}>{b.code}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* All Banks */}
                      <Text style={[styles.bankSectionTitle, { marginTop: 12 }]}>ALL BANKS</Text>
                    </>
                  ) : null}

                  {/* Scrollable list of matched banks */}
                  <View style={{ maxHeight: 350 }}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {filteredBanks.map((b) => (
                        <TouchableOpacity
                          key={b.code}
                          style={styles.bankListItem}
                          onPress={() => {
                            setSelectedBank(b.code);
                            if (b.code !== 'OTHER') {
                              setWithdrawalForm({ ...withdrawalForm, bankName: b.name });
                            } else {
                              setWithdrawalForm({ ...withdrawalForm, bankName: '' });
                            }
                            setWithdrawalStep(1); // Proceed to step 1
                          }}
                        >
                          <View style={[styles.bankListIconCircle, { backgroundColor: b.color + '15' }]}>
                            <MaterialCommunityIcons name={b.icon} size={20} color={b.color} />
                          </View>
                          <Text style={styles.bankListItemText}>{b.name}</Text>
                          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textLight} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                      ))}
                      {filteredBanks.length === 0 && (
                        <Text style={styles.noBankText}>No banks match your search query.</Text>
                      )}
                    </ScrollView>
                  </View>
                </View>
              );

            case 1: // Step 1: Account Info Form
              return (
                <View style={styles.wizardCard}>
                  <View style={styles.wizardHeaderRow}>
                    <TouchableOpacity onPress={() => setWithdrawalStep(0)} style={styles.wizardBackBtn}>
                      <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.wizardHeaderTitle}>Enter Account Details</Text>
                    <View style={{ width: 36 }} />
                  </View>

                  <View style={styles.selectedBankBanner}>
                    <MaterialCommunityIcons name="bank" size={20} color="#00C9A7" />
                    <Text style={styles.selectedBankBannerText}>
                      Selected: {selectedBank === 'OTHER' ? 'Custom Bank' : withdrawalForm.bankName}
                    </Text>
                  </View>

                  {selectedBank === 'OTHER' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Bank Name</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholderTextColor="#AAAAAA"
                        placeholder="e.g. Bank of India"
                        value={withdrawalForm.bankName}
                        onChangeText={(t) => setWithdrawalForm({ ...withdrawalForm, bankName: t })}
                      />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Account Holder Name</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholderTextColor="#AAAAAA"
                      placeholder="As printed on bank passbook"
                      value={accountHolderName}
                      onChangeText={setAccountHolderName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Account Number</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholderTextColor="#AAAAAA"
                      placeholder="Enter bank account number"
                      keyboardType="numeric"
                      value={withdrawalForm.accountNumber}
                      onChangeText={(t) => setWithdrawalForm({ ...withdrawalForm, accountNumber: t })}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Account Number</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholderTextColor="#AAAAAA"
                      placeholder="Re-enter bank account number"
                      keyboardType="numeric"
                      value={confirmAccountNumber}
                      onChangeText={setConfirmAccountNumber}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>IFSC Code</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholderTextColor="#AAAAAA"
                      placeholder="e.g. SBIN0001234"
                      autoCapitalize="characters"
                      value={withdrawalForm.ifscCode}
                      onChangeText={(t) => setWithdrawalForm({ ...withdrawalForm, ifscCode: t })}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => {
                      const { bankName, accountNumber, ifscCode } = withdrawalForm;
                      if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
                        return Alert.alert('Error', 'Please fill all details.');
                      }
                      if (accountNumber !== confirmAccountNumber) {
                        return Alert.alert('Mismatch', 'Account numbers do not match.');
                      }
                      setWithdrawalStep(2); // Proceed to amount entry
                    }}
                  >
                    <Text style={styles.continueBtnText}>Confirm Details</Text>
                  </TouchableOpacity>
                </View>
              );

            case 2: // Step 2: Amount Entry Screen (PhonePe Payment Interface)
              return (
                <View style={styles.wizardCard}>
                  <View style={styles.wizardHeaderRow}>
                    <TouchableOpacity onPress={() => setWithdrawalStep(1)} style={styles.wizardBackBtn}>
                      <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.wizardHeaderTitle}>Transfer Money</Text>
                    <View style={{ width: 36 }} />
                  </View>

                  {/* Recipient Profile Info */}
                  <View style={styles.recipientHeaderCard}>
                    <View style={styles.recipientAvatar}>
                      <Text style={styles.recipientAvatarText}>
                        {accountHolderName.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ marginLeft: 14, flex: 1 }}>
                      <Text style={styles.recipientName}>{accountHolderName}</Text>
                      <Text style={styles.recipientBankInfo}>
                        {withdrawalForm.bankName} • Account: •••• {withdrawalForm.accountNumber.slice(-4)}
                      </Text>
                    </View>
                  </View>

                  <LinearGradient colors={['#9B59B6', '#6C3483']} style={[styles.premiumCard, { marginTop: 10, padding: 20 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={[styles.premiumCardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Withdrawable Balance</Text>
                    <Text style={[styles.premiumCardBalance, { fontSize: 28, marginBottom: 0, color: '#fff' }]}>
                      ₹{merchantProfile?.balance || 0}
                    </Text>
                  </LinearGradient>

                  <View style={[styles.inputGroup, { marginTop: 16 }]}>
                    <Text style={styles.inputLabel}>Enter Transfer Amount</Text>
                    <View style={styles.phonepeInputWrap}>
                      <Text style={styles.currencySymbol}>₹</Text>
                      <TextInput
                        style={styles.phonepeInput}
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        placeholder="0"
                        keyboardType="numeric"
                        value={withdrawalForm.amount}
                        onChangeText={(t) => setWithdrawalForm({ ...withdrawalForm, amount: t })}
                      />
                    </View>
                  </View>

                  {/* Quick Value Buttons */}
                  <View style={styles.quickValuesRow}>
                    {[100, 500, 1000, 5000].map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={styles.quickValBtn}
                        onPress={() => setWithdrawalForm({ ...withdrawalForm, amount: String(val) })}
                      >
                        <Text style={styles.quickValText}>+₹{val}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.quickValBtn, { borderColor: '#9B59B6', backgroundColor: 'rgba(155,89,182,0.1)' }]}
                      onPress={() => setWithdrawalForm({ ...withdrawalForm, amount: String(merchantProfile?.balance || 0) })}
                    >
                      <Text style={[styles.quickValText, { color: '#9B59B6' }]}>MAX</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.phonepePayBtn}
                    onPress={handleWithdrawalSubmit}
                    disabled={submittingWithdrawal}
                  >
                    <LinearGradient colors={['#9B59B6', '#6C3483']} style={styles.phonepePayGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      {submittingWithdrawal ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.phonepePayText}>Send Money to Bank</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );

            case 3: // Step 3: Payout Success Screen (PhonePe Success Style)
              return (
                <View style={[styles.wizardCard, { alignItems: 'center', paddingVertical: 30 }]}>
                  <View style={styles.successCircle}>
                    <MaterialCommunityIcons name="check" size={54} color="#fff" />
                  </View>

                  <Text style={styles.successTitle}>Transfer Successful</Text>
                  <Text style={styles.successSubtitle}>Money sent to destination bank account successfully</Text>

                  <View style={styles.successSummaryBox}>
                    <Text style={styles.successAmount}>₹{recentTxDetails?.amount}</Text>
                    <Text style={styles.successRecipient}>To: {recentTxDetails?.bankName}</Text>
                    <Text style={styles.successAccount}>Acc No: •••• {recentTxDetails?.accountNumber?.slice(-4)}</Text>
                    <Text style={styles.successTime}>Time: {recentTxDetails?.date?.toLocaleString()}</Text>
                    <Text style={styles.successTxId}>Ref ID: METRO-{Math.floor(Math.random() * 899999 + 100000)}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.successDoneBtn, { flex: 1, backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: '#00C9A7' }]}
                      onPress={() => handleShareReceipt(recentTxDetails)}
                    >
                      <Text style={[styles.successDoneBtnText, { color: '#00C9A7', fontSize: 13 }]}>SHARE RECEIPT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.successDoneBtn, { flex: 1 }]}
                      onPress={() => {
                        setWithdrawalStep(0);
                        setRecentTxDetails(null);
                      }}
                    >
                      <Text style={styles.successDoneBtnText}>DONE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            default:
              return null;
          }
        };

        return (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Balance Debit Card - Hidden on Amount/Success screens to mimic PhonePe flow */}
            {withdrawalStep < 2 && (
              <LinearGradient colors={['#9B59B6', '#6C3483']} style={styles.premiumCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.premiumCardHeader}>
                  <Text style={styles.premiumCardTitle}>METROXIA BUSINESS</Text>
                  <MaterialCommunityIcons name="nfc" size={24} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={styles.premiumCardLabel}>Withdrawable Wallet Balance</Text>
                <Text style={styles.premiumCardBalance}>₹{merchantProfile?.balance || 0}</Text>
                <View style={styles.premiumCardFooter}>
                  <Text style={styles.premiumCardNumber}>•••• •••• •••• {merchantProfile?._id?.toString()?.slice(-4) || '9684'}</Text>
                  <Text style={styles.premiumCardChip}>GOLD CHIP</Text>
                </View>
              </LinearGradient>
            )}

            {/* Render Wizard Steps */}
            {renderWizardStep()}

            {withdrawalStep < 3 && (
              <>
                <Text style={styles.tabSectionTitle}>Withdrawal History</Text>
                {withdrawals.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No previous withdrawal requests.</Text>
                  </View>
                ) : (
                  withdrawals.map((item) => (
                    <TouchableOpacity key={item._id} style={styles.withdrawalCard} onPress={() => setSelectedReceipt(item)}>
                      <View style={styles.withLeft}>
                        <Text style={styles.withAmt}>₹{item.amount}</Text>
                        <Text style={styles.withBank}>{item.bankDetails?.bankName || 'Bank Transfer'}</Text>
                        <Text style={styles.withDate}>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={[styles.statusBadge, {
                          backgroundColor: item.status === 'SUCCESS' ? 'rgba(0,201,167,0.15)' : item.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                          borderColor: item.status === 'SUCCESS' ? '#00C9A7' : item.status === 'PENDING' ? '#F59E0B' : '#EF4444'
                        }]}>
                          <Text style={[styles.statusBadgeText, { color: item.status === 'SUCCESS' ? '#00C9A7' : item.status === 'PENDING' ? '#F59E0B' : '#EF4444' }]}>
                            {item.status}
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="share-variant-outline" size={16} color={COLORS.textLight} />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>
        );

      case 'support':
        // Support is now inside Settings — redirect
        return null;

      case 'settings':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* ── Settings Menu List ── */}
            <View style={styles.formCard}>
              {[
                {
                  key: 'shopConfig',
                  icon: 'store-edit-outline',
                  label: 'Edit Shop Configuration',
                  sub: 'Name, description, banner image',
                  color: '#00C9A7',
                },
                {
                  key: 'account',
                  icon: 'account-tie-outline',
                  label: 'Business & Account',
                  sub: 'View your business info & KYC status',
                  color: '#6C63FF',
                },
                {
                  key: 'support',
                  icon: 'headset',
                  label: 'Contact Support',
                  sub: 'Raise a ticket or check past requests',
                  color: '#3498DB',
                },
                {
                  key: 'products',
                  icon: 'tag-outline',
                  label: 'Manage Products',
                  sub: 'Add, edit or remove menu items',
                  color: '#00C9A7',
                  onPress: () => setActiveTab('products'),
                },
                {
                  key: 'coupons',
                  icon: 'ticket-percent-outline',
                  label: 'Manage Coupons',
                  sub: 'Create discount offers',
                  color: '#F39C12',
                  onPress: () => setActiveTab('coupons'),
                },
                {
                  key: 'withdrawals',
                  icon: 'wallet-outline',
                  label: 'Payout / Withdraw',
                  sub: 'Withdraw earnings to your bank',
                  color: '#9B59B6',
                  onPress: () => setActiveTab('withdrawals'),
                },
                {
                  key: 'notifications',
                  icon: 'bell-outline',
                  label: 'Notifications',
                  sub: 'View all notifications',
                  color: '#3498DB',
                  onPress: () => navigation.navigate('MerchantNotification'),
                },
              ].map((item, i, arr) => (
                <TouchableOpacity
                  key={item.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                    borderBottomColor: COLORS.border,
                  }}
                  onPress={item.onPress ? item.onPress : () => setSettingsModal(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.color + '18', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    <MaterialCommunityIcons name={item.icon} size={21} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>{item.sub}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Danger Zone */}
            <View style={[styles.formCard, { borderColor: 'rgba(239,68,68,0.25)', marginBottom: 8 }]}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={handleLogout} activeOpacity={0.7}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <MaterialCommunityIcons name="logout" size={21} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>Sign Out</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Log out from merchant account</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <Text style={{ textAlign: 'center', fontSize: 11, color: COLORS.textLight, marginTop: 8, marginBottom: 4 }}>METROXIA Merchant v1.0</Text>

          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Merchant Dashboard</Text>
            <Text style={styles.headerSubtitle}>{merchantProfile?.businessName || 'Business Owner'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MerchantNotification')}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }]}>
              <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* View renderer — takes all remaining space */}
        <View style={{ flex: 1 }}>
          {renderTabContent()}
        </View>

        {/* Add/Edit Product Modal */}
        <Modal visible={productModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedProduct ? 'Edit Product' : 'Add Product'}</Text>
              
              <Text style={styles.inputLabel}>Product Image</Text>
              <TouchableOpacity 
                style={{ width: '100%', height: 120, backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' }} 
                onPress={pickProductImage}
              >
                {productImageFile ? (
                  <Image source={{ uri: productImageFile.uri }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                ) : selectedProduct?.imageUrl ? (
                  <Image source={{ uri: selectedProduct.imageUrl.startsWith('http') ? selectedProduct.imageUrl : `${API_BASE_URL.replace('/api', '')}${selectedProduct.imageUrl}` }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <MaterialCommunityIcons name="image-plus" size={32} color={COLORS.textLight} />
                    <Text style={{ color: COLORS.textLight, marginTop: 8, fontSize: 13, fontWeight: '600' }}>Tap to upload image</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Product Name</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="#AAAAAA" placeholder="Enter Product Name" value={productForm.name} onChangeText={(t) => setProductForm({ ...productForm, name: t })} />

              <Text style={styles.inputLabel}>Price (INR)</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="#AAAAAA" placeholder="₹0.00" keyboardType="numeric" value={productForm.price} onChangeText={(t) => setProductForm({ ...productForm, price: t })} />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="#AAAAAA" placeholder="Enter Product Description" value={productForm.description} onChangeText={(t) => setProductForm({ ...productForm, description: t })} />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Available in Stock</Text>
                <Switch value={productForm.isAvailable} onValueChange={(v) => setProductForm({ ...productForm, isAvailable: v })} />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setProductModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handleSaveProduct}>
                  <Text style={styles.modalSubmitText}>Save Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Coupon Modal */}
        <Modal visible={couponModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Discount Coupon</Text>
              
              <Text style={styles.inputLabel}>Coupon Title</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="#AAAAAA" placeholder="e.g. Diwali Fest Offer" value={couponForm.title} onChangeText={(t) => setCouponForm({ ...couponForm, title: t })} />

              <Text style={styles.inputLabel}>Discount Text (e.g. 10% or ₹50)</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="#AAAAAA" placeholder="15% OFF" value={couponForm.discount} onChangeText={(t) => setCouponForm({ ...couponForm, discount: t })} />

              <Text style={styles.inputLabel}>Expiry Date (Optional)</Text>
              <TouchableOpacity
                style={[styles.modalInput, { justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }]}
                onPress={openDatePicker}
              >
                <MaterialCommunityIcons name="calendar" size={18} color={couponForm.validUntil ? COLORS.primary : COLORS.textLight} style={{ marginRight: 8 }} />
                <Text style={{ color: couponForm.validUntil ? COLORS.text : '#AAAAAA', fontSize: 14 }}>
                  {couponForm.validUntil ? new Date(couponForm.validUntil).toDateString() : 'Select expiry date...'}
                </Text>
                {couponForm.validUntil ? (
                  <TouchableOpacity onPress={() => setCouponForm({ ...couponForm, validUntil: '' })} style={{ marginLeft: 'auto' }}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textLight} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>


              <Text style={styles.inputLabel}>Applicable Products (Optional)</Text>
              <View style={{ marginBottom: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: couponForm.applicableProducts.length === 0 ? COLORS.primary : COLORS.cardBg, borderWidth: 1, borderColor: couponForm.applicableProducts.length === 0 ? COLORS.primary : COLORS.border }}
                    onPress={() => setCouponForm({ ...couponForm, applicableProducts: [] })}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: couponForm.applicableProducts.length === 0 ? '#fff' : COLORS.text }}>Store-wide (All)</Text>
                  </TouchableOpacity>
                  {shopDetails?.products?.map(p => {
                    const isSelected = couponForm.applicableProducts.includes(p._id);
                    return (
                      <TouchableOpacity
                        key={p._id}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: isSelected ? COLORS.primary : COLORS.cardBg, borderWidth: 1, borderColor: isSelected ? COLORS.primary : COLORS.border }}
                        onPress={() => {
                          let newSelected = [...couponForm.applicableProducts];
                          if (isSelected) {
                            newSelected = newSelected.filter(id => id !== p._id);
                          } else {
                            newSelected.push(p._id);
                          }
                          setCouponForm({ ...couponForm, applicableProducts: newSelected });
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#fff' : COLORS.text }}>{p.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setCouponModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handleSaveCoupon}>
                  <Text style={styles.modalSubmitText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Receipt Details Modal */}
        <Modal visible={!!selectedReceipt} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { padding: 24 }]}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={[styles.successCircle, { width: 64, height: 64, borderRadius: 32, marginBottom: 12 }]}>
                  <MaterialCommunityIcons name="check" size={40} color="#fff" />
                </View>
                <Text style={[styles.successTitle, { fontSize: 18 }]}>Transaction Successful</Text>
                <Text style={[styles.successSubtitle, { fontSize: 12, marginBottom: 0 }]}>Paid to Bank Account</Text>
              </View>

              {selectedReceipt && (
                <View style={[styles.successSummaryBox, { marginBottom: 20, padding: 16 }]}>
                  <Text style={[styles.successAmount, { fontSize: 26, marginBottom: 12 }]}>₹{selectedReceipt.amount}</Text>
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Bank Name:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt.bankName || selectedReceipt.bankDetails?.bankName || 'Bank Transfer'}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Account Number:</Text>
                    <Text style={styles.receiptValue}>
                      •••• {selectedReceipt.accountNumber?.slice(-4) || selectedReceipt.bankDetails?.accountNumber?.slice(-4) || ''}
                    </Text>
                  </View>

                  {selectedReceipt.bankDetails?.ifscCode ? (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>IFSC Code:</Text>
                      <Text style={styles.receiptValue}>{selectedReceipt.bankDetails.ifscCode}</Text>
                    </View>
                  ) : null}

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Date & Time:</Text>
                    <Text style={styles.receiptValue}>{new Date(selectedReceipt.createdAt || selectedReceipt.date).toLocaleString()}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Status:</Text>
                    <Text style={[styles.receiptValue, { color: '#00C9A7', fontWeight: 'bold' }]}>{selectedReceipt.status}</Text>
                  </View>

                  <View style={[styles.receiptRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Text style={styles.receiptLabel}>Ref ID:</Text>
                    <Text style={styles.receiptValue}>{selectedReceipt._id || 'N/A'}</Text>
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={[styles.successDoneBtn, { flex: 1, backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: '#9B59B6' }]}
                  onPress={() => handleShareReceipt(selectedReceipt)}
                >
                  <Text style={[styles.successDoneBtnText, { color: '#9B59B6', fontSize: 13 }]}>SHARE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.successDoneBtn, { flex: 1, backgroundColor: '#9B59B6' }]}
                  onPress={() => setSelectedReceipt(null)}
                >
                  <Text style={styles.successDoneBtnText}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* My Customers Modal */}
        <Modal visible={customerHistoryVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '80%', padding: 24 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.modalTitle}>My Customers</Text>
                <TouchableOpacity onPress={() => setCustomerHistoryVisible(false)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={getUniqueCustomers()}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.withdrawalCard, { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(243,156,18,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <MaterialCommunityIcons name="account" size={24} color="#F39C12" />
                      </View>
                      <View>
                        <Text style={[styles.withBank, { fontSize: 15, color: COLORS.text, fontWeight: '700', fontStyle: 'normal' }]}>{item.name}</Text>
                        <Text style={[styles.withDate, { fontSize: 11 }]}>{item.visits} visits • Last: {new Date(item.lastVisit).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.withAmt, { fontSize: 16, color: '#00C9A7', fontWeight: '800' }]}>₹{item.totalSpent.toFixed(2)}</Text>
                  </View>
                )}
                ListEmptyComponent={(
                  <View style={styles.emptyBox}>
                    <MaterialCommunityIcons name="account-group-outline" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>No customers registered yet.</Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>

        {/* ===== Total Sales (Earnings) Modal ===== */}
        <Modal visible={salesHistoryVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '85%', padding: 0, overflow: 'hidden' }]}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="trending-up" size={20} color="#00C9A7" />
                  </View>
                  <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Sales & Earnings</Text>
                </View>
                <TouchableOpacity onPress={() => setSalesHistoryVisible(false)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {/* Summary Banner */}
              <View style={{ flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: 'rgba(0,201,167,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,201,167,0.2)', padding: 14, justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#00C9A7' }}>₹{dashboardData?.stats?.totalSales || 0}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textLight, fontWeight: '700', marginTop: 2 }}>TOTAL COLLECTED</Text>
                </View>
                <View style={{ width: 1, backgroundColor: COLORS.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#3498DB' }}>{transactions.length}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textLight, fontWeight: '700', marginTop: 2 }}>TRANSACTIONS</Text>
                </View>
              </View>

              <FlatList
                data={transactions}
                keyExtractor={(item, idx) => item._id || idx.toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                renderItem={({ item }) => {
                  const isQR = item.paymentMethod === 'QR Scan';
                  const isToken = item.paymentMethod === 'Token';
                  const iconName = isQR ? 'qrcode-scan' : isToken ? 'ticket-percent-outline' : 'storefront-outline';
                  const iconColor = isQR ? '#F39C12' : isToken ? '#3498DB' : '#00C9A7';
                  const displayAmt = isQR ? (item.grossAmount || item.amount) : item.amount;
                  return (
                    <TouchableOpacity
                      style={[styles.withdrawalCard, { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                      onPress={() => {
                        setSalesHistoryVisible(false);
                        if (isQR) setSelectedReceipt(item);
                        else Alert.alert('Transaction Details', `Payer: ${item.userId?.name || 'Customer'}\nAmount: ₹${item.amount}\nMethod: ${item.paymentMethod}\nDate: ${new Date(item.createdAt).toLocaleString()}\nStatus: SUCCESS`);
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: iconColor + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <MaterialCommunityIcons name={iconName} size={21} color={iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.withAmt, { fontSize: 17, color: '#00C9A7' }]}>+₹{displayAmt}</Text>
                        <Text style={styles.withBank}>{item.userId?.name || 'Customer'} • {item.paymentMethod}</Text>
                        {isQR && item.grossAmount !== undefined && (
                          <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2, fontWeight: '600' }}>
                            Net: ₹{item.amount} • Platform Fee: ₹{item.commissionFee || 0}
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 11, color: COLORS.textLight }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        <Text style={{ fontSize: 10, color: COLORS.textLight }}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={(
                  <View style={styles.emptyBox}>
                    <MaterialCommunityIcons name="cash-remove" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>No earnings recorded yet.</Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>

        {/* ===== Total Orders (Order Log) Modal ===== */}
        <Modal visible={ordersHistoryVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '85%', padding: 0, overflow: 'hidden' }]}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(52,152,219,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="clipboard-list-outline" size={20} color="#3498DB" />
                  </View>
                  <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Order History</Text>
                </View>
                <TouchableOpacity onPress={() => setOrdersHistoryVisible(false)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {/* Summary Banner */}
              <View style={{ flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: 'rgba(52,152,219,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(52,152,219,0.2)', padding: 14, justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#3498DB' }}>{dashboardData?.stats?.totalOrders || 0}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textLight, fontWeight: '700', marginTop: 2 }}>TOTAL ORDERS</Text>
                </View>
                <View style={{ width: 1, backgroundColor: COLORS.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#F39C12' }}>{transactions.filter(t => t.paymentMethod === 'QR Scan').length}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textLight, fontWeight: '700', marginTop: 2 }}>VIA QR SCAN</Text>
                </View>
                <View style={{ width: 1, backgroundColor: COLORS.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#9B59B6' }}>{transactions.filter(t => t.paymentMethod === 'Token').length}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textLight, fontWeight: '700', marginTop: 2 }}>TOKEN ORDERS</Text>
                </View>
              </View>

              <FlatList
                data={transactions}
                keyExtractor={(item, idx) => item._id || idx.toString()}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                renderItem={({ item, index }) => {
                  const isQR = item.paymentMethod === 'QR Scan';
                  const isToken = item.paymentMethod === 'Token';
                  const badgeColor = isQR ? '#F39C12' : isToken ? '#9B59B6' : '#00C9A7';
                  const badgeLabel = isQR ? 'QR' : isToken ? 'TOKEN' : 'SHOP';
                  const iconName = isQR ? 'qrcode-scan' : isToken ? 'ticket-percent-outline' : 'storefront-outline';
                  const orderNum = transactions.length - index;
                  return (
                    <View style={[styles.withdrawalCard, { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                      {/* Order number circle */}
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(52,152,219,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1.5, borderColor: 'rgba(52,152,219,0.3)' }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#3498DB' }}>#{orderNum}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        {/* Payment method badge */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <View style={{ backgroundColor: badgeColor + '20', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: badgeColor + '40' }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: badgeColor, letterSpacing: 0.5 }}>{badgeLabel}</Text>
                          </View>
                          <Text style={{ fontSize: 12, color: COLORS.textLight, fontWeight: '600' }}>{item.userId?.name || 'Customer'}</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: COLORS.textLight }}>
                          {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>₹{isQR ? (item.grossAmount || item.amount) : item.amount}</Text>
                    </View>
                  );
                }}
                ListEmptyComponent={(
                  <View style={styles.emptyBox}>
                    <MaterialCommunityIcons name="clipboard-off-outline" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>No orders recorded yet.</Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>

        {/* ====== Settings Detail Modal ====== */}
        <Modal visible={!!settingsModal} animationType="slide" transparent={false} onRequestClose={() => setSettingsModal(null)}>
          <LinearGradient colors={[COLORS.background, COLORS.background]} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>

              {/* Modal Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <TouchableOpacity
                  onPress={() => setSettingsModal(null)}
                  style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}
                >
                  <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>
                  {settingsModal === 'shopConfig' ? 'Edit Shop Configuration'
                    : settingsModal === 'account' ? 'Business & Account'
                    : settingsModal === 'support' ? 'Contact Support'
                    : ''}
                </Text>
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ─── Shop Config ─── */}
                {settingsModal === 'shopConfig' && shopDetails && (
                  <View style={styles.formCard}>
                    <Text style={styles.inputLabel}>Shop Name</Text>
                    <TextInput style={styles.formInput} placeholderTextColor="#AAAAAA" placeholder="Enter Shop Name" value={shopDetails.shopName} onChangeText={(t) => setShopDetails({ ...shopDetails, shopName: t })} />

                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput style={[styles.formInput, { height: 90, textAlignVertical: 'top' }]} placeholderTextColor="#AAAAAA" placeholder="Enter Short Description" multiline value={shopDetails.description} onChangeText={(t) => setShopDetails({ ...shopDetails, description: t })} />

                    <Text style={styles.inputLabel}>Category</Text>
                    <View style={styles.categoryRow}>
                      {['Food', 'Retail', 'Service', 'Other'].map(cat => (
                        <TouchableOpacity key={cat} style={[styles.catBtn, shopDetails.category === cat && styles.catBtnActive]} onPress={() => setShopDetails({ ...shopDetails, category: cat })}>
                          <Text style={[styles.catBtnText, shopDetails.category === cat && styles.catBtnTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.inputLabel}>Store Banner Image</Text>
                    {(shopImageFile?.uri || shopDetails.imageUrl) ? (
                      <View style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border }}>
                        <Image
                          source={{
                            uri: shopImageFile?.uri
                              ? shopImageFile.uri
                              : shopDetails.imageUrl?.startsWith('/')
                                ? `${API_BASE_URL.replace('/api', '')}${shopDetails.imageUrl}`
                                : shopDetails.imageUrl
                          }}
                          style={{ width: '100%', height: 180 }}
                          resizeMode="cover"
                        />
                        {shopImageFile && (
                          <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', padding: 8, flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="image-check-outline" size={16} color="#00C9A7" />
                            <Text style={{ color: '#fff', fontSize: 12, marginLeft: 6, flex: 1 }} numberOfLines={1}>{shopImageFile.name}</Text>
                          </View>
                        )}
                      </View>
                    ) : null}

                    <TouchableOpacity style={[styles.kycPicker, shopImageFile && styles.kycPickerSuccess]} onPress={handleShopImagePick}>
                      <MaterialCommunityIcons name={shopImageFile ? 'image-check-outline' : 'camera-plus-outline'} size={22} color={shopImageFile ? '#00C9A7' : '#888888'} />
                      <Text style={[styles.kycPickerText, shopImageFile && { color: COLORS.text }]}>
                        {shopImageFile ? 'Change Image' : 'Choose Image from Device'}
                      </Text>
                    </TouchableOpacity>

                    {shopImageFile && (
                      <TouchableOpacity style={[styles.formSubmitBtn, { marginBottom: 0 }]} onPress={handleUploadShopImage} disabled={uploadingShopImage}>
                        <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          {uploadingShopImage ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>⬆ Upload Banner Image</Text>}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    <View style={{ height: 16 }} />
                    <TouchableOpacity style={styles.formSubmitBtn} onPress={() => { handleUpdateShop(); setSettingsModal(null); }}>
                      <LinearGradient colors={['#00C9A7', '#00b894']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={styles.btnText}>Save Shop Settings</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ─── Business & Account ─── */}
                {settingsModal === 'account' && (
                  <View style={styles.formCard}>
                    {[
                      { icon: 'domain', label: 'Business Name', value: merchantProfile?.businessName || '—', color: '#6C63FF' },
                      { icon: 'map-marker-outline', label: 'Address', value: merchantProfile?.address || '—', color: '#F39C12' },
                      { icon: 'phone-outline', label: 'Phone', value: merchantProfile?.phone || '—', color: '#00C9A7' },
                      { icon: 'briefcase-outline', label: 'Business Type', value: merchantProfile?.businessType || '—', color: '#3498DB' },
                      { icon: 'shield-check-outline', label: 'KYC Status', value: status.toUpperCase(), color: status === 'approved' ? '#00C9A7' : status === 'pending' ? '#F59E0B' : '#EF4444' },
                      { icon: 'cash-multiple', label: 'Total Earnings', value: `₹${merchantProfile?.totalEarnings?.toFixed(2) || '0.00'}`, color: '#00C9A7' },
                    ].map((row, i, arr) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: COLORS.border }}>
                        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: row.color + '18', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                          <MaterialCommunityIcons name={row.icon} size={20} color={row.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: COLORS.textLight, fontWeight: '700', marginBottom: 3 }}>{row.label}</Text>
                          <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '800' }}>{row.value}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* ─── Support ─── */}
                {settingsModal === 'support' && (
                  <View>
                    <View style={styles.formCard}>
                      <Text style={styles.inputLabel}>Subject</Text>
                      <TextInput style={styles.formInput} placeholderTextColor="#AAAAAA" placeholder="What is the issue?" value={supportForm.subject} onChangeText={(t) => setSupportForm({ ...supportForm, subject: t })} />

                      <Text style={styles.inputLabel}>Category</Text>
                      <View style={styles.categoryRow}>
                        {['Merchant Support', 'Grievance', 'Other'].map(c => (
                          <TouchableOpacity key={c} style={[styles.catBtn, supportForm.category === c && styles.catBtnActive]} onPress={() => setSupportForm({ ...supportForm, category: c })}>
                            <Text style={[styles.catBtnText, supportForm.category === c && styles.catBtnTextActive]}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.inputLabel}>Description</Text>
                      <TextInput style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]} placeholderTextColor="#AAAAAA" placeholder="Describe your query or concern..." multiline numberOfLines={4} value={supportForm.description} onChangeText={(t) => setSupportForm({ ...supportForm, description: t })} />

                      <TouchableOpacity style={styles.formSubmitBtn} onPress={handleSupportSubmit} disabled={submittingSupport}>
                        <LinearGradient colors={['#3498DB', '#2980B9']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          {submittingSupport ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Ticket</Text>}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>

                    {supportTickets.length > 0 && (
                      <View>
                        <Text style={[styles.tabSectionTitle, { marginLeft: 4 }]}>Your Tickets</Text>
                        {supportTickets.map((ticket) => (
                          <View key={ticket._id} style={styles.ticketCard}>
                            <View style={styles.ticketHeaderRow}>
                              <Text style={styles.ticketSub}>{ticket.subject}</Text>
                              <View style={[styles.statusBadge, {
                                backgroundColor: ticket.status === 'Resolved' ? 'rgba(0,201,167,0.15)' : 'rgba(245,158,11,0.15)',
                                borderColor: ticket.status === 'Resolved' ? '#00C9A7' : '#F59E0B'
                              }]}>
                                <Text style={[styles.statusBadgeText, { color: ticket.status === 'Resolved' ? '#00C9A7' : '#F59E0B' }]}>{ticket.status}</Text>
                              </View>
                            </View>
                            <Text style={styles.ticketDesc}>{ticket.description}</Text>
                            {ticket.adminReply ? (
                              <View style={styles.adminReplyBox}>
                                <Text style={styles.adminReplyTitle}>Admin Response:</Text>
                                <Text style={styles.adminReplyContent}>{ticket.adminReply}</Text>
                              </View>
                            ) : null}
                            <Text style={styles.ticketTime}>Raised: {new Date(ticket.createdAt).toLocaleString()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>

        {/* ====== BOTTOM NAV BAR ====== */}
        <View style={styles.bottomNav}>
          {[
            { id: 'overview',    label: 'Home',      icon: 'home',                iconOutline: 'home-outline' },
            { id: 'products',   label: 'Products',   icon: 'storefront',          iconOutline: 'storefront-outline' },
            { id: 'coupons',    label: 'Coupons',    icon: 'tag',                 iconOutline: 'tag-outline' },
            { id: 'withdrawals',label: 'Payouts',    icon: 'wallet',              iconOutline: 'wallet-outline' },
            { id: 'settings',   label: 'Settings',   icon: 'cog',                 iconOutline: 'cog-outline' },
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.bottomNavItem}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={active ? tab.icon : tab.iconOutline}
                  size={24}
                  color={active ? COLORS.secondary : COLORS.textLight}
                />
                <Text style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>




      </SafeAreaView>

      {/* Custom Date Picker Modal */}
      <Modal visible={showDatePickerModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 24, width: '100%' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 20, textAlign: 'center' }}>Select Expiry Date</Text>
            
            {/* Month / Day / Year selectors */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 24 }}>
              {/* Month */}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textLight, marginBottom: 8 }}>MONTH</Text>
                <TouchableOpacity onPress={() => setTempDate(p => ({ ...p, month: (p.month + 1) % 12 }))} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="chevron-up" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text, minWidth: 50, textAlign: 'center' }}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][tempDate.month]}
                </Text>
                <TouchableOpacity onPress={() => setTempDate(p => ({ ...p, month: (p.month + 11) % 12 }))} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {/* Day */}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textLight, marginBottom: 8 }}>DAY</Text>
                <TouchableOpacity onPress={() => setTempDate(p => { const max = new Date(p.year, p.month + 1, 0).getDate(); return { ...p, day: p.day >= max ? 1 : p.day + 1 }; })} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="chevron-up" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text, minWidth: 50, textAlign: 'center' }}>
                  {String(tempDate.day).padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={() => setTempDate(p => { const max = new Date(p.year, p.month + 1, 0).getDate(); return { ...p, day: p.day <= 1 ? max : p.day - 1 }; })} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {/* Year */}
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textLight, marginBottom: 8 }}>YEAR</Text>
                <TouchableOpacity onPress={() => setTempDate(p => ({ ...p, year: p.year + 1 }))} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="chevron-up" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text, minWidth: 60, textAlign: 'center' }}>
                  {tempDate.year}
                </Text>
                <TouchableOpacity onPress={() => setTempDate(p => ({ ...p, year: p.year > new Date().getFullYear() ? p.year - 1 : p.year }))} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowDatePickerModal(false)} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.border, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: COLORS.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDatePick} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#fff' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 10, backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  
  // Old horizontal tabs removed — replaced by bottom nav
  tabsRow: { display: 'none' },
  tabButton: {},
  tabButtonActive: {},
  tabButtonText: {},
  tabButtonTextActive: {},

  // Bottom Navigation Bar (Matches User portal MainTabNavigator style)
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'android' ? 8 : 12,
    paddingTop: 8,
    height: 65,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: COLORS.secondary,
    fontWeight: '800',
  },



  scrollContent: { padding: 20, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statCard: { flex: 1, marginHorizontal: 6, backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, alignItems: 'flex-start' },
  statIconWrap: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statValue: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  statTitle: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  
  statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  statusTitle: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  statusMessage: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', lineHeight: 26, marginBottom: 36 },
  refreshBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 20 },
  refreshBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  
  section: { backgroundColor: COLORS.cardBg, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: COLORS.text, marginBottom: 20 },
  chartWrapper: { alignItems: 'center', marginLeft: -20 },
  
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txDetails: { marginLeft: 14, flex: 1 },
  txType: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  txDate: { fontSize: 12, color: COLORS.textLight },
  txAmount: { fontSize: 16, fontWeight: '900', color: '#00C9A7' },
  
  qrContainer: { backgroundColor: COLORS.cardBg, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginBottom: 20, marginTop: 10 },
  qrTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  qrSubtitle: { fontSize: 13, color: COLORS.textLight, marginBottom: 24, textAlign: 'center' },
  qrWrapper: { padding: 16, backgroundColor: '#fff', borderRadius: 20, elevation: 8 },

  // Products
  tabHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  tabSectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginTop: 24, marginBottom: 16 },
  tabAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00C9A7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, gap: 4 },
  tabAddBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  productCard: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  productPrice: { fontSize: 15, fontWeight: '900', color: '#00C9A7', marginTop: 4 },
  productDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  productActions: { flexDirection: 'row', gap: 10 },
  prodActionBtn: { padding: 8, backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  unavailableBadge: { backgroundColor: 'rgba(239,68,68,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  unavailableText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },

  // Coupons
  couponCard: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  couponIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  couponTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  couponDiscount: { fontSize: 16, fontWeight: '900', color: '#00C9A7', marginTop: 2 },
  couponExpiry: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  couponDelete: { padding: 8 },

  // Withdrawals
  balanceCard: { backgroundColor: 'rgba(155,89,182,0.12)', borderLeftWidth: 4, borderLeftColor: '#9B59B6', padding: 18, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  balanceCardLabel: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  balanceCardVal: { fontSize: 26, fontWeight: '900', color: '#9B59B6', marginTop: 4 },
  withdrawalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.cardBg, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  withAmt: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  withDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },

  // Forms
  formCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  formCardTitle: { fontSize: 17, fontWeight: '900', color: COLORS.text, marginBottom: 18 },
  inputLabel: { fontSize: 13, color: COLORS.textLight, marginBottom: 6, marginTop: 10, fontWeight: '600' },
  formInput: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  formSubmitBtn: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  btnGrad: { height: 50, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  // Support
  categoryRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 8 },
  catBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.background },
  catBtnActive: { borderColor: '#00C9A7', backgroundColor: 'rgba(0,201,167,0.1)' },
  catBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textLight },
  catBtnTextActive: { color: '#00C9A7', fontWeight: '800' },
  ticketCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  ticketHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  ticketSub: { fontSize: 15, fontWeight: '800', color: COLORS.text, flex: 0.7 },
  ticketDesc: { fontSize: 13, color: COLORS.textLight, lineHeight: 20 },
  ticketTime: { fontSize: 11, color: COLORS.textLight, marginTop: 12, textAlign: 'right' },
  adminReplyBox: { backgroundColor: 'rgba(0,201,167,0.08)', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: 'rgba(0,201,167,0.15)' },
  adminReplyTitle: { fontSize: 12, fontWeight: '900', color: '#00C9A7', marginBottom: 4 },
  adminReplyContent: { fontSize: 13, color: COLORS.text, lineHeight: 18 },

  // KYC Screen
  kycScroll: { padding: 20, paddingBottom: 40 },
  kycHeader: { alignItems: 'center', marginVertical: 20 },
  kycTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginTop: 12, textAlign: 'center' },
  kycSubtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginTop: 6, paddingHorizontal: 15 },
  kycCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginTop: 10 },
  kycLabel: { fontSize: 14, color: COLORS.textLight, fontWeight: '700', marginBottom: 10, marginTop: 14 },
  kycPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', gap: 10 },
  kycPickerSuccess: { borderStyle: 'solid', borderColor: '#00C9A7', backgroundColor: 'rgba(0,201,167,0.05)' },
  kycPickerText: { fontSize: 13, color: COLORS.textLight, flex: 1, fontWeight: '600' },
  kycSubmitBtn: { marginTop: 30, borderRadius: 16, overflow: 'hidden' },
  rejectionBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.12)', padding: 14, marginHorizontal: 20, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', gap: 8 },
  rejectionText: { color: '#EF4444', fontSize: 13, fontWeight: '700', flex: 1 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.cardBg, width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 14, textAlign: 'center' },
  modalInput: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14, padding: 4 },
  switchLabel: { fontSize: 15, color: COLORS.text, fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 12 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  modalCancelText: { color: COLORS.text, fontWeight: '700' },
  modalSubmit: { backgroundColor: '#00C9A7', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  modalSubmitText: { color: '#fff', fontWeight: '800' },
  wizardCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  wizardCardTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  wizardCardSub: { fontSize: 13, color: COLORS.textLight, marginBottom: 20 },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  bankGridItem: { width: '22%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 14, backgroundColor: COLORS.background, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  bankLogoCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  bankGridText: { fontSize: 10, fontWeight: '800', color: COLORS.textLight, textAlign: 'center' },
  wizardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  wizardBackBtn: { padding: 8, backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  wizardHeaderTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  selectedBankBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,201,167,0.1)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,201,167,0.2)', marginBottom: 16 },
  selectedBankBannerText: { fontSize: 13, color: '#00C9A7', fontWeight: '800' },
  inputGroup: { marginBottom: 14 },
  continueBtn: { backgroundColor: '#9B59B6', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  continueBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  recipientHeaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  recipientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(155,89,182,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#9B59B6' },
  recipientAvatarText: { color: '#9B59B6', fontSize: 16, fontWeight: '900' },
  recipientName: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  recipientBankInfo: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  phonepeInputWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#9B59B6', paddingVertical: 10, marginHorizontal: 20 },
  currencySymbol: { fontSize: 36, fontWeight: '900', color: '#9B59B6', marginRight: 10 },
  phonepeInput: { flex: 1, fontSize: 38, fontWeight: '900', color: COLORS.text, padding: 0 },
  quickValuesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginVertical: 20 },
  quickValBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background },
  quickValText: { fontSize: 12, fontWeight: '800', color: COLORS.textLight },
  phonepePayBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  phonepePayGrad: { height: 52, justifyContent: 'center', alignItems: 'center' },
  phonepePayText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00C9A7', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#00C9A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  successSubtitle: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 20, marginBottom: 24 },
  successSummaryBox: { width: '100%', backgroundColor: COLORS.background, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  successAmount: { fontSize: 32, fontWeight: '900', color: '#00C9A7', textAlign: 'center', marginBottom: 16 },
  successRecipient: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  successAccount: { fontSize: 13, color: COLORS.textLight, marginBottom: 6 },
  successTime: { fontSize: 13, color: COLORS.textLight, marginBottom: 6 },
  successTxId: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic' },
  successDoneBtn: { width: '100%', backgroundColor: '#00C9A7', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  successDoneBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  premiumCard: { borderRadius: 24, padding: 24, marginBottom: 24, elevation: 8, shadowColor: '#9B59B6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  premiumCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  premiumCardTitle: { fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5 },
  premiumCardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  premiumCardBalance: { fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 6, marginBottom: 24 },
  premiumCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  premiumCardNumber: { fontSize: 16, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, fontWeight: '700' },
  premiumCardChip: { fontSize: 10, fontWeight: '900', color: '#E2C275', letterSpacing: 1 },
  withBank: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontStyle: 'italic' },
  phonepeSearchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 16, height: 48, marginBottom: 16 },
  phonepeSearchInput: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '600', padding: 0 },
  bankSectionTitle: { fontSize: 12, color: COLORS.textLight, fontWeight: '800', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  bankListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  bankListItemText: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginLeft: 14 },
  bankListIconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  noBankText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '20' },
  receiptLabel: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  receiptValue: { fontSize: 13, color: COLORS.text, fontWeight: '700', textAlign: 'right', flex: 0.7 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', fontWeight: '600', marginTop: 8 }
});
