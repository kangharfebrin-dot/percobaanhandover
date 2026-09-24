import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, ActivityIndicator, Image, Modal } from 'react-native';
import { API_URL } from '../../config';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FixVerificationScreen({ route, navigation }) {
  const { noPolisi } = route.params;
  const [issue, setIssue] = useState(null);
  const [brokenItems, setBrokenItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Camera & Location State
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [activeItemId, setActiveItemId] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    fetchIssue();
    getLocation();
  }, []);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Lokasi Ditolak', 'Harap berikan izin GPS untuk mengambil foto bukti perbaikan.');
      return;
    }
    try {
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 5000
      });
      setLocation(loc.coords);
    } catch (e) {
      console.log('Location error:', e);
      Alert.alert('Error', 'Gagal mendapatkan lokasi. Pastikan GPS aktif.');
    }
  };

  const fetchIssue = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/issues/ongoing`);
      const ongoingIssues = res.data || [];
      const activeIssue = ongoingIssues.find(iss => iss.handover && iss.handover.noPolisi === noPolisi);
      
      if (activeIssue) {
        setIssue(activeIssue);
        // Only get items that are not good and not yet repaired
        const items = activeIssue.handover.items.filter(i => !i.isGood && !i.isRepaired).map(i => ({
          ...i,
          repairStatus: 'RUSAK', // initial status
          repairNote: '',
          photo: null
        }));
        setBrokenItems(items);
      } else {
        Alert.alert('Info', 'Tidak ada isu aktif untuk kendaraan ini.');
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data isu.');
    } finally {
      setLoading(false);
    }
  };

  const setItemStatus = (index, statusValue) => {
    const newItems = [...brokenItems];
    newItems[index].repairStatus = statusValue;
    setBrokenItems(newItems);
  };

  const updateItemNote = (index, text) => {
    const newItems = [...brokenItems];
    newItems[index].repairNote = text;
    setBrokenItems(newItems);
  };

  const openCamera = (itemId) => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    if (!location) {
      Alert.alert('Tunggu', 'Sedang mencari lokasi. Pastikan GPS aktif.');
      getLocation();
      return;
    }
    setActiveItemId(itemId);
    setIsCameraOpen(true);
  };

  const takePicture = async () => {
    if (cameraRef.current && activeItemId) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      const index = brokenItems.findIndex(i => i.id === activeItemId);
      if (index !== -1) {
        const newItems = [...brokenItems];
        newItems[index].photo = photo;
        setBrokenItems(newItems);
      }
      setIsCameraOpen(false);
      setActiveItemId(null);
    }
  };

  const submitVerification = async () => {
    // Validate
    const itemsToRepair = brokenItems.filter(i => i.repairStatus === 'BAIK');
    if (itemsToRepair.length === 0) {
      Alert.alert('Peringatan', 'Tidak ada item yang diverifikasi sebagai BAIK.');
      return;
    }

    // Check if notes and photos are provided for BAIK items
    for (const item of itemsToRepair) {
      if (!item.repairNote.trim()) {
        Alert.alert('Peringatan', `Catatan perbaikan untuk ${item.name} wajib diisi.`);
        return;
      }
      if (!item.photo) {
        Alert.alert('Peringatan', `Bukti foto untuk perbaikan ${item.name} wajib dilampirkan.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      const itemsData = itemsToRepair.map(i => ({
        id: i.id,
        repairNote: i.repairNote
      }));
      formData.append('itemsData', JSON.stringify(itemsData));

      // Append photos
      itemsToRepair.forEach(item => {
        if (item.photo) {
          const filename = item.photo.uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          formData.append(`photo_${item.id}`, { uri: item.photo.uri, name: filename, type });
        }
      });

      const res = await axios.post(`${API_URL}/api/issues/${issue.id}/verify-repair`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal mengirim verifikasi perbaikan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#0055A5" />
        <Text style={tw`mt-4 text-gray-500 font-medium`}>Memuat Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <LinearGradient colors={['#0055A5', '#003366']} style={tw`px-6 py-4 rounded-b-3xl shadow-lg z-10`}>
        <View style={tw`flex-row items-center justify-between mt-2`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`bg-white/20 p-2 rounded-full`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-xl font-bold`}>Verifikasi Perbaikan</Text>
          <View style={tw`w-10`} />
        </View>
        <Text style={tw`text-white/80 text-center mt-2 font-medium`}>Truk: {noPolisi}</Text>
      </LinearGradient>

      <ScrollView style={tw`flex-1 px-4 py-6`} showsVerticalScrollIndicator={false}>
        {brokenItems.length === 0 ? (
          <View style={tw`items-center mt-20`}>
            <View style={tw`w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-4`}>
              <Ionicons name="time-outline" size={60} color="#0055A5" />
            </View>
            <Text style={tw`text-xl font-bold text-gray-800 mb-2`}>Sedang Ditinjau</Text>
            <Text style={tw`text-gray-500 text-center font-medium px-4 leading-6`}>
              Bukti perbaikan Anda telah dikirim dan saat ini sedang ditinjau oleh Admin.
            </Text>
          </View>
        ) : (
          brokenItems.map((item, index) => (
            <View key={item.id} style={tw`bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100`}>
              <View style={tw`flex-row justify-between items-start mb-3`}>
                <View style={tw`flex-1 mr-4`}>
                  <Text style={tw`font-bold text-gray-800 text-base mb-1`}>{item.name}</Text>
                  <Text style={tw`text-xs text-red-500 font-bold bg-red-50 self-start px-2 py-1 rounded`}>STATUS SEBELUMNYA: RUSAK</Text>
                  {item.adminRejectionNote ? (
                    <View style={tw`bg-red-100 p-3 rounded-lg mt-3 border border-red-200`}>
                      <Text style={tw`text-xs font-bold text-red-800 mb-1`}>DITOLAK ADMIN:</Text>
                      <Text style={tw`text-sm text-red-700`}>{item.adminRejectionNote}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={tw`flex-row bg-gray-100 p-1 rounded-xl mb-4`}>
                <TouchableOpacity
                  style={tw`flex-1 py-2 rounded-lg items-center ${item.repairStatus === 'BAIK' ? 'bg-green-500 shadow' : 'bg-transparent'}`}
                  onPress={() => setItemStatus(index, 'BAIK')}
                >
                  <Text style={tw`font-bold text-xs ${item.repairStatus === 'BAIK' ? 'text-white' : 'text-gray-500'}`}>SUDAH DIPERBAIKI</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-1 py-2 rounded-lg items-center ${item.repairStatus === 'RUSAK' ? 'bg-red-500 shadow' : 'bg-transparent'}`}
                  onPress={() => setItemStatus(index, 'RUSAK')}
                >
                  <Text style={tw`font-bold text-xs ${item.repairStatus === 'RUSAK' ? 'text-white' : 'text-gray-500'}`}>BELUM DIPERBAIKI</Text>
                </TouchableOpacity>
              </View>

              {item.repairStatus === 'BAIK' && (
                <View style={tw`mt-2 border-t border-gray-100 pt-3`}>
                  <Text style={tw`text-gray-700 font-semibold mb-2 text-sm`}>Catatan Perbaikan <Text style={tw`text-red-500`}>*</Text></Text>
                  <TextInput
                    style={tw`bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-sm text-gray-700 min-h-[80px]`}
                    placeholder="Contoh: Ban sudah diganti dengan yang baru..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={item.repairNote}
                    onChangeText={(text) => updateItemNote(index, text)}
                  />

                  <Text style={tw`text-gray-700 font-semibold mb-2 text-sm`}>Bukti Foto <Text style={tw`text-red-500`}>*</Text></Text>
                  {item.photo ? (
                    <View style={tw`relative mb-2`}>
                      <Image source={{ uri: item.photo.uri }} style={tw`w-full h-40 rounded-xl`} />
                      <TouchableOpacity 
                        style={tw`absolute top-2 right-2 bg-red-500 p-2 rounded-full`}
                        onPress={() => {
                          const newItems = [...brokenItems];
                          newItems[index].photo = null;
                          setBrokenItems(newItems);
                        }}
                      >
                        <Ionicons name="trash" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={tw`bg-blue-50 border border-blue-200 border-dashed rounded-xl p-6 items-center justify-center mb-2`}
                      onPress={() => openCamera(item.id)}
                    >
                      <Ionicons name="camera" size={32} color="#0055A5" />
                      <Text style={tw`text-blue-700 font-semibold mt-2`}>Ambil Foto Bukti</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
        )}

        {brokenItems.length > 0 && (
          <TouchableOpacity
            style={tw`w-full mb-10 mt-4 opacity-${submitting ? '50' : '100'}`}
            onPress={submitVerification}
            disabled={submitting}
          >
            <LinearGradient colors={['#00A651', '#007A3D']} style={tw`p-4 rounded-xl items-center`}>
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white font-bold text-lg`}>Kirim Verifikasi</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* CAMERA MODAL */}
      <Modal 
        visible={isCameraOpen} 
        animationType="slide" 
        transparent={false}
        onShow={() => setIsCameraReady(true)}
      >
        <View style={tw`flex-1 bg-black relative`}>
          {isCameraOpen && (
            <>
              {isCameraReady ? (
                <CameraView style={tw`absolute inset-0`} facing="back" ref={cameraRef} />
              ) : (
                <View style={tw`flex-1 items-center justify-center`}>
                  <ActivityIndicator color="white" size="large" />
                  <Text style={tw`text-white mt-4 font-bold`}>Menyiapkan Kamera...</Text>
                </View>
              )}
              
              <View style={tw`absolute top-12 left-0 right-0 items-center px-4`} pointerEvents="none">
                <Text style={tw`bg-black/70 text-white p-3 rounded-full font-bold text-lg text-center`}>
                  Ambil Foto Bukti Perbaikan
                </Text>
                {location && (
                  <Text style={tw`text-white bg-black/50 text-xs px-2 py-1 mt-2 rounded`}>
                    GPS Aktif: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={tw`absolute top-12 left-4 bg-black/50 p-2 rounded-full`}
                onPress={() => { setIsCameraOpen(false); setIsCameraReady(false); setActiveItemId(null); }}
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>

              <View style={tw`absolute bottom-12 w-full flex-row justify-center`}>
                <TouchableOpacity 
                  style={tw`w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg`} 
                  onPress={takePicture}
                />
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* MODAL SUKSES (BERHASIL KIRIM) */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-slate-900/80 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[40px] p-8 items-center shadow-2xl border border-white/20`}>
            <View style={tw`w-28 h-28 bg-green-50 rounded-full items-center justify-center mb-6 border-8 border-green-100`}>
              <Ionicons name="checkmark-done" size={60} color="#2ECC71" />
            </View>
            <Text style={tw`text-2xl font-black text-gray-800 mb-3 text-center tracking-tight`}>Verifikasi Terkirim!</Text>
            <Text style={tw`text-gray-500 text-center mb-8 font-medium leading-6`}>
              Bukti perbaikan telah berhasil dikirim dan sedang menunggu persetujuan admin.
            </Text>
            <TouchableOpacity 
              style={tw`w-full bg-[#0055A5] p-4 rounded-2xl items-center shadow-lg`}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.popToTop();
              }}
            >
              <Text style={tw`text-white font-bold text-[15px]`}>Kembali ke Menu Utama</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
