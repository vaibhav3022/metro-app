import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useSelector } from 'react-redux';
import { store } from './redux/store';
import { ActivityIndicator, View } from 'react-native';

// Auth Screens
import LoginScreen from './screens/LoginScreen';
import OTPScreen from './screens/OTPScreen';
import SplashScreen from './screens/SplashScreen';

// User Screens
import MainTabNavigator from './navigation/MainTabNavigator';
import WalletScreen from './screens/WalletScreen';
import QRTicketScreen from './screens/QRTicketScreen';
import TicketHistoryScreen from './screens/TicketHistoryScreen';
import RouteSelectionScreen from './screens/RouteSelectionScreen';
import ScanAndPayScreen from './screens/ScanAndPayScreen';
import FareCalculatorScreen from './screens/FareCalculatorScreen';
import FareScreen from './screens/FareScreen';
import MetroMapScreen from './screens/MetroMapScreen';
import SmartCardScreen from './screens/SmartCardScreen';
import ProfileScreen from './screens/ProfileScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import ShopsScreen from './screens/ShopsScreen';
import FeederServicesScreen from './screens/FeederServicesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import PaymentGatewayScreen from './screens/PaymentGatewayScreen';
import PaymentScreen from './screens/PaymentScreen';
import StationInfoScreen from './screens/StationInfoScreen';

// User sub-screens
import TokenEconomyScreen from './screens/User/TokenEconomyScreen';
import NotificationScreen from './screens/User/NotificationScreen';
import PayMerchantScreen from './screens/User/PayMerchantScreen';

// Merchant Screens
import MerchantDashboardScreen from './screens/Merchant/MerchantDashboardScreen';
import MerchantPendingScreen from './screens/MerchantPendingScreen';
import ShopAnalyticsScreen from './screens/Merchant/ShopAnalyticsScreen';
import MerchantNotificationScreen from './screens/Merchant/MerchantNotificationScreen';

// Admin Screens
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminNotificationScreen from './screens/Admin/AdminNotificationScreen';
import MerchantManagementScreen from './screens/Admin/MerchantManagementScreen';
import RevenueAnalyticsScreen from './screens/Admin/RevenueAnalyticsScreen';
import StationManagementScreen from './screens/Admin/StationManagementScreen';
import UserManagementScreen from './screens/Admin/UserManagementScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, token, loading } = useSelector((state) => state.auth);
  const { isDark, theme: COLORS } = useTheme();

  const navigationTheme = isDark ? {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: COLORS.background, card: COLORS.cardBg, text: COLORS.text, border: COLORS.border }
  } : {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: COLORS.background, card: COLORS.cardBg, text: COLORS.text, border: COLORS.border }
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          // Auth Stack
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            {/* Initial screen based on role */}
            {user?.role === 'admin' ? (
              <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            ) : user?.role === 'merchant' ? (
              <Stack.Screen name="MerchantDashboard" component={MerchantDashboardScreen} />
            ) : (
              <Stack.Screen name="Home" component={MainTabNavigator} />
            )}

            {/* Common User Screens */}
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="QRTicket" component={QRTicketScreen} />
            <Stack.Screen name="TicketHistory" component={TicketHistoryScreen} />
            <Stack.Screen name="RouteSelection" component={RouteSelectionScreen} />
            <Stack.Screen name="ScanAndPay" component={ScanAndPayScreen} />
            <Stack.Screen name="FareCalculator" component={FareCalculatorScreen} />
            <Stack.Screen name="Fare" component={FareScreen} />
            <Stack.Screen name="MetroMap" component={MetroMapScreen} />
            <Stack.Screen name="SmartCard" component={SmartCardScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="Feeder" component={FeederServicesScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            <Stack.Screen name="PaymentGateway" component={PaymentGatewayScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="StationInfo" component={StationInfoScreen} />

            {/* User Sub-screens */}
            <Stack.Screen name="Tokens" component={TokenEconomyScreen} />
            <Stack.Screen name="UserNotification" component={NotificationScreen} />
            <Stack.Screen name="PayMerchant" component={PayMerchantScreen} />

            {/* Merchant Sub-screens */}
            <Stack.Screen name="MerchantPending" component={MerchantPendingScreen} />
            <Stack.Screen name="ShopAnalytics" component={ShopAnalyticsScreen} />
            <Stack.Screen name="MerchantNotification" component={MerchantNotificationScreen} />

            {/* Admin Sub-screens */}
            <Stack.Screen name="AdminNotifications" component={AdminNotificationScreen} />
            <Stack.Screen name="MerchantManagement" component={MerchantManagementScreen} />
            <Stack.Screen name="RevenueAnalytics" component={RevenueAnalyticsScreen} />
            <Stack.Screen name="StationManagement" component={StationManagementScreen} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { ThemeProvider, useTheme } from './context/ThemeContext';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </Provider>
  );
}
