import React, { useState } from 'react';
import COLORS from '../constants/colors';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, SafeAreaView, StatusBar, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { ticketAPI } from '../api/ticketAPI';

// Use react-native-camera or expo-barcode-scanner in a real app.
// For now, using a manual entry fallback.
export default function QRScannerScreen() {
  const [scannedResult, setScannedResult] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const navigation = useNavigation();

  const handleManualScan = async (code) => {
    if (processing || scannedResult) return;
    setScannedResult(code);
    setProcessing(true);

    try {
      const response = await ticketAPI.verifyTicketQR(code);
      Alert.alert('Scan Successful', response.message || 'Ticket Verified!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (err) {
      const backendError = err.response?.data?.message || err.message || 'Failed to verify ticket.';
      setError(backendError);
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setScannedResult(null);
    setError(null);
    setProcessing(false);
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Ticket QR</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.body}>
          {error ? (
            <View style={styles.centered}>
              <View style={styles.iconCircleRed}>
                <Icon name="alert-circle-outline" size={40} color="#EF4444" />
              </View>
              <Text style={styles.statusTitle}>Scan Failed</Text>
              <Text style={styles.statusSubtitle}>{error}</Text>
              <TouchableOpacity style={styles.actionButton} onPress={resetScanner}>
                <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.actionBtnGrad}>
                  <Text style={styles.actionButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : scannedResult ? (
            <View style={styles.centered}>
              <View style={styles.iconCircleBlue}>
                <ActivityIndicator size="large" color="#00C9A7" />
              </View>
              <Text style={styles.statusTitle}>Verifying Ticket...</Text>
              <Text style={styles.statusSubtitle} numberOfLines={2}>Code: {scannedResult}</Text>
            </View>
          ) : (
            <View style={styles.centered}>
              <View style={styles.scannerPlaceholder}>
                <Icon name="qrcode-scan" size={100} color="#00C9A7" />
                <View style={styles.scannerCorner1} />
                <View style={styles.scannerCorner2} />
                <View style={styles.scannerCorner3} />
                <View style={styles.scannerCorner4} />
              </View>
              <Text style={styles.scanHint}>Align your digital or physical ticket QR code within the frame.</Text>
              
              <View style={{ marginTop: 40, width: '100%' }}>
                <TouchableOpacity style={styles.demoButton} onPress={() => handleManualScan('DEMO-TICKET-' + Date.now())}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primary]} style={styles.actionBtnGrad}>
                    <Icon name="ticket-confirmation" size={20} color="#fff" />
                    <Text style={styles.demoButtonText}>Simulate Successful Scan</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  
  body: { flex: 1, padding: 24, justifyContent: 'center' },
  centered: { alignItems: 'center', gap: 20 },
  
  iconCircleRed: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(239,68,68,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  iconCircleBlue: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(0,201,167,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,201,167,0.3)' },
  
  statusTitle: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center' },
  statusSubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 24, lineHeight: 22 },
  
  actionButton: { borderRadius: 16, overflow: 'hidden', marginTop: 10, width: '100%' },
  actionBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16 },
  actionButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  
  scannerPlaceholder: { width: 280, height: 280, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 20 },
  scannerCorner1: { position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#00C9A7', borderRadius: 8 },
  scannerCorner2: { position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderTopWidth: 5, borderRightWidth: 5, borderColor: '#00C9A7', borderRadius: 8 },
  scannerCorner3: { position: 'absolute', bottom: 20, left: 20, width: 40, height: 40, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#00C9A7', borderRadius: 8 },
  scannerCorner4: { position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#00C9A7', borderRadius: 8 },
  
  scanHint: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 30, lineHeight: 24 },
  
  demoButton: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  demoButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
