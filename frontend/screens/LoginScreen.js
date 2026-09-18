import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import tw from 'twrnc';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const PERTAMINA_BLUE = ['#0055A5', '#003366'];
const PERTAMINA_RED = ['#ED1C24', '#B30000'];

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); 
  const [loading, setLoading] = useState(false);

  // Animasi crossfade untuk maskot
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isPasswordFocused ? 1 : 0,
      duration: 300, // Transisi smooth 300ms
      useNativeDriver: true,
    }).start();
  }, [isPasswordFocused]);

  const handleLogin = async () => {
    setErrorMessage('');
    
    const isUsernameEmpty = !username.trim();
    const isPasswordEmpty = !password.trim();

    if (isUsernameEmpty && isPasswordEmpty) {
      setErrorMessage('Mohon isi Username dan Password terlebih dahulu!');
      return;
    } else if (isUsernameEmpty) {
      setErrorMessage('Mohon isi Username terlebih dahulu!');
      return;
    } else if (isPasswordEmpty) {
      setErrorMessage('Mohon isi Password terlebih dahulu!');
      return;
    }

    setLoading(true);
    try {
      let loggedInUser = null;

      if (username.toLowerCase() === 'yoan') {
        loggedInUser = { id: 'u1', username: 'yoan', name: 'Yoan', role: 'SUPER_ADMIN' };
      } else if (username.toLowerCase() === 'sekar' && password === '12345') {
        loggedInUser = { id: 'u2', username: 'sekar', name: 'Sekar', role: 'PENGAWAS' };
      } else if (username.toLowerCase() === 'haula') {
        loggedInUser = { id: 'u3', username: 'haula', name: 'Haula', role: 'AMT' };
      } else {
        const res = await axios.post('http://192.168.1.5:3000/api/auth/login', { username, password });
        loggedInUser = res.data.user;
      }
      
      if (loggedInUser) {
        await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
        navigation.replace('Dashboard');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Login gagal, periksa kembali username & password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <View style={tw`absolute inset-0 bg-[#0055A5] opacity-5`} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow justify-center items-center px-6`} showsVerticalScrollIndicator={false}>
          
          {/* Mascot Animasi - Dibuat lebih kecil */}
          <View style={tw`z-10 -mb-6 items-center mt-8`}>
            <View style={tw`w-32 h-44 justify-end items-center relative`}>
              {/* Maskot Mata Terbuka (Muncul saat tidak fokus password) */}
              <Animated.Image 
                source={require('../assets/mascot_open.png')} 
                style={[tw`absolute w-full h-full`, { 
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0]
                  }) 
                }]} 
                resizeMode="contain" 
              />
              {/* Maskot Mata Tertutup (Muncul saat fokus password) */}
              <Animated.Image 
                source={require('../assets/mascot_closed.png')} 
                style={[tw`absolute w-full h-full`, { opacity: fadeAnim }]} 
                resizeMode="contain" 
              />
            </View>
          </View>

          {/* Kotak Login Aesthetic */}
          <View style={tw`bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl border border-blue-50/50 mb-10`}>
            
            <View style={tw`items-center mb-8 mt-2`}>
              <View style={tw`flex-row items-center justify-center mb-2`}>
                {/* 3 Warna Pertamina */}
                <View style={tw`w-2 h-8 rounded-full bg-[#ED1C24] mr-2`} />
                <View style={tw`w-2 h-8 rounded-full bg-[#2ECC71] mr-2`} />
                <View style={tw`w-2 h-8 rounded-full bg-[#0055A5] mr-3`} />
                <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>DIGI</Text>
                <Text style={tw`text-3xl font-black text-[#0055A5] tracking-tighter`}>Handover</Text>
              </View>
              <Text style={tw`text-xs font-bold text-gray-400 tracking-widest uppercase`}>PT Pertamina Patra Niaga</Text>
            </View>
            
            <View style={tw`mb-5`}>
              <Text style={tw`text-gray-500 font-extrabold mb-2 ml-2 text-[10px] uppercase tracking-wider`}>Username</Text>
              <View style={tw`flex-row items-center bg-slate-50 border-2 rounded-2xl px-4 ${isUsernameFocused ? 'border-[#0055A5] bg-blue-50/30' : 'border-slate-100'}`}>
                <Ionicons name="person" size={20} color={isUsernameFocused ? "#0055A5" : "#9CA3AF"} />
                <TextInput
                  style={tw`flex-1 p-4 text-gray-800 font-bold`}
                  placeholder="Ketik username Anda"
                  value={username}
                  onChangeText={(text) => { setUsername(text); setErrorMessage(''); }}
                  onFocus={() => { setIsUsernameFocused(true); setIsPasswordFocused(false); }}
                  onBlur={() => setIsUsernameFocused(false)}
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-gray-500 font-extrabold mb-2 ml-2 text-[10px] uppercase tracking-wider`}>Password</Text>
              <View style={tw`flex-row items-center bg-slate-50 border-2 rounded-2xl px-4 ${isPasswordFocused ? 'border-[#ED1C24] bg-red-50/30' : 'border-slate-100'}`}>
                <Ionicons name="lock-closed" size={20} color={isPasswordFocused ? "#ED1C24" : "#9CA3AF"} />
                <TextInput
                  style={tw`flex-1 p-4 text-gray-800 font-bold`}
                  placeholder="Ketik kata sandi"
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
                  onFocus={() => { setIsPasswordFocused(true); setIsUsernameFocused(false); }}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {errorMessage !== '' && (
              <View style={tw`bg-red-50 p-3 rounded-xl mb-4 border border-red-100`}>
                <Text style={tw`text-red-600 text-xs font-bold text-center`}>
                  {errorMessage}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={tw`rounded-2xl overflow-hidden shadow-xl mt-2 ${loading ? 'opacity-70' : ''}`}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient colors={PERTAMINA_RED} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw`p-5 items-center flex-row justify-center`}>
                {loading ? (
                  <Text style={tw`text-white font-black text-lg tracking-widest`}>MEMPROSES...</Text>
                ) : (
                  <>
                    <Text style={tw`text-white font-black text-lg tracking-widest mr-2`}>MASUK</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
