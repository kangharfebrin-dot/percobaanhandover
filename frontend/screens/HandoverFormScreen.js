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
  "Kondisi Rem", "Kondisi Ban", "Kondisi Wiper", "Kondisi Lampu-lampu",
  "Kondisi Kompartemen Tangki", "Keberadaan APAR", "Oli Mesin", "Air Radiator",
  "Keberadaan STNK", "Keberadaan Surat Keur", "Keberadaan Surat Tera",
  "Keberadaan Kotak P3K", "Keberadaan Flame Trap", "Keberadaan Ban Serep",
  "Keberadaan Tools Kit termasuk dongkrak", "Keberadaan Selang bongkar",
  "Keberadaan Grounding Cable", "Keberadaan Spill Kit"
];

const CHECKLIST_B = [
  "Membawa SIM Sesuai Kendaraan", "Surat Ijin Masuk Area TBBM berlaku",
  "Menggunakan Seragam Kerja", "Menggunakan Safety Shoes", "Menggunakan Safety Helm",
  "Menggunakan ID Card", "Menggunakan Safety Glove", "Membawa Jas Hujan",
  "Membawa Buku Saku AMT", "Membawa Catatan Perjalanan AMT"
];

const REQUIRED_PHOTOS = ['Depan', 'Belakang', 'Kanan', 'Kiri'];
const PERTAMINA_BLUE = ['#0055A5', '#003366'];

export default function HandoverFormScreen({ route, navigation }) {
  const { noPolisi: initialNoPolisi } = route.params;
  const [noPolisi, setNoPolisi] = useState(initialNoPolisi || '');
  const [shift, setShift] = useState('Shift 1');
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

    // 3. Validasi Blokir Major
    const hasMajor = items.some(item => item.status === 'RUSAK' && item.severity === 'Major');
    if (hasMajor) {
      Alert.alert(
        "KENDARAAN DIBLOKIR",
        "Terdapat temuan dengan kategori MAJOR. Kendaraan ini diblokir dan wajib masuk tahap Perbaikan. Laporan tidak dapat dikirim!"
      );
      return;
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

      const finalItems = items.map(i => ({ ...i, isGood: i.status === 'BAIK' }));
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
    return (
      <View key={originalIdx} style={tw`border-b border-gray-100 ${item.status === 'RUSAK' ? 'bg-red-50' : item.status === 'BAIK' ? 'bg-green-50/30' : 'bg-white'}`}>
        <View style={tw`flex-col py-4 px-4`}>
          <Text style={tw`text-gray-700 font-medium mb-3 ${item.status === 'RUSAK' ? 'text-red-700 font-bold' : ''}`}>{item.name}</Text>
          <View style={tw`flex-row justify-end`}>
            {/* Tombol BAIK */}
            <TouchableOpacity
              style={tw`flex-1 py-3 px-2 mx-1 rounded-xl items-center border ${item.status === 'BAIK' ? 'bg-green-500 border-green-600' : 'bg-gray-100 border-gray-200'}`}
              onPress={() => setItemStatus(originalIdx, 'BAIK')}
            >
              <Text style={tw`font-bold ${item.status === 'BAIK' ? 'text-white' : 'text-gray-400'}`}>
                {item.category === 'A' ? 'BAIK' : 'ADA'}
              </Text>
            </TouchableOpacity>

            {/* Tombol RUSAK */}
            <TouchableOpacity
              style={tw`flex-1 py-3 px-2 mx-1 rounded-xl items-center border ${item.status === 'RUSAK' ? 'bg-red-500 border-red-600' : 'bg-gray-100 border-gray-200'}`}
              onPress={() => setItemStatus(originalIdx, 'RUSAK')}
            >
              <Text style={tw`font-bold ${item.status === 'RUSAK' ? 'text-white' : 'text-gray-400'}`}>
                {item.category === 'A' ? 'RUSAK' : 'TIDAK ADA'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Tambahan Jika RUSAK */}
        {item.status === 'RUSAK' && (
          <View style={tw`px-4 pb-4`}>
            <View style={tw`bg-white p-3 rounded-xl border border-red-200`}>
              <Text style={tw`text-xs font-bold text-gray-500 mb-2 uppercase`}>Tingkat Kerusakan:</Text>
              <View style={tw`flex-row mb-3`}>
                <TouchableOpacity
                  style={tw`flex-1 py-2 px-3 mr-1 rounded-lg border ${item.severity === 'Minor' ? 'bg-yellow-100 border-yellow-400' : 'bg-gray-50 border-gray-200'} items-center`}
                  onPress={() => updateItemSeverity(originalIdx, 'Minor')}
                >
                  <Text style={tw`text-xs font-bold ${item.severity === 'Minor' ? 'text-yellow-700' : 'text-gray-400'}`}>MINOR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-1 py-2 px-3 ml-1 rounded-lg border ${item.severity === 'Major' ? 'bg-red-100 border-red-500' : 'bg-gray-50 border-gray-200'} items-center`}
                  onPress={() => updateItemSeverity(originalIdx, 'Major')}
                >
                  <Text style={tw`text-xs font-bold ${item.severity === 'Major' ? 'text-red-700' : 'text-gray-400'}`}>MAJOR (BLOKIR)</Text>
                </TouchableOpacity>
              </View>

              {item.severity === 'Minor' && (
                <View>
                  <Text style={tw`text-xs font-bold text-gray-500 mb-1 uppercase`}>Catatan Wajib:</Text>
                  <TextInput
                    style={tw`bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-black`}
                    placeholder="Tulis detail catatan kerusakan..."
                    value={item.catatan}
                    onChangeText={(text) => updateItemCatatan(originalIdx, text)}
                  />
                </View>
              )}

              {item.severity === 'Major' && (
                <View style={tw`bg-red-50 p-2 rounded-lg border border-red-100 items-center`}>
                  <Text style={tw`text-red-600 text-xs font-bold text-center`}>
                    ⚠️ PERHATIAN: Status Major akan menyebabkan kendaraan DIBLOKIR. Laporan tidak dapat dilanjutkan!
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <LinearGradient colors={PERTAMINA_BLUE} style={tw`pt-6 pb-8 px-4 flex-row items-center rounded-b-[30px] shadow-lg z-10`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-white/20 rounded-full mr-4`}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={tw`text-2xl font-extrabold text-white`}>Form Handover</Text>
          <Text style={tw`text-blue-200 font-medium`}>{noPolisi || "Isi No. Polisi di Bawah"}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={tw`flex-1 px-4 pt-6`} showsVerticalScrollIndicator={false}>
        {/* Info Perjalanan */}
        <View style={tw`bg-white p-5 rounded-2xl mb-6 shadow-sm border border-gray-100`}>
          <View style={tw`flex-row items-center mb-4`}>
            <Ionicons name="car-sport" size={20} color="#0055A5" style={tw`mr-2`} />
            <Text style={tw`text-gray-800 font-bold text-lg`}>Info Perjalanan</Text>
          </View>

          <Text style={tw`text-gray-500 font-semibold text-xs uppercase mb-1`}>No Polisi Kendaraan</Text>
          <TextInput
            style={tw`bg-gray-50 p-4 rounded-xl border border-gray-200 text-black mb-4 font-bold text-base`}
            value={noPolisi}
            onChangeText={setNoPolisi}
            placeholder="Ketik Plat Nomor (Misal: B 1234 XYZ)"
            autoCapitalize="characters"
          />

          <Text style={tw`text-gray-500 font-semibold text-xs uppercase mb-1`}>Shift</Text>
          <TextInput
            style={tw`bg-gray-50 p-4 rounded-xl border border-gray-200 text-black mb-4 font-bold text-base`}
            value={shift}
            onChangeText={setShift}
          />

          <Text style={tw`text-gray-500 font-semibold text-xs uppercase mb-1`}>Odo Meter (KM)</Text>
          <TextInput
            style={tw`bg-gray-50 p-4 rounded-xl border border-gray-200 text-black font-bold text-base`}
            placeholder="Misal: 150000"
            keyboardType="numeric"
            value={odoMeter}
            onChangeText={setOdoMeter}
          />
        </View>

        {/* Kategori A */}
        <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6`}>
          <View style={tw`bg-gray-100 p-4 flex-row items-center border-b border-gray-200`}>
            <Ionicons name="construct" size={20} color="#00A651" style={tw`mr-2`} />
            <Text style={tw`font-bold text-lg text-gray-800`}>A. Perlengkapan Mobil Tangki</Text>
          </View>
          {items.filter(i => i.category === 'A').map(renderChecklistItem)}
        </View>

        {/* Kategori B */}
        <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6`}>
          <View style={tw`bg-gray-100 p-4 flex-row items-center border-b border-gray-200`}>
            <Ionicons name="person-circle" size={20} color="#0055A5" style={tw`mr-2`} />
            <Text style={tw`font-bold text-lg text-gray-800`}>B. Perlengkapan AMT</Text>
          </View>
          {items.filter(i => i.category === 'B').map(renderChecklistItem)}
        </View>

        {/* Area Foto 4 Sisi */}
        <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 p-4`}>
          <View style={tw`flex-row items-center mb-4`}>
            <Ionicons name="camera" size={20} color="#0055A5" style={tw`mr-2`} />
            <Text style={tw`font-bold text-lg text-gray-800`}>C. Foto Kendaraan Wajib</Text>
          </View>

          <View style={tw`flex-row flex-wrap justify-between`}>
            {REQUIRED_PHOTOS.map(side => (
              <TouchableOpacity
                key={side}
                style={tw`w-[48%] aspect-square bg-gray-50 rounded-xl border-2 ${photos[side] ? 'border-green-500' : 'border-dashed border-gray-300'} justify-center items-center mb-4 overflow-hidden`}
                onPress={() => openCameraFor(side)}
              >
                {photos[side] ? (
                  <View style={tw`w-full h-full relative`}>
                    <Image source={{ uri: photos[side].uri }} style={tw`w-full h-full`} resizeMode="cover" />
                    <View style={tw`absolute inset-0 bg-black/40 justify-center items-center`}>
                      <Ionicons name="refresh" size={24} color="white" />
                      <Text style={tw`text-white font-bold text-xs mt-1`}>Ulangi {side}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                    <Text style={tw`text-gray-500 font-bold mt-2`}>{side}</Text>
                    <Text style={tw`text-gray-400 text-xs`}>Ketuk untuk foto</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={tw`h-10`} />
      </ScrollView>

      {/* Tombol Submit Utama */}
      <View style={tw`p-4 bg-white border-t border-gray-200 shadow-2xl pb-8`}>
        <TouchableOpacity
          style={tw`rounded-xl overflow-hidden shadow-lg ${loading ? 'opacity-70' : ''}`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient colors={PERTAMINA_BLUE} style={tw`p-4 items-center flex-row justify-center`}>
            {loading ? (
              <ActivityIndicator color="white" style={tw`mr-2`} />
            ) : (
              <Ionicons name="cloud-upload" size={24} color="white" style={tw`mr-2`} />
            )}
            <Text style={tw`text-white font-bold text-lg`}>
              {loading ? "MENGIRIM LAPORAN..." : "KIRIM LAPORAN"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* MODAL KAMERA FULL SCREEN */}
      <Modal visible={isCameraOpen} animationType="slide" transparent={false}>
        {previewPhoto ? (
          <View style={tw`flex-1 bg-black`}>
            <Image source={{ uri: previewPhoto.uri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />
            <View style={tw`absolute top-12 left-0 right-0 items-center px-4`}>
              <Text style={tw`bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow-lg`}>
                Hasil Foto Tampak {activePhotoType}
              </Text>
            </View>
            <View style={tw`absolute bottom-10 w-full px-6 flex-row justify-between`}>
              <TouchableOpacity
                style={tw`flex-1 bg-red-50 py-4 rounded-2xl items-center border border-red-200 mr-2 flex-row justify-center`}
                onPress={() => setPreviewPhoto(null)}
              >
                <Feather name="rotate-ccw" size={20} color="#ED1C24" style={tw`mr-2`} />
                <Text style={tw`text-[#ED1C24] font-bold text-base`}>Ulangi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 ml-2 rounded-2xl overflow-hidden shadow-lg`}
                onPress={savePhoto}
              >
                <LinearGradient colors={['#0055A5', '#00A651']} style={tw`py-4 items-center flex-row justify-center`}>
                  <Feather name="check" size={20} color="white" style={tw`mr-2`} />
                  <Text style={tw`text-white font-bold text-base`}>Simpan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={tw`flex-1 bg-black`}>
            <CameraView style={StyleSheet.absoluteFillObject} facing="back" ref={cameraRef}>
              <View style={tw`absolute top-12 left-0 right-0 items-center px-4`}>
                <View style={tw`bg-black/70 px-6 py-4 rounded-full border border-white/20 items-center`}>
                  <Text style={tw`text-white font-black text-xl`}>
                    Foto Tampak <Text style={tw`text-[#00A651]`}>{activePhotoType}</Text>
                  </Text>
                </View>
              </View>
              <View style={tw`flex-1 justify-center items-center`}>
                <View style={tw`w-80 h-48 border-2 border-white/50 rounded-2xl relative`}>
                  <View style={tw`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-xl`} />
                  <View style={tw`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-xl`} />
                  <View style={tw`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-xl`} />
                  <View style={tw`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-xl`} />
                  <View style={tw`flex-1 items-center justify-center`}>
                    <Text style={tw`text-white/50 font-bold tracking-widest`}>Paskan Kendaraan di Sini</Text>
                  </View>
                </View>
              </View>
              <View style={tw`absolute bottom-12 w-full flex-row justify-center items-center px-8`}>
                <TouchableOpacity
                  style={tw`absolute left-8 bg-black/60 p-4 rounded-full`}
                  onPress={() => setIsCameraOpen(false)}
                >
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg justify-center items-center ${loading ? 'opacity-50' : ''}`}
                  onPress={takePicture}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="black" /> : <View style={tw`w-16 h-16 bg-white rounded-full border-2 border-gray-100`} />}
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        )}
      </Modal>

      {/* MODAL SUKSES (BERHASIL KIRIM) */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-black/60 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl`}>
            <View style={tw`w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6`}>
              <Ionicons name="checkmark-circle" size={60} color="#00A651" />
            </View>
            <Text style={tw`text-2xl font-extrabold text-gray-800 mb-2 text-center`}>Berhasil Dikirim!</Text>
            <Text style={tw`text-gray-500 text-center mb-6 font-medium`}>
              Laporan Handover kendaraan Anda telah tersimpan dengan aman ke server Pertamina.
            </Text>
            <ActivityIndicator size="small" color="#0055A5" />
            <Text style={tw`text-gray-400 text-xs mt-3`}>Kembali ke Beranda otomatis...</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
