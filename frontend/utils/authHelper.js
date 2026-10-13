import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/**
 * Fungsi logout terpusat yang menghapus seluruh kredensial auth dari storage,
 * menghapus Authorization header di axios, dan mereset stack navigasi ke 'Login'
 * sehingga riwayat navigasi (dashboard dll) terhapus total dan tidak bisa dibalikkan via tombol Back Android.
 */
export const handleLogoutAndReset = async (navigation) => {
  try {
    await AsyncStorage.multiRemove(['user', 'token', 'refreshToken']);
  } catch (error) {
    console.error('Logout error while clearing storage:', error);
  }

  delete axios.defaults.headers.common['Authorization'];

  if (navigation && typeof navigation.reset === 'function') {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } else if (navigation && typeof navigation.replace === 'function') {
    navigation.replace('Login');
  }
};

/**
 * Normalisasi role resmi DIGI Handover:
 * 1. SUPER_ADMIN -> Super Admin (Pusat Kendali Sistem)
 * 2. ADMIN -> Admin Operasional
 * 3. PENGAWAS -> Pengawas Operasional
 * 4. AMT -> Pelaksana / Awak Mobil Tangki (akun legacy USER otomatis dinormalisasi ke AMT)
 */
export const normalizeRole = (role) => {
  if (!role) return null;
  const r = String(role).trim().toUpperCase();
  if (r === 'USER') return 'AMT';
  return r;
};

export const getDashboardRoute = (roleOrUser) => {
  const rawRole = typeof roleOrUser === 'string' ? roleOrUser : roleOrUser?.role;
  const role = normalizeRole(rawRole);

  if (role === 'SUPER_ADMIN') return 'SuperAdminDashboard';
  if (role === 'ADMIN') return 'AdminDashboard';
  if (role === 'PENGAWAS') return 'PengawasDashboard';
  if (role === 'AMT') return 'UserDashboard';

  // Role tidak dikenal atau belum login
  return 'Login';
};

/**
 * Aturan Akses Manajemen Akun:
 * Hanya SUPER_ADMIN yang berhak mengelola akun ADMIN dan PENGAWAS.
 * ADMIN dilarang melakukan CRUD terhadap akun ADMIN dan PENGAWAS.
 */
export const canManageAdminAndPengawas = (roleOrUser) => {
  const role = normalizeRole(typeof roleOrUser === 'string' ? roleOrUser : roleOrUser?.role);
  return role === 'SUPER_ADMIN';
};

/**
 * Aturan Akses Operasional:
 * ADMIN dan SUPER_ADMIN memiliki hak akses operasional yang SETARA (dashboard operasional,
 * kendaraan, checklist, verifikasi perbaikan, isu, laporan, analitik, notifikasi).
 */
export const canAccessOperationalManagement = (roleOrUser) => {
  const role = normalizeRole(typeof roleOrUser === 'string' ? roleOrUser : roleOrUser?.role);
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
};

/**
 * Akses Audit Log & Monitoring Sistem:
 * Terbuka untuk ADMIN dan SUPER_ADMIN.
 */
export const canAccessAuditLog = (roleOrUser) => {
  const role = normalizeRole(typeof roleOrUser === 'string' ? roleOrUser : roleOrUser?.role);
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
};
