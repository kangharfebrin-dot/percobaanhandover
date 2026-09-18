import React, { useState, useEffect } from 'react';
import { View, Image, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ScannerScreen from './screens/ScannerScreen';
import HandoverFormScreen from './screens/HandoverFormScreen';
import HistoryScreen from './screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setInitialRoute('Dashboard');
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

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <Image 
          source={require('./assets/logo.png')} 
          style={{ width: 80, height: 80, marginBottom: 20 }} 
          resizeMode="contain" 
        />
        <ActivityIndicator size="large" color="#0055A5" style={{ marginBottom: 15 }} />
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937', marginBottom: 10 }}>Mohon Ditunggu</Text>
        <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500' }}>Sedang memuat aplikasi...</Text>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="HandoverForm" component={HandoverFormScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
