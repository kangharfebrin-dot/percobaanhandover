import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from '../../config';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, StyleSheet, Image, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import TextLogo from '../../components/TextLogo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const REQUIRED_PHOTOS = ['Depan', 'Belakang', 'Kanan', 'Kiri'];
const PERTAMINA_BLUE = ['#4A90E2', '#0055A5']; // Softer aesthetic blue gradient
const PERTAMINA_RED = ['#FF4B4B', '#ED1C24'];
const PERTAMINA_GREEN = ['#2ECC71', '#00A651'];

export default function HandoverFormScreen({ route, navigation }) {
  const { noPolisi: initialNoPolisi, type } = route?.params || {};
  const [noPolisi, setNoPolisi] = useState(initialNoPolisi || '');
  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  const [shift, setShift] = useState(`${currentHour}:${currentMinute}`);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(currentHour);
  const [selectedMinute, setSelectedMinute] = useState(currentMinute);
  const [odoMeter, setOdoMeter] = useState('');
  const [amt1, setAmt1] = useState('');
  const [amt2, setAmt2] = useState('');
  const [isAmt1Locked, setIsAmt1Locked] = useState(false);
  const [isAmt2Locked, setIsAmt2Locked] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers1, setFilteredWorkers1] = useState([]);
  const [filteredWorkers2, setFilteredWorkers2] = useState([]);
  const [showWorkers1, setShowWorkers1] = useState(false);
  const [showWorkers2, setShowWorkers2] = useState(false);

  // Checklist State (Mulai dari null/kosong)
  const [items, setItems] = useState([]);

  // Camera & Photo State
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState({ Depan: null, Belakang: null, Kanan: null, Kiri: null });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [activePhotoType, setActivePhotoType] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('USER');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationTitle, setValidationTitle] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const cameraRef = useRef(null);

  const showValidationError = (title, message) => {
    setValidationTitle(title);
    setValidationMessage(message);
    setValidationModalVisible(true);
  };

  useEffect(() => {
    
    const loadWorkers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/workers`);
        setWorkers(res.data);
      } catch (e) {
        console.error("Gagal load workers:", e);
      }
    };
    loadWorkers();

    const loadChecklist = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/checklists`);
        let sourceItems = res.data;
        if (!sourceItems || sourceItems.length === 0) {
          sourceItems = DEFAULT_ITEMS;
        }
        setItems(sourceItems.map(item => ({
          category: item.category,
          name: item.name,
          status: null,
          severity: item.severity || 'Minor',
          catatan: ''
        })));
      } catch (e) {
        console.error("Gagal mengambil checklist dari API, menggunakan default:", e);
        setItems(DEFAULT_ITEMS.map(item => ({
          category: item.category,
          name: item.name,
          status: null,
          severity: item.severity || 'Minor',
          catatan: ''
        })));
      }
    };
    loadChecklist();

    (async () => {
      try {
        // Ambil User Role agar goToDashboard berfungsi benar
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserRole(user.role || 'USER');
          
          if (user.role === 'AMT' || user.role === 'USER') {
            const jbt = (user.jabatan || '').toUpperCase();
            if (jbt.includes('2')) {
              setAmt2(user.name);
              setIsAmt2Locked(true);
            } else {
              setAmt1(user.name);
              setIsAmt1Locked(true);
            }
          }
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // OPTIMASI LOKASI: Gunakan akurasi Balanced dan timeout agar tidak hang
          let loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 5000
          });
          setLocation(loc.coords);
        }
      } catch (err) {
        console.log("Location or user fetch silently failed on mount:", err);
      }
    })();
  }, []);

  // AUTOCOMPLETE LOGIC
  const handleSearchAmt1 = (text) => {
    setAmt1(text);
    if(text.length > 0) {
      setFilteredWorkers1(workers.filter(w => w.name.toLowerCase().includes(text.toLowerCase())));
      setShowWorkers1(true);
    } else {
      setShowWorkers1(false);
    }
  };
  const handleSearchAmt2 = (text) => {
    setAmt2(text);
    if(text.length > 0) {
      setFilteredWorkers2(workers.filter(w => w.name.toLowerCase().includes(text.toLowerCase())));
      setShowWorkers2(true);
    } else {
      setShowWorkers2(false);
    }
  };
  const selectAmt1 = (name) => { setAmt1(name); setShowWorkers1(false); };
  const selectAmt2 = (name) => { setAmt2(name); setShowWorkers2(false); };

  // UPDATE ITEMS LOGIC
  const setItemStatus = (index, statusValue) => {
    const newItems = [...items];
    newItems[index].status = statusValue;
    if (statusValue === 'BAIK') {
      newItems[index].severity = null;
      newItems[index].catatan = '';
      // Hapus foto kerusakan item ini jika user memilih atau membatalkan ke BAIK
      setPhotos(prev => {
        if (!prev[`item_${index}`]) return prev;
        const nextPhotos = { ...prev };
        delete nextPhotos[`item_${index}`];
        return nextPhotos;
      });
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
  const openCameraFor = async (type) => {
    if (!permission) return;
    if (!permission.granted) {
      Alert.alert('Izin Diperlukan', 'Kami butuh izin kamera untuk mengambil foto.', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Berikan Izin', onPress: requestPermission }
      ]);
      return;
    }

    // Buka kamera langsung tanpa menunggu (instan)
    setActivePhotoType(type);
    setPreviewPhoto(null);
    setIsCameraReady(false);
    setIsCameraOpen(true);

    // Ambil lokasi secara asinkron di latar belakang agar tidak memblokir UI
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, 
          timeout: 5000
        }).then(loc => {
          setLocation(loc.coords);
        }).catch(() => {
          // Fallback tanpa alert agar tidak mengganggu jika gagal
        });
      }
    });
  };

  const takePicture = () => {
    if (cameraRef.current && !loading) {
      setLoading(true);

      // Beri jeda sedikit agar UI (Loading Indicator) ter-render mulus sebelum membebani Native Camera
      setTimeout(async () => {
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });

          const now = new Date();
          const timestampStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          let locStr = 'Lokasi tidak ditemukan';
          if (location) {
            locStr = `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}`;
          }

          setPreviewPhoto({ ...photo, timestampStr, locStr });
        } catch (error) {
          console.error("Gagal mengambil foto:", error);
        } finally {
          setLoading(false);
        }
      }, 50); // 50ms sudah cukup untuk 3 frame UI (60fps)
    }
  };

  const savePhoto = () => {
    setPhotos({ ...photos, [activePhotoType]: previewPhoto });
    setIsCameraOpen(false);
    setPreviewPhoto(null);
    setActivePhotoType(null);
  };

  // SUBMIT LOGIC

  // Menerima role sebagai parameter agar tidak bergantung pada state yang mungkin masih stale
  const goToDashboard = (role) => {
    const r = role || userRole;
    if (r === 'SUPER_ADMIN' || r === 'ADMIN') {
      navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
    } else if (r === 'PENGAWAS') {
      navigation.reset({ index: 0, routes: [{ name: 'PengawasDashboard' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'UserDashboard' }] });
    }
  };

  const handleSubmit = async () => {
    // 1. Validasi Info Dasar
    if (!noPolisi || !odoMeter || !shift) {
      showValidationError("Perhatian", "Informasi perjalanan (Plat, Shift, Odo Meter) tidak boleh kosong.");
      return;
    }

    // 2. Validasi Wajib Isi Semua Checklist
    const emptyItem = items.find(item => item.status === null);
    if (emptyItem) {
      showValidationError("Form Belum Lengkap", `Anda belum mengecek item:\n"${emptyItem.name}"\n\nHarap pilih [BAIK] atau [RUSAK]!`);
      return;
    }

    // 3. Deteksi Blokir Major (Tidak memblokir pengiriman, diteruskan ke admin)
    const hasMajor = items.some(item => item.status === 'RUSAK' && item.severity === 'Major');
    if (hasMajor) {
      // Untuk notifikasi peringatan saja sebelum lanjut (bisa diabaikan jika butuh blocking)
      // showValidationError("KENDARAAN DIBLOKIR", "Terdapat temuan MAJOR. Kendaraan diblokir dan laporan akan langsung diteruskan ke Admin!");
    }

    // 4. (Dihapus) Validasi Catatan sekarang opsional (tidak wajib diisi)

    // 5. Validasi Foto Lengkap
    const missingPhotos = REQUIRED_PHOTOS.filter(p => !photos[p]);
    if (missingPhotos.length > 0) {
      showValidationError("Foto Belum Lengkap", `Harap ambil foto wajib untuk sisi: ${missingPhotos.join(', ')}`);
      return;
    }

    // 6. Validasi Wajib Foto Kerusakan
    const missingIssuePhotos = items.filter((item, idx) => item.status === 'RUSAK' && !photos[`item_${idx}`]);
    if (missingIssuePhotos.length > 0) {
      showValidationError("Foto Kerusakan Belum Lengkap", `Harap ambil foto untuk kerusakan pada item:\n"${missingIssuePhotos[0].name}"`);
      return;
    }

    // SEMUA VALIDASI LULUS -> KIRIM DATA
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1, role: 'USER' }; // Fallback for dev
      const currentRole = user.role || 'USER'; // Simpan di variabel lokal, jangan andalkan state

      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('noPolisi', noPolisi);
      formData.append('shift', shift);
      formData.append('type', type || 'mulai');

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

      Object.keys(photos).forEach(key => {
        const p = photos[key];
        if (p) {
          // Determine the friendly name for the backend
          let photoName = `photo_${key}.jpg`;
          if (key.startsWith('item_')) {
            const idx = parseInt(key.split('_')[1]);
            // JANGAN KIRIM foto kerusakan jika item tersebut statusnya BUKAN RUSAK!
            if (!items[idx] || items[idx].status !== 'RUSAK') {
              return;
            }
            const itemName = items[idx]?.name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
            photoName = `Kerusakan_${itemName}.jpg`;
          }

          const filename = p.uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append('photos', { uri: p.uri, name: photoName, type });
        }
      });

      await axios.post(`${API_URL}/api/handovers`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLoading(false);

      // Tampilkan Modal Sukses Cantik
      setShowSuccessModal(true);

      // Otomatis kembali ke dashboard setelah 2.5 detik
      // Gunakan currentRole (variabel lokal) agar tidak bergantung state yang async
      setTimeout(() => {
        setShowSuccessModal(false);
        goToDashboard(currentRole);
      }, 2500);

    } catch (error) {
      setLoading(false);
      console.error(error);
      showValidationError('Error', 'Gagal mengirim laporan. Pastikan Backend sudah menyala dan internet stabil.');
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
                style={tw`py-3 px-2 items-center justify-center border ${isBaik ? 'border-transparent' : 'border-gray-200'} rounded-xl`}
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
                style={tw`py-3 px-2 items-center justify-center border ${isRusak ? 'border-transparent' : 'border-gray-200'} rounded-xl`}
              >
                <Text style={tw`font-bold ${isRusak ? 'text-white' : 'text-gray-500'}`}>
                  {item.category === 'A' ? 'RUSAK' : 'TIDAK ADA'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Tambahan Jika RUSAK (Langsung Minta Catatan, Severity otomatis dari setting Admin) */}
        {isRusak && (
          <View style={tw`mt-4 pt-4 border-t border-red-200`}>
            <View style={tw`flex-row items-center mb-3 justify-between`}>
              <Text style={tw`text-xs font-bold text-red-800 uppercase tracking-wider`}>Detail Kerusakan / Catatan:</Text>
            </View>

            <View style={tw`bg-white rounded-xl shadow-sm border border-red-100 p-1`}>
              <TextInput
                style={[tw`p-3 text-sm text-gray-800 font-medium`, { minHeight: 80 }]}
                placeholder="Ketik detail kerusakan di sini... (Opsional)"
                placeholderTextColor="#9CA3AF"
                value={item.catatan}
                onChangeText={(text) => updateItemCatatan(originalIdx, text)}
                multiline
                scrollEnabled={false} // Supaya otomatis memanjang ke bawah
                textAlignVertical="top"
              />
            </View>

            {item.severity === 'Major' && (
              <View style={tw`bg-red-100 p-4 rounded-xl border border-red-300 items-center flex-row`}>
                <Ionicons name="warning" size={24} color="#DC2626" style={tw`mr-3`} />
                <Text style={tw`text-red-800 flex-1 text-xs font-bold leading-5`}>
                  Status Major menyebabkan kendaraan <Text style={tw`font-black text-red-600 uppercase`}>diblokir</Text>. Laporan ditandai bahaya!
                </Text>
              </View>
            )}

            {/* Wajib Foto Kerusakan */}
            <View style={tw`mt-4 items-start`}>
              <Text style={tw`text-xs font-bold text-red-800 uppercase tracking-wider mb-2`}>* Foto Kerusakan (Wajib)</Text>
              <View style={tw`relative`}>
                <TouchableOpacity
                  style={tw`w-32 h-32 bg-slate-50 rounded-2xl border-2 ${photos[`item_${originalIdx}`] ? 'border-green-500 shadow-md' : 'border-dashed border-red-300'} justify-center items-center overflow-hidden`}
                  onPress={() => openCameraFor(`item_${originalIdx}`)}
                >
                  {photos[`item_${originalIdx}`] ? (
                    <>
                      <Image source={{ uri: photos[`item_${originalIdx}`].uri }} style={tw`w-full h-full`} resizeMode="cover" />
                      <View style={tw`absolute inset-0 bg-black/20 justify-center items-center`}>
                        <Ionicons name="checkmark-circle" size={32} color="white" />
                      </View>
                    </>
                  ) : (
                    <>
                      <Ionicons name="camera" size={32} color="#DC2626" />
                      <Text style={tw`text-xs text-red-600 mt-2 font-bold`}>Ambil Foto</Text>
                    </>
                  )}
                </TouchableOpacity>

                {photos[`item_${originalIdx}`] && (
                  <TouchableOpacity
                    style={tw`absolute -top-2 -right-2 bg-red-600 rounded-full p-1.5 shadow-md z-10 border-2 border-white`}
                    onPress={() => {
                      setPhotos(prev => {
                        const nextPhotos = { ...prev };
                        delete nextPhotos[`item_${originalIdx}`];
                        return nextPhotos;
                      });
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <View style={tw`z-10 rounded-b-[40px] shadow-xl bg-white overflow-hidden`}>
        <LinearGradient colors={PERTAMINA_BLUE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`pt-8 pb-10 px-6 rounded-b-[40px]`}>
          <View style={tw`w-full flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <TouchableOpacity onPress={() => goToDashboard()} style={tw`p-3 bg-white/20 rounded-2xl mr-4 border border-white/30`}>
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

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`w-full px-4 pt-8 pb-10`} showsVerticalScrollIndicator={false}>
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
            style={tw`p-4 rounded-2xl border mb-5 font-bold text-base shadow-sm ${initialNoPolisi ? 'bg-gray-200 border-gray-300 text-gray-600' : 'bg-slate-50 border-slate-200 text-black'}`}
            value={noPolisi}
            onChangeText={setNoPolisi}
            placeholder="Ketik Plat Nomor (Sesuai Kendaraan)"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            editable={!initialNoPolisi}
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

          <Text style={tw`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2`}>AMT 1</Text>
          <View style={tw`relative z-20`}>
            <TextInput style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm mb-5 ${isAmt1Locked ? "text-gray-400 bg-gray-100" : ""}`} placeholder="Nama AMT 1" value={amt1} editable={!isAmt1Locked} onChangeText={handleSearchAmt1} onFocus={() => amt1.length > 0 && setShowWorkers1(true)} />
            {showWorkers1 && filteredWorkers1.length > 0 && (
              <View style={tw`absolute top-14 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-40`}>
                <ScrollView nestedScrollEnabled={true}>
                  {filteredWorkers1.map(w => (
                    <TouchableOpacity key={w.id} style={tw`p-3 border-b border-gray-100`} onPress={() => selectAmt1(w.name)}>
                      <Text style={tw`font-bold text-gray-800`}>{w.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <Text style={tw`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2`}>AMT 2</Text>
          <View style={tw`relative z-10`}>
            <TextInput style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm mb-5 ${isAmt2Locked ? "text-gray-400 bg-gray-100" : ""}`} placeholder="Nama AMT 2" value={amt2} editable={!isAmt2Locked} onChangeText={handleSearchAmt2} onFocus={() => amt2.length > 0 && setShowWorkers2(true)} />
            {showWorkers2 && filteredWorkers2.length > 0 && (
              <View style={tw`absolute top-14 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-40`}>
                <ScrollView nestedScrollEnabled={true}>
                  {filteredWorkers2.map(w => (
                    <TouchableOpacity key={w.id} style={tw`p-3 border-b border-gray-100`} onPress={() => selectAmt2(w.name)}>
                      <Text style={tw`font-bold text-gray-800`}>{w.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <Text style={tw`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2`}>{type === 'akhiri' ? 'Odometer Akhir' : 'Odometer Awal'}</Text>
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

                    {/* Thumbnail Watermark */}
                    <View style={tw`absolute top-1 left-1 right-1`}>
                      <Text style={tw`text-white text-[7px] font-bold bg-black/60 px-1 py-0.5 rounded shadow-lg`} numberOfLines={1}>{photos[side].locStr}</Text>
                      <Text style={tw`text-white text-[7px] font-bold bg-black/60 px-1 py-0.5 rounded shadow-lg mt-0.5`} numberOfLines={1}>{photos[side].timestampStr}</Text>
                    </View>

                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={tw`absolute inset-0 justify-end items-center pb-3`} pointerEvents="none">
                      <Ionicons name="checkmark-circle" size={24} color="#2ECC71" style={tw`mb-1 shadow-lg`} />
                      <Text style={tw`text-white font-extrabold text-[10px] tracking-wider shadow-lg`}>{side.toUpperCase()}</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <>
                    <View style={tw`bg-white p-3 rounded-full shadow-sm mb-3`}>
                      <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
                    </View>
                    <Text style={tw`text-gray-600 text-sm font-extrabold tracking-wider`}>{side}</Text>
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
      <View style={[tw`p-5 bg-white border-t border-gray-200 pb-10`, { elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10 }]}>
        <View style={tw`w-full`}>
          <TouchableOpacity
            style={tw`rounded-2xl overflow-hidden shadow-xl ${loading ? 'opacity-70' : ''}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient colors={PERTAMINA_BLUE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-5 items-center flex-row justify-center`}>
              {loading ? (
                <ActivityIndicator color="white" style={tw`mr-3`} />
              ) : (
                <Ionicons name="paper-plane" size={24} color="white" style={tw`mr-3`} />
              )}
              <Text style={tw`text-white font-extrabold text-xl tracking-wide`}>
                {loading ? "MEMPROSES..." : (type === 'akhiri' ? 'AKHIRI PERJALANAN' : 'MULAI PERJALANAN')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL LOADING */}
      <Modal visible={loading} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-slate-900/80 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[40px] p-8 items-center shadow-2xl border border-white/20`}>
            <TextLogo style={[tw`mb-4`, { transform: [{ scale: 1.2 }] }]} />
            <ActivityIndicator size="large" color="#4A90E2" style={tw`mb-5`} />
            <Text style={tw`text-2xl font-black text-gray-800 mb-2 text-center tracking-tight`}>Mohon Ditunggu</Text>
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
              <View style={tw`w-28 h-56 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden`}>
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
              <View style={tw`w-28 h-56 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden`}>
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
              <LinearGradient colors={PERTAMINA_BLUE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-5 items-center justify-center`}>
                <Text style={tw`text-white font-extrabold text-lg tracking-wide`}>SIMPAN WAKTU</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL KAMERA FULL SCREEN */}
      <Modal
        visible={isCameraOpen}
        animationType="slide"
        transparent={false}
        onShow={() => setIsCameraReady(true)}
      >
        {previewPhoto ? (
          <View style={tw`flex-1 bg-black relative`}>
            <Image source={{ uri: previewPhoto.uri }} style={tw`w-full h-full absolute inset-0`} resizeMode="contain" />

            {/* WATERMARK OVERLAY PADA PREVIEW */}
            <View style={tw`absolute bottom-40 left-6 bg-black/60 p-4 rounded-2xl border border-white/20 shadow-2xl`}>
              <Text style={tw`text-white font-bold text-xs mb-2`}><Ionicons name="location" size={14} color="#2ECC71" /> {previewPhoto.locStr}</Text>
              <Text style={tw`text-white font-bold text-xs`}><Ionicons name="time" size={14} color="#2ECC71" /> {previewPhoto.timestampStr}</Text>
            </View>

            {/* TOMBOL BATAL / TUTUP PREVIEW */}
            <TouchableOpacity
              style={tw`absolute top-14 left-6 bg-black/50 p-3 rounded-full border border-white/20 z-10`}
              onPress={() => {
                setPreviewPhoto(null);
                setIsCameraOpen(false);
                setActivePhotoType(null);
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <View style={tw`absolute top-14 left-0 right-0 items-center px-4`}>
              <LinearGradient colors={PERTAMINA_GREEN} style={tw`px-6 py-3 rounded-full shadow-2xl border border-white/20`}>
                <Text style={tw`text-white font-extrabold tracking-wider text-sm`}>
                  HASIL FOTO: {activePhotoType?.toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <View style={tw`absolute bottom-12 w-full px-8 flex-row justify-between gap-4`}>
              <TouchableOpacity
                style={tw`flex-1 bg-white/10 py-5 rounded-2xl items-center border border-white/20 flex-row justify-center`}
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
            {isCameraReady ? (
              <CameraView style={tw`absolute inset-0`} facing="back" ref={cameraRef} />
            ) : (
              <View style={tw`flex-1 items-center justify-center`}>
                <ActivityIndicator color="white" size="large" />
                <Text style={tw`text-white font-bold mt-4 text-xs tracking-widest uppercase`}>Menyiapkan Kamera...</Text>
              </View>
            )}

            <View style={tw`absolute inset-0 justify-between`} pointerEvents="box-none">
              <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={tw`absolute top-0 w-full h-40`} pointerEvents="none" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={tw`absolute bottom-0 w-full h-40`} pointerEvents="none" />

              <View style={tw`pt-14 px-4 items-center`} pointerEvents="none">
                <View style={tw`bg-black/50 px-8 py-4 rounded-full border border-white/30 items-center shadow-2xl`}>
                  <Text style={tw`text-white font-bold text-lg tracking-widest`}>
                    ARAHKAN KE <Text style={tw`text-[#2ECC71] font-black`}>{activePhotoType?.toUpperCase()}</Text>
                  </Text>
                </View>
              </View>

              <View style={tw`flex-1 justify-center items-center`} pointerEvents="none">
                <View style={tw`w-80 h-56 border border-white/30 rounded-3xl relative shadow-2xl bg-white/5`}>
                  <View style={tw`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#2ECC71] rounded-tl-3xl`} />
                  <View style={tw`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#2ECC71] rounded-tr-3xl`} />
                  <View style={tw`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#2ECC71] rounded-bl-3xl`} />
                  <View style={tw`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#2ECC71] rounded-br-3xl`} />

                  <View style={tw`flex-1 items-center justify-center`}>
                    <Ionicons name="scan-outline" size={48} color="rgba(255,255,255,0.3)" />
                  </View>
                </View>
              </View>

              <View style={tw`pb-12 w-full flex-row justify-center items-center px-8`} pointerEvents="box-none">
                <TouchableOpacity
                  style={tw`absolute left-8 bg-white/10 p-4 rounded-full border border-white/20`}
                  onPress={() => setIsCameraOpen(false)}
                >
                  <Ionicons name="close" size={32} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`w-24 h-24 bg-white/20 rounded-full border-4 border-white shadow-xl justify-center items-center ${loading ? 'opacity-50' : ''}`}
                  onPress={takePicture}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="white" size="large" /> : <View style={tw`w-20 h-20 bg-white rounded-full`} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* MODAL SUKSES (BERHASIL KIRIM) */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-slate-900/80 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[40px] p-8 items-center shadow-2xl border border-white/20`}>
            <View style={tw`w-28 h-28 bg-green-50 rounded-full items-center justify-center mb-6 border-8 border-green-100`}>
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

      {/* MODAL VALIDASI ERROR (CUSTOM) */}
      <Modal visible={validationModalVisible} transparent={true} animationType="fade" onRequestClose={() => setValidationModalVisible(false)}>
        <View style={tw`flex-1 justify-center items-center bg-black/60 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl relative overflow-hidden`}>
            {/* Watermark Logo Samar */}
            <TextLogo style={[tw`absolute opacity-10`, { top: -20, right: -40, transform: [{ scale: 1.2 }] }]} />

            <View style={tw`w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6 border-4 border-red-100`}>
              <Ionicons name="alert-circle" size={48} color="#ED1C24" />
            </View>

            <Text style={tw`text-2xl font-black text-gray-800 mb-2 text-center tracking-tight`}>{validationTitle}</Text>
            <Text style={tw`text-gray-500 text-center mb-8 font-medium leading-6 px-2`}>
              {validationMessage}
            </Text>

            <TouchableOpacity
              style={tw`w-full bg-[#ED1C24] py-4 rounded-xl items-center shadow-lg shadow-red-500/30`}
              onPress={() => setValidationModalVisible(false)}
            >
              <Text style={tw`text-sm text-white font-black tracking-widest uppercase`}>Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
