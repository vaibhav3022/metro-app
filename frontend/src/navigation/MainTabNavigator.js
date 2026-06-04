import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TicketHistoryScreen from '../screens/TicketHistoryScreen';
import WalletScreen from '../screens/WalletScreen';
import ShopsScreen from '../screens/ShopsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TicketsTab') {
            iconName = focused ? 'ticket-confirmation' : 'ticket-confirmation-outline';
          } else if (route.name === 'WalletTab') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'ShopsTab') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: '#00C9A7',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: '#0A0A1A',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ title: 'Home' }} 
      />
      <Tab.Screen 
        name="TicketsTab" 
        component={TicketHistoryScreen} 
        options={{ title: 'Tickets' }} 
      />
      <Tab.Screen 
        name="WalletTab" 
        component={WalletScreen} 
        options={{ title: 'Wallet' }} 
      />
      <Tab.Screen 
        name="ShopsTab" 
        component={ShopsScreen} 
        options={{ title: 'Shops' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }} 
      />
    </Tab.Navigator>
  );
}
