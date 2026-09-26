import React from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';

const GLASS_BG = 'rgba(255, 255, 255, 0.7)';
const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

export default function WebSidebar({ user, activeMenu, navigation, handleLogout, unreadNotificationsCount = 0 }) {
  if (Platform.OS !== 'web' || !user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isPengawas = user.role === 'PENGAWAS' || user.role === 'ADMIN';

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isPengawas) return 'Pengawas';
    return 'Awak Mobil Tangki';
  };

  const getInitials = () => {
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return 'AD';
    if (user.role === 'PENGAWAS') return 'PS';
    const parts = (user.name || '').trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (user.name || 'U').substring(0, 2).toUpperCase();
  };

  return (
    <View style={[
      tw`w-72 my-6 ml-6 rounded-[40px] border border-white/50 overflow-hidden`,
      {
        backgroundColor: GLASS_BG,
        ...glassStyle,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 30,
        height: Platform.OS === 'web' ? 'calc(100vh - 48px)' : undefined,
        maxHeight: Platform.OS === 'web' ? 'calc(100vh - 48px)' : undefined,
      }
    ]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-6 pb-8`}
        showsVerticalScrollIndicator={true}
      >
        {/* Profile Card */}
        <View style={tw`items-center mb-8`}>
          <View style={tw`w-20 h-20 bg-blue-600 rounded-[26px] items-center justify-center mb-4 shadow-xl shadow-blue-500/30 rotate-3`}>
            <Text style={tw`text-2xl font-black text-white -rotate-3`}>{getInitials()}</Text>
          </View>
          <Text style={tw`text-xl font-black text-gray-800 text-center tracking-tight`}>{user.name}</Text>
          <View style={tw`bg-blue-100 mt-2 px-3 py-1 rounded-full`}>
            <Text style={tw`text-[11px] text-[#0055A5] font-black uppercase tracking-widest`}>{getRoleLabel()}</Text>
          </View>
        </View>

        {/* 1. Beranda */}
        <TouchableOpacity
          style={tw`flex-row items-center p-4 mb-3 rounded-2xl ${activeMenu === 'Home' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
          onPress={() => {
            if (user.role === 'SUPER_ADMIN') navigation.replace('AdminDashboard');
            else if (user.role === 'PENGAWAS' || user.role === 'ADMIN') navigation.replace('PengawasDashboard');
            else navigation.replace('UserDashboard');
          }}
        >
          <Feather name="grid" size={22} color={activeMenu === 'Home' ? 'white' : '#6B7280'} />
          <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'Home' ? 'text-white' : 'text-gray-500'}`}>Beranda</Text>
        </TouchableOpacity>

        {/* 2. Log Riwayat */}
        <TouchableOpacity
          style={tw`flex-row items-center p-4 mb-3 rounded-2xl ${activeMenu === 'History' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
          onPress={() => navigation.replace('History')}
        >
          <Feather name="file-text" size={22} color={activeMenu === 'History' ? 'white' : '#6B7280'} />
          <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'History' ? 'text-white' : 'text-gray-500'}`}>Log Riwayat</Text>
        </TouchableOpacity>

        {/* 3. Manajer Checklist (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw`flex-row items-center p-4 mb-3 rounded-2xl ${activeMenu === 'Checklist' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
            onPress={() => navigation.replace('ChecklistManager')}
          >
            <Feather name="check-square" size={22} color={activeMenu === 'Checklist' ? 'white' : '#6B7280'} />
            <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'Checklist' ? 'text-white' : 'text-gray-500'}`}>Manajer Checklist</Text>
          </TouchableOpacity>
        )}

        {/* 4. Daftar Kendaraan (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw`flex-row items-center p-4 mb-3 rounded-2xl ${activeMenu === 'VehicleList' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
            onPress={() => navigation.replace('VehicleList')}
          >
            <Feather name="truck" size={22} color={activeMenu === 'VehicleList' ? 'white' : '#6B7280'} />
            <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'VehicleList' ? 'text-white' : 'text-gray-500'}`}>Daftar Kendaraan</Text>
          </TouchableOpacity>
        )}

        {/* 5. Daftar Kendala (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw`flex-row items-center p-4 mb-3 rounded-2xl ${activeMenu === 'IssueList' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
            onPress={() => navigation.replace('IssueList')}
          >
            <Feather name="alert-triangle" size={22} color={activeMenu === 'IssueList' ? 'white' : '#6B7280'} />
            <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'IssueList' ? 'text-white' : 'text-gray-500'}`}>Daftar Kendala</Text>
          </TouchableOpacity>
        )}

        {/* 6. Daftar Pekerja (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw`flex-row items-center p-4 mb-3 rounded-2xl ${activeMenu === 'WorkerList' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
            onPress={() => navigation.replace('WorkerList')}
          >
            <Feather name="users" size={22} color={activeMenu === 'WorkerList' ? 'white' : '#6B7280'} />
            <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'WorkerList' ? 'text-white' : 'text-gray-500'}`}>Daftar Pekerja</Text>
          </TouchableOpacity>
        )}

        {/* 7. Daftar Pengawas (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw`flex-row items-center p-4 mb-3 rounded-2xl ${activeMenu === 'PengawasList' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
            onPress={() => navigation.replace('PengawasList')}
          >
            <Feather name="shield" size={22} color={activeMenu === 'PengawasList' ? 'white' : '#6B7280'} />
            <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'PengawasList' ? 'text-white' : 'text-gray-500'}`}>Daftar Pengawas</Text>
          </TouchableOpacity>
        )}

        {/* 8. Pesan (Semua Pengguna: Super Admin, Pengawas, AMT/User) */}
        <TouchableOpacity
          style={tw`flex-row items-center justify-between p-4 mb-3 rounded-2xl ${activeMenu === 'Messages' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}`}
          onPress={() => navigation.replace('MessageCenter')}
        >
          <View style={tw`flex-row items-center`}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={activeMenu === 'Messages' ? 'white' : '#6B7280'} />
            <Text style={tw`ml-4 font-bold text-[15px] ${activeMenu === 'Messages' ? 'text-white' : 'text-gray-500'}`}>Pesan</Text>
          </View>
          {unreadNotificationsCount > 0 && (
            <View style={tw`bg-red-500 px-2 py-0.5 rounded-full`}>
              <Text style={tw`text-white text-xs font-bold`}>{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 9. Sign Out Button */}
        <View style={tw`mt-4 pt-4 border-t border-gray-100`}>
          <TouchableOpacity
            style={tw`flex-row items-center p-4 rounded-2xl bg-red-50 border border-red-100`}
            onPress={handleLogout || (() => {})}
          >
            <Feather name="log-out" size={22} color="#ED1C24" />
            <Text style={tw`ml-4 font-bold text-[15px] text-[#ED1C24]`}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
