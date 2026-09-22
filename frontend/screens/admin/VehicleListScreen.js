import React, { useState, useEffect } from 'react';
import TextLogo from '../../components/TextLogo';
import { View, Text, FlatList, TouchableOpacity, TextInput, Platform, Modal, Animated, Image, Easing, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const API_URL = 'http://192.168.1.4:3000/api';
const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

export default function VehicleListScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua'); 
  const [selectedMonth, setSelectedMonth] = useState('Semua');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [user, setUser] = useState(null);
  
  // Modal Manage Vehicle (Detail/Edit/Delete)
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [fullScreenBarcode, setFullScreenBarcode] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Modal Add / Edit Vehicle
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newNoPolisi, setNewNoPolisi] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newType, setNewType] = useState('');
  const [newBarcode, setNewBarcode] = useState('');

  // Custom Success Notification Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Custom Warning Modal
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [warningTitle, setWarningTitle] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  const showWarningModal = (title, message) => {
    setWarningTitle(title);
    setWarningMessage(message);
    setWarningModalVisible(true);
  };
  
  const orb1TranslateY = React.useRef(new Animated.Value(0)).current;
  const orb2TranslateY = React.useRef(new Animated.Value(0)).current;
  const orb3TranslateY = React.useRef(new Animated.Value(0)).current;

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const [vehicleRes, handoverRes] = await Promise.all([
        axios.get(`${API_URL}/vehicles`),
        axios.get(`${API_URL}/handovers`)
      ]);
      
      const vehiclesData = vehicleRes.data;
      const handoversData = handoverRes.data;
      
      const updatedVehicles = vehiclesData.map(vehicle => {
        const vehicleHandovers = handoversData.filter(h => h.noPolisi === vehicle.noPolisi);
        if (vehicleHandovers.length > 0) {
          // data dari API diurutkan berdasarkan timestamp descending, jadi index 0 adalah yang terbaru
          const latestHandover = vehicleHandovers[0];
          vehicle.dynamicStatus = latestHandover.status !== 'Siap Operasi (Normal)' ? 'Buruk' : 'Baik';
        } else {
          vehicle.dynamicStatus = 'Baik';
        }
        return vehicle;
      });
      
      setVehicles(updatedVehicles);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data kendaraan');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessModal = (message) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
    setTimeout(() => {
      setSuccessModalVisible(false);
    }, 2500);
  };

  const handleDownloadBarcode = async () => {
    if (!selectedVehicle) return;
    
    const imageUrl = `${API_URL.replace('/api', '')}/barcodes/${selectedVehicle.barcode}.jpg`;

    if (Platform.OS === 'web') {
      window.open(imageUrl, '_blank');
      setFullScreenBarcode(false);
      showSuccessModal('Barcode dibuka di tab baru! Silakan klik kanan dan Simpan Gambar.');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Gagal', 'Fitur berbagi tidak tersedia di perangkat ini.');
        return;
      }

      const fileUri = FileSystem.documentDirectory + `${selectedVehicle.barcode}.jpg`;
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Simpan Barcode Kendaraan',
        UTI: 'public.jpeg'
      });
      
      setFullScreenBarcode(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat memproses barcode.');
    }
  };

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

    const loadUser = async () => {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
    };
    
    loadUser();
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((item) => {
    const matchesSearch = item.noPolisi.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    let matchesStatus = true;
    if (selectedStatus !== 'Semua') matchesStatus = item.dynamicStatus === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const openManageModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setManageModalVisible(true);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setNewNoPolisi(''); setNewBrand(''); setNewType(''); setNewBarcode('');
    setAddModalVisible(true);
  };

  const openEditModal = (vehicle) => {
    setIsEditMode(true);
    setSelectedVehicle(vehicle);
    setNewNoPolisi(vehicle.noPolisi);
    setNewBrand(vehicle.brand || '');
    setNewType(vehicle.jenisKendaraan || '');
    setNewBarcode(vehicle.barcode || '');
    setManageModalVisible(false);
    setAddModalVisible(true);
  };

  const handleDeleteVehicle = (vehicle) => {
    Alert.alert(
      "Hapus Kendaraan",
      `Yakin ingin menghapus ${vehicle.noPolisi}? Semua data barcode terkait juga akan dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/vehicles/${vehicle.id}`);
              setManageModalVisible(false);
              fetchVehicles();
              showSuccessModal('Kendaraan berhasil dihapus!');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Gagal menghapus kendaraan');
            }
          }
        }
      ]
    );
  };

  const handleSaveVehicle = async () => {
    if (!newNoPolisi || !newBarcode) {
      Alert.alert("Data Tidak Lengkap", "Nomor Polisi dan Barcode wajib diisi.");
      return;
    }

    const isBarcodeValid = /^[a-zA-Z0-9-]+$/.test(newBarcode);
    if (!isBarcodeValid) {
      Alert.alert("Format Tidak Valid", "Barcode hanya boleh berisi huruf, angka, dan tanda strip (-), tanpa spasi atau simbol lain.");
      return;
    }

    // Cek duplikasi
    const isDuplicateBarcode = vehicles.some(v => v.barcode.toLowerCase() === newBarcode.toLowerCase() && (!isEditMode || v.id !== selectedVehicle?.id));
    const isDuplicateNoPolisi = vehicles.some(v => v.noPolisi.toLowerCase() === newNoPolisi.toLowerCase() && (!isEditMode || v.id !== selectedVehicle?.id));

    if (isDuplicateBarcode) {
      showWarningModal(
        "Barcode Terpakai!", 
        `Kode barcode "${newBarcode}" sudah dipakai oleh kendaraan lain. Mohon gunakan kode yang unik.`
      );
      return;
    }

    if (isDuplicateNoPolisi) {
      showWarningModal(
        "Plat Terdaftar!", 
        `Plat nomor "${newNoPolisi}" sudah ada di database. Silakan periksa kembali.`
      );
      return;
    }

    try {
      if (isEditMode && selectedVehicle) {
        await axios.put(`${API_URL}/vehicles/${selectedVehicle.id}`, {
          noPolisi: newNoPolisi,
          brand: newBrand,
          jenisKendaraan: newType,
          barcode: newBarcode
        });
        showSuccessModal('Kendaraan berhasil diperbarui!');
      } else {
        await axios.post(`${API_URL}/vehicles`, {
          noPolisi: newNoPolisi,
          brand: newBrand,
          jenisKendaraan: newType,
          barcode: newBarcode
        });
        showSuccessModal('Kendaraan baru berhasil ditambahkan!');
      }
      
      setAddModalVisible(false);
      fetchVehicles();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan kendaraan');
    }
  };

  const renderItem = ({ item }) => {
    // Gunakan dynamicStatus yang sudah dikalkulasi dari laporan handover terbaru
    const currentStatus = item.dynamicStatus || item.status || 'Baik';
    const isMaintenance = currentStatus === 'Buruk' || currentStatus === 'Maintenance';

    return (
      <TouchableOpacity 
        style={tw`bg-white p-5 rounded-2xl mb-4 shadow-sm border ${isMaintenance ? 'border-red-100' : 'border-gray-100'} flex-row justify-between items-center`}
        onPress={() => openManageModal(item)}
        activeOpacity={0.7}
      >
        <View style={tw`flex-row items-center flex-1`}>
          <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-3 ${isMaintenance ? 'bg-red-100' : 'bg-green-100'}`}>
            <MaterialCommunityIcons name="truck" size={26} color={isMaintenance ? "#ED1C24" : "#00A651"} />
          </View>
          <View style={tw`flex-1 pr-2`}>
            <Text style={tw`text-xl font-black ${isMaintenance ? 'text-red-900' : 'text-gray-800'}`}>{item.noPolisi}</Text>
            <Text style={tw`text-sm font-bold text-gray-500`} numberOfLines={1}>{item.brand || 'Truk'} • {item.jenisKendaraan || 'Umum'}</Text>
          </View>
        </View>
        
        <View style={tw`items-end`}>
          <View style={tw`px-3 py-1.5 rounded-lg mb-1 flex-row items-center ${isMaintenance ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <View style={tw`w-1.5 h-1.5 rounded-full mr-1.5 ${isMaintenance ? 'bg-red-500' : 'bg-green-500'}`} />
            <Text style={tw`text-[10px] font-black uppercase tracking-widest ${isMaintenance ? 'text-red-600' : 'text-green-600'}`}>
              {currentStatus}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </TouchableOpacity>
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
        <View style={[tw`flex-row items-center px-5 py-3 mx-5 mt-4 mb-2 rounded-3xl border border-white/60 relative z-20`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.15, shadowRadius: 25, shadowOffset: {width: 0, height: 10} }]}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-gray-100 rounded-full mr-4 shadow-sm z-30`}>
            <Ionicons name="arrow-back" size={24} color="#0055A5" />
          </TouchableOpacity>
          <Text style={tw`text-2xl font-black text-gray-800 tracking-tight z-30`}>Daftar Kendaraan</Text>
        </View>

        <View style={tw`flex-1 relative`}>
          <View style={tw`px-6 pt-2 flex-row items-center justify-between`}>
            <View style={tw`flex-1 flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mr-3`}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput style={tw`flex-1 ml-3 text-gray-800 font-medium`} placeholder="Cari Plat Nomor..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
            </View>
            <TouchableOpacity style={tw`bg-[#0055A5] p-3 rounded-2xl shadow-md shadow-blue-500/30`} onPress={() => setIsFilterVisible(true)}>
              <Feather name="filter" size={22} color="white" />
            </TouchableOpacity>
          </View>

          <View style={tw`px-6 mt-4 mb-2 flex-row justify-between items-center`}>
            <Text style={tw`text-gray-500 font-bold uppercase tracking-widest text-xs`}>{filteredVehicles.length} Kendaraan Terdaftar</Text>
            {loading && <ActivityIndicator size="small" color="#0055A5" />}
          </View>

          <FlatList
            contentContainerStyle={tw`p-6 pb-30 w-full max-w-4xl mx-auto`}
            data={filteredVehicles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              !loading && (
                <View style={tw`items-center mt-20`}>
                  <Ionicons name="car-sport-outline" size={60} color="#CBD5E1" />
                  <Text style={tw`text-center text-gray-400 font-bold mt-4 text-lg`}>Tidak ada kendaraan yang sesuai.</Text>
                </View>
              )
            }
          />
        </View>

        {/* Floating Action Button (Only for Admin) */}
        {user?.role === 'SUPER_ADMIN' && (
          <TouchableOpacity 
            style={tw`absolute bottom-6 right-6 bg-[#0055A5] w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-blue-500/30`}
            onPress={openAddModal}
          >
            <Feather name="plus" size={28} color="white" />
          </TouchableOpacity>
        )}

      </SafeAreaView>

      {/* FILTER MODAL */}
      <Modal visible={isFilterVisible} transparent={true} animationType="slide" onRequestClose={() => setIsFilterVisible(false)}>
        <View style={tw`flex-1 justify-end bg-black/40`}>
          <View style={tw`bg-white rounded-t-[30px] p-6 shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <Text style={tw`text-2xl font-black text-gray-800`}>Filter Kendaraan</Text>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)} style={tw`p-2 bg-gray-100 rounded-full`}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <Text style={tw`text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider`}>Berdasarkan Status Isu</Text>
            <View style={tw`flex-row flex-wrap mb-6`}>
              {['Semua', 'Baik', 'Buruk'].map(status => (
                <TouchableOpacity key={status} style={tw`px-5 py-2.5 rounded-full mr-3 mb-3 border ${selectedStatus === status ? (status === 'Buruk' ? 'bg-[#ED1C24] border-[#ED1C24]' : 'bg-[#0055A5] border-[#0055A5]') : 'bg-transparent border-gray-300'}`} onPress={() => setSelectedStatus(status)}>
                  <Text style={tw`text-sm font-bold ${selectedStatus === status ? 'text-white' : 'text-gray-600'}`}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={tw`bg-[#0055A5] p-4 rounded-2xl items-center shadow-lg shadow-blue-500/40`} onPress={() => setIsFilterVisible(false)}>
              <Text style={tw`text-white font-black text-lg tracking-wide`}>TERAPKAN FILTER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      

          {/* FULL SCREEN BARCODE MODAL */}
          <Modal visible={fullScreenBarcode} transparent={true} animationType="fade" onRequestClose={() => setFullScreenBarcode(false)}>
            <View style={tw`flex-1 bg-black/90 justify-center items-center`}>
              {selectedVehicle && (
                <>
                  <View style={tw`absolute top-10 right-5 z-50`}>
                    <TouchableOpacity onPress={() => setFullScreenBarcode(false)} style={tw`p-3 bg-white/20 rounded-full`}>
                      <Ionicons name="close" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <Text style={tw`text-white text-2xl font-black mb-10`}>{selectedVehicle.noPolisi}</Text>
                  <View style={tw`w-80 h-80 bg-white rounded-3xl p-4`}>
                    <Image 
                      source={{ uri: `http://192.168.1.4:3000/barcodes/${selectedVehicle.barcode}.jpg` }} 
                      style={tw`w-full h-full`} 
                      resizeMode="contain" 
                    />
                  </View>
                  
                  <TouchableOpacity style={tw`bg-[#0055A5] mt-8 px-6 py-4 rounded-full flex-row items-center shadow-lg shadow-blue-500/50`} onPress={handleDownloadBarcode}>
                    <Feather name="download" size={20} color="white" />
                    <Text style={tw`text-white font-bold text-lg ml-3 tracking-wide`}>Simpan Barcode</Text>
                  </TouchableOpacity>
                  
                  <Text style={tw`text-gray-300 text-sm mt-6 text-center px-10`}>Barcode akan diunduh dan Anda bisa menyimpannya ke galeri.</Text>
                </>
              )}
            </View>
          </Modal>

          {/* Modals for Admin Only */}
      {user?.role === 'SUPER_ADMIN' && (
        <>
          {/* MANAGE VEHICLE MODAL */}
          <Modal visible={manageModalVisible} transparent={true} animationType="slide" onRequestClose={() => setManageModalVisible(false)}>
            <View style={tw`flex-1 justify-end bg-black/60`}>
              {selectedVehicle && (
                <View style={tw`bg-white w-full rounded-t-[30px] p-6 shadow-2xl`}>
                  <View style={tw`flex-row justify-between items-center mb-6 border-b border-gray-100 pb-4`}>
                    <View>
                      <Text style={tw`text-xl font-black text-gray-800`}>Detail Kendaraan</Text>
                      <Text style={tw`text-blue-600 font-bold`}>{selectedVehicle.noPolisi}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setManageModalVisible(false)} style={tw`p-2 bg-gray-100 rounded-full`}>
                      <Ionicons name="close" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={tw`flex-row mb-6`}>
                    <View style={tw`flex-1 justify-center`}>
                      <Text style={tw`text-xs text-gray-500 uppercase font-bold mb-1`}>Merek / Tipe</Text>
                      <Text style={tw`text-base font-black text-gray-800 mb-3`}>{selectedVehicle.brand || '-'} {selectedVehicle.jenisKendaraan ? `(${selectedVehicle.jenisKendaraan})` : ''}</Text>
                      
                      <Text style={tw`text-xs text-gray-500 uppercase font-bold mb-1`}>Status Truk</Text>
                      <Text style={tw`text-base font-black ${selectedVehicle.status === 'Buruk' || selectedVehicle.status === 'Maintenance' ? 'text-red-600' : 'text-green-600'} mb-3`}>
                        {selectedVehicle.status === 'Buruk' || selectedVehicle.status === 'Maintenance' ? 'Buruk (Maintenance)' : 'Baik (Active)'}
                      </Text>

                      <Text style={tw`text-xs text-gray-500 uppercase font-bold mb-1`}>Data Barcode</Text>
                      <Text style={tw`text-base font-black text-gray-800`}>{selectedVehicle.barcode}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={tw`w-32 h-32 bg-gray-100 rounded-xl items-center justify-center p-2`}
                      onPress={() => setFullScreenBarcode(true)}
                    >
                      <Image 
                        source={{ uri: `http://192.168.1.4:3000/barcodes/${selectedVehicle.barcode}.jpg` }} 
                        style={tw`w-full h-full`} 
                        resizeMode="contain" 
                      />
                      <Text style={tw`text-[8px] text-gray-400 mt-1 text-center font-bold`}>TAP UNTUK PERBESAR</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={tw`flex-row justify-between`}>
                    <TouchableOpacity 
                      style={tw`bg-green-50 p-4 rounded-xl items-center flex-1 mr-2 border border-green-200`} 
                      onPress={() => { setManageModalVisible(false); navigation.navigate('History', { noPolisi: selectedVehicle.noPolisi }); }}
                    >
                      <Text style={tw`text-green-700 font-bold`}>Lihat Riwayat</Text>
                    </TouchableOpacity>

                    {user?.role === 'SUPER_ADMIN' && (
                      <TouchableOpacity style={tw`bg-blue-50 p-4 rounded-xl items-center flex-1 mx-1 border border-blue-200`} onPress={() => openEditModal(selectedVehicle)}>
                        <Text style={tw`text-blue-600 font-bold`}>Edit</Text>
                      </TouchableOpacity>
                    )}

                    {user?.role === 'SUPER_ADMIN' && (
                      <TouchableOpacity style={tw`bg-red-50 p-4 rounded-xl items-center flex-1 ml-2 border border-red-200`} onPress={() => handleDeleteVehicle(selectedVehicle)}>
                        <Text style={tw`text-red-600 font-bold`}>Hapus</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          </Modal>

          {/* ADD / EDIT VEHICLE MODAL */}
          <Modal visible={addModalVisible} transparent={true} animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={tw`flex-1 justify-end bg-black/60`}>
              <View style={[tw`bg-white rounded-t-[30px] shadow-2xl`, { maxHeight: '90%' }]}>
                <ScrollView contentContainerStyle={tw`p-6 pb-12`} showsVerticalScrollIndicator={false}>
                  <View style={tw`flex-row justify-between items-center mb-6`}>
                    <Text style={tw`text-2xl font-black text-gray-800`}>{isEditMode ? 'Edit Kendaraan' : 'Tambah Kendaraan'}</Text>
                    <TouchableOpacity onPress={() => setAddModalVisible(false)} style={tw`p-2 bg-gray-100 rounded-full`}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
                  </View>
                  
                  <View style={tw`mb-4`}>
                    <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Nomor Polisi</Text>
                    <TextInput style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`} placeholder={vehicles.length > 0 ? `Misal: ${vehicles[0].noPolisi}` : "Misal: B 1234 XYZ"} value={newNoPolisi} onChangeText={setNewNoPolisi} autoCapitalize="characters" />
                  </View>
                  
                  <View style={tw`mb-4`}>
                    <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Merek Kendaraan</Text>
                    <TextInput style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`} placeholder="Misal: Hino 500" value={newBrand} onChangeText={setNewBrand} />
                  </View>
                  
                  <View style={tw`mb-4`}>
                    <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Tipe / Kapasitas</Text>
                    <TextInput style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`} placeholder="Misal: Tangki 16KL" value={newType} onChangeText={setNewType} />
                  </View>

                  <View style={tw`mb-8`}>
                    <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Data Barcode</Text>
                    <TextInput style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`} placeholder="Misal: TRK-006" value={newBarcode} onChangeText={setNewBarcode} />
                    <Text style={tw`text-[10px] text-gray-400 mt-1`}>*Barcode akan otomatis digenerate sebagai gambar QR Code di backend.</Text>
                  </View>

                  <TouchableOpacity style={tw`bg-[#0055A5] p-4 rounded-2xl items-center shadow-lg shadow-blue-500/40 mb-4`} onPress={handleSaveVehicle}>
                    <Text style={tw`text-white font-black text-lg tracking-wide`}>{isEditMode ? 'SIMPAN PERUBAHAN' : 'SIMPAN KENDARAAN'}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </>
      )}

      {/* SUCCESS NOTIFICATION MODAL */}
      <Modal visible={successModalVisible} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-black/40 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[35px] p-8 items-center shadow-2xl border border-green-100 relative overflow-hidden`}>
            <View style={tw`absolute -top-10 -right-10 w-32 h-32 bg-green-50 rounded-full`} />
            <View style={tw`absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full`} />
            <Image source={require('../../assets/logo.png')} style={[tw`absolute opacity-5`, { width: 250, height: 250, top: -50, right: -50 }]} resizeMode="contain" />
            
            <View style={tw`w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-5 shadow-lg shadow-green-500/30 z-10 border-4 border-white`}>
              <Feather name="check-circle" size={40} color="#00A651" />
            </View>
            
            <Text style={tw`text-2xl font-black text-gray-800 mb-2 tracking-tight z-10 text-center`}>Sukses!</Text>
            <Text style={tw`text-center text-gray-500 font-medium mb-6 z-10 px-4`}>{successMessage}</Text>
            
            <View style={tw`flex-row items-center justify-center mt-2 z-10`}>
              <View style={tw`flex-row items-center mr-2`}>
                <View style={tw`w-1 h-4 rounded-full bg-[#ED1C24] mr-0.5`} />
                <View style={tw`w-1 h-4 rounded-full bg-[#2ECC71] mr-0.5`} />
                <View style={tw`w-1 h-4 rounded-full bg-[#0055A5]`} />
              </View>
              <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-widest`}>DigiHandover</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* WARNING NOTIFICATION MODAL */}
      <Modal visible={warningModalVisible} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-black/40 px-6 z-50`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[35px] p-8 items-center shadow-2xl border border-red-100 relative overflow-hidden`}>
            {/* Background Accent */}
            <View style={tw`absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full`} />
            <View style={tw`absolute -bottom-10 -left-10 w-32 h-32 bg-orange-50 rounded-full`} />
            
            <Image source={require('../../assets/logo.png')} style={[tw`absolute opacity-5`, { width: 250, height: 250, bottom: -50, left: -50 }]} resizeMode="contain" />
            
            <View style={tw`w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-5 shadow-lg shadow-red-500/30 z-10 border-4 border-white`}>
              <Feather name="alert-triangle" size={40} color="#ED1C24" />
            </View>
            
            <Text style={tw`text-2xl font-black text-gray-800 mb-2 tracking-tight z-10 text-center`}>{warningTitle}</Text>
            <Text style={tw`text-center text-gray-500 font-medium mb-8 z-10 px-4`}>
              {warningMessage}
            </Text>
            
            <TouchableOpacity 
              style={tw`bg-[#ED1C24] px-8 py-4 rounded-2xl shadow-lg shadow-red-500/30 z-10 w-full items-center`}
              onPress={() => setWarningModalVisible(false)}
            >
              <Text style={tw`text-white text-sm font-black tracking-widest uppercase`}>OK, MENGERTI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
