import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, StatusBar, ActivityIndicator, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../api/axiosConfig';

export default function ShopsScreen({ navigation }) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const [search, setSearch] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);

  const ShopImage = ({ uri }) => {
    const [hasError, setHasError] = useState(false);
    return (
      <Image 
        source={{ uri: hasError || !uri ? 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80' : uri }} 
        style={styles.cardImage} 
        onError={() => setHasError(true)} 
      />
    );
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await api.get('/shops');
      setShops(res.data.shops || []);
    } catch (err) {
      console.log('Error fetching shops', err);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredShops = shops.filter(shop => 
    (shop.shopName || shop.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (shop.merchantId?.address || shop.location || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderShop = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => setSelectedShop(item)}>
      <ShopImage uri={item.imageUrl || item.image} />
      <View style={styles.cardImageOverlay} />
      <View style={styles.cardContent}>
        <Text style={styles.shopName}>{item.shopName || item.name}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.shopCategory}>{item.category || 'Retail'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="email-outline" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={{ fontSize: 12, color: COLORS.textLight, marginLeft: 4 }}>{item.merchantId?.userId?.email || 'No email'}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Icon name="map-marker-outline" size={16} color="rgba(255,255,255,0.5)" />
          <Text style={styles.shopLocation}>{item.merchantId?.address || item.location || 'Metro Station'}</Text>
        </View>
        <View style={styles.footerRow}>
          <View style={styles.ratingBox}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ScanAndPay', { shopId: item._id, shopName: item.shopName })}
              style={{ borderRadius: 16, overflow: 'hidden' }}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtn}>
                <Icon name="form-textbox" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.payBtnText}>Pay</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('ScanAndPay')}
              style={{ borderRadius: 16, overflow: 'hidden' }}
            >
              <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtn}>
                <Icon name="qrcode-scan" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.payBtnText}>Scan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Station Shops</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={22} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by shop name or station..."
          placeholderTextColor="#AAAAAA"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00C9A7" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredShops}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderShop}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="store-off-outline" size={60} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>No shops found.</Text>
            </View>
          }
        />
      )}

      {/* Shop Details Modal */}
      <Modal
        visible={!!selectedShop}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedShop(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedShop && (
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedShop(null)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
              
              <Image 
                source={{ uri: selectedShop.imageUrl || selectedShop.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80' }} 
                style={styles.modalImage} 
              />
              <LinearGradient colors={['transparent', COLORS.cardBg]} style={styles.modalImageGrad} />

              <ScrollView style={styles.modalBody}>
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalTitle}>{selectedShop.shopName || selectedShop.name}</Text>
                  <View style={styles.ratingBox}>
                    <Icon name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{selectedShop.rating || '4.5'}</Text>
                  </View>
                </View>

                <Text style={styles.modalCategory}>{selectedShop.category || 'Retail Store'}</Text>

                <View style={styles.modalInfoRow}>
                  <Icon name="map-marker-outline" size={20} color="#00C9A7" />
                  <Text style={styles.modalInfoText}>{selectedShop.merchantId?.address || selectedShop.location || 'Inside Metro Station'}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Icon name="email-outline" size={20} color="#3498DB" />
                  <Text style={styles.modalInfoText}>{selectedShop.merchantId?.userId?.email || 'Contact unavailable'}</Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Icon name="clock-outline" size={20} color="#F39C12" />
                  <Text style={styles.modalInfoText}>Open: 08:00 AM - 10:00 PM</Text>
                </View>

                <View style={styles.modalDescWrap}>
                  <Text style={styles.modalDescTitle}>About the Shop</Text>
                  <Text style={styles.modalDesc}>
                    {selectedShop.description || `Welcome to ${selectedShop.shopName || selectedShop.name}! We provide top quality products and services to metro passengers. Visit us for an excellent experience right inside the station.`}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalActionBtn} 
                  onPress={() => {
                    const shopId = selectedShop._id;
                    const shopName = selectedShop.shopName;
                    setSelectedShop(null);
                    navigation.navigate('ScanAndPay', { shopId, shopName });
                  }}
                >
                  <LinearGradient colors={[COLORS.primary, COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalActionGrad}>
                    <Icon name="form-textbox" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.modalActionText}>Pay Bill</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setSelectedShop(null);
                    navigation.navigate('ScanAndPay');
                  }}
                >
                  <LinearGradient colors={[COLORS.secondary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalActionGrad}>
                    <Icon name="qrcode-scan" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.modalActionText}>Scan QR</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, marginLeft: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: { width: '100%', height: 160 },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 160,
    backgroundColor: 'rgba(10,10,26,0.2)',
  },
  cardContent: { padding: 18 },
  shopName: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  shopCategory: { fontSize: 13, color: '#00C9A7', marginBottom: 12, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  shopLocation: { fontSize: 13, color: COLORS.textLight, marginLeft: 6, fontWeight: '500' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  ratingText: { marginLeft: 6, fontSize: 14, fontWeight: '800', color: '#FFD700' },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: COLORS.textLight, marginTop: 16, fontSize: 16, fontWeight: '500' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBg, height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '100%', height: 250 },
  modalImageGrad: { position: 'absolute', top: 0, width: '100%', height: 250 },
  modalBody: { padding: 24 },
  modalHeaderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text, flex: 1, marginRight: 10 },
  modalCategory: { fontSize: 15, color: '#00C9A7', fontWeight: '700', marginBottom: 24 },
  modalInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: COLORS.background, padding: 14, borderRadius: 16 },
  modalInfoText: { color: COLORS.text, fontSize: 14, marginLeft: 12, fontWeight: '600' },
  modalDescWrap: { marginTop: 10, marginBottom: 40, backgroundColor: COLORS.background, padding: 16, borderRadius: 16 },
  modalDescTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  modalDesc: { color: COLORS.textLight, fontSize: 14, lineHeight: 22 },
  modalFooter: { flexDirection: 'row', padding: 20, paddingBottom: 30, backgroundColor: COLORS.cardBg, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12 },
  modalActionBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  modalActionGrad: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  modalActionText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
