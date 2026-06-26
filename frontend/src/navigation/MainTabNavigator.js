import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TicketHistoryScreen from '../screens/TicketHistoryScreen';
import ScanAndPayScreen from '../screens/ScanAndPayScreen';
import ShopsScreen from '../screens/ShopsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Floating Scanner Button - half above, half below nav bar
function ScannerTabButton({ children, onPress }) {
  return (
    <TouchableOpacity
      style={styles.scannerBtnWrap}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.scannerBtn}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name="qrcode-scan" size={32} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function MainTabNavigator() {
  const { theme: COLORS } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TicketsTab') {
            iconName = focused ? 'ticket-confirmation' : 'ticket-confirmation-outline';
          } else if (route.name === 'ScannerTab') {
            iconName = 'qrcode-scan';
          } else if (route.name === 'ShopsTab') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={26} color={color} />;
        },
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.cardBg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 2,
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: t('tabs.home') }}
      />
      <Tab.Screen
        name="TicketsTab"
        component={TicketHistoryScreen}
        options={{ title: t('tabs.tickets') }}
      />
      <Tab.Screen
        name="ScannerTab"
        component={ScanAndPayScreen}
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarButton: (props) => <ScannerTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="ShopsTab"
        component={ShopsScreen}
        options={{ title: 'Shops' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  scannerBtnWrap: {
    top: -26,           // half above the nav bar
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: '#fff',
  },
});
