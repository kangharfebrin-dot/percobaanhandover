import Toast from 'react-native-toast-message';
import React, { useState, useEffect } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import { API_URL } from '../../config';
import { View, Text, FlatList, TouchableOpacity, Platform, TextInput, Modal, Alert, Animated, Easing, Dimensions } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

const DEFAULT_ITEMS = [
  { id: 'A1', category: 'A', name: 'Kondisi Rem', severity: 'Major' },
  { id: 'A2', category: 'A', name: 'Kondisi Wiper', severity: 'Minor' },
  { id: 'A3', category: 'A', name: 'Kondisi Kompartemen Tangki', severity: 'Major' },
  { id: 'A4', category: 'A', name: 'Keberadaan DCP/ CO2', severity: 'Major' },
  { id: 'A5', category: 'A', name: 'Oli Mesin', severity: 'Major' },
  { id: 'A6', category: 'A', name: 'Air Radiator', severity: 'Minor' },
  { id: 'A7', category: 'A', name: 'Keberadaan STNK', severity: 'Major' },
  { id: 'A8', category: 'A', name: 'Keberadaan Surat Keur', severity: 'Major' },
  { id: 'A9', category: 'A', name: 'Keberadaan Surat Tera', severity: 'Major' },
  { id: 'A10', category: 'A', name: 'Keberadaan Kotak P3K', severity: 'Minor' },
  { id: 'A11', category: 'A', name: 'Keberadaan Flame Trap', severity: 'Major' },
  { id: 'A12', category: 'A', name: 'Keberadaan Tools Kit termasuk dongkrak', severity: 'Minor' },
  { id: 'A13', category: 'A', name: 'Keberadaan Selang bongkar', severity: 'Major' },
  { id: 'A14', category: 'A', name: 'Keberadaan Grounding Cable', severity: 'Major' },
  { id: 'A15', category: 'A', name: 'Keberadaan Spill Kit', severity: 'Minor' },
  { id: 'B1', category: 'B', name: 'Membawa SIM Sesuai Kendaraan', severity: 'Major' },
  { id: 'B2', category: 'B', name: 'ID/ HSE Paspor Berlaku', severity: 'Major' },
  { id: 'B3', category: 'B', name: 'Dokumen KIM', severity: 'Major' },
  { id: 'B4', category: 'B', name: 'Menggunakan Seragam Kerja', severity: 'Minor' },
  { id: 'B5', category: 'B', name: 'Menggunakan Safety Shoes', severity: 'Major' },
  { id: 'B6', category: 'B', name: 'Menggunakan Safety Helm', severity: 'Major' },
  { id: 'B7', category: 'B', name: 'Menggunakan Safety Glove', severity: 'Minor' },
  { id: 'B8', category: 'B', name: 'Membawa Jas Hujan', severity: 'Minor' },
  { id: 'B9', category: 'B', name: 'Membawa Buku Saku AMT', severity: 'Minor' }
];

export default function ChecklistManagerScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [notificationModal, setNotificationModal] = useState({ visible: false, title: '', message: '', type: 'success' });
  const showNotification = (title, message, type = 'success') => {
    setNotificationModal({ visible: true, title, message, type });
  };
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('A');
  const [newSeverity, setNewSeverity] = useState('Minor');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [user, setUser] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchUnreadNotificationsCount = async (userData) => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${userData.token}` }
      });
      setUnreadNotificationsCount(res.data.notifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.log('Error fetching notifications:', error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) fetchUnreadNotificationsCount(user);
    });
    return unsubscribe;
  }, [navigation, user]);
  const isLargeScreen = screenWidth > 768;

  const orb1TranslateY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1TranslateY, { toValue: -40, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(orb1TranslateY, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
    
    loadItems();
    loadUser();
    return () => subscription?.remove();
  }, []);

  const loadUser = async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchUnreadNotificationsCount(userData);
    }
  };

  const loadItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/checklists`);
      setItems(res.data);
    } catch (e) {
      console.error(e);
      showNotification('Error', 'Gagal memuat data checklist dari server', 'error');
    }
  };

  const handleSave = async () => {
    if (!newName.trim()) {
      showNotification('Error', 'Nama pengecekan tidak boleh kosong.', 'error');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`${API_URL}/api/checklists/${editingItem.id}`, {
          name: newName,
          category: newCategory,
          severity: newSeverity
        });
      } else {
        await axios.post(`${API_URL}/api/checklists`, {
          name: newName,
          category: newCategory,
          severity: newSeverity
        });
      }
      loadItems();
      setModalVisible(false);
      showNotification('Berhasil', 'Item berhasil disimpan!', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Error', 'Gagal menyimpan data ke server', 'error');
    }
  };

    const handleDelete = (id) => {
    const it = items.find(i => i.id === id);
    setItemToDelete(it);
    setConfirmModalVisible(true);
  };

  const confirmDelete = async () => {
    if(!itemToDelete) return;
    try {
      await axios.delete(`${API_URL}/api/checklists/${itemToDelete.id}`);
      setConfirmModalVisible(false);
      loadItems();
      showNotification('Berhasil', 'Item berhasil dihapus!', 'success');
    } catch (e) {
      console.error(e);
      setConfirmModalVisible(false);
      showNotification('Error', 'Gagal menghapus data dari server', 'error');
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewName('');
    setNewCategory('A');
    setNewSeverity('Minor');
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewCategory(item.category);
    setNewSeverity(item.severity || 'Minor');
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={tw`bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100 flex-row justify-between items-center`}>
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center mb-1`}>
          <View style={tw`bg-blue-100 px-2 py-0.5 rounded-md mr-2`}>
            <Text style={tw`text-blue-700 text-[10px] font-black`}>KATEGORI {item.category}</Text>
          </View>
          <View style={tw`${item.severity === 'Major' ? 'bg-red-100' : 'bg-amber-100'} px-2 py-0.5 rounded-md`}>
            <Text style={tw`${item.severity === 'Major' ? 'text-red-700' : 'text-amber-700'} text-[10px] font-black uppercase`}>{item.severity || 'Minor'}</Text>
          </View>
        </View>
        <Text style={tw`text-gray-800 font-bold text-base`}>{item.name}</Text>
      </View>
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
        <View style={tw`flex-row`}>
          <TouchableOpacity style={tw`p-2 bg-blue-50 rounded-lg mr-2`} onPress={() => openEditModal(item)}>
            <Feather name="edit-2" size={18} color="#0055A5" />
          </TouchableOpacity>
          <TouchableOpacity style={tw`p-2 bg-red-50 rounded-lg`} onPress={() => handleDelete(item.id)}>
            <Feather name="trash-2" size={18} color="#ED1C24" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={tw`flex-1 bg-[#F4F7FA]`}>
      <Animated.View style={[tw`absolute -top-20 -left-10 w-[30rem] h-[30rem] rounded-full opacity-15`, { transform: [{ translateY: orb1TranslateY }] }]}>
        <LinearGradient colors={['#00A651', '#0055A5']} style={tw`flex-1 rounded-full`} />
      </Animated.View>

      <SafeAreaView style={tw`flex-1 relative`}>
        <View style={[tw`flex-row items-center justify-between px-5 py-3 mx-5 mt-4 mb-4 rounded-3xl border border-white/60 relative z-20`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#00A651', shadowOpacity: 0.15, shadowRadius: 25, shadowOffset: {width: 0, height: 10} }]}>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={tw`p-2 bg-gray-100 rounded-full mr-4 shadow-sm z-30`}>
              <Ionicons name="arrow-back" size={24} color="#00A651" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-black text-gray-800 tracking-tight z-30`}>Manajer Checklist</Text>
          </View>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
            <TouchableOpacity onPress={openAddModal}>
               <Ionicons name="add-circle" size={28} color="#00A651" />
            </TouchableOpacity>
          )}
        </View>

        <View style={tw`px-6 mb-2`}>
          <Text style={tw`text-gray-500 font-medium text-sm`}>Edit pertanyaan yang akan muncul di Form Handover AMT secara real-time.</Text>
        </View>

        <FlatList
          contentContainerStyle={tw`p-6 pb-40 w-full max-w-4xl mx-auto`}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      </SafeAreaView>

      {/* ADMIN BOTTOM NAVBAR MOCK (Identik dengan Dashboard) */}
      {!isLargeScreen && user && (
        <View style={tw`absolute bottom-8 self-center w-11/12 bg-white rounded-full flex-row justify-around items-center py-5 shadow-2xl shadow-gray-400/50 z-50`}>
          <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace('AdminDashboard')}>
            <Feather name="grid" size={26} color="#9CA3AF" />
          </TouchableOpacity>

          {user.role === 'SUPER_ADMIN' && (
            <TouchableOpacity style={tw`items-center justify-center px-4 relative`}>
              <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}>
                <Animated.View style={[tw`h-full w-[64px]`]}>
                  <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw`flex-1`} />
                </Animated.View>
              </View>
              <View style={tw`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full`}>
                <Animated.View style={[tw`h-full w-[64px]`]}>
                  <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw`flex-1`} />
                </Animated.View>
              </View>
              <Feather name="check-square" size={26} color="#1F2937" />
            </TouchableOpacity>
          )}

          {(user.role === 'AMT' || user.role === 'USER') && (
            <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace('History')}>
              <Feather name="file-text" size={26} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {(user.role === 'SUPER_ADMIN' || user.role === 'PENGAWAS') && (
            <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace('MessageCenter')}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color="#9CA3AF" />
              {unreadNotificationsCount > 0 && <View style={tw`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white`} />}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={tw`items-center justify-center px-4 relative`}>
            <Feather name="log-out" size={26} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      )}

      {/* CRUD MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center bg-black/60 px-4`}>
          <View style={tw`bg-white rounded-[25px] p-6 shadow-2xl w-full max-w-sm self-center`}>
            <Text style={tw`text-2xl font-black text-gray-800 mb-4`}>{editingItem ? 'Edit Item' : 'Tambah Item'}</Text>
            
            <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Nama Pengecekan</Text>
            <TextInput 
              style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold mb-4`} 
              placeholder="Misal: Periksa APAR" 
              value={newName} 
              onChangeText={setNewName} 
            />

            <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Kategori (A/B/C)</Text>
            <View style={tw`flex-row gap-2 mb-4`}>
              {['A', 'B', 'C'].map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={tw`flex-1 py-3 rounded-lg border ${newCategory === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'} items-center`}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={tw`font-bold ${newCategory === cat ? 'text-white' : 'text-gray-600'}`}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Keparahan (Tingkat Isu)</Text>
            <View style={tw`flex-row gap-2 mb-8`}>
              {['Minor', 'Major'].map(sev => (
                <TouchableOpacity 
                  key={sev} 
                  style={tw`flex-1 py-3 rounded-lg border ${newSeverity === sev ? (sev === 'Major' ? 'bg-red-600 border-red-600' : 'bg-amber-500 border-amber-500') : 'bg-white border-gray-300'} items-center`}
                  onPress={() => setNewSeverity(sev)}
                >
                  <Text style={tw`font-bold ${newSeverity === sev ? 'text-white' : 'text-gray-600'} uppercase`}>{sev}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={tw`flex-row justify-end gap-3`}>
              <TouchableOpacity style={tw`px-6 py-3 rounded-xl bg-gray-100`} onPress={() => setModalVisible(false)}>
                <Text style={tw`font-bold text-gray-600`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`px-6 py-3 rounded-xl bg-[#00A651]`} onPress={handleSave}>
                <Text style={tw`font-bold text-white`}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    <ConfirmModal visible={confirmModalVisible} title="Hapus Item" message={itemToDelete ? `Yakin ingin menghapus form pengecekan ${itemToDelete.name}?` : ''} onConfirm={confirmDelete} onCancel={() => setConfirmModalVisible(false)} />
      
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
