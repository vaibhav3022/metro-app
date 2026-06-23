import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, StatusBar } from 'react-native';
import { useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../utils/storage';
import { authSuccess, logout } from '../redux/slices/authSlice';
import { authAPI } from '../api/authAPI';

export default function SplashScreen({ navigation }) {
  const dispatch = useDispatch();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await storage.getToken();
        const refreshToken = await storage.getRefreshToken();
        const storedUser = await storage.getUser();


        if (token && storedUser) {
          // Verify with backend
          try {
            const profileData = await authAPI.getProfile();
            const finalUser = profileData.user || storedUser;
            dispatch(authSuccess({
              user: finalUser,
              token,
              refreshToken
            }));

            if (finalUser.role === 'admin') {
              navigation.replace('AdminDashboard');
            } else if (finalUser.role === 'merchant') {
              navigation.replace('MerchantDashboard');
            } else {
              navigation.replace('Home');
            }
          } catch (apiError) {
            console.log('Profile fetch failed, trying token update', apiError);
            // If it's a transient network error, we can still let them in using stored credentials
            dispatch(authSuccess({
              user: storedUser,
              token,
              refreshToken
            }));

            if (storedUser.role === 'admin') {
              navigation.replace('AdminDashboard');
            } else if (storedUser.role === 'merchant') {
              navigation.replace('MerchantDashboard');
            } else {
              navigation.replace('Home');
            }
          }
        } else {
          navigation.replace('Login');
        }
      } catch (e) {
        console.error('Error during splash auth check', e);
        navigation.replace('Login');
      }
    };

    checkAuthStatus();
  }, [dispatch, navigation]);

  return (
    <LinearGradient
      colors={[COLORS.primary, '#00366C']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.logoContainer}>
        <View style={styles.logoBg}>
          <MaterialCommunityIcons name="subway" size={54} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>PUNE METRO</Text>
        <Text style={styles.subtitle}>आली आपली मेट्रो!</Text>
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.white} />
        <Text style={styles.loadingText}>Securing booking gateway...</Text>
      </View>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  logoBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 12,
    fontSize: 12,
    fontWeight: '500',
  },
});
