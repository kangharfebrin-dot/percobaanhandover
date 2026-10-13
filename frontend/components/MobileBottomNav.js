import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Dimensions, Platform } from 'react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { normalizeRole } from '../utils/authHelper';

export default function MobileBottomNav({
  user,
  navigation,
  activeMenu = 'Home',
  handleLogout,
  unreadNotificationsCount = 0,
  isLogoutVisible = false,
}) {
  const [screenWidth, setScreenWidth] = React.useState(Dimensions.get('window').width);

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isLargeScreen = screenWidth > 768;

  // Animasi garis geser tricolor Pertamina untuk indikator menu aktif
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [slideAnim]);

  const slideInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -32]
  });

  // Komponen ini khusus untuk viewport mobile (layar sempit)
  if (isLargeScreen || !user) return null;

  const role = normalizeRole(user.role);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN';
  const isPengawas = role === 'PENGAWAS';
  const isAMT = role === 'AMT';

  const navigateTo = (routeName) => {
    if (!navigation) return;
    if (typeof navigation.replace === 'function') {
      navigation.replace(routeName);
    } else if (typeof navigation.navigate === 'function') {
      navigation.navigate(routeName);
    }
  };

  const renderActiveIndicator = () => (
    <>
      <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}>
        <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
          <LinearGradient
            colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={tw`flex-1`}
          />
        </Animated.View>
      </View>
      <View style={tw`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full`}>
        <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
          <LinearGradient
            colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={tw`flex-1`}
          />
        </Animated.View>
      </View>
    </>
  );

  return (
    <View style={tw`absolute bottom-8 self-center w-11/12 bg-white rounded-full flex-row justify-around items-center py-5 shadow-2xl shadow-gray-400/50 z-50`}>
      {/* 1. Beranda / Dashboard Utama Sesuai Role */}
      <TouchableOpacity
        style={tw`items-center justify-center px-3 relative`}
        onPress={() => {
          if (isSuperAdmin) navigateTo('SuperAdminDashboard');
          else if (isAdmin) navigateTo('AdminDashboard');
          else if (isPengawas) navigateTo('PengawasDashboard');
          else navigateTo('UserDashboard');
        }}
        activeOpacity={0.7}
      >
        {activeMenu === 'Home' && !isLogoutVisible && renderActiveIndicator()}
        <Feather
          name="grid"
          size={24}
          color={activeMenu === 'Home' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'}
        />
      </TouchableOpacity>

      {/* 2. Manajer Checklist (Untuk Super Admin & Admin) */}
      {(isSuperAdmin || isAdmin) && (
        <TouchableOpacity
          style={tw`items-center justify-center px-3 relative`}
          onPress={() => navigateTo('ChecklistManager')}
          activeOpacity={0.7}
        >
          {activeMenu === 'Checklist' && !isLogoutVisible && renderActiveIndicator()}
          <Feather
            name="check-square"
            size={24}
            color={activeMenu === 'Checklist' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'}
          />
        </TouchableOpacity>
      )}

      {/* 3. Audit Log Sistem (Untuk Super Admin & Admin) */}
      {(isSuperAdmin || isAdmin) && (
        <TouchableOpacity
          style={tw`items-center justify-center px-3 relative`}
          onPress={() => navigateTo('AuditLog')}
          activeOpacity={0.7}
        >
          {activeMenu === 'AuditLog' && !isLogoutVisible && renderActiveIndicator()}
          <Feather
            name="clipboard"
            size={24}
            color={activeMenu === 'AuditLog' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'}
          />
        </TouchableOpacity>
      )}

      {/* Alternatif untuk Pengawas: Issue List & History */}
      {isPengawas && (
        <TouchableOpacity
          style={tw`items-center justify-center px-3 relative`}
          onPress={() => navigateTo('IssueList')}
          activeOpacity={0.7}
        >
          {activeMenu === 'IssueList' && !isLogoutVisible && renderActiveIndicator()}
          <Feather
            name="alert-triangle"
            size={24}
            color={activeMenu === 'IssueList' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'}
          />
        </TouchableOpacity>
      )}

      {/* Alternatif untuk AMT / Pengawas: History */}
      {(isAMT || isPengawas) && (
        <TouchableOpacity
          style={tw`items-center justify-center px-3 relative`}
          onPress={() => navigateTo('History')}
          activeOpacity={0.7}
        >
          {activeMenu === 'History' && !isLogoutVisible && renderActiveIndicator()}
          <Feather
            name="file-text"
            size={24}
            color={activeMenu === 'History' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'}
          />
        </TouchableOpacity>
      )}

      {/* 4. Notifikasi / Messages (Untuk Super Admin, Admin, Pengawas) */}
      {(isSuperAdmin || isAdmin || isPengawas) && (
        <TouchableOpacity
          style={tw`items-center justify-center px-3 relative`}
          onPress={() => navigateTo('MessageCenter')}
          activeOpacity={0.7}
        >
          {activeMenu === 'Messages' && !isLogoutVisible && renderActiveIndicator()}
          <View style={tw`relative`}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={25}
              color={activeMenu === 'Messages' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'}
            />
            {unreadNotificationsCount > 0 && (
              <View style={tw`absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] min-h-[18px] items-center justify-center border border-white px-[2px]`}>
                <Text style={tw`text-white text-[10px] font-bold`}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* 5. Keluar / Logout */}
      <TouchableOpacity
        style={tw`items-center justify-center px-3 relative`}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        {activeMenu === 'Logout' && renderActiveIndicator()}
        <Feather
          name="log-out"
          size={24}
          color={activeMenu === 'Logout' ? '#ED1C24' : '#9CA3AF'}
        />
      </TouchableOpacity>
    </View>
  );
}
