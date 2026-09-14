import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState(null); // 'success' | 'error' | null

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

  const handleBarcodeScanned = ({ type, data }) => {
    // Cek apakah kode yang discan adalah master QR
    if (data === 'AKSES-AMT-PERTAMINA') {
      setScanResult('success');
    } else {
      setScanResult('error');
    }
  };

  return (
    <View style={tw`flex-1 bg-black`}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanResult === null ? handleBarcodeScanned : undefined}
      >
        <View style={tw`flex-1 justify-center items-center`}>
          {/* Kotak bidikan kamera */}
          <View style={tw`w-72 h-72 border-4 ${scanResult === 'success' ? 'border-green-500' : scanResult === 'error' ? 'border-red-500' : 'border-[#0055A5]'} rounded-3xl bg-transparent flex items-center justify-center relative overflow-hidden`}>
            {scanResult === null && (
               <View style={tw`w-full h-1 bg-[#0055A5]/50 absolute top-1/2`} />
            )}
          </View>
          <Text style={tw`text-white bg-black/60 px-4 py-2 mt-6 rounded-full font-bold`}>
            Arahkan kamera ke QR Master
          </Text>
        </View>
      </CameraView>

      <TouchableOpacity 
        style={tw`absolute top-12 left-6 bg-black/50 p-3 rounded-full flex-row items-center`} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* POPUP HASIL SCAN (Pengganti Alert agar aman di Web) */}
      {scanResult !== null && (
        <View style={tw`absolute inset-0 bg-black/70 justify-center items-center px-6 z-50`}>
          {scanResult === 'success' ? (
            <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl`}>
              <View style={tw`w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6`}>
                <Ionicons name="checkmark-circle" size={48} color="#00A651" />
              </View>
              <Text style={tw`text-2xl font-extrabold text-gray-800 mb-2`}>Akses Diterima</Text>
              <Text style={tw`text-gray-500 text-center mb-8 font-medium`}>QR Master Valid. Anda dapat melanjutkan untuk mengisi form serah terima kendaraan.</Text>
              
              <TouchableOpacity 
                style={tw`w-full`}
                onPress={() => navigation.navigate('HandoverForm', { noPolisi: '' })}
              >
                <LinearGradient colors={['#0055A5', '#003366']} style={tw`p-4 rounded-2xl items-center`}>
                  <Text style={tw`text-white font-bold text-lg`}>Lanjutkan ke Form</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl`}>
              <View style={tw`w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6`}>
                <Ionicons name="close-circle" size={48} color="#ED1C24" />
              </View>
              <Text style={tw`text-2xl font-extrabold text-gray-800 mb-2`}>Akses Ditolak</Text>
              <Text style={tw`text-gray-500 text-center mb-8 font-medium`}>QR Code tidak dikenali! Harap gunakan QR Master Pertamina yang resmi.</Text>
              
              <TouchableOpacity 
                style={tw`w-full bg-red-50 p-4 rounded-2xl items-center border border-red-200`}
                onPress={() => setScanResult(null)}
              >
                <Text style={tw`text-[#ED1C24] font-bold text-lg`}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
