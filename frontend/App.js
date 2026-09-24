import React, { useState, useEffect } from 'react';
import TextLogo from './components/TextLogo';
import { View, Image, Text, ActivityIndicator, Animated, Easing, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

// Screens
import LoginScreen from './screens/shared/LoginScreen';
import HistoryScreen from './screens/shared/HistoryScreen';
import HandoverDetailScreen from './screens/shared/HandoverDetailScreen';
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import WorkerListScreen from './screens/admin/WorkerListScreen';
import PengawasListScreen from './screens/admin/PengawasListScreen';
import VehicleListScreen from './screens/admin/VehicleListScreen';
import ChecklistManagerScreen from './screens/admin/ChecklistManagerScreen';
import PengawasDashboardScreen from './screens/pengawas/PengawasDashboardScreen';
import IssueListScreen from './screens/pengawas/IssueListScreen';
import MessageCenterScreen from './screens/pengawas/MessageCenterScreen';
import UserDashboardScreen from './screens/user/UserDashboardScreen';
import ScannerScreen from './screens/user/ScannerScreen';
import HandoverFormScreen from './screens/user/HandoverFormScreen';
import FixVerificationScreen from './screens/user/FixVerificationScreen';
const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        
        if (userStr && token) {
          const user = JSON.parse(userStr);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
            setInitialRoute('AdminDashboard');
          } else if (user.role === 'PENGAWAS') {
            setInitialRoute('PengawasDashboard');
          } else {
            setInitialRoute('UserDashboard');
          }
        } else {
          setInitialRoute('Login');
        }
      } catch (error) {
        console.error('Failed to load user from AsyncStorage:', error);
        setInitialRoute('Login'); // Fallback ke Login jika error
      }
    };
    checkLogin();
  }, []);

  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      )
    ]).start();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [{ scale: scaleAnim }],
          alignItems: 'center'
        }}>
          <TextLogo style={{ marginBottom: 20, transform: [{ scale: 1.2 }] }} />
          <ActivityIndicator size="large" color="#0055A5" />
        </Animated.View>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator 
        initialRouteName={initialRoute} 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade_from_bottom', // Smooth premium transition
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="PengawasDashboard" component={PengawasDashboardScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="HandoverForm" component={HandoverFormScreen} />
        <Stack.Screen name="FixVerification" component={FixVerificationScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="HandoverDetail" component={HandoverDetailScreen} />
        <Stack.Screen name="VehicleList" component={VehicleListScreen} />
        <Stack.Screen name="IssueList" component={IssueListScreen} />
        <Stack.Screen name="MessageCenter" component={MessageCenterScreen} />
        <Stack.Screen name="ChecklistManager" component={ChecklistManagerScreen} />
        <Stack.Screen name="WorkerList" component={WorkerListScreen} />
        <Stack.Screen name="PengawasList" component={PengawasListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
