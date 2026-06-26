import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import RouteSelectionScreen from '../screens/RouteSelectionScreen';
import FareScreen from '../screens/FareScreen';
import PaymentScreen from '../screens/PaymentScreen';
import QRTicketScreen from '../screens/QRTicketScreen';
import MetroMapScreen from '../screens/MetroMapScreen';
import PaymentGatewayScreen from '../screens/PaymentGatewayScreen';
import NotificationsScreen from '../screens/User/NotificationScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import MerchantDashboardScreen from '../screens/Merchant/MerchantDashboardScreen';
import ScanAndPayScreen from '../screens/ScanAndPayScreen';
import PayMerchantScreen from '../screens/User/PayMerchantScreen';
import FareCalculatorScreen from '../screens/FareCalculatorScreen';
import StationInfoScreen from '../screens/StationInfoScreen';
import FeederServicesScreen from '../screens/FeederServicesScreen';
import SmartCardScreen from '../screens/SmartCardScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import TokenEconomyScreen from '../screens/User/TokenEconomyScreen';
import MerchantManagementScreen from '../screens/Admin/MerchantManagementScreen';
import RevenueAnalyticsScreen from '../screens/Admin/RevenueAnalyticsScreen';
import UserManagementScreen from '../screens/Admin/UserManagementScreen';
import AdminNotificationScreen from '../screens/Admin/AdminNotificationScreen';
import ShopAnalyticsScreen from '../screens/Merchant/ShopAnalyticsScreen';
import MerchantNotificationScreen from '../screens/Merchant/MerchantNotificationScreen';

const Stack = createStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#F5F5F5' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        
        {/* User Portal */}
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="RouteSelection" component={RouteSelectionScreen} />
        <Stack.Screen name="Fare" component={FareScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="QRTicket" component={QRTicketScreen} />
        <Stack.Screen name="MetroMap" component={MetroMapScreen} />
        <Stack.Screen name="PaymentGateway" component={PaymentGatewayScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="ScanAndPay" component={ScanAndPayScreen} />
        <Stack.Screen name="PayMerchant" component={PayMerchantScreen} />
        <Stack.Screen name="FareCalculator" component={FareCalculatorScreen} />
        <Stack.Screen name="StationInfo" component={StationInfoScreen} />
        <Stack.Screen name="FeederServices" component={FeederServicesScreen} />
        <Stack.Screen name="SmartCard" component={SmartCardScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="TokenEconomy" component={TokenEconomyScreen} />

        {/* Admin Portal */}
        <Stack.Screen name="AdminMain" component={AdminDashboardScreen} />
        <Stack.Screen name="MerchantManagement" component={MerchantManagementScreen} />
        <Stack.Screen name="RevenueAnalytics" component={RevenueAnalyticsScreen} />
        <Stack.Screen name="UserManagement" component={UserManagementScreen} />
        <Stack.Screen name="AdminNotification" component={AdminNotificationScreen} />

        {/* Merchant Portal */}
        <Stack.Screen name="MerchantMain" component={MerchantDashboardScreen} />
        <Stack.Screen name="ShopAnalytics" component={ShopAnalyticsScreen} />
        <Stack.Screen name="MerchantNotificationScreen" component={MerchantNotificationScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
