import React, { useState, useEffect } from 'react';
import TextLogo from '../../components/TextLogo';
import { View, Text, FlatList, TouchableOpacity, TextInput, Platform, Modal, Animated, Image, Easing, Alert, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://192.168.151.137:3000/api';
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
  const [newStatus, setNewStatus] = useState('Baik');
  
  const orb1TranslateY = React.useRef(new Animated.Value(0)).current;
  const orb2TranslateY = React.useRef(new Animated.Value(0)).current;
  const orb3TranslateY = React.useRef(new Animated.Value(0)).current;

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/vehicles`);
      setVehicles(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data kendaraan');
    } finally {
      setLoading(false);
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
    if (selectedStatus !== 'Semua') matchesStatus = item.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const openManageModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setManageModalVisible(true);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setNewNoPolisi(''); setNewBrand(''); setNewType(''); setNewBarcode(''); setNewStatus('Baik');
    setAddModalVisible(true);
  };

  const openEditModal = (vehicle) => {
    setIsEditMode(true);
    setSelectedVehicle(vehicle);
    setNewNoPolisi(vehicle.noPolisi);
    setNewBrand(vehicle.brand || '');
    setNewType(vehicle.jenisKendaraan || '');
    setNewBarcode(vehicle.barcode || '');
    setNewStatus(vehicle.status === 'Buruk' || vehicle.status === 'Maintenance' ? 'Buruk' : 'Baik');
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
              Alert.alert('Sukses', 'Kendaraan berhasil dihapus');
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

    // Validasi format barcode agar aman dijadikan nama file (hanya huruf, angka, dan strip)
    const isBarcodeValid = /^[a-zA-Z0-9-]+$/.test(newBarcode);
    if (!isBarcodeValid) {
      Alert.alert("Format Tidak Valid", "Barcode hanya boleh berisi huruf, angka, dan tanda strip (-), tanpa spasi atau simbol lain.");
      return;
    }

    try {
      if (isEditMode && selectedVehicle) {
        await axios.put(`${API_URL}/vehicles/${selectedVehicle.id}`, {
          noPolisi: newNoPolisi,
          brand: newBrand,
          jenisKendaraan: newType,
          barcode: newBarcode, status: newStatus
        });
        Alert.alert('Sukses', 'Kendaraan berhasil diperbarui');
      } else {
        await axios.post(`${API_URL}/vehicles`, {
          noPolisi: newNoPolisi,
          brand: newBrand,
          jenisKendaraan: newType,
          barcode: newBarcode, status: newStatus
        });
        Alert.alert('Sukses', 'Kendaraan berhasil ditambahkan');
      }
      
      setAddModalVisible(false);
      fetchVehicles();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan kendaraan');
    }
  };

  const renderItem = ({ item }) => {
    const isNormal = item.status === 'Baik' || item.status === 'Active';
    const isMaintenance = item.status === 'Buruk' || item.status === 'Maintenance';

    return (
      <TouchableOpacity 
        style={tw`bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100 flex-row justify-between items-center`}
        onPress={() => openManageModal(item)}
        activeOpacity={0.7}
      >
        <View style={tw`flex-row items-center flex-1`}>
          <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-3 ${isMaintenance ? 'bg-red-200' : (isNormal ? 'bg-green-100' : 'bg-red-100')}`}>
            <Ionicons name={isMaintenance ? "build" : (isNormal ? "car" : "warning")} size={28} color={isMaintenance ? "#991B1B" : (isNormal ? "#00A651" : "#ED1C24")} />
          </View>
          <View>
            <Text style={tw`text-xl font-black ${isMaintenance ? 'text-red-900' : 'text-gray-800'}`}>{item.noPolisi}</Text>
            <Text style={tw`text-sm font-bold text-gray-500`}>{item.brand || 'Truk'} • {item.jenisKendaraan || 'Umum'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
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
              {['Semua', 'Active', 'Maintenance'].map(status => (
                <TouchableOpacity key={status} style={tw`px-5 py-2.5 rounded-full mr-3 mb-3 border ${selectedStatus === status ? 'bg-[#0055A5] border-[#0055A5]' : 'bg-transparent border-gray-300'}`} onPress={() => setSelectedStatus(status)}>
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
                      source={{ uri: `http://192.168.151.137:3000/barcodes/${selectedVehicle.barcode}.jpg` }} 
                      style={tw`w-full h-full`} 
                      resizeMode="contain" 
                    />
                  </View>
                  <Text style={tw`text-gray-300 text-sm mt-6 text-center px-10`}>Silakan screenshot layar ini untuk menyimpan atau mencetak barcode.</Text>
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
                        source={{ uri: `http://192.168.151.137:3000/barcodes/${selectedVehicle.barcode}.jpg` }} 
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
            <View style={tw`flex-1 justify-end bg-black/60`}>
              <View style={tw`bg-white rounded-t-[30px] p-6 shadow-2xl`}>
                <View style={tw`flex-row justify-between items-center mb-6`}>
                  <Text style={tw`text-2xl font-black text-gray-800`}>{isEditMode ? 'Edit Kendaraan' : 'Tambah Kendaraan'}</Text>
                  <TouchableOpacity onPress={() => setAddModalVisible(false)} style={tw`p-2 bg-gray-100 rounded-full`}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
                </View>
                
                <View style={tw`mb-4`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>No Polisi</Text>
                  <TextInput style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`} placeholder="Misal: B 1234 XYZ" value={newNoPolisi} onChangeText={setNewNoPolisi} autoCapitalize="characters" />
                </View>
                
                <View style={tw`mb-4`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Merek Kendaraan</Text>
                  <TextInput style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`} placeholder="Misal: Hino 500" value={newBrand} onChangeText={setNewBrand} />
                </View>
                
                <View style={tw`mb-4`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Tipe / Kapasitas</Text>
                  <TextInput style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`} placeholder="Misal: Tangki 16KL" value={newType} onChangeText={setNewType} />
                </View>

                                <View style={tw`mb-4`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Status Truk</Text>
                  <View style={tw`flex-row`}>
                    <TouchableOpacity 
                      style={tw`flex-1 py-3 items-center rounded-l-xl border ${newStatus === 'Baik' ? 'bg-[#00A651] border-[#00A651]' : 'bg-white border-gray-200'}`} 
                      onPress={() => setNewStatus('Baik')}>
                      <Text style={tw`font-bold ${newStatus === 'Baik' ? 'text-white' : 'text-gray-500'}`}>Baik</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={tw`flex-1 py-3 items-center rounded-r-xl border border-l-0 ${newStatus === 'Buruk' ? 'bg-[#ED1C24] border-[#ED1C24]' : 'bg-white border-gray-200'}`} 
                      onPress={() => setNewStatus('Buruk')}>
                      <Text style={tw`font-bold ${newStatus === 'Buruk' ? 'text-white' : 'text-gray-500'}`}>Buruk</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={tw`mb-8`}>
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Data Barcode</Text>
                  <TextInput style={tw`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold`} placeholder="Misal: TRK-006" value={newBarcode} onChangeText={setNewBarcode} />
                  <Text style={tw`text-[10px] text-gray-400 mt-1`}>*Barcode akan otomatis digenerate sebagai gambar QR Code di backend.</Text>
                </View>

                <TouchableOpacity style={tw`bg-[#0055A5] p-4 rounded-2xl items-center shadow-lg shadow-blue-500/40`} onPress={handleSaveVehicle}>
                  <Text style={tw`text-white font-black text-lg tracking-wide`}>{isEditMode ? 'SIMPAN PERUBAHAN' : 'SIMPAN KENDARAAN'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}

    </View>
  );
}
