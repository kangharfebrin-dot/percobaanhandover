import React, { useState, useRef, useEffect } from 'react';
import { API_URL, saveApiUrl, resetApiUrl, loadSavedApiUrl } from '../../config';
import { View, Text, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ScrollView, Image, ImageBackground, Modal, Linking, Dimensions, BackHandler, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';

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
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Konfigurasi Server Dinamis
  const [currentApiUrl, setCurrentApiUrl] = useState(API_URL);
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverInput, setServerInput] = useState(API_URL);
  const [testingServer, setTestingServer] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Rahasia Developer Mode: Ketuk logo 5x dalam 2 detik untuk membuka pengaturan server
  const logoTapCountRef = useRef(0);
  const lastLogoTapTimeRef = useRef(0);

  const handleLogoPress = () => {
    const now = Date.now();
    if (now - lastLogoTapTimeRef.current > 2000) {
      logoTapCountRef.current = 1;
    } else {
      logoTapCountRef.current += 1;
    }
    lastLogoTapTimeRef.current = now;

    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      setServerInput(currentApiUrl);
      setTestResult(null);
      setShowServerModal(true);
    }
  };

  useEffect(() => {
    loadSavedApiUrl().then((url) => {
      setCurrentApiUrl(url);
      setServerInput(url);
    });
  }, []);

  const handleTestServer = async () => {
    const raw = (serverInput || '').trim().replace(/\/+$/, '');
    if (!raw) return;
    const target = raw.startsWith('http') ? raw : `http://${raw}`;
    setTestingServer(true);
    setTestResult(null);
    try {
      const res = await axios.get(`${target}/health`, {
        timeout: 5000,
        headers: target.includes('loca.lt') ? { 'bypass-tunnel-reminder': 'true' } : {}
      });
      if (res.status === 200) {
        setTestResult({ success: true, message: 'Berhasil terhubung ke Backend!' });
      } else {
        setTestResult({ success: false, message: `Server merespons status: ${res.status}` });
      }
    } catch (e) {
      setTestResult({ success: false, message: 'Gagal terhubung. Pastikan backend aktif dan URL benar.' });
    } finally {
      setTestingServer(false);
    }
  };

  const handleSaveServer = async () => {
    try {
      const updated = await saveApiUrl(serverInput);
      setCurrentApiUrl(updated);
      setShowServerModal(false);
      showNotification('Server Tersimpan', `Menggunakan server: ${updated}`, 'success');
    } catch (e) {
      showNotification('Gagal', 'Gagal menyimpan konfigurasi server.', 'error');
    }
  };

  const handleResetServer = async () => {
    try {
      const def = await resetApiUrl();
      setCurrentApiUrl(def);
      setServerInput(def);
      setShowServerModal(false);
      showNotification('Reset Default', `Kembali ke default: ${def}`, 'info');
    } catch (e) {
      showNotification('Gagal', 'Gagal reset konfigurasi server.', 'error');
    }
  };

  // Tangani tombol back hardware Android saat di halaman Login agar keluar dari aplikasi (tidak balik ke dashboard)
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showForgotPasswordModal) {
          setShowForgotPasswordModal(false);
          return true;
        }
        BackHandler.exitApp();
        return true;
      };

      const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backSubscription.remove();
    }, [showForgotPasswordModal])
  );

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
      const res = await axios.post(`${currentApiUrl}/api/auth/login`, { username, password });
      const loggedInUser = res.data.user;
      const token = res.data.token;
      const refreshToken = res.data.refreshToken;

      if (loggedInUser && token) {
        await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
        await AsyncStorage.setItem('token', token);
        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const targetDashboard = (loggedInUser.role === 'SUPER_ADMIN' || loggedInUser.role === 'ADMIN')
          ? 'AdminDashboard'
          : loggedInUser.role === 'PENGAWAS'
          ? 'PengawasDashboard'
          : 'UserDashboard';

        navigation.reset({
          index: 0,
          routes: [{ name: targetDashboard }],
        });
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
    if (isSubmittingReset) return; // Cegah double-tap

    if (!username.trim()) {
      setShowForgotPasswordModal(false);
      showNotification('Username Kosong', 'Mohon isi username Anda pada form login sebelum meminta reset password.', 'error');
      return;
    }
    
    setIsSubmittingReset(true);
    setShowForgotPasswordModal(false);

    // Langsung tampilkan notif sukses (optimistic)
    showNotification('Berhasil', `Permintaan reset password untuk '${username}' telah dikirim ke Admin.`, 'success');

    // Kirim API di background
    try {
      await axios.post(`${currentApiUrl}/api/password-reset/request`, { 
        email: username, 
        reason: 'Lupa password dari aplikasi' 
      });
    } catch (error) {
      // Jika gagal, timpa notif sukses dengan notif error
      showNotification('Gagal', error.response?.data?.message || "Gagal mengirim permintaan reset password.", 'error');
    } finally {
      setIsSubmittingReset(false);
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
                  style={tw`flex-1 ${isSubmittingReset ? 'bg-gray-300' : 'bg-[#ED1C24]'} py-4 rounded-2xl ml-2 items-center shadow-md`}
                  onPress={handleForgotPassword}
                  disabled={isSubmittingReset}
                >
                  <Text style={tw`text-white font-bold`}>{isSubmittingReset ? 'Mengirim...' : 'Kirim Notif'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Kustom Pengaturan Server Dinamis */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showServerModal}
          onRequestClose={() => setShowServerModal(false)}
        >
          <View style={tw`flex-1 justify-center items-center bg-black/60 px-4`}>
            <View style={tw`bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl`}>
              <View style={tw`flex-row items-center mb-4`}>
                <View style={tw`bg-blue-50 p-3 rounded-2xl mr-3`}>
                  <Ionicons name="server-outline" size={26} color="#0055A5" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xl font-black text-gray-800`}>Pengaturan Server</Text>
                  <Text style={tw`text-xs text-gray-400 font-semibold`}>Ganti IP Backend tanpa build APK</Text>
                </View>
              </View>

              <Text style={tw`text-gray-600 font-bold text-xs mb-1.5 ml-1`}>Alamat URL Server / IP Backend:</Text>
              <View style={tw`bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 mb-3`}>
                <TextInput
                  style={tw`text-gray-800 font-bold text-sm py-2`}
                  placeholder="http://192.168.1.58:3000 atau https://xxx.loca.lt"
                  value={serverInput}
                  onChangeText={(text) => { setServerInput(text); setTestResult(null); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Status Hasil Tes Koneksi */}
              {testResult && (
                <View style={tw`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border p-3 rounded-xl mb-3 flex-row items-center`}>
                  <Ionicons name={testResult.success ? "checkmark-circle" : "alert-circle"} size={18} color={testResult.success ? "#10B981" : "#EF4444"} style={tw`mr-2`} />
                  <Text style={tw`${testResult.success ? 'text-green-700' : 'text-red-700'} text-xs font-bold flex-1`}>
                    {testResult.message}
                  </Text>
                </View>
              )}

              {/* Tombol Tes Koneksi */}
              <TouchableOpacity
                style={tw`bg-blue-50 py-3 rounded-xl items-center mb-4 flex-row justify-center border border-blue-100`}
                onPress={handleTestServer}
                disabled={testingServer || !serverInput.trim()}
              >
                {testingServer ? (
                  <ActivityIndicator size="small" color="#0055A5" />
                ) : (
                  <>
                    <Ionicons name="pulse" size={16} color="#0055A5" style={tw`mr-2`} />
                    <Text style={tw`text-[#0055A5] font-bold text-xs`}>Tes Koneksi Server</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Action Buttons: Simpan & Batal */}
              <View style={tw`flex-row justify-between gap-2 mb-2`}>
                <TouchableOpacity
                  style={tw`flex-1 bg-slate-100 py-3.5 rounded-xl items-center`}
                  onPress={() => setShowServerModal(false)}
                >
                  <Text style={tw`text-gray-600 font-bold text-sm`}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-1 bg-[#0055A5] py-3.5 rounded-xl items-center shadow-sm`}
                  onPress={handleSaveServer}
                >
                  <Text style={tw`text-white font-bold text-sm`}>Simpan</Text>
                </TouchableOpacity>
              </View>

              {/* Reset to Default */}
              <TouchableOpacity
                style={tw`py-2 items-center`}
                onPress={handleResetServer}
              >
                <Text style={tw`text-xs text-gray-400 font-semibold underline`}>Kembalikan ke Default</Text>
              </TouchableOpacity>
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

              {/* Logo DIGI Handover (Tampilan bersih untuk rilis resmi. Rahasia: ketuk 5x cepat untuk mode developer pengaturan server) */}
              <TouchableOpacity
                style={tw`items-center mb-8 mt-2`}
                activeOpacity={1}
                onPress={handleLogoPress}
              >
                <View style={tw`flex-row items-center justify-center mb-2`}>
                  {/* 3 Warna Pertamina */}
                  <View style={tw`w-2 h-8 rounded-full bg-[#ED1C24] mr-2`} />
                  <View style={tw`w-2 h-8 rounded-full bg-[#2ECC71] mr-2`} />
                  <View style={tw`w-2 h-8 rounded-full bg-[#0055A5] mr-3`} />
                  <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>DIGI</Text>
                  <Text style={tw`text-3xl font-black text-[#0055A5] tracking-tighter`}>Handover</Text>
                </View>
                <Text style={tw`text-xs font-bold text-gray-400 tracking-widest uppercase`}>PT Pertamina Patra Niaga</Text>
              </TouchableOpacity>

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
