import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, Alert, Modal, StatusBar, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../api/axiosConfig';
import EmptyState from '../../components/EmptyState';
import ToastMessage from '../../components/ToastMessage';

export default function ShopAnalyticsScreen({ navigation }) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [productModal, setProductModal] = useState({ visible: false, isEdit: false });
  const [offerModal, setOfferModal] = useState(false);
  
  const [prodForm, setProdForm] = useState({ _id: null, name: '', price: '', description: '', isAvailable: true });
  const [offerForm, setOfferForm] = useState({ title: '', discount: '', validUntil: '' });

  const fetchShop = async () => {
    setLoading(true);
    try {
      const res = await api.get('/merchant/shop');
      setShop(res.data.shop);
    } catch (err) {
      showToast('Failed to fetch shop details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShop(); }, []);

  const showToast = (message, type) => setToast({ visible: true, message, type });

  const resetProdForm = () => setProdForm({ _id: null, name: '', price: '', description: '', isAvailable: true });
  const resetOfferForm = () => setOfferForm({ title: '', discount: '', validUntil: '' });

  const handleSaveProduct = async () => {
    if (!prodForm.name || !prodForm.price) return showToast('Name and Price are required', 'error');
    try {
      setLoading(true);
      const payload = { ...prodForm, price: parseFloat(prodForm.price) };
      if (prodForm.isEdit) {
        await api.put(`/merchant/shop/product/${prodForm._id}`, payload);
      } else {
        await api.post('/merchant/shop/product', payload);
      }
      showToast(`Product ${prodForm.isEdit ? 'updated' : 'added'}`, 'success');
      setProductModal({ visible: false, isEdit: false });
      resetProdForm();
      fetchShop();
    } catch (err) {
      showToast('Failed to save product', 'error');
      setLoading(false);
    }
  };

  const handleDeleteProduct = (id) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            await api.delete(`/merchant/shop/product/${id}`);
            showToast('Product deleted', 'success');
            fetchShop();
          } catch (err) { showToast('Failed to delete', 'error'); setLoading(false); }
        }
      }
    ]);
  };

  const handleSaveOffer = async () => {
    if (!offerForm.title || !offerForm.discount) return showToast('Title and Discount are required', 'error');
    try {
      setLoading(true);
      await api.post('/merchant/shop/offer', offerForm);
      showToast('Offer added', 'success');
      setOfferModal(false);
      resetOfferForm();
      fetchShop();
    } catch (err) { showToast('Failed to add offer', 'error'); setLoading(false); }
  };

  return (
    <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        {toast.visible && <ToastMessage message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop Manager</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchShop} tintColor="#00C9A7" />} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {shop && (
            <LinearGradient colors={['rgba(155,89,182,0.2)', 'rgba(0,201,167,0.15)']} style={styles.shopHeaderCard} start={{x:0, y:0}} end={{x:1, y:1}}>
              <Text style={styles.shopName}>{shop.shopName}</Text>
              <Text style={styles.shopCategory}>{shop.category}</Text>
              <View style={styles.shopStatsRow}>
                <View style={styles.statBadge}>
                  <Text style={styles.shopStatText}>{shop.products?.length || 0} Products</Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.shopStatText}>{shop.offers?.length || 0} Active Offers</Text>
                </View>
              </View>
            </LinearGradient>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => { resetProdForm(); setProductModal({ visible: true, isEdit: false }); }}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {!shop?.products || shop.products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="package-variant-closed" size={48} color="#00C9A7" />
              </View>
              <Text style={styles.emptyTitle}>No Products</Text>
              <Text style={styles.emptySubtitle}>Add some products to your shop.</Text>
            </View>
          ) : (
            shop.products.map(p => (
              <View key={p._id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{p.name}</Text>
                  <Text style={styles.itemPrice}>₹{p.price}</Text>
                  <View style={[styles.badge, { backgroundColor: p.isAvailable ? 'rgba(0,201,167,0.2)' : 'rgba(239,68,68,0.2)', borderColor: p.isAvailable ? '#00C9A7' : '#EF4444' }]}>
                    <Text style={[styles.badgeText, { color: p.isAvailable ? '#00C9A7' : '#EF4444' }]}>{p.isAvailable ? 'Available' : 'Unavailable'}</Text>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => {
                    setProdForm({ _id: p._id, name: p.name, price: p.price.toString(), description: p.description || '', isAvailable: p.isAvailable, isEdit: true });
                    setProductModal({ visible: true, isEdit: true });
                  }}>
                    <MaterialCommunityIcons name="pencil-outline" size={22} color="#F59E0B" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteProduct(p._id)}>
                    <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={[styles.sectionHeader, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Offers</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => { resetOfferForm(); setOfferModal(true); }}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {!shop?.offers || shop.offers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.iconCircle, { borderColor: 'rgba(155,89,182,0.3)', backgroundColor: 'rgba(155,89,182,0.1)' }]}>
                <MaterialCommunityIcons name="ticket-percent-outline" size={48} color="#9B59B6" />
              </View>
              <Text style={styles.emptyTitle}>No Offers</Text>
              <Text style={styles.emptySubtitle}>Create an offer to attract more customers.</Text>
            </View>
          ) : (
            shop.offers.map(o => (
              <View key={o._id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{o.title}</Text>
                  <Text style={styles.itemDesc}>{o.discount} Discount</Text>
                  {o.validUntil && <Text style={styles.itemDate}>Valid until: {new Date(o.validUntil).toLocaleDateString()}</Text>}
                </View>
              </View>
            ))
          )}

        </ScrollView>

        {/* Product Modal */}
        <Modal visible={productModal.visible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{productModal.isEdit ? 'Edit Product' : 'Add Product'}</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Product Name" value={prodForm.name} onChangeText={t => setProdForm({...prodForm, name: t})} />
              <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Price (₹)" keyboardType="numeric" value={prodForm.price} onChangeText={t => setProdForm({...prodForm, price: t})} />
              <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Description (Optional)" value={prodForm.description} onChangeText={t => setProdForm({...prodForm, description: t})} />
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Available</Text>
                <Switch value={prodForm.isAvailable} onValueChange={v => setProdForm({...prodForm, isAvailable: v})} trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0,201,167,0.5)' }} thumbColor={prodForm.isAvailable ? '#00C9A7' : 'rgba(255,255,255,0.5)'} />
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setProductModal({ visible: false, isEdit: false })}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handleSaveProduct}><Text style={styles.modalSubmitText}>Save Product</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Offer Modal */}
        <Modal visible={offerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Offer</Text>
              <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Offer Title (e.g. Summer Sale)" value={offerForm.title} onChangeText={t => setOfferForm({...offerForm, title: t})} />
              <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Discount (e.g. 20% OFF)" value={offerForm.discount} onChangeText={t => setOfferForm({...offerForm, discount: t})} />
              <TextInput style={styles.modalInput} placeholderTextColor="rgba(255,255,255,0.4)" placeholder="Valid Until (YYYY-MM-DD)" value={offerForm.validUntil} onChangeText={t => setOfferForm({...offerForm, validUntil: t})} />
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setOfferModal(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handleSaveOffer}><Text style={styles.modalSubmitText}>Save Offer</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  shopHeaderCard: { padding: 24, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  shopName: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  shopCategory: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 16, fontWeight: '600' },
  shopStatsRow: { flexDirection: 'row', gap: 12 },
  statBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  shopStatText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,201,167,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  addBtnText: { color: '#fff', fontWeight: '800', marginLeft: 6, fontSize: 13 },
  
  itemCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1, marginRight: 16 },
  itemName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 6 },
  itemPrice: { fontSize: 16, color: '#00C9A7', fontWeight: '900', marginBottom: 10 },
  itemDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 8, fontWeight: '600' },
  itemDate: { fontSize: 12, color: 'rgba(245,158,11,0.8)', fontWeight: '700' },
  
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  
  itemActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#141432', width: '100%', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 24, color: '#fff' },
  modalInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 16, fontSize: 16, color: '#fff' },
  
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  switchLabel: { fontSize: 16, color: '#fff', fontWeight: '700' },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 12 },
  modalCancel: { paddingVertical: 14, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14 },
  modalCancelText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalSubmit: { backgroundColor: '#00C9A7', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
  modalSubmitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,201,167,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }
});
