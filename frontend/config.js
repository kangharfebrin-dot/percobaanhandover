// Konfigurasi Aplikasi

// Ganti IP ini dengan IP server/backend Anda saat deployment atau jalankan lokal.
// Jika menggunakan emulator Android, gunakan 10.0.2.2.
// Jika menggunakan device fisik, gunakan IP lokal komputer Anda (misal: 192.168.1.4)
// Jika dideploy ke production, gunakan URL server production (misal: https://api.namadomain.com)

// Mendapatkan IP laptop secara otomatis dari koneksi Expo
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let HOST_IP = '192.168.1.7'; // Default fallback

// Cek dari mana Expo berjalan
if (Platform.OS === 'web') {
  if (typeof window !== 'undefined') {
    HOST_IP = window.location.hostname;
  }
} else if (Constants.expoConfig?.hostUri) {
  HOST_IP = Constants.expoConfig.hostUri.split(':')[0];
} else if (Constants.manifest?.debuggerHost) {
  HOST_IP = Constants.manifest.debuggerHost.split(':')[0];
} else if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
  HOST_IP = Constants.manifest2.extra.expoGo.debuggerHost.split(':')[0];
}

// Gunakan IP dinamis tersebut
export const API_URL = `http://${HOST_IP}:3000`;

export default {
  API_URL,
};
