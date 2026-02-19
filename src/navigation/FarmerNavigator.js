import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/theme';

import FarmerDashboard from '../screens/farmer/FarmerDashboard';
import UploadDiagnosisScreen from '../screens/farmer/UploadDiagnosisScreen';
import DiagnosisResultScreen from '../screens/farmer/DiagnosisResultScreen';
import ReportsScreen from '../screens/farmer/ReportsScreen';
import ChatScreen from '../screens/farmer/ChatScreen';
import SupportScreen from '../screens/farmer/SupportScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FarmerHome" component={FarmerDashboard} />
    <Stack.Screen name="UploadDiagnosis" component={UploadDiagnosisScreen} />
    <Stack.Screen name="DiagnosisResult" component={DiagnosisResultScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen} 
      options={{ headerShown: true }}
    />
  </Stack.Navigator>
);

const DiagnoseStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UploadDiagnosis" component={UploadDiagnosisScreen} />
    <Stack.Screen name="DiagnosisResult" component={DiagnosisResultScreen} />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen} 
      options={{ headerShown: true }}
    />
  </Stack.Navigator>
);

const ReportsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportsMain" component={ReportsScreen} />
    <Stack.Screen name="DiagnosisResult" component={DiagnosisResultScreen} />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen} 
      options={{ headerShown: true }}
    />
  </Stack.Navigator>
);

const SupportStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SupportMain" component={SupportScreen} />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen} 
      options={{ headerShown: true }}
    />
  </Stack.Navigator>
);

const FarmerNavigator = () => {
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
          const icons = {
            Home: { focused: 'home', default: 'home-outline' },
            Diagnose: { focused: 'scan', default: 'scan-outline' },
            Reports: { focused: 'document-text', default: 'document-text-outline' },
            Support: { focused: 'headset', default: 'headset-outline' },
          };

          const iconSet = icons[route.name] || { focused: 'ellipse', default: 'ellipse-outline' };
          const iconName = focused ? iconSet.focused : iconSet.default;

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Diagnose" component={DiagnoseStack} />
      <Tab.Screen name="Reports" component={ReportsStack} />
      <Tab.Screen name="Support" component={SupportStack} />
    </Tab.Navigator>
  );
};

export default FarmerNavigator;
