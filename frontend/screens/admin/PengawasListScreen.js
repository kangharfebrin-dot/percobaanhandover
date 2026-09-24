import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import TextLogo from '../../components/TextLogo';
import { View, Text, FlatList, TouchableOpacity, TextInput, Platform, Modal, Animated, Image, Easing, Alert, ScrollView } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

const API_BASE = `${API_URL}/api`; // Sesuaikan IP backend

const { Dimensions } = require('react-native');
export default function PengawasListScreen({ navigation }) {
  const [pengawass, setPengawass] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const isLargeScreen = Platform.OS === 'web' && screenWidth > 768;
  const numCols = isLargeScreen ? 3 : 1;

  // Modal CRUD Pengawas
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedPengawas, setSelectedPengawas] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('AMT');
  const [jabatan, setJabatan] = useState('');

  const [filterJabatan, setFilterJabatan] = useState('Semua');
  const [sortBy, setSortBy] = useState('Abjad');

  const orb1TranslateY = React.useRef(new Animated.Value(0)).current;
  const orb2TranslateY = React.useRef(new Animated.Value(0)).current;
  const orb3TranslateY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(orb1TranslateY, { toValue: -50, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(orb1TranslateY, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(orb2TranslateY, { toValue: 60, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(orb2TranslateY, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(orb3TranslateY, { toValue: -70, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(orb3TranslateY, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();

    const loadUserAndFetch = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
      fetchPengawass();
    };
    loadUserAndFetch();
  }, []);

  const fetchPengawass = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/pengawas`);
      setPengawass(res.data);
    } catch (error) {
      console.log('Error fetching pengawass:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPengawass = pengawass.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchLower) ||
                          item.username.toLowerCase().includes(searchLower);
                          
    let matchesJabatan = true;
    if (filterJabatan !== 'Semua') {
      matchesJabatan = item.jabatan === filterJabatan;
    }

    return matchesSearch && matchesJabatan;
  }).sort((a, b) => {
    if (sortBy === 'Abjad') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'NIP') {
      return a.username.localeCompare(b.username);
    }
    return 0;
  });

  const openAddModal = () => {
    setSelectedPengawas(null);
    setName('');
    setUsername('');
    setPassword('');
    setJabatan('');
    setRole('PENGAWAS');
    setManageModalVisible(true);
  };

  const openEditModal = (pengawas) => {
    setSelectedPengawas(pengawas);
    setName(pengawas.name);
    setUsername(pengawas.username);
    setPassword(''); // biarkan kosong jika tidak diubah
    setJabatan(pengawas.jabatan || '');
    setRole(pengawas.role);
    setManageModalVisible(true);
  };

  const handleSavePengawas = async () => {
    if (!name || !username || (!selectedPengawas && !password)) {
      Alert.alert("Data Tidak Lengkap", "Pastikan Nama, Username, dan Password (untuk pengguna baru) diisi.");
      return;
    }

    const isUsernameValid = /^[a-zA-Z]+$/.test(username);
    const isPasswordValid = selectedPengawas && !password ? true : /^[0-9]+$/.test(password);

    if (!isUsernameValid) {
      Alert.alert("Format Tidak Valid", "Username hanya boleh berisi huruf (alfabet) tanpa spasi atau angka.");
      return;
    }

    if (!isPasswordValid) {
      Alert.alert("Format Tidak Valid", "Password hanya boleh berisi angka.");
      return;
    }

    try {
      const data = { name, username, role, jabatan };
      if (password) data.password = password;

      if (selectedPengawas) {
        // Update
        await axios.put(`${API_BASE}/pengawas/${selectedPengawas.id}`, data);
        Alert.alert("Berhasil", "Data pekerja berhasil diperbarui!");
      } else {
        // Create
        await axios.post(`${API_BASE}/pengawas`, data);
        Alert.alert("Berhasil", "Pekerja baru berhasil ditambahkan!");
      }
      setManageModalVisible(false);
      fetchPengawass();
    } catch (error) {
      Alert.alert("Gagal", error.response?.data?.error || error.message);
    }
  };

  const handleDeletePengawas = () => {
    if (!selectedPengawas) return;

    Alert.alert("Konfirmasi Hapus", `Apakah Anda yakin ingin menghapus ${selectedPengawas.name}?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE}/pengawas/${selectedPengawas.id}`);
            Alert.alert("Berhasil", "Pengawas berhasil dihapus!");
            setManageModalVisible(false);
            fetchPengawass();
          } catch (error) {
            Alert.alert("Gagal", error.response?.data?.error || error.message);
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    return (
      <View style={tw`${isLargeScreen ? "flex-1 min-w-[30%] mx-2" : "w-full"} bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100 flex-row justify-between items-center`}>
        <View style={tw`flex-row items-center flex-1`}>
          <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-3 bg-blue-100`}>
            <Feather name="user" size={24} color="#0055A5" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-black text-gray-800`} numberOfLines={1}>{item.name}</Text>
            <Text style={tw`text-sm font-bold text-gray-500`}>@{item.username} • {item.jabatan || item.role}</Text>
          </View>
        </View>

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <TouchableOpacity onPress={() => openEditModal(item)} style={tw`p-2 bg-gray-50 rounded-full border border-gray-200`}>
            <Feather name="edit-2" size={18} color="#4B5563" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-[#F4F7FA]`}>
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
        <View style={[tw`flex-row items-center px-5 py-3 mx-5 mt-4 mb-2 rounded-3xl border border-white/60 relative z-20`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.15, shadowRadius: 25, shadowOffset: { width: 0, height: 10 } }]}>

          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('AdminDashboard')} style={tw`p-2 bg-gray-100 rounded-full mr-4 shadow-sm z-30`}>
            <Ionicons name="arrow-back" size={24} color="#0055A5" />
          </TouchableOpacity>
          <Text style={tw`text-2xl font-black text-gray-800 tracking-tight z-30`}>Daftar Pengawas</Text>
        </View>

        <View style={tw`flex-1 relative`}>
          <View style={tw`px-6 pt-2`}>
            <View style={tw`flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mb-3`}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={tw`flex-1 ml-3 text-gray-800 font-medium`}
                placeholder="Cari Nama atau Username..."
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

            
          </View>

          <View style={tw`px-6 mt-2 mb-2`}>
            <Text style={tw`text-gray-500 font-bold uppercase tracking-widest text-xs`}>{filteredPengawass.length} Pengawas Terdaftar</Text>
          </View>

          <FlatList key={numCols} numColumns={numCols} columnWrapperStyle={isLargeScreen ? tw`justify-start gap-4` : undefined}
            contentContainerStyle={tw`p-6 pb-30 w-full max-w-7xl mx-auto`}
            data={filteredPengawass}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={tw`items-center mt-20`}>
                <Feather name="users" size={60} color="#CBD5E1" />
                <Text style={tw`text-center text-gray-400 font-bold mt-4 text-lg`}>
                  {loading ? 'Memuat data pekerja...' : 'Tidak ada data pekerja.'}
                </Text>
              </View>
            }
          />
        </View>

        {/* Floating Action Button (Only for Admin) */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <TouchableOpacity
            style={tw`absolute bottom-6 right-6 bg-[#0055A5] w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-500/50`}
            onPress={openAddModal}
          >
            <Feather name="plus" size={28} color="white" />
          </TouchableOpacity>
        )}

      </SafeAreaView>

      {/* MANAGE PENGAWAS MODAL */}
      <Modal visible={manageModalVisible} transparent={true} animationType="slide" onRequestClose={() => setManageModalVisible(false)}>
        <View style={tw`flex-1 justify-end bg-black/60`}>
          <View style={tw`bg-white rounded-t-[30px] p-6 shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <Text style={tw`text-2xl font-black text-gray-800`}>{selectedPengawas ? 'Edit Pengawas' : 'Tambah Pengawas'}</Text>
              <TouchableOpacity onPress={() => setManageModalVisible(false)} style={tw`p-2 bg-gray-100 rounded-full`}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Nama Pekerja</Text>
              <TextInput
                style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`}
                placeholder="Masukkan nama lengkap"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Username</Text>
              <TextInput
                style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`}
                placeholder="Masukkan username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={tw`mb-4`}>
              <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Jabatan (Cth: AMT I / AMT II)</Text>
              <TextInput
                style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`}
                placeholder="Masukkan jabatan (opsional)"
                value={jabatan}
                onChangeText={setJabatan}
              />
            </View>

            <View style={tw`mb-6`}>
              {selectedPengawas && (
                <View style={tw`mb-4 p-4 bg-gray-100 rounded-xl border border-gray-200 flex-row justify-between items-center`}>
                  <View>
                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1`}>Password Saat Ini</Text>
                    <Text style={tw`text-sm font-bold text-gray-700`}>{selectedPengawas.password}</Text>
                  </View>
                  <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                </View>
              )}
              <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>
                Password {selectedPengawas ? '(Kosongkan jika tidak diubah)' : ''}
              </Text>
              <TextInput
                style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`}
                placeholder={selectedPengawas ? "Masukkan password baru" : "Masukkan password"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={tw`flex-row justify-between w-full mb-6`}>
              {selectedPengawas ? (
                <>
                  <TouchableOpacity style={tw`flex-1 bg-red-100 p-4 rounded-xl mr-2 items-center`} onPress={handleDeletePengawas}>
                    <Text style={tw`text-red-700 font-bold`}>Hapus Data</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={tw`flex-1 bg-[#0055A5] p-4 rounded-xl ml-2 items-center shadow-lg shadow-blue-500/40`} onPress={handleSavePengawas}>
                    <Text style={tw`text-white font-bold`}>Simpan</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={tw`flex-1 bg-[#0055A5] p-4 rounded-xl items-center shadow-lg shadow-blue-500/40`} onPress={handleSavePengawas}>
                  <Text style={tw`text-white font-black text-lg tracking-wide`}>SIMPAN PEKERJA</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}
