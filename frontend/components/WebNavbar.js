import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, Animated, Image } from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function WebNavbar({
  user,
  title,
  subtitle,
  navigation,
  showBack = false,
  onBack,
  rightAction,
  style,
}) {
  // Animasi rotasi halus untuk border pelangi avatar (Pertamina tricolor)
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  // Hanya tampil di web dan saat user terautentikasi (dieksekusi SETELAH hooks)
  if (Platform.OS !== 'web' || !user) return null;

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Dynamic greeting berdasarkan waktu lokal
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'SELAMAT PAGI,';
    if (hour < 15) return 'SELAMAT SIANG,';
    if (hour < 18) return 'SELAMAT SORE,';
    return 'SELAMAT MALAM,';
  };

  // Inisial avatar yang elegan (menggunakan zero-width space \u200B agar Chrome tidak auto-translate 'AD' ke 'IKLAN')
  const getInitials = () => {
    if (!user) return 'PT';
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return 'A\u200BD';
    if (user.role === 'PENGAWAS') return 'P\u200BS';
    if (!user.name) return 'PT';
    const parts = user.name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + '\u200B' + parts[1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <View
      style={[
        tw`mx-5 mt-3 mb-2 rounded-[24px] overflow-hidden relative z-20 border border-gray-100 bg-white`,
        {
          height: 64,
          shadowColor: '#0055A5',
          shadowOpacity: 0.08,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: 4 },
        },
        style,
      ]}
    >
      {/* Aksen Coretan Pertamina (Top Right) */}
      <View style={tw`absolute top-[-2px] right-[-2px] opacity-15`}>
        <View style={[tw`absolute border-b-[3px] border-l-[3px] border-[#ED1C24] rounded-bl-[40px]`, { top: 0, right: 0, width: 90, height: 90 }]} />
        <View style={[tw`absolute border-b-[3px] border-l-[3px] border-[#00A651] rounded-bl-[30px]`, { top: 0, right: 0, width: 70, height: 70 }]} />
        <View style={[tw`absolute border-b-[3px] border-l-[3px] border-[#0055A5] rounded-bl-[20px]`, { top: 0, right: 0, width: 50, height: 50 }]} />
      </View>

      {/* Aksen Coretan Pertamina (Bottom Left) */}
      <View style={tw`absolute bottom-[-2px] left-[-2px] opacity-15`}>
        <View style={[tw`absolute border-t-[3px] border-r-[3px] border-[#ED1C24] rounded-tr-[40px]`, { bottom: 0, left: 0, width: 90, height: 90 }]} />
        <View style={[tw`absolute border-t-[3px] border-r-[3px] border-[#00A651] rounded-tr-[30px]`, { bottom: 0, left: 0, width: 70, height: 70 }]} />
        <View style={[tw`absolute border-t-[3px] border-r-[3px] border-[#0055A5] rounded-tr-[20px]`, { bottom: 0, left: 0, width: 50, height: 50 }]} />
      </View>

      {/* Content Overlay */}
      <View style={tw`flex-1 flex-row items-center justify-between px-5 relative z-10`}>
        {/* SISI KIRI: Profil User atau Judul Halaman */}
        {title ? (
          <View style={tw`flex-row items-center flex-1 pr-4`}>
            {(showBack || (navigation && navigation.canGoBack && navigation.canGoBack())) && (
              <TouchableOpacity
                onPress={() => {
                  if (onBack) {
                    onBack();
                  } else if (navigation && navigation.canGoBack && navigation.canGoBack()) {
                    navigation.goBack();
                  } else if (navigation && typeof navigation.replace === 'function') {
                    navigation.replace(user.role === 'PENGAWAS' ? 'PengawasDashboard' : user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'AdminDashboard' : 'UserDashboard');
                  }
                }}
                style={tw`w-9 h-9 bg-white/85 rounded-full items-center justify-center mr-3 shadow-sm border border-blue-100 hover:bg-white active:scale-95`}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color="#0055A5" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={tw`text-xl font-black text-[#1A2E44] tracking-tight leading-tight`} numberOfLines={1} className="notranslate" translate="no">
                {title}
              </Text>
              {subtitle ? (
                <Text style={tw`text-xs font-bold text-[#4B637B] mt-0.5 tracking-normal`} numberOfLines={1} className="notranslate" translate="no">
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={tw`flex-row items-center flex-1 pr-4`}>
            {/* Avatar Pill dengan Rainbow Ring Border (Warna khas Pertamina: Merah, Hijau, Biru) */}
            <View style={tw`w-[44px] h-[44px] mr-3 justify-center items-center relative shadow-sm`}>
              <Animated.View
                style={[
                  tw`absolute w-full h-full rounded-full overflow-hidden`,
                  { transform: [{ rotate: spinInterpolate }] },
                ]}
              >
                <LinearGradient
                  colors={['#ED1C24', '#00A651', '#0055A5', '#F58220', '#ED1C24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={tw`flex-1 w-full h-full`}
                />
              </Animated.View>
              <View style={tw`w-[38px] h-[38px] rounded-full bg-white items-center justify-center border border-gray-100`}>
                <Text style={tw`text-[#1A2E44] font-black text-base tracking-widest`} className="notranslate" translate="no">
                  {getInitials()}
                </Text>
              </View>
            </View>

            {/* Greeting & User Name */}
            <View style={tw`justify-center`}>
              <Text style={tw`text-[#4B637B] text-[10px] font-black uppercase tracking-[1.4px] mb-0.5`}>
                {getGreeting()}
              </Text>
              <Text
                style={tw`text-[#1A2E44] text-[18px] font-black tracking-tight max-w-[250px] leading-tight`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user.name || 'Yoann'}
              </Text>
            </View>
          </View>
        )}

        {/* SISI KANAN: Custom Action Buttons dan Logo Handover */}
        <View style={tw`flex-row items-center gap-4 z-20`}>
          {rightAction && (
            <View style={tw`flex-row items-center`}>
              {rightAction}
            </View>
          )}
          {!title && (
            <View style={[tw`flex-row items-center pr-1 select-none`, rightAction ? tw`border-l border-gray-200/50 pl-4` : {}]}>
              <Image
                source={require('../assets/exact_logo_handover.png')}
                style={{ width: 130, height: 24 }}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
