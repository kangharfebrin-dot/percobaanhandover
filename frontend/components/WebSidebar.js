import React from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';

const GLASS_BG = 'rgba(255, 255, 255, 0.7)';
const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

export default function WebSidebar({ user, activeMenu, navigation, handleLogout, unreadNotificationsCount = 0 }) {
  if (Platform.OS !== 'web' || !user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isAdmin = user.role === 'ADMIN';
  const isManagement = isSuperAdmin || isAdmin;
  const isPengawas = user.role === 'PENGAWAS';

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isAdmin) return 'Admin';
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
      tw`w-72 my-6 ml-6 rounded-[40px] border border-white/50 overflow-hidden flex-col`,
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
      {/* Profile Card - Fixed Header (Informasi admin tetap terlihat) */}
      <View style={tw`pt-8 px-6 pb-5 items-center border-b border-gray-100/80`}>
        <View style={tw`w-20 h-20 bg-blue-600 rounded-[26px] items-center justify-center mb-3 shadow-xl shadow-blue-500/30 rotate-3`}>
          <Text style={tw`text-2xl font-black text-white -rotate-3`}>{getInitials()}</Text>
        </View>
        <Text style={tw`text-xl font-black text-gray-800 text-center tracking-tight`}>{user.name}</Text>
        <View style={tw`bg-blue-100 mt-2 px-3 py-1 rounded-full`}>
          <Text style={tw`text-[11px] text-[#0055A5] font-black uppercase tracking-widest`}>{getRoleLabel()}</Text>
        </View>
      </View>

      {/* Menu Navigasi - Scrollable Container */}
      <View style={tw`flex-1 bg-slate-50/20`}>
        <ScrollView
          style={[
            tw`flex-1`,
            Platform.OS === 'web' ? {
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E1 transparent',
            } : {}
          ]}
          contentContainerStyle={tw`p-4 pt-3 pb-8`}
          showsVerticalScrollIndicator={true}
        >
          {/* Section: Menu Utama */}
          <View style={tw`flex-row items-center mb-2.5 px-2`}>
            <View style={tw`flex-1 h-[1px] bg-gray-200/80`} />
            <Text style={tw`px-2 text-[10px] font-black text-gray-400 uppercase tracking-wider`}>Menu Utama</Text>
            <View style={tw`flex-1 h-[1px] bg-gray-200/80`} />
          </View>

          {/* 1. Beranda */}
          <TouchableOpacity
            style={[
              tw`flex-row items-center p-3.5 mb-2 rounded-2xl border ${
                activeMenu === 'Home'
                  ? 'bg-[#0055A5] border-[#00488C] shadow-md shadow-blue-500/30'
                  : 'bg-white/70 border-gray-200/80 shadow-sm'
              }`,
              Platform.OS === 'web' ? { cursor: 'pointer' } : {}
            ]}
            onPress={() => {
              if (user.role === 'SUPER_ADMIN') navigation.replace('AdminDashboard');
              else if (user.role === 'PENGAWAS' || user.role === 'ADMIN') navigation.replace('PengawasDashboard');
              else navigation.replace('UserDashboard');
            }}
          >
            <Feather name="grid" size={20} color={activeMenu === 'Home' ? 'white' : '#0055A5'} />
            <Text style={tw`ml-3.5 font-bold text-[14px] ${activeMenu === 'Home' ? 'text-white' : 'text-gray-700'}`}>Beranda</Text>
          </TouchableOpacity>

          {/* 2. Log Riwayat */}
          <TouchableOpacity
            style={[
              tw`flex-row items-center p-3.5 mb-2 rounded-2xl border ${
                activeMenu === 'History'
                  ? 'bg-[#0055A5] border-[#00488C] shadow-md shadow-blue-500/30'
                  : 'bg-white/70 border-gray-200/80 shadow-sm'
              }`,
              Platform.OS === 'web' ? { cursor: 'pointer' } : {}
            ]}
            onPress={() => navigation.replace('History')}
          >
            <Feather name="file-text" size={20} color={activeMenu === 'History' ? 'white' : '#4B5563'} />
            <Text style={tw`ml-3.5 font-bold text-[14px] ${activeMenu === 'History' ? 'text-white' : 'text-gray-700'}`}>Log Riwayat</Text>
          </TouchableOpacity>

          {/* Section: Manajemen (isManagement) */}
          {isManagement && (
            <>
              <View style={tw`flex-row items-center mt-3 mb-2.5 px-2`}>
                <View style={tw`flex-1 h-[1px] bg-gray-200/80`} />
                <Text style={tw`px-2 text-[10px] font-black text-gray-400 uppercase tracking-wider`}>Manajemen</Text>
                <View style={tw`flex-1 h-[1px] bg-gray-200/80`} />
              </View>

              {/* 3. Manajer Checklist */}
              <TouchableOpacity
                style={[
                  tw`flex-row items-center p-3.5 mb-2 rounded-2xl border ${
                    activeMenu === 'Checklist'
                      ? 'bg-[#0055A5] border-[#00488C] shadow-md shadow-blue-500/30'
                      : 'bg-white/70 border-gray-200/80 shadow-sm'
                  }`,
                  Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                ]}
                onPress={() => navigation.replace('ChecklistManager')}
              >
                <Feather name="check-square" size={20} color={activeMenu === 'Checklist' ? 'white' : '#4B5563'} />
                <Text style={tw`ml-3.5 font-bold text-[14px] ${activeMenu === 'Checklist' ? 'text-white' : 'text-gray-700'}`}>Manajer Checklist</Text>
              </TouchableOpacity>

              {/* 4. Daftar Kendaraan */}
              <TouchableOpacity
                style={[
                  tw`flex-row items-center p-3.5 mb-2 rounded-2xl border ${
                    activeMenu === 'VehicleList'
                      ? 'bg-[#0055A5] border-[#00488C] shadow-md shadow-blue-500/30'
                      : 'bg-white/70 border-gray-200/80 shadow-sm'
                  }`,
                  Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                ]}
                onPress={() => navigation.replace('VehicleList')}
              >
                <Feather name="truck" size={20} color={activeMenu === 'VehicleList' ? 'white' : '#4B5563'} />
                <Text style={tw`ml-3.5 font-bold text-[14px] ${activeMenu === 'VehicleList' ? 'text-white' : 'text-gray-700'}`}>Daftar Kendaraan</Text>
              </TouchableOpacity>

              {/* 5. Daftar Kendala */}
              <TouchableOpacity
                style={[
                  tw`flex-row items-center p-3.5 mb-2 rounded-2xl border ${
                    activeMenu === 'IssueList'
                      ? 'bg-[#0055A5] border-[#00488C] shadow-md shadow-blue-500/30'
                      : 'bg-white/70 border-gray-200/80 shadow-sm'
                  }`,
                  Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                ]}
                onPress={() => navigation.replace('IssueList')}
              >
                <Feather name="alert-triangle" size={20} color={activeMenu === 'IssueList' ? 'white' : '#4B5563'} />
                <Text style={tw`ml-3.5 font-bold text-[14px] ${activeMenu === 'IssueList' ? 'text-white' : 'text-gray-700'}`}>Daftar Kendala</Text>
              </TouchableOpacity>

              {/* 6. Daftar Pekerja */}
              <TouchableOpacity
                style={[
                  tw`flex-row items-center p-3.5 mb-2 rounded-2xl border ${
                    activeMenu === 'WorkerList'
                      ? 'bg-[#0055A5] border-[#00488C] shadow-md shadow-blue-500/30'
                      : 'bg-white/70 border-gray-200/80 shadow-sm'
                  }`,
                  Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                ]}
                onPress={() => navigation.replace('WorkerList')}
              >
                <Feather name="users" size={20} color={activeMenu === 'WorkerList' ? 'white' : '#4B5563'} />
                <Text style={tw`ml-3.5 font-bold text-[14px] ${activeMenu === 'WorkerList' ? 'text-white' : 'text-gray-700'}`}>Daftar Pekerja</Text>
              </TouchableOpacity>

              {/* 7. Daftar Pengawas */}
              <TouchableOpacity
                style={[
                  tw`flex-row items-center p-3.5 mb-2 rounded-2xl border ${
                    activeMenu === 'PengawasList'
                      ? 'bg-[#0055A5] border-[#00488C] shadow-md shadow-blue-500/30'
                      : 'bg-white/70 border-gray-200/80 shadow-sm'
                  }`,
                  Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                ]}
                onPress={() => navigation.replace('PengawasList')}
              >
                <Feather name="shield" size={20} color={activeMenu === 'PengawasList' ? 'white' : '#4B5563'} />
                <Text style={tw`ml-3.5 font-bold text-[14px] ${activeMenu === 'PengawasList' ? 'text-white' : 'text-gray-700'}`}>Daftar Pengawas</Text>
              </TouchableOpacity>

              {/* 8. Daftar Admin */}
              <TouchableOpacity
                style={[
                  tw`flex-row items-center p-3.5 mb-2 rounded-2xl border ${
                    activeMenu === 'AdminList'
                      ? 'bg-[#0055A5] border-[#00488C] shadow-md shadow-blue-500/30'
                      : 'bg-white/70 border-gray-200/80 shadow-sm'
                  }`,
                  Platform.OS === 'web' ? { cursor: 'pointer' } : {}
                ]}
                onPress={() => navigation.replace('AdminList')}
              >
                <Feather name="user-check" size={20} color={activeMenu === 'AdminList' ? 'white' : '#4B5563'} />
                <Text style={tw`ml-3.5 font-bold text-[14px] ${activeMenu === 'AdminList' ? 'text-white' : 'text-gray-700'}`}>Daftar Admin</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Section: Komunikasi */}
          <View style={tw`flex-row items-center mt-3 mb-2.5 px-2`}>
            <View style={tw`flex-1 h-[1px] bg-gray-200/80`} />
            <Text style={tw`px-2 text-[10px] font-black text-gray-400 uppercase tracking-wider`}>Komunikasi</Text>
            <View style={tw`flex-1 h-[1px] bg-gray-200/80`} />
          </View>

          {/* 8. Pesan */}
          <TouchableOpacity
            style={[
              tw`flex-row items-center justify-between p-3.5 mb-2 rounded-2xl border ${
                activeMenu === 'Messages'
                  ? 'bg-[#0055A5] border-[#00488C] shadow-md shadow-blue-500/30'
                  : 'bg-white/70 border-gray-200/80 shadow-sm'
              }`,
              Platform.OS === 'web' ? { cursor: 'pointer' } : {}
            ]}
            onPress={() => navigation.replace('MessageCenter')}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={activeMenu === 'Messages' ? 'white' : '#4B5563'} />
              <Text style={tw`ml-3.5 font-bold text-[14px] ${activeMenu === 'Messages' ? 'text-white' : 'text-gray-700'}`}>Pesan</Text>
            </View>
            {unreadNotificationsCount > 0 && (
              <View style={tw`bg-red-500 px-2 py-0.5 rounded-full`}>
                <Text style={tw`text-white text-xs font-bold`}>{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Section: Sesi & Logout */}
          <View style={tw`mt-3 pt-3 border-t border-gray-200/80`}>
            <TouchableOpacity
              style={[
                tw`flex-row items-center p-3.5 rounded-2xl bg-red-50/80 border border-red-200/70 shadow-sm`,
                Platform.OS === 'web' ? { cursor: 'pointer' } : {}
              ]}
              onPress={handleLogout || (() => {})}
            >
              <Feather name="log-out" size={20} color="#ED1C24" />
              <Text style={tw`ml-3.5 font-bold text-[14px] text-[#ED1C24]`}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
