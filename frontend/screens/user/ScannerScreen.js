import React, { useState } from 'react';
import { API_URL } from '../../config';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';

export default function ScannerScreen({ route, navigation }) {
  const { type } = route?.params || { type: 'mulai' };
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState(null); // 'recap' | 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastHandover, setLastHandover] = useState(null);
  const [scannedNoPolisi, setScannedNoPolisi] = useState('');
  const isFocused = useIsFocused();

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white px-6`}>
        <Text style={tw`text-center mb-6 text-lg text-gray-700`}>Kami butuh izin kamera untuk scan barcode kendaraan</Text>
        <TouchableOpacity style={tw`bg-blue-600 p-4 rounded-xl`} onPress={requestPermission}>
          <Text style={tw`text-white font-bold`}>Berikan Izin Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }) => {
    if (loading) return;

    // Bersihkan data dari spasi tambahan dan jadikan huruf besar semua
    const cleanedData = data.trim().toUpperCase();

    setLoading(true);

    // Gunakan data yang sudah dibersihkan
    const scannedText = cleanedData;

    try {
      // CEK STATUS MAINTENANCE KE BACKEND (Penting!)
      const fetchPromise = axios.get(`${API_URL}/api/vehicles/scan/${scannedText}`);
      const issueRes = await axios.get(`${API_URL}/api/issues/ongoing`);
      const ongoingIssues = issueRes.data || [];
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Network Timeout')), 5000));

      const res = await Promise.race([fetchPromise, timeoutPromise]);

      if (res && res.data && res.data.success && res.data.vehicle) {
        setScannedNoPolisi(res.data.vehicle.noPolisi);
        const isUnderRepair = ongoingIssues.some(issue => issue.handover && issue.handover.noPolisi === res.data.vehicle.noPolisi);

        if (isUnderRepair) {
          setScanResult('repair');
          setLoading(false);
          return;
        }

        if (res.data.vehicle.status === 'Maintenance') {
          setScanResult('maintenance');
          setLoading(false);
          return;
        }
        // Jika lolos (Active), gunakan Nomor Polisi aslinya!
        setScannedNoPolisi(res.data.vehicle.noPolisi);

        if (res.data.lastHandover) {
          const lastType = res.data.lastHandover.type;

          if (type === 'mulai' && lastType === 'mulai') {
            setErrorMessage('Kendaraan ini belum menyelesaikan pekerjaannya (Belum Akhiri Pekerjaan).');
            setLoading(false);
            setScanResult('error');
            return;
          } else if (type === 'akhiri' && lastType !== 'mulai') {
            setErrorMessage('Kendaraan ini belum memulai pekerjaan (Belum Mulai Pekerjaan).');
            setLoading(false);
            setScanResult('error');
            return;
          }

          setLastHandover(res.data.lastHandover);
          setScanResult('recap');
        } else {
          if (type === 'akhiri') {
            setErrorMessage('Kendaraan ini belum memulai pekerjaan.');
            setLoading(false);
            setScanResult('error');
            return;
          }
          setScanResult('success');
        }
        setLoading(false);
      } else {
        throw new Error('Barcode tidak valid atau data kendaraan tidak ditemukan');
      }

    } catch (error) {
      console.error(error);
      setErrorMessage("Kendaraan tidak terdaftar di database atau masalah jaringan.");
      setLoading(false);
      setScanResult('error');
    }
  };

  const proceedToForm = () => {
    setScanResult(null);
    navigation.navigate('HandoverForm', { noPolisi: scannedNoPolisi, type });
  };

  const renderRecapModal = () => {
    if (!lastHandover) return null;

    // Hitung status checklist
    const itemsA = lastHandover.items.filter(i => i.category === 'A');
    const itemsB = lastHandover.items.filter(i => i.category === 'B');
    const odoItem = lastHandover.items.find(i => i.category === 'C');

    const countAGood = itemsA.filter(i => i.isGood).length;
    const countBGood = itemsB.filter(i => i.isGood).length;
    const odoMeter = odoItem ? odoItem.name.replace('Odo Meter: ', '') : '-';

    return (
      <View style={tw`absolute inset-0 bg-black/70 justify-center items-center px-4 z-50`}>
        <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-6 shadow-2xl`}>
          {/* Header Recap */}
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-4`}>
              <Ionicons name="checkmark" size={48} color="#00A651" />
            </View>
            <View style={tw`bg-green-100 px-3 py-1 rounded-full mb-3`}>
              <Text style={tw`text-[#00A651] font-bold text-[10px] uppercase tracking-widest`}>RECAP TERAKHIR</Text>
            </View>
            <Text style={tw`text-xl font-extrabold text-gray-800 text-center mb-2 leading-6`}>Data Inspeksi Terakhir{"\n"}Berhasil Ditemukan!</Text>
            <Text style={tw`text-gray-500 text-center text-xs font-medium px-2 leading-5`}>Seluruh alur pemeriksaan telah tervalidasi dalam sistem digital iAMT.</Text>
          </View>

          {/* Table Data */}
          <View style={tw`border border-gray-100 rounded-2xl p-4 mb-6 bg-slate-50/50 shadow-sm`}>
            <View style={tw`flex-row justify-between py-2 border-b border-gray-100`}>
              <Text style={tw`text-gray-500 text-sm`}>No Polisi</Text>
              <Text style={tw`font-extrabold text-gray-800 text-sm`}>{lastHandover.noPolisi}</Text>
            </View>
            <View style={tw`flex-row justify-between py-2 border-b border-gray-100`}>
              <Text style={tw`text-gray-500 text-sm`}>Shift</Text>
              <Text style={tw`font-extrabold text-gray-800 text-sm`}>{lastHandover.shift}</Text>
            </View>
            <View style={tw`flex-row justify-between py-2 border-b border-gray-100 items-center`}>
              <Text style={tw`text-gray-500 text-sm`}>Status</Text>
              <View style={tw`bg-green-100 px-2 py-1 rounded-md flex-row items-center`}>
                <View style={tw`w-2 h-2 bg-green-500 rounded-full mr-2`} />
                <Text style={tw`text-green-700 font-bold text-xs`}>{lastHandover.status}</Text>
              </View>
            </View>
            <View style={tw`flex-row justify-between py-2 border-b border-gray-100`}>
              <Text style={tw`text-gray-500 text-xs`}>Checklist Kendaraan</Text>
              <Text style={tw`font-extrabold text-green-700 text-xs`}>{countAGood}/{itemsA.length} Baik</Text>
            </View>
            <View style={tw`flex-row justify-between py-2 border-b border-gray-100`}>
              <Text style={tw`text-gray-500 text-xs`}>Perlengkapan AMT</Text>
              <Text style={tw`font-extrabold text-green-700 text-xs`}>{countBGood}/{itemsB.length} Lengkap</Text>
            </View>
            <View style={tw`flex-row justify-between pt-2`}>
              <Text style={tw`text-gray-500 text-xs`}>ODO Meter</Text>
              <Text style={tw`font-extrabold text-gray-800 text-xs`}>{odoMeter} km</Text>
            </View>
          </View>

          {/* Button Lanjut */}
          <TouchableOpacity onPress={proceedToForm} style={tw`w-full`}>
            <LinearGradient colors={['#0055A5', '#003366']} style={tw`p-4 rounded-xl items-center`}>
              <Text style={tw`text-white font-bold text-[14px]`}>Lanjut ke Pengisian Perjalanan →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSuccessModal = () => (
    <View style={tw`absolute inset-0 bg-black/70 justify-center items-center px-6 z-50`}>
      <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl`}>
        <View style={tw`w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6`}>
          <Ionicons name="checkmark-circle" size={48} color="#00A651" />
        </View>
        <Text style={tw`text-2xl font-extrabold text-gray-800 mb-2 text-center`}>Kendaraan{"\n"}Teridentifikasi</Text>
        <Text style={tw`text-gray-500 text-center mb-8 font-medium`}>
          {type === 'mulai' ? 'Tidak ada data inspeksi sebelumnya.' : 'Akses diterima untuk Akhiri Pekerjaan.'} Lanjutkan untuk mengisi form.
        </Text>
        <TouchableOpacity style={tw`w-full`} onPress={proceedToForm}>
          <LinearGradient colors={['#0055A5', '#003366']} style={tw`p-4 rounded-2xl items-center`}>
            <Text style={tw`text-white font-bold text-[15px]`}>Lanjut ke Pengisian Perjalanan →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={tw`flex-1 bg-black`}>
      {isFocused && !scanResult && (
        <CameraView
          style={tw`absolute inset-0`}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={loading ? undefined : handleBarcodeScanned}
        />
      )}

      {/* Overlay UI diletakkan di luar CameraView */}
      <View style={tw`absolute inset-0 justify-center items-center`} pointerEvents="none">
        <View style={tw`w-72 h-72 border-4 ${scanResult ? 'border-green-500' : 'border-[#0055A5]'} rounded-3xl bg-transparent flex items-center justify-center relative overflow-hidden`}>
          {scanResult === null && !loading && (
            <View style={tw`w-full h-1 bg-[#0055A5]/50 absolute top-1/2`} />
          )}
          {loading && <ActivityIndicator size="large" color="#0055A5" />}
        </View>
        <Text style={tw`text-white bg-black/60 px-4 py-2 mt-6 rounded-full font-bold`}>
          Arahkan kamera ke QR Kendaraan ({type?.toUpperCase() || 'MULAI'})
        </Text>
      </View>

      <TouchableOpacity
        style={tw`absolute top-12 left-6 bg-black/50 p-3 rounded-full flex-row items-center`}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {scanResult === 'recap' && renderRecapModal()}
      {scanResult === 'success' && renderSuccessModal()}


      {scanResult === 'repair' && (
        <View style={tw`absolute inset-0 bg-black/70 justify-center items-center px-6 z-50`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl border-4 border-red-100`}>
            <View style={tw`w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6 shadow-lg shadow-red-200`}>
              <Ionicons name="construct" size={50} color="#ED1C24" />
            </View>
            <Text style={tw`text-2xl font-black text-gray-800 mb-2 text-center`}>Truk Dalam{"\n"}Perbaikan!</Text>
            <Text style={tw`text-gray-500 text-center mb-8 font-semibold`}>Truk ini sedang dalam masa perbaikan (Isu aktif belum diselesaikan admin). Tidak dapat melanjutkan perjalanan.</Text>

            <TouchableOpacity
              style={tw`w-full bg-blue-600 p-4 rounded-2xl items-center shadow-lg mb-3`}
              onPress={() => { setScanResult(null); navigation.navigate('FixVerification', { noPolisi: scannedNoPolisi || data }); }}
            >
              <Text style={tw`text-white font-bold text-[15px]`}>Verifikasi Sudah Diperbaiki</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`w-full bg-red-50 p-4 rounded-2xl items-center border border-red-200`}
              onPress={() => { setScanResult(null); navigation.goBack(); }}
            >
              <Text style={tw`text-red-600 font-bold text-[15px]`}>Kembali ke Beranda</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {scanResult === 'maintenance' && (
        <View style={tw`absolute inset-0 bg-black/70 justify-center items-center px-6 z-50`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl border-4 border-red-100`}>
            <View style={tw`w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6 shadow-lg shadow-red-200`}>
              <Ionicons name="lock-closed" size={50} color="#ED1C24" />
            </View>
            <Text style={tw`text-2xl font-black text-gray-800 mb-2 text-center`}>Kendaraan{"\n"}Diblokir</Text>
            <Text style={tw`text-gray-500 text-center mb-8 font-semibold`}>Truk ini sedang dalam status MAINTENANCE total. Tidak dapat digunakan untuk operasional.</Text>
            <TouchableOpacity
              style={tw`w-full bg-red-600 p-4 rounded-2xl items-center shadow-lg shadow-red-500/30`}
              onPress={() => { setScanResult(null); navigation.goBack(); }}
            >
              <Text style={tw`text-white font-bold text-lg`}>Kembali ke Beranda</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {scanResult === 'error' && (
        <View style={tw`absolute inset-0 bg-black/70 justify-center items-center px-6 z-50`}>
          <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl`}>
            <View style={tw`w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6`}>
              <Ionicons name="close-circle" size={48} color="#ED1C24" />
            </View>
            <Text style={tw`text-2xl font-extrabold text-gray-800 mb-2`}>Scan Gagal</Text>
            <Text style={tw`text-gray-500 text-center mb-8 font-medium`}>{errorMessage || 'Kode QR tidak valid atau jaringan bermasalah.'}</Text>
            <TouchableOpacity
              style={tw`w-full bg-red-50 p-4 rounded-2xl items-center border border-red-200`}
              onPress={() => setScanResult(null)}
            >
              <Text style={tw`text-[#ED1C24] font-bold text-lg`}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
