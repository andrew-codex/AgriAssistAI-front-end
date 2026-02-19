import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DADashboard from '../screens/da/DADashboard';
import CaseDetailScreen from '../screens/da/CaseDetailScreen';
import DAChatScreen from '../screens/da/DAChatScreen';
import CasesScreen from '../screens/da/CasesScreen';
import ChatScreen from '../screens/farmer/ChatScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Removed unused MessagesScreen placeholder to reduce dead code.

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DAHome" component={DADashboard} />
    <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

const CasesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CasesHome" component={CasesScreen} />
    <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
  </Stack.Navigator>
);

const MessagesStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      headerShown: false,
    }}
  >
    <Stack.Screen name="MessagesHome" component={DAChatScreen} />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{
        headerShown: true,
        headerTransparent: false,
      }}
    />
  </Stack.Navigator>
);

const DANavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: (insets.bottom || 0) + 8,
          paddingTop: 8,
          height: 65 + (insets.bottom || 0),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Cases':
              iconName = focused ? 'folder-open' : 'folder-open-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Cases" component={CasesStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
    </Tab.Navigator>
  );
};

export default DANavigator;
