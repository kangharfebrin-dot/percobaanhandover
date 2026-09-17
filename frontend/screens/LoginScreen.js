import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Animated, Easing, Platform, Dimensions } from 'react-native';
import tw from 'twrnc';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const PERTAMINA_BLUE = ['#0055A5', '#003366'];

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // State untuk pesan error di dalam UI

  // Animasi untuk mata tertutup
  const eyeCoverAnim = useRef(new Animated.Value(0)).current;
  // Animasi untuk pergerakan mata mengikuti mouse (Web)
  const mousePos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  // Animasi untuk pergerakan kepala (lebih sedikit dari mata)
  const headPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    Animated.timing(eyeCoverAnim, {
      toValue: isPasswordFocused ? 1 : 0,
      duration: 250,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isPasswordFocused]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMouseMove = (e) => {
        if (isPasswordFocused) {
          // Reset posisi kepala ke tengah saat memejamkan mata
          Animated.spring(headPos, {
            toValue: { x: 0, y: 0 },
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }).start();
          return;
        }
        
        const { innerWidth, innerHeight } = window;
        const centerX = innerWidth / 2;
        const centerY = innerHeight / 2;
        
        // Batas pergerakan bola mata maks 4px
        const moveX = ((e.clientX - centerX) / centerX) * 4;
        const moveY = ((e.clientY - centerY) / centerY) * 4;

        Animated.spring(mousePos, {
          toValue: { x: moveX, y: moveY },
          friction: 7,
          tension: 40,
          useNativeDriver: false,
        }).start();

        Animated.spring(headPos, {
          toValue: { x: moveX * 0.5, y: moveY * 0.5 },
          friction: 7,
          tension: 40,
          useNativeDriver: false,
        }).start();
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isPasswordFocused]);

  const handleLogin = async () => {
    setErrorMessage(''); // Reset error
    
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

    try {
      let loggedInUser = null;

      // Mock Login untuk Prototipe Sesuai Permintaan
      if (username.toLowerCase() === 'yoan') {
        loggedInUser = { id: 'u1', username: 'yoan', name: 'Yoan', role: 'SUPER_ADMIN' };
      } else if (username.toLowerCase() === 'sekar' && password === '12345') {
        loggedInUser = { id: 'u2', username: 'sekar', name: 'Sekar', role: 'PENGAWAS' };
      } else if (username.toLowerCase() === 'haula') {
        loggedInUser = { id: 'u3', username: 'haula', name: 'Haula', role: 'AMT' };
      } else {
        // Fallback ke Backend jika bukan user mock
        const res = await axios.post('http://localhost:3000/api/auth/login', { username, password });
        loggedInUser = res.data.user;
      }
      
      if (loggedInUser) {
        await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
        navigation.replace('Dashboard');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Login gagal, periksa kembali username & password');
    }
  };

  const eyeHeight = eyeCoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 2] // Mata terbuka (12px) ke mata tertutup (garis 2px)
  });

  const eyeBorderRadius = eyeCoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 1] // Bulat ke kotak/garis
  });

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100`}>
      <View style={tw`absolute inset-0 bg-[#0055A5] opacity-10`} />
      
      <View style={tw`flex-1 justify-center items-center px-4`}>
        {/* Karakter Animasi di atas Kotak */}
        <View style={tw`z-10 -mb-6 items-center`}>
          <Animated.View style={[
            tw`bg-white w-24 h-24 rounded-full justify-center items-center shadow-lg border-4 border-[#0055A5]`,
            { transform: [{ translateX: headPos.x }, { translateY: headPos.y }] }
          ]}>
            {/* Mata Kiri */}
            <View style={tw`absolute left-5 top-8 w-6 h-6 items-center justify-center`}>
              <Animated.View style={[
                tw`bg-gray-800 w-3`, 
                { height: eyeHeight, borderRadius: eyeBorderRadius },
                !isPasswordFocused && { transform: [{ translateX: mousePos.x }, { translateY: mousePos.y }] }
              ]} />
            </View>
            {/* Mata Kanan */}
            <View style={tw`absolute right-5 top-8 w-6 h-6 items-center justify-center`}>
              <Animated.View style={[
                tw`bg-gray-800 w-3`, 
                { height: eyeHeight, borderRadius: eyeBorderRadius },
                !isPasswordFocused && { transform: [{ translateX: mousePos.x }, { translateY: mousePos.y }] }
              ]} />
            </View>
            {/* Mulut */}
            <View style={tw`absolute bottom-6 w-6 h-2 bg-red-400 rounded-full`} />
          </Animated.View>
        </View>

        {/* Kotak Login Standard yang elegan */}
        <View style={tw`bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl`}>
          <View style={tw`items-center mb-8 mt-4`}>
            <Text style={tw`text-2xl font-extrabold text-[#0055A5] mb-1`}>AMT Handover</Text>
            <Text style={tw`text-sm text-gray-500`}>PT Pertamina Patra Niaga</Text>
          </View>
          
          <View style={tw`mb-5`}>
            <Text style={tw`text-gray-500 font-bold mb-2 ml-1 text-xs uppercase`}>Username</Text>
            <View style={tw`flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4`}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={tw`flex-1 p-4 text-black`}
                placeholder="Masukkan username"
                value={username}
                onChangeText={(text) => { setUsername(text); setErrorMessage(''); }}
                onFocus={() => setIsPasswordFocused(false)}
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-500 font-bold mb-2 ml-1 text-xs uppercase`}>Password</Text>
            <View style={tw`flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4`}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={tw`flex-1 p-4 text-black`}
                placeholder="Masukkan password"
                secureTextEntry
                value={password}
                onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Menampilkan pesan Error tepat di atas tombol */}
          {errorMessage !== '' && (
            <Text style={tw`text-red-500 text-xs font-bold text-center mb-4 px-2`}>
              {errorMessage}
            </Text>
          )}

          <TouchableOpacity 
            style={tw`rounded-xl overflow-hidden shadow-lg`}
            onPress={handleLogin}
          >
            <LinearGradient colors={['#ED1C24', '#B30000']} style={tw`p-4 items-center`}>
              <Text style={tw`text-white font-bold text-lg tracking-wide`}>LOGIN</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
