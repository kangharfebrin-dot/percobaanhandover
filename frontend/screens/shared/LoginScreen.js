import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from '../../config';
import { View, Text, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ScrollView, Image, ImageBackground, Modal, Linking, Dimensions } from 'react-native';
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
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animasi crossfade untuk maskot
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isPasswordFocused ? 1 : 0,
      duration: 300,
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
    }
    // Remove restrictive regex validation, just check for empty strings
    if (isUsernameEmpty) {
      setErrorMessage('Mohon isi Username terlebih dahulu!');
      return;
    }
    if (isPasswordEmpty) {
      setErrorMessage('Mohon isi Password terlebih dahulu!');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      const loggedInUser = res.data.user;
      const token = res.data.token;

      if (loggedInUser && token) {
        await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
        await AsyncStorage.setItem('token', token);

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        if (loggedInUser.role === 'SUPER_ADMIN' || loggedInUser.role === 'ADMIN') {
          navigation.replace('AdminDashboard');
        } else if (loggedInUser.role === 'PENGAWAS') {
          navigation.replace('PengawasDashboard');
        } else {
          navigation.replace('UserDashboard');
        }
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Login gagal, periksa kembali username & password');
    } finally {
      setLoading(false);
    }
  };

  const [notificationModal, setNotificationModal] = useState({ visible: false, title: '', message: '', type: 'success' });

  const showNotification = (title, message, type = 'success') => {
    setNotificationModal({ visible: true, title, message, type });
  };

  const handleForgotPassword = async () => {
    if (!username.trim()) {
      setShowForgotPasswordModal(false);
      showNotification('Username Kosong', 'Mohon isi username Anda pada form login sebelum meminta reset password.', 'error');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/password-reset/request`, { 
        email: username, 
        reason: 'Lupa password dari aplikasi' 
      });
      setShowForgotPasswordModal(false);
      showNotification('Berhasil', `Permintaan reset password untuk '${username}' telah dikirim ke Admin.`, 'success');
    } catch (error) {
      setShowForgotPasswordModal(false);
      showNotification('Gagal', error.response?.data?.message || "Gagal mengirim permintaan reset password.", 'error');
    }
  };

  return (
    <View style={[tw`flex-1`, Platform.OS === 'web' && { minHeight: '100vh', minWidth: '100vw' }]}>
      <Image
        source={Platform.OS === 'web' ? require('../../assets/background web.jpg') : require('../../assets/background.jpg')}
        style={[tw`absolute top-0 left-0`, Platform.OS !== 'web' ? { width: Dimensions.get('screen').width, height: Dimensions.get('screen').height } : tw`w-full h-full`]}
        resizeMode="stretch"
      />
      <View style={[tw`absolute top-0 left-0 bg-black/10`, Platform.OS !== 'web' ? { width: Dimensions.get('screen').width, height: Dimensions.get('screen').height } : tw`w-full h-full`]} />
      <SafeAreaView style={tw`flex-1`}>

        {/* Modal Kustom Notifikasi */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={notificationModal.visible}
          onRequestClose={() => setNotificationModal({ ...notificationModal, visible: false })}
        >
          <View style={tw`flex-1 justify-center items-center bg-black/50 px-4`}>
            <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl`}>
              <View style={tw`${notificationModal.type === 'success' ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-full mb-4`}>
                <Ionicons name={notificationModal.type === 'success' ? 'checkmark-circle' : 'close-circle'} size={40} color={notificationModal.type === 'success' ? '#10B981' : '#EF4444'} />
              </View>
              <Text style={tw`text-2xl font-black text-gray-800 mb-2`}>{notificationModal.title}</Text>
              <Text style={tw`text-gray-500 text-center text-base mb-6 leading-relaxed`}>
                {notificationModal.message}
              </Text>
              <TouchableOpacity
                style={tw`w-full ${notificationModal.type === 'success' ? 'bg-[#0055A5]' : 'bg-[#ED1C24]'} py-4 rounded-2xl items-center shadow-md`}
                onPress={() => setNotificationModal({ ...notificationModal, visible: false })}
              >
                <Text style={tw`text-white font-bold`}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal Kustom Lupa Password */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showForgotPasswordModal}
          onRequestClose={() => setShowForgotPasswordModal(false)}
        >
          <View style={tw`flex-1 justify-center items-center bg-black/50 px-4`}>
            <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl`}>
              <View style={tw`bg-red-50 p-4 rounded-full mb-4`}>
                <Ionicons name="help-buoy" size={40} color="#ED1C24" />
              </View>
              <Text style={tw`text-2xl font-black text-gray-800 mb-2`}>Lupa Password?</Text>
              <Text style={tw`text-gray-500 text-center text-base mb-6 leading-relaxed`}>
                Kirimkan notifikasi ke Admin untuk mereset akun Anda? (Pastikan Anda telah mengisi Username Anda di layar login)
              </Text>

              <View style={tw`w-full flex-row justify-between`}>
                <TouchableOpacity
                  style={tw`flex-1 bg-gray-100 py-4 rounded-2xl mr-2 items-center`}
                  onPress={() => setShowForgotPasswordModal(false)}
                >
                  <Text style={tw`text-gray-600 font-bold`}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-1 bg-[#ED1C24] py-4 rounded-2xl ml-2 items-center shadow-md`}
                  onPress={handleForgotPassword}
                >
                  <Text style={tw`text-white font-bold`}>Kirim Notif</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={tw`flex-1`}
        >
          <ScrollView contentContainerStyle={tw`flex-grow justify-center items-center px-6`} showsVerticalScrollIndicator={false}>

            {/* Header Image Area: Truck behind Mascot */}
            <View style={tw`z-10 mb-0 items-center mt-4 w-80 h-48 justify-end relative`}>
              {/* Truk di Belakang */}
              <View style={tw`absolute top-0 w-full h-full items-center justify-end`}>
                <Image
                  source={require('../../assets/truck.png')}
                  style={tw`w-[120%] h-[120%] opacity-90 -mb-5`}
                  resizeMode="contain"
                />
              </View>

              {/* Maskot Animasi - Dibuat lebih kecil menyesuaikan */}
              <View style={tw`w-16 h-24 justify-end items-center relative z-20`}>
                <Animated.Image
                  source={require('../../assets/mascot_open.png')}
                  style={[tw`absolute w-full h-full`, {
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0]
                    })
                  }]}
                  resizeMode="contain"
                />
                <Animated.Image
                  source={require('../../assets/mascot_closed.png')}
                  style={[tw`absolute w-full h-full`, { opacity: fadeAnim }]}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Kotak Login Solid Putih Lebih Besar untuk Web */}
            <View style={tw`bg-white w-full max-w-[420px] p-8 rounded-[40px] shadow-2xl mb-10 z-20`}>

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
                <View style={tw`flex-row items-center bg-slate-50 border-2 rounded-2xl px-4 ${isUsernameFocused ? 'border-[#0055A5] bg-blue-50/50' : 'border-slate-100'}`}>
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
                <View style={tw`flex-row items-center bg-slate-50 border-2 rounded-2xl px-4 ${isPasswordFocused ? 'border-[#ED1C24] bg-red-50/50' : 'border-slate-100'}`}>
                  <Ionicons name="lock-closed" size={20} color={isPasswordFocused ? "#ED1C24" : "#9CA3AF"} />
                  <TextInput
                    style={tw`flex-1 p-4 text-gray-800 font-bold`}
                    placeholder="Ketik kata sandi"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
                    onFocus={() => { setIsPasswordFocused(true); setIsUsernameFocused(false); }}
                    onBlur={() => setIsPasswordFocused(false)}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={tw`p-2`}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
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
                <LinearGradient colors={PERTAMINA_RED} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`p-5 items-center flex-row justify-center`}>
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

              {/* Tombol Lupa Password */}
              <TouchableOpacity
                style={tw`mt-6 items-center`}
                onPress={() => {
                  if (!username.trim()) {
                    setErrorMessage('Silakan isi Username terlebih dahulu agar admin tahu akun siapa yang lupa password.');
                    return;
                  }
                  setShowForgotPasswordModal(true);
                }}
              >
                <Text style={tw`text-[#ED1C24] font-bold text-sm tracking-wide`}>Lupa Password?</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
