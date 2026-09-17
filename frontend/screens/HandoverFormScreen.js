import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, StyleSheet, Image, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECKLIST_A = [
  "Kondisi Rem", "Kondisi Wiper",
  "Kondisi Kompartemen Tangki", "Keberadaan DCP/ CO2", "Oli Mesin", "Air Radiator",
  "Keberadaan STNK", "Keberadaan Surat Keur", "Keberadaan Surat Tera",
  "Keberadaan Kotak P3K", "Keberadaan Flame Trap",
  "Keberadaan Tools Kit termasuk dongkrak", "Keberadaan Selang bongkar",
  "Keberadaan Grounding Cable", "Keberadaan Spill Kit"
];

const CHECKLIST_B = [
  "Membawa SIM Sesuai Kendaraan", "ID/ HSE Paspor Berlaku", "Dokumen KIM",
  "Menggunakan Seragam Kerja", "Menggunakan Safety Shoes", "Menggunakan Safety Helm",
  "Menggunakan Safety Glove", "Membawa Jas Hujan",
  "Membawa Buku Saku AMT"
];

const REQUIRED_PHOTOS = ['Depan', 'Belakang', 'Kanan', 'Kiri'];
const PERTAMINA_BLUE = ['#4A90E2', '#0055A5']; // Softer aesthetic blue gradient
const PERTAMINA_RED = ['#FF4B4B', '#ED1C24'];
const PERTAMINA_GREEN = ['#2ECC71', '#00A651'];

export default function HandoverFormScreen({ route, navigation }) {
  const { noPolisi: initialNoPolisi } = route.params;
  const [noPolisi, setNoPolisi] = useState(initialNoPolisi || '');
  const [shift, setShift] = useState('08:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [odoMeter, setOdoMeter] = useState('');

  // Checklist State (Mulai dari null/kosong)
  const [items, setItems] = useState([
    ...CHECKLIST_A.map(name => ({ category: 'A', name, status: null, severity: null, catatan: '' })),
    ...CHECKLIST_B.map(name => ({ category: 'B', name, status: null, severity: null, catatan: '' }))
  ]);

  // Camera & Photo State
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState({ Depan: null, Belakang: null, Kanan: null, Kiri: null });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activePhotoType, setActivePhotoType] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  // UPDATE ITEMS LOGIC
  const setItemStatus = (index, statusValue) => {
    const newItems = [...items];
    newItems[index].status = statusValue;
    if (statusValue === 'BAIK') {
      newItems[index].severity = null;
      newItems[index].catatan = '';
    } else {
      newItems[index].severity = 'Minor'; // Default saat diset rusak
    }
    setItems(newItems);
  };

  const updateItemSeverity = (index, severity) => {
    const newItems = [...items];
    newItems[index].severity = severity;
    setItems(newItems);
  };

  const updateItemCatatan = (index, text) => {
    const newItems = [...items];
    newItems[index].catatan = text;
    setItems(newItems);
  };

  // CAMERA LOGIC
  const openCameraFor = (type) => {
    if (!permission) return;
    if (!permission.granted) {
      Alert.alert('Izin Diperlukan', 'Kami butuh izin kamera untuk mengambil foto.', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Berikan Izin', onPress: requestPermission }
      ]);
      return;
    }
    setActivePhotoType(type);
    setPreviewPhoto(null);
    setIsCameraOpen(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync();
      setPreviewPhoto(photo);
      setLoading(false);
    }
  };

  const savePhoto = () => {
    setPhotos({ ...photos, [activePhotoType]: previewPhoto });
    setIsCameraOpen(false);
    setPreviewPhoto(null);
    setActivePhotoType(null);
  };

  // SUBMIT LOGIC
  const handleSubmit = async () => {
    // 1. Validasi Info Dasar
    if (!noPolisi || !odoMeter || !shift) {
      Alert.alert("Perhatian", "Informasi perjalanan (Plat, Shift, Odo Meter) tidak boleh kosong.");
      return;
    }

    // 2. Validasi Wajib Isi Semua Checklist
    const emptyItem = items.find(item => item.status === null);
    if (emptyItem) {
      Alert.alert("Form Belum Lengkap", `Anda belum mengecek item:\n"${emptyItem.name}"\n\nHarap pilih [BAIK] atau [RUSAK]!`);
      return;
    }

    // 3. Deteksi Blokir Major (Tidak memblokir pengiriman, diteruskan ke admin)
    const hasMajor = items.some(item => item.status === 'RUSAK' && item.severity === 'Major');
    if (hasMajor) {
      Alert.alert(
        "KENDARAAN DIBLOKIR",
        "Terdapat temuan MAJOR. Kendaraan diblokir dan laporan akan langsung diteruskan ke Admin!"
      );
      // Jangan return, biarkan lanjut agar terkirim
    }

    // 4. Validasi Catatan Minor
    const missingMinorNotes = items.find(item => item.status === 'RUSAK' && item.severity === 'Minor' && !item.catatan.trim());
    if (missingMinorNotes) {
      Alert.alert("Perhatian", `Anda memiliki temuan Minor pada "${missingMinorNotes.name}". Wajib mengisi kolom Catatan!`);
      return;
    }

    // 5. Validasi Foto Lengkap
    const missingPhotos = REQUIRED_PHOTOS.filter(p => !photos[p]);
    if (missingPhotos.length > 0) {
      Alert.alert("Foto Belum Lengkap", `Harap ambil foto untuk sisi: ${missingPhotos.join(', ')}`);
      return;
    }

    // SEMUA VALIDASI LULUS -> KIRIM DATA
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1 }; // Fallback for dev

      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('noPolisi', noPolisi);
      formData.append('shift', shift);

      const finalItems = items.map(i => ({ 
        ...i, 
        isGood: i.status === 'BAIK',
        name: i.name + (i.severity ? ` [${i.severity.toUpperCase()}]` : '') + (i.catatan ? ` - ${i.catatan}` : '')
      }));
      finalItems.push({ category: 'C', name: `Odo Meter: ${odoMeter}`, isGood: true });
      formData.append('items', JSON.stringify(finalItems));

      if (location) {
        formData.append('locationLat', location.latitude);
        formData.append('locationLng', location.longitude);
      }

      REQUIRED_PHOTOS.forEach(step => {
        const p = photos[step];
        if (p) {
          const filename = p.uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          formData.append('photos', { uri: p.uri, name: filename || `photo_${step}.jpg`, type });
        }
      });

      await axios.post('http://localhost:3000/api/handovers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLoading(false);
      
      // Tampilkan Modal Sukses Cantik
      setShowSuccessModal(true);
      
      // Otomatis kembali ke dashboard setelah 2 detik
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.navigate('Dashboard');
      }, 2500);

    } catch (error) {
      setLoading(false);
      console.error(error);
      Alert.alert('Error', 'Gagal mengirim laporan. Pastikan Backend sudah menyala dan internet stabil.');
    }
  };

  // RENDER ITEM CHECKLIST
  const renderChecklistItem = (item) => {
    const originalIdx = items.findIndex(x => x.name === item.name);
    const isBaik = item.status === 'BAIK';
    const isRusak = item.status === 'RUSAK';
    
    return (
      <View key={originalIdx} style={tw`border-b border-gray-100 p-5 ${isRusak ? 'bg-red-50/50' : isBaik ? 'bg-green-50/30' : 'bg-white'}`}>
        <View style={tw`flex-col`}>
          <Text style={tw`text-gray-800 font-bold text-base mb-4 ${isRusak ? 'text-red-700' : ''}`}>{item.name}</Text>
          <View style={tw`flex-row justify-between gap-3`}>
            {/* Tombol BAIK */}
            <TouchableOpacity
              style={tw`flex-1 rounded-xl overflow-hidden shadow-sm`}
              onPress={() => setItemStatus(originalIdx, 'BAIK')}
            >
              <LinearGradient 
                colors={isBaik ? PERTAMINA_GREEN : ['#F3F4F6', '#E5E7EB']} 
                style={tw`py-3 px-2 items-center justify-center border ${isBaik ? 'border-transparent' : 'border-gray-200'} rounded-xl h-full`}
              >
                <Text style={tw`font-bold ${isBaik ? 'text-white' : 'text-gray-500'}`}>
                  {item.category === 'A' ? 'BAIK' : 'ADA'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Tombol RUSAK */}
            <TouchableOpacity
              style={tw`flex-1 rounded-xl overflow-hidden shadow-sm`}
              onPress={() => setItemStatus(originalIdx, 'RUSAK')}
            >
              <LinearGradient 
                colors={isRusak ? PERTAMINA_RED : ['#F3F4F6', '#E5E7EB']} 
                style={tw`py-3 px-2 items-center justify-center border ${isRusak ? 'border-transparent' : 'border-gray-200'} rounded-xl h-full`}
              >
                <Text style={tw`font-bold ${isRusak ? 'text-white' : 'text-gray-500'}`}>
                  {item.category === 'A' ? 'RUSAK' : 'TIDAK ADA'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Tambahan Jika RUSAK */}
        {isRusak && (
          <View style={tw`mt-4 pt-4 border-t border-red-200`}>
            <Text style={tw`text-xs font-bold text-red-800 mb-3 uppercase tracking-wider`}>Tingkat Kerusakan:</Text>
            <View style={tw`flex-row mb-4 gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 rounded-xl overflow-hidden`}
                onPress={() => updateItemSeverity(originalIdx, 'Minor')}
              >
                <LinearGradient 
                  colors={item.severity === 'Minor' ? ['#FBBF24', '#F59E0B'] : ['#FEF3C7', '#FDE68A']}
                  style={tw`py-3 px-2 items-center rounded-xl border ${item.severity === 'Minor' ? 'border-amber-500' : 'border-amber-200'}`}
                >
                  <Text style={tw`text-xs font-black ${item.severity === 'Minor' ? 'text-white' : 'text-amber-700'}`}>MINOR</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={tw`flex-1 rounded-xl overflow-hidden`}
                onPress={() => updateItemSeverity(originalIdx, 'Major')}
              >
                <LinearGradient 
                  colors={item.severity === 'Major' ? ['#EF4444', '#DC2626'] : ['#FEE2E2', '#FECACA']}
                  style={tw`py-3 px-2 items-center rounded-xl border ${item.severity === 'Major' ? 'border-red-500' : 'border-red-200'}`}
                >
                  <Text style={tw`text-xs font-black ${item.severity === 'Major' ? 'text-white' : 'text-red-700'}`}>MAJOR (BLOKIR)</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {item.severity === 'Minor' && (
              <View style={tw`bg-white rounded-xl shadow-sm border border-red-100 p-1`}>
                <TextInput
                  style={tw`p-3 text-sm text-gray-800 font-medium`}
                  placeholder="Ketik detail kerusakan..."
                  placeholderTextColor="#9CA3AF"
                  value={item.catatan}
                  onChangeText={(text) => updateItemCatatan(originalIdx, text)}
                  multiline
                />
              </View>
            )}

            {item.severity === 'Major' && (
              <View style={tw`bg-red-100 p-4 rounded-xl border border-red-300 items-center flex-row`}>
                <Ionicons name="warning" size={24} color="#DC2626" style={tw`mr-3`} />
                <Text style={tw`text-red-800 flex-1 text-xs font-bold leading-5`}>
                  Status Major menyebabkan kendaraan <Text style={tw`font-black text-red-600 uppercase`}>diblokir</Text>. Laporan ditandai bahaya!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <View style={tw`z-10 rounded-b-[40px] shadow-xl bg-white overflow-hidden`}>
        <LinearGradient colors={PERTAMINA_BLUE} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={tw`pt-8 pb-10 px-6 rounded-b-[40px]`}>
          <View style={tw`w-full max-w-4xl mx-auto flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={tw`p-3 bg-white/20 rounded-2xl mr-4 border border-white/30`}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <View>
                <Text style={tw`text-3xl font-extrabold text-white tracking-tight`}>Form Handover</Text>
                <Text style={tw`text-blue-100 font-medium text-sm mt-1 flex-row items-center`}>
                  <Ionicons name="location" size={14} color="#93C5FD" /> Area TBBM Pertamina
                </Text>
              </View>
            </View>
            <View style={tw`bg-white/20 p-3 rounded-2xl border border-white/30`}>
              <Ionicons name="document-text" size={28} color="white" />
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`w-full max-w-4xl mx-auto px-4 pt-8 pb-10`} showsVerticalScrollIndicator={false}>
        {/* Info Perjalanan */}
        <View style={tw`bg-white p-6 rounded-3xl mb-8 shadow-md border border-gray-100`}>
          <View style={tw`flex-row items-center mb-6`}>
            <View style={tw`bg-blue-50 p-2 rounded-xl mr-3`}>
              <Ionicons name="car-sport" size={24} color="#0055A5" />
            </View>
            <Text style={tw`text-gray-800 font-extrabold text-xl tracking-tight`}>Info Perjalanan</Text>
          </View>

          <Text style={tw`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2`}>No Polisi Kendaraan</Text>
          <TextInput
            style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black mb-5 font-bold text-base shadow-sm`}
            value={noPolisi}
            onChangeText={setNoPolisi}
            placeholder="Ketik Plat Nomor (Misal: B 1234 XYZ)"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
          />

          <Text style={tw`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2`}>Waktu Jam / Shift</Text>
          <TouchableOpacity 
            style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-5 flex-row justify-between items-center shadow-sm`}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={tw`text-black font-extrabold text-lg`}>{shift}</Text>
            <View style={tw`bg-blue-100 p-2 rounded-xl`}>
              <Ionicons name="time" size={20} color="#0055A5" />
            </View>
          </TouchableOpacity>

          <Text style={tw`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2`}>Odo Meter (KM)</Text>
          <TextInput
            style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm`}
            placeholder="Misal: 150000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={odoMeter}
            onChangeText={setOdoMeter}
          />
        </View>

        {/* Kategori A */}
        <View style={tw`bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mb-8`}>
          <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={tw`p-5 flex-row items-center border-b border-gray-200`}>
            <View style={tw`bg-green-100 p-2 rounded-xl mr-3 shadow-sm`}>
              <Ionicons name="construct" size={24} color="#00A651" />
            </View>
            <Text style={tw`font-extrabold text-lg text-gray-800`}>A. Perlengkapan Tangki</Text>
          </LinearGradient>
          {items.filter(i => i.category === 'A').map(renderChecklistItem)}
        </View>

        {/* Kategori B */}
        <View style={tw`bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mb-8`}>
          <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={tw`p-5 flex-row items-center border-b border-gray-200`}>
            <View style={tw`bg-blue-100 p-2 rounded-xl mr-3 shadow-sm`}>
              <Ionicons name="person-circle" size={24} color="#0055A5" />
            </View>
            <Text style={tw`font-extrabold text-lg text-gray-800`}>B. Perlengkapan AMT</Text>
          </LinearGradient>
          {items.filter(i => i.category === 'B').map(renderChecklistItem)}
        </View>

        {/* Area Foto 4 Sisi */}
        <View style={tw`bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mb-8 p-5`}>
          <View style={tw`flex-row items-center mb-5`}>
            <View style={tw`bg-red-50 p-2 rounded-xl mr-3 shadow-sm`}>
              <Ionicons name="camera" size={24} color="#ED1C24" />
            </View>
            <Text style={tw`font-extrabold text-lg text-gray-800`}>C. Foto Kendaraan Wajib</Text>
          </View>

          <View style={tw`flex-row flex-wrap justify-between gap-y-4`}>
            {REQUIRED_PHOTOS.map(side => (
              <TouchableOpacity
                key={side}
                style={tw`w-[48%] aspect-square bg-slate-50 rounded-2xl border-2 ${photos[side] ? 'border-green-500 shadow-md' : 'border-dashed border-slate-300'} justify-center items-center overflow-hidden`}
                onPress={() => openCameraFor(side)}
              >
                {photos[side] ? (
                  <View style={tw`w-full h-full relative`}>
                    <Image source={{ uri: photos[side].uri }} style={tw`w-full h-full`} resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={tw`absolute inset-0 justify-end items-center pb-4`}>
                      <Ionicons name="checkmark-circle" size={32} color="#2ECC71" style={tw`mb-1 shadow-lg`} />
                      <Text style={tw`text-white font-extrabold text-xs tracking-wider shadow-lg`}>{side.toUpperCase()}</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <>
                    <View style={tw`bg-white p-3 rounded-full shadow-sm mb-3`}>
                      <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
                    </View>
                    <Text style={tw`text-gray-600 font-extrabold tracking-wider`}>{side}</Text>
                    <Text style={tw`text-gray-400 text-xs font-medium mt-1`}>Ketuk untuk foto</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={tw`h-6`} />
      </ScrollView>

      {/* Tombol Submit Utama */}
      <View style={tw`p-5 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-10`}>
        <View style={tw`w-full max-w-4xl mx-auto`}>
          <TouchableOpacity
            style={tw`rounded-2xl overflow-hidden shadow-xl ${loading ? 'opacity-70' : ''}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient colors={PERTAMINA_BLUE} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={tw`p-5 items-center flex-row justify-center`}>
              {loading ? (
                <ActivityIndicator color="white" style={tw`mr-3`} />
              ) : (
                <Ionicons name="paper-plane" size={24} color="white" style={tw`mr-3`} />
              )}
              <Text style={tw`text-white font-extrabold text-xl tracking-wide`}>
                {loading ? "MENGIRIM LAPORAN..." : "KIRIM LAPORAN"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL LOADING */}
      <Modal visible={loading} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-slate-900/80 px-6 backdrop-blur-sm`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[40px] p-8 items-center shadow-2xl border border-white/20`}>
            <Image 
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Logo_Pertamina.svg/1200px-Logo_Pertamina.svg.png' }} 
              style={tw`w-24 h-24 mb-6`} 
              resizeMode="contain" 
            />
            <ActivityIndicator size="large" color="#4A90E2" style={tw`mb-5`} />
            <Text style={tw`text-2xl font-black text-gray-800 mb-2 text-center tracking-tight`}>Mohon di Tunggu</Text>
            <Text style={tw`text-gray-500 text-center font-medium text-sm leading-5`}>
              Sedang memproses dan mengirim data...
            </Text>
          </View>
        </View>
      </Modal>

      {/* MODAL TIME PICKER */}
      <Modal visible={showTimePicker} transparent={true} animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/60`}>
          <View style={tw`bg-white rounded-t-[40px] p-8 shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-8`}>
              <View>
                <Text style={tw`text-2xl font-extrabold text-gray-800 tracking-tight`}>Pilih Waktu</Text>
                <Text style={tw`text-gray-500 font-medium mt-1`}>Tentukan jam operasional shift</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTimePicker(false)} style={tw`p-3 bg-slate-100 rounded-2xl`}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <View style={tw`flex-row justify-center items-center mb-10`}>
              {/* Hour Scroll/Selector */}
              <View style={tw`w-28 h-56 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-inner`}>
                <ScrollView showsVerticalScrollIndicator={false} snapToInterval={56} decelerationRate="fast" contentContainerStyle={tw`py-20`}>
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hr = i.toString().padStart(2, '0');
                    const isSelected = hr === selectedHour;
                    return (
                      <TouchableOpacity 
                        key={hr} 
                        style={tw`h-[56px] justify-center items-center ${isSelected ? 'bg-blue-500 rounded-2xl mx-2 shadow-md' : ''}`}
                        onPress={() => setSelectedHour(hr)}
                      >
                        <Text style={tw`text-3xl font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{hr}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              </View>

              <Text style={tw`text-4xl font-black text-slate-300 mx-5`}>:</Text>

              {/* Minute Scroll/Selector */}
              <View style={tw`w-28 h-56 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-inner`}>
                <ScrollView showsVerticalScrollIndicator={false} snapToInterval={56} decelerationRate="fast" contentContainerStyle={tw`py-20`}>
                  {Array.from({ length: 60 }).map((_, i) => {
                    const min = i.toString().padStart(2, '0');
                    const isSelected = min === selectedMinute;
                    return (
                      <TouchableOpacity 
                        key={min} 
                        style={tw`h-[56px] justify-center items-center ${isSelected ? 'bg-blue-500 rounded-2xl mx-2 shadow-md' : ''}`}
                        onPress={() => setSelectedMinute(min)}
                      >
                        <Text style={tw`text-3xl font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{min}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity 
              style={tw`rounded-2xl overflow-hidden shadow-xl`}
              onPress={() => {
                setShift(`${selectedHour}:${selectedMinute}`);
                setShowTimePicker(false);
              }}
            >
              <LinearGradient colors={PERTAMINA_BLUE} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={tw`p-5 items-center justify-center`}>
                <Text style={tw`text-white font-extrabold text-lg tracking-wide`}>SIMPAN WAKTU</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL KAMERA FULL SCREEN */}
      <Modal visible={isCameraOpen} animationType="slide" transparent={false}>
        {previewPhoto ? (
          <View style={tw`flex-1 bg-black`}>
            <Image source={{ uri: previewPhoto.uri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />
            <View style={tw`absolute top-14 left-0 right-0 items-center px-4`}>
              <LinearGradient colors={PERTAMINA_GREEN} style={tw`px-6 py-3 rounded-full shadow-2xl border border-white/20`}>
                <Text style={tw`text-white font-extrabold tracking-wider`}>
                  HASIL FOTO: {activePhotoType.toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <View style={tw`absolute bottom-12 w-full px-8 flex-row justify-between gap-4`}>
              <TouchableOpacity
                style={tw`flex-1 bg-white/10 py-5 rounded-2xl items-center border border-white/20 backdrop-blur-md flex-row justify-center`}
                onPress={() => setPreviewPhoto(null)}
              >
                <Ionicons name="refresh" size={24} color="white" style={tw`mr-2`} />
                <Text style={tw`text-white font-extrabold text-lg tracking-wide`}>ULANGI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 rounded-2xl overflow-hidden shadow-2xl`}
                onPress={savePhoto}
              >
                <LinearGradient colors={PERTAMINA_GREEN} style={tw`py-5 items-center flex-row justify-center h-full`}>
                  <Ionicons name="checkmark-done" size={24} color="white" style={tw`mr-2`} />
                  <Text style={tw`text-white font-extrabold text-lg tracking-wide`}>SIMPAN</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={tw`flex-1 bg-black`}>
            <CameraView style={StyleSheet.absoluteFillObject} facing="back" ref={cameraRef}>
              <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={tw`absolute top-0 w-full h-40`} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={tw`absolute bottom-0 w-full h-40`} />
              
              <View style={tw`absolute top-14 left-0 right-0 items-center px-4`}>
                <View style={tw`bg-black/50 px-8 py-4 rounded-full border border-white/30 backdrop-blur-lg items-center shadow-2xl`}>
                  <Text style={tw`text-white font-bold text-lg tracking-widest`}>
                    ARAHKAN KE <Text style={tw`text-[#2ECC71] font-black`}>{activePhotoType.toUpperCase()}</Text>
                  </Text>
                </View>
              </View>
              
              <View style={tw`flex-1 justify-center items-center`}>
                <View style={tw`w-80 h-56 border border-white/30 rounded-3xl relative shadow-2xl bg-white/5`}>
                  {/* Corners */}
                  <View style={tw`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#2ECC71] rounded-tl-3xl`} />
                  <View style={tw`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#2ECC71] rounded-tr-3xl`} />
                  <View style={tw`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#2ECC71] rounded-bl-3xl`} />
                  <View style={tw`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#2ECC71] rounded-br-3xl`} />
                  
                  <View style={tw`flex-1 items-center justify-center`}>
                    <Ionicons name="scan-outline" size={48} color="rgba(255,255,255,0.3)" />
                  </View>
                </View>
              </View>

              <View style={tw`absolute bottom-12 w-full flex-row justify-center items-center px-8`}>
                <TouchableOpacity
                  style={tw`absolute left-8 bg-white/10 p-4 rounded-full border border-white/20 backdrop-blur-md`}
                  onPress={() => setIsCameraOpen(false)}
                >
                  <Ionicons name="close" size={32} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`w-24 h-24 bg-white/20 rounded-full border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] justify-center items-center backdrop-blur-md ${loading ? 'opacity-50' : ''}`}
                  onPress={takePicture}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="white" size="large" /> : <View style={tw`w-20 h-20 bg-white rounded-full shadow-inner`} />}
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        )}
      </Modal>

      {/* MODAL SUKSES (BERHASIL KIRIM) */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-slate-900/80 px-6 backdrop-blur-sm`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[40px] p-8 items-center shadow-2xl border border-white/20`}>
            <View style={tw`w-28 h-28 bg-green-50 rounded-full items-center justify-center mb-6 border-8 border-green-100 shadow-inner`}>
              <Ionicons name="checkmark-done" size={60} color="#2ECC71" />
            </View>
            <Text style={tw`text-3xl font-black text-gray-800 mb-3 text-center tracking-tight`}>Berhasil!</Text>
            <Text style={tw`text-gray-500 text-center mb-8 font-medium leading-6`}>
              Laporan Handover kendaraan Anda telah tersimpan dengan aman ke server Pertamina.
            </Text>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={tw`text-gray-400 text-xs mt-4 font-bold tracking-widest uppercase`}>Kembali otomatis...</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
