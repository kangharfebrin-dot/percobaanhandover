import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import tw from 'twrnc';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

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
    setScanned(true);
    Alert.alert(
      "Barcode Terdeteksi",
      `No Polisi: ${data}`,
      [
        { text: "Batal", onPress: () => setScanned(false), style: "cancel" },
        { text: "Lanjutkan Handover", onPress: () => navigation.navigate('HandoverForm', { noPolisi: data }) }
      ]
    );
  };

  return (
    <View style={tw`flex-1 bg-black`}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "code128"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      >
        <View style={tw`flex-1 justify-center items-center`}>
          <View style={tw`w-64 h-64 border-4 border-green-500 rounded-xl bg-transparent`} />
          <Text style={tw`text-white bg-black/50 p-2 mt-4 rounded-lg`}>Arahkan kamera ke Barcode Kendaraan</Text>
        </View>
      </CameraView>
      <TouchableOpacity 
        style={tw`absolute top-12 left-6 bg-black/50 p-3 rounded-full`} 
        onPress={() => navigation.goBack()}
      >
        <Text style={tw`text-white`}>Kembali</Text>
      </TouchableOpacity>
    </View>
  );
}
