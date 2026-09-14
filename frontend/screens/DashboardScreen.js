import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Dimensions, ScrollView, Animated, Easing, Platform } from 'react-native';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';

const PERTAMINA_BLUE = ['#003366', '#0055A5'];
const PERTAMINA_RED = ['#ED1C24', '#B30000'];
const GLASS_BG = 'rgba(255, 255, 255, 0.7)';

// Helper untuk efek Glassmorphism di Web
const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [allHandovers, setAllHandovers] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Home');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Animasi Background Orbs
  const floatAnim1 = React.useRef(new Animated.Value(0)).current;
  const floatAnim2 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
      ])
    ).start();
  }, []);

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const isLargeScreen = screenWidth > 768;

  useEffect(() => {
    const loadData = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        if (userData.role === 'ADMIN') {
          fetchAlerts();
        }
      }
    };
    loadData();
    
    const unsubscribe = navigation.addListener('focus', () => {
      if (user && user.role === 'ADMIN') fetchAlerts();
    });
    return unsubscribe;
  }, [navigation, user?.role]);

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await axios.get('http://localhost:3000/api/handovers');
      setAllHandovers(res.data);
      const issues = res.data.filter(h => h.status !== 'Siap Operasi (Normal)');
      setAlerts(issues);
    } catch (error) {
      console.error("Gagal mengambil data alert:", error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const orb1TranslateY = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const orb2TranslateY = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });

  const renderAlertItem = ({ item }) => (
    <View style={[tw`p-5 rounded-3xl mb-4 flex-row items-center overflow-hidden border border-white/60`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#ED1C24', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: {width: 0, height: 10} }]}>
      <View style={tw`bg-red-100 p-4 rounded-2xl mr-4 items-center justify-center`}>
        <Feather name="alert-triangle" size={28} color="#ED1C24" />
      </View>
      <View style={tw`flex-1`}>
        <View style={tw`flex-row justify-between items-center mb-1`}>
          <Text style={tw`text-lg font-black text-gray-800 tracking-wide`}>{item.noPolisi}</Text>
          <View style={tw`bg-red-500 px-3 py-1 rounded-full`}>
            <Text style={tw`text-[10px] text-white font-bold uppercase tracking-widest`}>Kritis</Text>
          </View>
        </View>
        <Text style={tw`text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider`}>{item.shift} • {item.user.name}</Text>
        <View style={tw`bg-red-50/50 p-3 rounded-xl border border-red-100/50`}>
          {item.items.filter(i => !i.isGood).map((issue, idx) => (
            <Text key={idx} style={tw`text-red-700 text-xs font-bold mb-1`}>• {issue.name}</Text>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={tw`flex-1 bg-[#F4F7FA]`}>
      {/* Animated Background Orbs for Premium Vibe */}
      <Animated.View style={[tw`absolute -top-20 -left-20 w-[40rem] h-[40rem] rounded-full opacity-30`, { transform: [{ translateY: orb1TranslateY }] }]}>
        <LinearGradient colors={['#0055A5', '#00A651']} style={tw`flex-1 rounded-full`} />
      </Animated.View>
      <Animated.View style={[tw`absolute -bottom-40 -right-20 w-[30rem] h-[30rem] rounded-full opacity-20`, { transform: [{ translateY: orb2TranslateY }] }]}>
        <LinearGradient colors={['#ED1C24', '#F59E0B']} style={tw`flex-1 rounded-full`} />
      </Animated.View>

      <SafeAreaView style={tw`flex-1 ${isLargeScreen ? 'flex-row' : 'flex-col'}`}>
        
        {/* ULTRA PREMIUM SIDEBAR */}
        {isLargeScreen && (
          <View style={[tw`w-72 m-6 rounded-[40px] border border-white/50 overflow-hidden`, { backgroundColor: GLASS_BG, ...glassStyle, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 30 }]}>
            <View style={tw`pt-12 pb-8 flex-1 justify-between`}>
              <View>
                <View style={tw`items-center mb-12 px-6`}>
                  <View style={tw`w-24 h-24 bg-gradient-to-tr from-blue-500 to-blue-700 rounded-[30px] items-center justify-center mb-6 shadow-xl shadow-blue-500/30 rotate-3`}>
                    <Text style={tw`text-3xl font-black text-white -rotate-3`}>{user.name.charAt(0)}</Text>
                  </View>
                  <Text style={tw`text-2xl font-black text-gray-800 text-center tracking-tight`}>{user.name}</Text>
                  <View style={tw`bg-blue-100 mt-3 px-4 py-1.5 rounded-full`}>
                    <Text style={tw`text-xs text-[#0055A5] font-black uppercase tracking-widest`}>{isAdmin ? 'Super Admin' : 'Awak Mobil Tangki'}</Text>
                  </View>
                </View>

                {/* Sidebar Navigation */}
                <View style={tw`px-6`}>
                  <TouchableOpacity 
                    style={tw`flex-row items-center p-5 mb-4 rounded-3xl ${activeMenu === 'Home' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
                    onPress={() => setActiveMenu('Home')}
                  >
                    <Feather name="grid" size={22} color={activeMenu === 'Home' ? 'white' : '#6B7280'} />
                    <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'Home' ? 'text-white' : 'text-gray-500'}`}>Beranda</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={tw`flex-row items-center p-5 mb-4 rounded-3xl ${activeMenu === 'History' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
                    onPress={() => {
                      setActiveMenu('History');
                      navigation.navigate('History');
                      setTimeout(() => setActiveMenu('Home'), 500); 
                    }}
                  >
                    <Feather name="file-text" size={22} color={activeMenu === 'History' ? 'white' : '#6B7280'} />
                    <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'History' ? 'text-white' : 'text-gray-500'}`}>Log Riwayat</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={tw`px-6`}>
                <TouchableOpacity 
                  style={tw`flex-row items-center p-5 rounded-3xl bg-red-50 border border-red-100`}
                  onPress={handleLogout}
                >
                  <Feather name="log-out" size={22} color="#ED1C24" />
                  <Text style={tw`ml-4 font-bold text-[15px] text-[#ED1C24]`}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* MAIN CONTENT AREA */}
        <View style={tw`flex-1 relative`}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`${isLargeScreen ? 'p-6' : 'p-4 pb-32'}`}>
            
            {/* Greeting Header */}
            <View style={tw`mb-10 ${isLargeScreen ? 'mt-6' : 'mt-4'}`}>
              <Text style={tw`text-sm font-bold text-[#0055A5] uppercase tracking-widest mb-2`}>Sistem Terintegrasi Pertamina</Text>
              <Text style={tw`text-4xl font-black text-gray-800 tracking-tighter`}>
                Overview <Text style={tw`text-[#ED1C24]`}>Hari Ini</Text>.
              </Text>
            </View>

            {/* SUPER CARDS */}
            {isAdmin && (
              <View style={tw`flex-row justify-between mb-10`}>
                <View style={[tw`flex-1 p-6 rounded-[35px] border border-white/60 mr-3 justify-between`, { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 }]}>
                  <View style={tw`w-14 h-14 bg-blue-100 rounded-full items-center justify-center mb-6`}>
                    <Feather name="truck" size={26} color="#0055A5" />
                  </View>
                  <View>
                    <Text style={tw`text-5xl font-black text-gray-800 tracking-tighter`}>{allHandovers.length}</Text>
                    <Text style={tw`text-xs text-gray-500 font-black uppercase tracking-widest mt-2`}>Total Kendaraan</Text>
                  </View>
                </View>
                
                <View style={[tw`flex-1 p-6 rounded-[35px] border border-white/60 ml-3 justify-between`, { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#ED1C24', shadowOpacity: 0.1, shadowRadius: 20 }]}>
                  <View style={tw`w-14 h-14 bg-red-100 rounded-full items-center justify-center mb-6`}>
                    <Feather name="alert-circle" size={26} color="#ED1C24" />
                  </View>
                  <View>
                    <Text style={tw`text-5xl font-black text-[#ED1C24] tracking-tighter`}>{alerts.length}</Text>
                    <Text style={tw`text-xs text-red-400 font-black uppercase tracking-widest mt-2`}>Isu Ditemukan</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Card */}
            {!isAdmin ? (
              <TouchableOpacity style={tw`w-full mb-10`} onPress={() => navigation.navigate('Scanner')}>
                <LinearGradient colors={PERTAMINA_BLUE} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={tw`p-8 rounded-[40px] shadow-2xl shadow-blue-500/40 relative overflow-hidden`}>
                  <View style={tw`absolute -right-10 -bottom-10 opacity-20`}>
                    <Ionicons name="qr-code" size={200} color="white" />
                  </View>
                  <View style={tw`w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-8 backdrop-blur-md`}>
                    <Feather name="maximize" size={32} color="white" />
                  </View>
                  <Text style={tw`text-blue-200 font-bold text-sm uppercase tracking-widest mb-2`}>Mulai Pekerjaan</Text>
                  <Text style={tw`text-white font-black text-3xl tracking-tight`}>Pindai QR Code</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={tw`w-full mb-10`} onPress={() => navigation.navigate('History')}>
                <LinearGradient colors={PERTAMINA_GREEN} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={tw`p-8 rounded-[40px] shadow-2xl shadow-green-500/40 relative overflow-hidden`}>
                  <View style={tw`absolute -right-10 -top-10 opacity-20`}>
                    <Ionicons name="documents" size={200} color="white" />
                  </View>
                  <View style={tw`w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-8 backdrop-blur-md`}>
                    <Feather name="database" size={32} color="white" />
                  </View>
                  <Text style={tw`text-green-200 font-bold text-sm uppercase tracking-widest mb-2`}>Arsip Database</Text>
                  <Text style={tw`text-white font-black text-3xl tracking-tight`}>Lihat Seluruh Laporan</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Live Feed / Alerts */}
            {isAdmin && (
              <View>
                <View style={tw`flex-row justify-between items-center mb-6`}>
                  <Text style={tw`text-2xl font-black text-gray-800 tracking-tight`}>Live Feed Isu</Text>
                  <View style={tw`bg-red-100 px-4 py-1.5 rounded-full`}>
                    <Text style={tw`text-[#ED1C24] text-xs font-black uppercase tracking-widest`}>Realtime</Text>
                  </View>
                </View>
                
                {loadingAlerts ? (
                  <ActivityIndicator size="large" color="#ED1C24" style={tw`my-10`} />
                ) : alerts.length > 0 ? (
                  alerts.map(item => <React.Fragment key={item.id}>{renderAlertItem({item})}</React.Fragment>)
                ) : (
                  <View style={[tw`items-center justify-center py-16 px-6 rounded-[35px] border border-white/60`, { backgroundColor: 'rgba(255,255,255,0.6)', ...glassStyle }]}>
                    <View style={tw`w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6`}>
                      <Feather name="check-circle" size={48} color="#00A651" />
                    </View>
                    <Text style={tw`text-gray-800 font-black text-2xl tracking-tight`}>Status Aman Beroperasi</Text>
                    <Text style={tw`text-gray-500 text-center text-sm mt-3 font-semibold px-4`}>Semua kendaraan siap digunakan. Tidak ada anomali yang dilaporkan.</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>

        {/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY) */}
        {!isLargeScreen && (
          <View style={[tw`absolute bottom-6 left-6 right-6 rounded-[35px] border border-white/50 flex-row justify-around py-4`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 30, shadowOffset: {width: 0, height: 10} }]}>
            <TouchableOpacity style={tw`items-center justify-center px-4`} onPress={() => setActiveMenu('Home')}>
              <View style={tw`w-12 h-12 rounded-full items-center justify-center ${activeMenu === 'Home' ? 'bg-[#0055A5]' : 'bg-transparent'}`}>
                <Feather name="grid" size={24} color={activeMenu === 'Home' ? 'white' : '#9CA3AF'} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={tw`items-center justify-center px-4`} onPress={() => navigation.navigate('History')}>
              <View style={tw`w-12 h-12 rounded-full items-center justify-center bg-transparent`}>
                <Feather name="file-text" size={24} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={tw`items-center justify-center px-4`} onPress={handleLogout}>
              <View style={tw`w-12 h-12 rounded-full items-center justify-center bg-red-50`}>
                <Feather name="log-out" size={24} color="#ED1C24" />
              </View>
            </TouchableOpacity>
          </View>
        )}

      </SafeAreaView>
    </View>
  );
}
