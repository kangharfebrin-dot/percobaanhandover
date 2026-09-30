import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Animated, Image } from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function WebSidebar({ user, activeMenu, navigation, handleLogout, unreadNotificationsCount = 0 }) {
  if (Platform.OS !== 'web' || !user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isAdmin = user.role === 'ADMIN';
  const isManagement = isSuperAdmin || isAdmin;
  const isPengawas = user.role === 'PENGAWAS';

  // Referensi dan state untuk dynamic scroll indicator (Ukuran pas untuk zoom 100%)
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(1);
  const [visibleHeight, setVisibleHeight] = useState(1);
  const [trackHeight, setTrackHeight] = useState(350);

  // Tinggi kapsul 3-warna yang ideal dan proporsional pada zoom standar 100%
  const thumbHeight = Math.max(90, Math.min(130, Math.round((visibleHeight / Math.max(1, contentHeight)) * trackHeight)));
  const maxScroll = Math.max(1, contentHeight - visibleHeight);
  const maxThumbTravel = Math.max(0, trackHeight - thumbHeight);

  React.useEffect(() => {
    if (Platform.OS === 'web' && scrollViewRef.current) {
      const savedScroll = sessionStorage.getItem('sidebarScrollY');
      if (savedScroll) {
        setTimeout(() => {
          if (scrollViewRef.current?.scrollTo) {
            scrollViewRef.current.scrollTo({ y: parseFloat(savedScroll), animated: false });
          } else if (scrollViewRef.current?.getNode) {
            scrollViewRef.current.getNode().scrollTo({ y: parseFloat(savedScroll), animated: false });
          }
        }, 100);
      }
    }
  }, [contentHeight]);

  const thumbTranslateY = scrollY.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [0, maxThumbTravel],
    extrapolate: 'clamp',
  });

  const handleTrackClick = (e) => {
    if (Platform.OS !== 'web' || !scrollViewRef.current) return;
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const ratio = Math.max(0, Math.min(1, (clickY - thumbHeight / 2) / Math.max(1, rect.height - thumbHeight)));
      const targetY = ratio * maxScroll;
      if (typeof scrollViewRef.current.scrollTo === 'function') {
        scrollViewRef.current.scrollTo({ y: targetY, animated: true });
      } else if (scrollViewRef.current.getNode && typeof scrollViewRef.current.getNode().scrollTo === 'function') {
        scrollViewRef.current.getNode().scrollTo({ y: targetY, animated: true });
      }
    } catch (err) {}
  };

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isAdmin) return 'Admin';
    if (isPengawas) return 'Pengawas';
    return 'Pekerja';
  };

  const getInitials = () => {
    if (isSuperAdmin || isAdmin) return 'AD';
    if (isPengawas) return 'PS';
    const parts = (user.name || '').trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (user.name || 'U').substring(0, 2).toUpperCase();
  };

  const renderSectionHeader = (title) => (
    <View style={tw`flex-row items-center my-2.5 px-1`}>
      <View style={tw`flex-1 h-[1px] bg-gray-200/90`} />
      <Text style={tw`px-2.5 text-[10.5px] font-bold text-gray-400 uppercase tracking-wider`}>
        {title}
      </Text>
      <View style={tw`flex-1 h-[1px] bg-gray-200/90`} />
    </View>
  );

  const renderMenuItem = ({ label, iconComponent, active, onPress, badge }) => (
    <TouchableOpacity
      style={[
        tw`flex-row items-center justify-between px-3 py-2.5 mb-1.5 rounded-[16px] border`,
        active ? {
          backgroundColor: '#0055A5',
          borderColor: '#00488C',
          shadowColor: '#0055A5',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        } : {
          backgroundColor: '#FFFFFF',
          borderColor: '#F1F5F9',
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        },
        Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.15s ease' } : {}
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={tw`flex-row items-center flex-1`}>
        {iconComponent}
        <Text
          style={[
            tw`ml-3 text-[13px]`,
            active ? tw`text-white font-extrabold` : tw`text-gray-800 font-bold`
          ]}
        >
          {label}
        </Text>
      </View>
      {badge}
    </TouchableOpacity>
  );

  return (
    <View style={[
      tw`my-4 ml-4 flex-row items-stretch select-none`,
      {
        height: Platform.OS === 'web' ? 'calc(100vh - 32px)' : undefined,
        maxHeight: Platform.OS === 'web' ? 'calc(100vh - 32px)' : undefined,
      }
    ]}>
      {/* 1. Main Sidebar Card - Ukuran ramping & proporsional (295px) untuk Zoom 100% */}
      <View style={[
        tw`bg-white rounded-[32px] border border-gray-100 flex-col overflow-hidden relative`,
        {
          width: 260,
          shadowColor: '#000',
          shadowOpacity: 0.07,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
        }
      ]}>
        {/* Faint Pertamina Brand Ribbons Watermark at bottom */}
        <View style={[tw`absolute bottom-0 left-0 right-0 h-36 overflow-hidden pointer-events-none opacity-20`, { zIndex: 0 }]}>
          <View style={[tw`absolute -bottom-10 -left-10 w-56 h-8 bg-[#0055A5] -rotate-25 rounded-full`]} />
          <View style={[tw`absolute -bottom-4 -left-4 w-56 h-8 bg-[#ED1C24] -rotate-25 rounded-full`]} />
          <View style={[tw`absolute bottom-2 left-2 w-56 h-8 bg-[#52B848] -rotate-25 rounded-full`]} />
        </View>

        {/* Header: Logo Pertamina */}
        <View style={tw`pt-5 pb-2 items-center justify-center flex-row z-10`}>
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 34, height: 34 }}
            resizeMode="contain"
          />
          <Text style={tw`text-[17px] font-black tracking-wider text-gray-900 ml-2.5`}>
            PERTAMINA
          </Text>
        </View>

        {/* Profile Card */}
        <View style={[
          tw`mx-3.5 mt-1 mb-2 bg-white rounded-[22px] p-3.5 items-center border border-gray-100/90 z-10`,
          {
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }
        ]}>
          <View style={tw`w-12 h-12 rounded-full bg-[#1E5EAA] items-center justify-center mb-1.5 shadow-sm`}>
            <Text style={tw`text-base font-black text-white tracking-wide`}>
              {getInitials()}
            </Text>
          </View>
          <Text style={tw`text-[15px] font-black text-gray-800 text-center tracking-tight`} numberOfLines={1}>
            {user.name || 'User'}
          </Text>
          <View style={tw`bg-[#EBF3FC] mt-1 px-3 py-0.5 rounded-full`}>
            <Text style={tw`text-[10px] text-[#475569] font-black uppercase tracking-widest`}>
              {getRoleLabel().toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Scrollable Navigation Menu */}
        <Animated.ScrollView
          ref={scrollViewRef}
          style={[
            tw`flex-1 z-10`,
            Platform.OS === 'web' ? {
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } : {}
          ]}
          contentContainerStyle={tw`pl-3.5 pr-5.5 pt-1 pb-5`}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { 
              useNativeDriver: false,
              listener: (event) => {
                if (Platform.OS === 'web') {
                  sessionStorage.setItem('sidebarScrollY', event.nativeEvent.contentOffset.y.toString());
                }
              }
            }
          )}
          scrollEventThrottle={16}
          onContentSizeChange={(_, h) => setContentHeight(h)}
          onLayout={(e) => setVisibleHeight(e.nativeEvent.layout.height)}
        >
          {/* Section: Menu Utama */}
          {renderSectionHeader('MENU UTAMA')}

          {/* Beranda */}
          {renderMenuItem({
            label: 'Beranda',
            iconComponent: <Feather name="grid" size={20} color={activeMenu === 'Home' ? '#FFFFFF' : '#0055A5'} />,
            active: activeMenu === 'Home',
            onPress: () => {
              if (isSuperAdmin || isAdmin) navigation.navigate('AdminDashboard');
              else if (isPengawas) navigation.navigate('PengawasDashboard');
              else navigation.navigate('UserDashboard');
            }
          })}

          {/* Riwayat Handover */}
          {renderMenuItem({
            label: 'Riwayat Handover',
            iconComponent: <Feather name="file-text" size={20} color={activeMenu === 'History' ? '#FFFFFF' : '#991B1B'} />,
            active: activeMenu === 'History',
            onPress: () => navigation.navigate('History')
          })}

          {/* Section: Manajemen */}
          {(isManagement || isPengawas) && (
            <>
              {renderSectionHeader('MANAJEMEN')}

              {/* Manajer Checklist (Khusus Admin / Super Admin) */}
              {isManagement && renderMenuItem({
                label: 'Manajer Checklist',
                iconComponent: <Feather name="check-square" size={20} color={activeMenu === 'Checklist' ? '#FFFFFF' : '#991B1B'} />,
                active: activeMenu === 'Checklist',
                onPress: () => navigation.navigate('ChecklistManager')
              })}

              {/* Daftar Kendaraan */}
              {renderMenuItem({
                label: 'Daftar Kendaraan',
                iconComponent: <Feather name="truck" size={20} color={activeMenu === 'VehicleList' ? '#FFFFFF' : '#0055A5'} />,
                active: activeMenu === 'VehicleList',
                onPress: () => navigation.navigate('VehicleList')
              })}

              {/* Isu Ditemukan */}
              {renderMenuItem({
                label: 'Isu Ditemukan',
                iconComponent: <Feather name="alert-triangle" size={20} color={activeMenu === 'IssueList' ? '#FFFFFF' : '#991B1B'} />,
                active: activeMenu === 'IssueList',
                onPress: () => navigation.navigate('IssueList')
              })}

              {/* Daftar Pekerja */}
              {renderMenuItem({
                label: 'Daftar Pekerja',
                iconComponent: <Feather name="users" size={20} color={activeMenu === 'WorkerList' ? '#FFFFFF' : '#991B1B'} />,
                active: activeMenu === 'WorkerList',
                onPress: () => navigation.navigate('WorkerList')
              })}

              {/* Daftar Pengawas (Khusus Admin / Super Admin) */}
              {isManagement && renderMenuItem({
                label: 'Daftar Pengawas',
                iconComponent: <Feather name="shield" size={20} color={activeMenu === 'PengawasList' ? '#FFFFFF' : '#0055A5'} />,
                active: activeMenu === 'PengawasList',
                onPress: () => navigation.navigate('PengawasList')
              })}

              {/* Daftar Admin (Khusus Admin / Super Admin) */}
              {isManagement && renderMenuItem({
                label: 'Daftar Admin',
                iconComponent: <Feather name="user-check" size={20} color={activeMenu === 'AdminList' ? '#FFFFFF' : '#0055A5'} />,
                active: activeMenu === 'AdminList',
                onPress: () => navigation.navigate('AdminList')
              })}
            </>
          )}

          {/* Section: Komunikasi */}
          {renderSectionHeader('KOMUNIKASI')}

          {/* Pesan & Notifikasi */}
          {renderMenuItem({
            label: 'Pesan & Notifikasi',
            iconComponent: <Ionicons name="chatbubble-ellipses-outline" size={20} color={activeMenu === 'Messages' ? '#FFFFFF' : '#0055A5'} />,
            active: activeMenu === 'Messages',
            onPress: () => navigation.navigate('MessageCenter'),
            badge: unreadNotificationsCount > 0 ? (
              <View style={tw`w-5 h-5 rounded-full bg-[#ED1C24] items-center justify-center`}>
                <Text style={tw`text-white text-[11px] font-black`}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            ) : null
          })}

          {/* Slogan / Tagline */}
          <Text style={tw`text-[11.5px] font-bold text-gray-400 tracking-wider text-center mt-3.5 mb-2`}>
            Energi untuk Negeri
          </Text>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[
              tw`flex-row items-center px-3.5 py-3 rounded-[18px] bg-white border border-gray-100 mb-1.5`,
              {
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              },
              Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.15s ease' } : {}
            ]}
            onPress={handleLogout || (() => {})}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={20} color="#991B1B" />
            <Text style={tw`ml-3.5 font-bold text-[14px] text-[#991B1B]`}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </Animated.ScrollView>

        {/* 2. Scrollbar Track 3-Warna Pertamina Proporsional (Zoom 100%) */}
        <View
          style={[
            tw`absolute top-48 bottom-6 rounded-full overflow-hidden flex-col items-center justify-start z-30`,
            {
              right: 6,
              width: 8,
              backgroundColor: 'rgba(241, 245, 249, 0.8)',
              borderColor: 'rgba(226, 232, 240, 0.7)',
              borderWidth: 1,
            },
            Platform.OS === 'web' ? { cursor: 'pointer' } : {}
          ]}
          onLayout={(e) => setTrackHeight(e.nativeEvent.layout.height)}
          onClick={handleTrackClick}
        >
          <Animated.View
            style={[
              tw`rounded-full overflow-hidden flex-col`,
              {
                width: 8,
                height: thumbHeight,
                transform: [{ translateY: thumbTranslateY }],
                shadowColor: '#0055A5',
                shadowOpacity: 0.3,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: 3,
              }
            ]}
          >
            <View style={tw`flex-1 bg-[#ED1C24]`} />
            <View style={tw`flex-1 bg-[#0055A5]`} />
            <View style={tw`flex-1 bg-[#52B848]`} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
