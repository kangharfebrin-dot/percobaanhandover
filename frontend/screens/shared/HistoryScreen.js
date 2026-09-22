import React, { useEffect, useState } from 'react';
import TextLogo from '../../components/TextLogo';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Dimensions, Platform, Modal, Animated, Image, Easing } from 'react-native';
import tw from 'twrnc';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

export default function HistoryScreen({ navigation }) {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua'); 
  const [selectedShift, setSelectedShift] = useState('Semua');
  const [selectedMonth, setSelectedMonth] = useState('Semua');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  
  const [activeMenu, setActiveMenu] = useState('History');
  const [previousMenu, setPreviousMenu] = useState('History');
  
  const fadeAnim = React.useRef(new Animated.Value(0.3)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const floatAnim1 = React.useRef(new Animated.Value(0)).current;
  const floatAnim2 = React.useRef(new Animated.Value(0)).current;
  const floatAnim3 = React.useRef(new Animated.Value(0)).current;
  
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isLargeScreen = screenWidth > 768;

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim3, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim3, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [fadeAnim, slideAnim]);

  const slideInterpolate = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -32] });
  const orb1TranslateY = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const orb2TranslateY = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
  const orb3TranslateY = floatAnim3.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });

  useEffect(() => {
    const loadUserAndHistory = async () => {
      const userStr = await AsyncStorage.getItem('user');
      let userData = null;
      if (userStr) {
        userData = JSON.parse(userStr);
        setUser(userData);
      }
      fetchHistory(userData);
    };
    loadUserAndHistory();
  }, []);

  const fetchHistory = async (userData) => {
    try {
      const res = await axios.get('http://192.168.151.137:3000/api/handovers');
      let data = res.data;
      if (userData && (userData.role === 'AMT' || userData.role === 'USER')) {
        // Asumsi data res.data berisi relasi user, atau memiliki userId
        data = res.data.filter(h => h.userId === userData.id || (h.user && h.user.id === userData.id));
      }
      setHandovers(data);
    } catch (error) {
      console.log('Gagal fetch history (mungkin server/DB offline):', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setPreviousMenu(activeMenu);
    setActiveMenu('Logout');
    setIsLogoutVisible(true);
  };

  const handleCancelLogout = () => {
    setIsLogoutVisible(false);
    setActiveMenu(previousMenu);
  };

  const confirmLogout = async () => {
    setIsLogoutVisible(false);
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const getDashboardRoute = () => {
    if (!user) return 'Login';
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return 'AdminDashboard';
    if (user.role === 'PENGAWAS') return 'PengawasDashboard';
    return 'UserDashboard';
  };

  const filteredHandovers = handovers.filter((item) => {
    let matchesSearch = false;
    if (user && (user.role === 'AMT' || user.role === 'USER')) {
      matchesSearch = item.noPolisi.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      matchesSearch = 
        item.noPolisi.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.user && item.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
      
    const isNormal = item.status === 'Siap Operasi (Normal)';
    
    let matchesStatus = true;
    if (selectedStatus === 'Normal') matchesStatus = isNormal;
    if (selectedStatus === 'Isu') matchesStatus = !isNormal;
    
    let matchesShift = true;
    if (selectedShift !== 'Semua') matchesShift = item.shift === selectedShift;

    let matchesMonth = true;
    if (selectedMonth !== 'Semua') {
      const itemMonth = new Date(item.timestamp).toLocaleString('id-ID', { month: 'long' });
      if (itemMonth.toLowerCase() !== selectedMonth.toLowerCase()) matchesMonth = false;
    }
    
    return matchesSearch && matchesStatus && matchesShift && matchesMonth;
  });

  const renderItem = ({ item }) => {
    const isNormal = item.status === 'Siap Operasi (Normal)';
    return (
      <View style={tw`bg-white p-5 rounded-2xl mb-4 shadow-md border ${isNormal ? 'border-green-100' : 'border-red-200'}`}>
        <View style={tw`flex-row justify-between items-start mb-3`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-3 ${isNormal ? 'bg-green-100' : 'bg-red-100'}`}>
              <Ionicons name={isNormal ? "checkmark-circle" : "warning"} size={28} color={isNormal ? "#00A651" : "#ED1C24"} />
            </View>
            <View>
              <Text style={tw`text-xl font-bold text-gray-800`}>{item.noPolisi}</Text>
              <Text style={tw`text-sm text-gray-500`}>{item.shift} • {item.user.name}</Text>
            </View>
          </View>
          <View style={tw`px-3 py-1 rounded-full ${isNormal ? 'bg-green-100' : 'bg-red-500'}`}>
            <Text style={tw`text-xs font-bold ${isNormal ? 'text-green-700' : 'text-white'}`}>
              {isNormal ? 'NORMAL' : 'ISU'}
            </Text>
          </View>
        </View>

        <Text style={tw`text-xs text-gray-400 mb-2`}>Tanggal: {new Date(item.timestamp).toLocaleString()}</Text>

        {!isNormal && (
          <View style={tw`mt-2 bg-red-50 p-3 rounded-xl border border-red-100`}>
            <Text style={tw`text-red-800 font-bold mb-1 text-sm`}>Detail Kendala:</Text>
            {item.items.filter(i => !i.isGood).map((issue, idx) => (
              <Text key={idx} style={tw`text-red-600 text-xs my-1`}>• {issue.name}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-[#F4F7FA]`}>
      {/* 3 Animated Background Orbs for Premium Vibe (Fainter) */}
      <Animated.View style={[tw`absolute -top-20 -left-10 w-[35rem] h-[35rem] rounded-full opacity-15`, { transform: [{ translateY: orb1TranslateY }] }]}>
        <LinearGradient colors={['#0055A5', '#003366']} style={tw`flex-1 rounded-full`} />
      </Animated.View>
      <Animated.View style={[tw`absolute -top-20 -right-20 w-[25rem] h-[25rem] rounded-full opacity-15`, { transform: [{ translateY: orb3TranslateY }] }]}>
        <LinearGradient colors={['#00A651', '#007A3B']} style={tw`flex-1 rounded-full`} />
      </Animated.View>
      <Animated.View style={[tw`absolute -bottom-40 -right-10 w-[30rem] h-[30rem] rounded-full opacity-15`, { transform: [{ translateY: orb2TranslateY }] }]}>
        <LinearGradient colors={['#ED1C24', '#B30000']} style={tw`flex-1 rounded-full`} />
      </Animated.View>

      <SafeAreaView style={tw`flex-1 relative`}>
        
        {/* STICKY NAVBAR (Floating Modern Style) */}
        <View style={[tw`flex-row items-center px-5 py-3 mx-5 mt-4 mb-2 rounded-3xl border border-white/60 relative z-20`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.15, shadowRadius: 25, shadowOffset: {width: 0, height: 10} }]}>
          {/* Faint Logo Watermark with Clip */}
          
          
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace(getDashboardRoute())} style={tw`p-2 bg-gray-100 rounded-full mr-4 shadow-sm z-30`}>
            <Ionicons name="arrow-back" size={24} color="#0055A5" />
          </TouchableOpacity>
          <Text style={tw`text-2xl font-black text-gray-800 tracking-tight z-30`}>Riwayat Handover</Text>
        </View>

        <View style={tw`flex-1 relative`}>
          {/* Modern Search & Filter Button (Moved closer to navbar) */}
          <View style={tw`px-6 pt-2 flex-row items-center justify-between`}>
            <View style={tw`flex-1 flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mr-3`}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput 
                style={tw`flex-1 ml-3 text-gray-800 font-medium`}
                placeholder={user && (user.role === 'AMT' || user.role === 'USER') ? "Cari berdasarkan Nopol..." : "Cari Nopol atau Nama AMT..."}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={tw`bg-[#0055A5] p-3 rounded-2xl shadow-md shadow-blue-500/30`}
              onPress={() => setIsFilterVisible(true)}
            >
              <Feather name="filter" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* Filter Modal */}
          <Modal
            visible={isFilterVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsFilterVisible(false)}
          >
            <View style={tw`flex-1 justify-end bg-black/40`}>
              <View style={tw`bg-white rounded-t-[30px] p-6 shadow-2xl`}>
                <View style={tw`flex-row justify-between items-center mb-6`}>
                  <Text style={tw`text-2xl font-black text-gray-800`}>Filter Riwayat</Text>
                  <TouchableOpacity onPress={() => setIsFilterVisible(false)} style={tw`p-2 bg-gray-100 rounded-full`}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Status Filter */}
                <Text style={tw`text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider`}>Berdasarkan Status</Text>
                <View style={tw`flex-row flex-wrap mb-6`}>
                  {['Semua', 'Normal', 'Isu'].map(status => (
                    <TouchableOpacity 
                      key={status} 
                      style={tw`px-5 py-2.5 rounded-full mr-3 mb-3 border ${selectedStatus === status ? 'bg-[#0055A5] border-[#0055A5]' : 'bg-transparent border-gray-300'}`}
                      onPress={() => setSelectedStatus(status)}
                    >
                      <Text style={tw`text-sm font-bold ${selectedStatus === status ? 'text-white' : 'text-gray-600'}`}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Shift Filter */}
                <Text style={tw`text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider`}>Berdasarkan Shift</Text>
                <View style={tw`flex-row flex-wrap mb-6`}>
                  {['Semua', 'Shift 1', 'Shift 2'].map(shift => (
                    <TouchableOpacity 
                      key={shift} 
                      style={tw`px-5 py-2.5 rounded-full mr-3 mb-3 border ${selectedShift === shift ? 'bg-[#0055A5] border-[#0055A5]' : 'bg-transparent border-gray-300'}`}
                      onPress={() => setSelectedShift(shift)}
                    >
                      <Text style={tw`text-sm font-bold ${selectedShift === shift ? 'text-white' : 'text-gray-600'}`}>{shift}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Month Filter */}
                <Text style={tw`text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider`}>Bulan Inspeksi</Text>
                <View style={tw`flex-row flex-wrap mb-10`}>
                  {['Semua', 'Juli', 'Agustus', 'September'].map(month => (
                    <TouchableOpacity 
                      key={month} 
                      style={tw`px-5 py-2.5 rounded-full mr-3 mb-3 border ${selectedMonth === month ? 'bg-[#0055A5] border-[#0055A5]' : 'bg-transparent border-gray-300'}`}
                      onPress={() => setSelectedMonth(month)}
                    >
                      <Text style={tw`text-sm font-bold ${selectedMonth === month ? 'text-white' : 'text-gray-600'}`}>{month}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={tw`bg-[#0055A5] p-4 rounded-2xl items-center shadow-lg shadow-blue-500/40`}
                  onPress={() => setIsFilterVisible(false)}
                >
                  <Text style={tw`text-white font-black text-lg tracking-wide`}>TERAPKAN FILTER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {loading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <View style={tw`items-center justify-center -mt-10`}>
                <Animated.View style={[tw`mb-2`, { opacity: fadeAnim }]}><TextLogo style={{ transform: [{ scale: 0.9 }] }} /></Animated.View>
                <ActivityIndicator size="large" color="#0055A5" />
                <Text style={tw`mt-2 text-gray-500 font-bold tracking-widest uppercase text-xs`}>Memuat Data...</Text>
              </View>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={tw`p-6 pb-32 w-full max-w-4xl mx-auto`}
              data={filteredHandovers}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={tw`items-center mt-20`}>
                  <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
                  <Text style={tw`text-center text-gray-400 font-medium mt-4 text-lg`}>Tidak ada data yang sesuai filter.</Text>
                </View>
              }
            />
          )}

          {/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY) */}
          {!isLargeScreen && user && (
            <View style={tw`absolute bottom-8 self-center w-11/12 bg-white rounded-full flex-row justify-around items-center py-5 shadow-2xl shadow-gray-400/50 z-50`}>
              <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace(getDashboardRoute())}>
                <Feather name="grid" size={26} color="#9CA3AF" />
              </TouchableOpacity>

              {user.role === 'SUPER_ADMIN' && (
                <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace('ChecklistManager')}>
                  <Feather name="check-square" size={26} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              {user && (user.role === 'AMT' || user.role === 'USER') && (
                <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace('History')}>
                  <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                  <View style={tw`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full`}>
                    <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw`flex-1`} />
                    </Animated.View>
                  </View>
                  <Feather name="file-text" size={26} color="#1F2937" />
                </TouchableOpacity>
              )}

              {(user.role === 'SUPER_ADMIN' || user.role === 'PENGAWAS') && (
                <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace('MessageCenter')}>
                  <Ionicons name="chatbubble-ellipses-outline" size={26} color="#9CA3AF" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={handleLogout}>
                <Feather name="log-out" size={26} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Logout Modal */}
          <Modal
            visible={isLogoutVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCancelLogout}
          >
            <View style={tw`flex-1 justify-center items-center bg-black/60 px-6`}>
              <View style={tw`bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-2xl relative overflow-hidden`}>
                <Image source={require('../../assets/logo.png')} style={[tw`absolute opacity-10`, { width: 250, height: 250, top: -50, right: -50 }]} resizeMode="contain" />
                <View style={tw`w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4`}>
                  <Feather name="log-out" size={32} color="#ED1C24" />
                </View>
                <Text style={tw`text-2xl font-black text-gray-800 mb-2`}>Konfirmasi Keluar</Text>
                <Text style={tw`text-center text-gray-500 font-medium mb-8 px-4`}>
                  Apakah Anda yakin ingin keluar dari akun ini?
                </Text>
                <View style={tw`flex-row w-full`}>
                  <TouchableOpacity 
                    style={tw`flex-1 bg-gray-100 p-4 rounded-xl mr-2 items-center`}
                    onPress={handleCancelLogout}
                  >
                    <Text style={tw`font-bold text-gray-600`}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={tw`flex-1 bg-[#ED1C24] p-4 rounded-xl ml-2 items-center shadow-lg shadow-red-500/30`}
                    onPress={confirmLogout}
                  >
                    <Text style={tw`font-bold text-white`}>Ya, Keluar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

        </View>
      </SafeAreaView>
    </View>
  );
}
