import Toast from 'react-native-toast-message';
import React, { useState, useEffect, useMemo } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
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
export default function WorkerListScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
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

  // Modal CRUD Worker
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('AMT');
  const [jabatan, setJabatan] = useState('AMT I');

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState(null);
  const [notificationModal, setNotificationModal] = useState({ visible: false, title: '', message: '', type: 'success' });
  const showNotification = (title, message, type = 'success') => {
    setNotificationModal({ visible: true, title, message, type });
  };

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
      fetchWorkers();
    };
    loadUserAndFetch();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/workers`);
      setWorkers(res.data);
    } catch (error) {
      console.log('Error fetching workers:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = useMemo(() => { return workers.filter((item) => { const searchLower = (searchQuery || '').toLowerCase().trim(); const matchesSearch = (item.name || '').toLowerCase().includes(searchLower) || (item.username || '').toLowerCase().includes(searchLower); let matchesJabatan = true; if (filterJabatan !== 'Semua') { matchesJabatan = item.jabatan === filterJabatan; } return matchesSearch && matchesJabatan; }).sort((a, b) => { if (sortBy === 'Abjad') { return a.name.localeCompare(b.name); } else if (sortBy === 'NIP') { return a.username.localeCompare(b.username); } return 0; }); }, [workers, searchQuery, filterJabatan, sortBy]);

  const openAddModal = () => {
    setSelectedWorker(null);
    setName('');
    setUsername('');
    setPassword('');
    setJabatan('');
    setRole('AMT');
    setManageModalVisible(true);
  };

  const openEditModal = (worker) => {
    setSelectedWorker(worker);
    setName(worker.name);
    setUsername(worker.username);
    setPassword(''); // biarkan kosong jika tidak diubah
    setJabatan(worker.jabatan || '');
    setRole(worker.role);
    setManageModalVisible(true);
  };

  const handleSaveWorker = async () => {
    if (!name || !username || (!selectedWorker && !password)) {
      showNotification('Data Tidak Lengkap', 'Pastikan Nama, Username, dan Password (untuk pengguna baru) diisi.', 'info');
      return;
    }

    const isUsernameValid = /^[a-zA-Z0-9\s.\-_]+$/.test(username);
    const isPasswordValid = selectedWorker && !password ? true : /^[0-9]+$/.test(password);

    if (!isUsernameValid) {
      showNotification('Format Tidak Valid', 'Username hanya boleh berisi huruf, angka, spasi, titik, strip atau underscore.', 'info');
      return;
    }

    if (!isPasswordValid) {
      showNotification('Format Tidak Valid', 'Password hanya boleh berisi angka.', 'info');
      return;
    }

    try {
      const data = { name, username, role, jabatan };
      if (password) data.password = password;

      if (selectedWorker) {
        // Update
        await axios.put(`${API_BASE}/workers/${selectedWorker.id}`, data);
        showNotification('Berhasil', 'Data pekerja berhasil diperbarui!', 'success');
      } else {
        // Create
        await axios.post(`${API_BASE}/workers`, data);
        showNotification('Berhasil', 'Pekerja baru berhasil ditambahkan!', 'success');
        setSearchQuery('');
      }
      setManageModalVisible(false);
      fetchWorkers();
    } catch (error) {
      showNotification('Gagal', error.response?.data?.error || error.message, 'error');
    }
  };

    const handleDeleteWorker = () => {
    setWorkerToDelete(selectedWorker);
    setConfirmModalVisible(true);
  };

  const confirmDelete = async () => {
    if(!workerToDelete) return;
    try {
      await axios.delete(`${API_BASE}/workers/${workerToDelete.id}`);
      setConfirmModalVisible(false);
      setManageModalVisible(false);
      fetchWorkers();
      showNotification('Berhasil!', 'Data pekerja berhasil dihapus.', 'success');
    } catch (error) {
      console.error(error);
      setConfirmModalVisible(false);
      showNotification('Error', 'Gagal menghapus pekerja', 'error');
    }
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
          <Text style={tw`text-2xl font-black text-gray-800 tracking-tight z-30`}>Daftar Pekerja</Text>
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row`}>
              <TouchableOpacity onPress={() => setSortBy('Abjad')} style={tw`px-4 py-2 rounded-full mr-2 border ${sortBy === 'Abjad' ? 'bg-[#0055A5] border-[#0055A5]' : 'bg-white border-gray-200'}`}>
                <Text style={tw`text-xs font-bold ${sortBy === 'Abjad' ? 'text-white' : 'text-gray-500'}`}>Urut Abjad</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortBy('NIP')} style={tw`px-4 py-2 rounded-full mr-2 border ${sortBy === 'NIP' ? 'bg-[#0055A5] border-[#0055A5]' : 'bg-white border-gray-200'}`}>
                <Text style={tw`text-xs font-bold ${sortBy === 'NIP' ? 'text-white' : 'text-gray-500'}`}>Urut NIP</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setFilterJabatan('Semua')} style={tw`px-4 py-2 rounded-full mr-2 border ${filterJabatan === 'Semua' ? 'bg-[#00A651] border-[#00A651]' : 'bg-white border-gray-200'}`}>
                <Text style={tw`text-xs font-bold ${filterJabatan === 'Semua' ? 'text-white' : 'text-gray-500'}`}>Semua AMT</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterJabatan('AMT I')} style={tw`px-4 py-2 rounded-full mr-2 border ${filterJabatan === 'AMT I' ? 'bg-[#00A651] border-[#00A651]' : 'bg-white border-gray-200'}`}>
                <Text style={tw`text-xs font-bold ${filterJabatan === 'AMT I' ? 'text-white' : 'text-gray-500'}`}>AMT I</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterJabatan('AMT II')} style={tw`px-4 py-2 rounded-full mr-4 border ${filterJabatan === 'AMT II' ? 'bg-[#00A651] border-[#00A651]' : 'bg-white border-gray-200'}`}>
                <Text style={tw`text-xs font-bold ${filterJabatan === 'AMT II' ? 'text-white' : 'text-gray-500'}`}>AMT II</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={tw`px-6 mt-2 mb-2`}>
            <Text style={tw`text-gray-500 font-bold uppercase tracking-widest text-xs`}>{filteredWorkers.length} Pekerja Terdaftar</Text>
          </View>

          <FlatList key={numCols} numColumns={numCols} columnWrapperStyle={isLargeScreen ? tw`justify-start gap-4` : undefined}
            contentContainerStyle={tw`p-6 pb-30 w-full max-w-7xl mx-auto`}
            data={filteredWorkers}
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

      {/* MANAGE WORKER MODAL */}
      <Modal visible={manageModalVisible} transparent={true} animationType="slide" onRequestClose={() => setManageModalVisible(false)}>
        <View style={tw`flex-1 justify-end bg-black/60`}>
          <View style={tw`bg-white rounded-t-[30px] p-6 shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <Text style={tw`text-2xl font-black text-gray-800`}>{selectedWorker ? 'Edit Pekerja' : 'Tambah Pekerja'}</Text>
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
              <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Jabatan</Text>
              <View style={tw`flex-row justify-between`}>
                <TouchableOpacity
                  style={tw`flex-1 p-4 rounded-xl border ${jabatan === 'AMT I' ? 'border-[#0055A5] bg-[#0055A5]' : 'border-slate-200 bg-slate-50'} mr-2 items-center`}
                  onPress={() => setJabatan('AMT I')}
                >
                  <Text style={tw`font-bold ${jabatan === 'AMT I' ? 'text-white' : 'text-gray-600'}`}>AMT I</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-1 p-4 rounded-xl border ${jabatan === 'AMT II' ? 'border-[#0055A5] bg-[#0055A5]' : 'border-slate-200 bg-slate-50'} ml-2 items-center`}
                  onPress={() => setJabatan('AMT II')}
                >
                  <Text style={tw`font-bold ${jabatan === 'AMT II' ? 'text-white' : 'text-gray-600'}`}>AMT II</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={tw`mb-6`}>
              {selectedWorker && (
                <View style={tw`mb-4 p-4 bg-gray-100 rounded-xl border border-gray-200 flex-row justify-between items-center`}>
                  <View>
                    <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1`}>Password Saat Ini</Text>
                    <Text style={tw`text-sm font-bold text-gray-700`}>{selectedWorker.password}</Text>
                  </View>
                  <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                </View>
              )}
              <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>
                Password {selectedWorker ? '(Kosongkan jika tidak diubah)' : ''}
              </Text>
              <TextInput
                style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`}
                placeholder={selectedWorker ? "Masukkan password baru" : "Masukkan password"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={tw`flex-row justify-between w-full mb-6`}>
              {selectedWorker ? (
                <>
                  <TouchableOpacity style={tw`flex-1 bg-red-100 p-4 rounded-xl mr-2 items-center`} onPress={handleDeleteWorker}>
                    <Text style={tw`text-red-700 font-bold`}>Hapus Data</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={tw`flex-1 bg-[#0055A5] p-4 rounded-xl ml-2 items-center shadow-lg shadow-blue-500/40`} onPress={handleSaveWorker}>
                    <Text style={tw`text-white font-bold`}>Simpan</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={tw`flex-1 bg-[#0055A5] p-4 rounded-xl items-center shadow-lg shadow-blue-500/40`} onPress={handleSaveWorker}>
                  <Text style={tw`text-white font-black text-lg tracking-wide`}>SIMPAN PEKERJA</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      </Modal>

    
      <ConfirmModal visible={confirmModalVisible} title="Konfirmasi Hapus" message={workerToDelete ? `Apakah Anda yakin ingin menghapus ${workerToDelete.name}?` : ''} onConfirm={confirmDelete} onCancel={() => setConfirmModalVisible(false)} />

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
              <Ionicons name={notificationModal.type === 'success' ? 'checkmark-circle' : notificationModal.type === 'info' ? 'information-circle' : 'close-circle'} size={40} color={notificationModal.type === 'success' ? '#10B981' : notificationModal.type === 'info' ? '#3B82F6' : '#EF4444'} />
            </View>
            <Text style={tw`text-2xl font-black text-gray-800 mb-2`}>{notificationModal.title}</Text>
            <Text style={tw`text-gray-500 text-center text-base mb-6 leading-relaxed`}>
              {notificationModal.message}
            </Text>
            <TouchableOpacity
              style={tw`w-full ${notificationModal.type === 'success' ? 'bg-[#0055A5]' : notificationModal.type === 'info' ? 'bg-[#3B82F6]' : 'bg-[#ED1C24]'} py-4 rounded-2xl items-center shadow-md`}
              onPress={() => setNotificationModal({ ...notificationModal, visible: false })}
            >
              <Text style={tw`text-white font-bold`}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
