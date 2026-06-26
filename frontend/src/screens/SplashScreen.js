import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, StatusBar, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../utils/storage';
import { authSuccess } from '../redux/slices/authSlice';
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
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      
      <View style={styles.logoContainer}>
        <View style={styles.logoBg}>
          <Image 
            source={require('../assets/images/app_logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>
        <Text style={styles.title}>PUNE METRO</Text>
        <Text style={styles.subtitle}>आली आपली मेट्रो! 🚇</Text>
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Securing booking gateway...</Text>
      </View>
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  logoBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
    padding: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.secondary,
    marginTop: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textLight,
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
});
