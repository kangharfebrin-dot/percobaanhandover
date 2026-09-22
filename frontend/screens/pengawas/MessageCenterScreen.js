import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, Animated, Easing, Dimensions, Image, Modal } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

const MOCK_MESSAGES = [];

export default function MessageCenterScreen({ navigation }) {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [user, setUser] = useState(null);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const isLargeScreen = screenWidth > 768;

  const orb1TranslateY = React.useRef(new Animated.Value(0)).current;
  const orb2TranslateY = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    
    const loadUser = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
    };
    loadUser();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1TranslateY, { toValue: -40, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(orb1TranslateY, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2TranslateY, { toValue: 50, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(orb2TranslateY, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true })
      ])
    ).start();
    
    return () => subscription?.remove();
  }, []);

  const slideInterpolate = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -32] });

  const handleLogout = () => setIsLogoutVisible(true);
  const handleCancelLogout = () => setIsLogoutVisible(false);
  const confirmLogout = async () => {
    setIsLogoutVisible(false);
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const markAsRead = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const markAllAsRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, read: true })));
  };

  const renderMessage = ({ item }) => {
    const isUnread = !item.read;
    let iconName = "information-circle";
    let iconColor = "#3B82F6"; // Blue
    let bgColor = "bg-blue-100";

    if (item.type === 'auth') {
      iconName = "key";
      iconColor = "#F59E0B"; // Yellow/Orange
      bgColor = "bg-amber-100";
    } else if (item.type === 'issue') {
      iconName = "warning";
      iconColor = "#ED1C24"; // Red
      bgColor = "bg-red-100";
    }

    return (
      <TouchableOpacity 
        style={tw`bg-white p-5 rounded-2xl mb-4 shadow-sm border ${isUnread ? 'border-blue-200' : 'border-gray-100'} flex-row items-start`}
        onPress={() => markAsRead(item.id)}
      >
        <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-4 mt-1 ${bgColor}`}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row justify-between items-center mb-1`}>
            <Text style={tw`text-base font-black ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>{item.title}</Text>
            {isUnread && <View style={tw`w-2.5 h-2.5 bg-blue-500 rounded-full ml-2`} />}
          </View>
          <Text style={tw`text-sm font-medium ${isUnread ? 'text-gray-700' : 'text-gray-400'} leading-5 mb-2`}>{item.message}</Text>
          <Text style={tw`text-xs font-bold text-gray-400`}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`flex-1 bg-[#F4F7FA]`}>
      <Animated.View style={[tw`absolute -top-20 -left-10 w-[30rem] h-[30rem] rounded-full opacity-15`, { transform: [{ translateY: orb1TranslateY }] }]}>
        <LinearGradient colors={['#3B82F6', '#1E40AF']} style={tw`flex-1 rounded-full`} />
      </Animated.View>
      <Animated.View style={[tw`absolute -bottom-20 -right-20 w-[25rem] h-[25rem] rounded-full opacity-15`, { transform: [{ translateY: orb2TranslateY }] }]}>
        <LinearGradient colors={['#60A5FA', '#2563EB']} style={tw`flex-1 rounded-full`} />
      </Animated.View>

      <SafeAreaView style={tw`flex-1 relative`}>
        {/* STICKY NAVBAR */}
        <View style={[tw`flex-row items-center justify-between px-5 py-3 mx-5 mt-4 mb-6 rounded-3xl border border-white/60 relative z-20`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#3B82F6', shadowOpacity: 0.15, shadowRadius: 25, shadowOffset: {width: 0, height: 10} }]}>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity onPress={() => navigation.navigate('PengawasDashboard')} style={tw`p-2 bg-gray-100 rounded-full mr-4 shadow-sm z-30`}>
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-black text-gray-800 tracking-tight z-30`}>Pesan & Notifikasi</Text>
          </View>
          
          <TouchableOpacity onPress={markAllAsRead}>
             <Ionicons name="checkmark-done" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <FlatList
          contentContainerStyle={tw`p-6 pb-30 w-full max-w-4xl mx-auto`}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={
            <View style={tw`items-center mt-20`}>
              <Ionicons name="chatbubble-outline" size={60} color="#CBD5E1" />
              <Text style={tw`text-center text-gray-400 font-bold mt-4 text-lg`}>Tidak ada pesan baru.</Text>
            </View>
          }
        />
      </SafeAreaView>

      {/* ADMIN BOTTOM NAVBAR MOCK (Identik dengan Dashboard) */}
      {!isLargeScreen && user && (
        <View style={tw`absolute bottom-8 self-center w-11/12 bg-white rounded-full flex-row justify-around items-center py-5 shadow-2xl shadow-gray-400/50 z-50`}>
          <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace('PengawasDashboard')}>
            <Feather name="grid" size={26} color="#9CA3AF" />
          </TouchableOpacity>

          {user.role === 'SUPER_ADMIN' && (
            <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace('ChecklistManager')}>
              <Feather name="check-square" size={26} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {(user.role === 'AMT' || user.role === 'USER') && (
            <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={() => navigation.replace('History')}>
              <Feather name="file-text" size={26} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {(user.role === 'SUPER_ADMIN' || user.role === 'PENGAWAS') && (
            <TouchableOpacity style={tw`items-center justify-center px-4 relative`}>
              <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}>
                <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                  <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw`flex-1`} />
                </Animated.View>
              </View>
              <View style={tw`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full`}>
                <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>
                  <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw`flex-1`} />
                </Animated.View>
              </View>
              <View style={tw`relative`}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color="#1F2937" />
                {/* RED DOT BADGE MOCK */}
                {messages.some(m => !m.read) && (
                  <View style={tw`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white`} />
                )}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={handleLogout}>
            <Feather name="log-out" size={26} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Logout Modal */}
      <Modal
        visible={isLogoutVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={tw`flex-1 justify-center items-center bg-black/60 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-2xl relative overflow-hidden`}>
            <Image source={require('../../assets/logo.png')} style={[tw`absolute opacity-10`, { width: 250, height: 250, top: -50, right: -50 }]} resizeMode="contain" />
            <View style={tw`w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4`}>
              <Feather name="log-out" size={32} color="#ED1C24" />
            </View>
            <Text style={tw`text-2xl font-black text-gray-800 mb-2`}>Konfirmasi Keluar</Text>
            <Text style={tw`text-center text-gray-500 font-medium mb-8 px-4`}>
              Apakah Anda yakin ingin keluar dari akun ini?
            </Text>
            <View style={tw`flex-row w-full`}>
              <TouchableOpacity 
                style={tw`flex-1 bg-gray-100 p-4 rounded-xl mr-2 items-center`}
                onPress={handleCancelLogout}
              >
                <Text style={tw`font-bold text-gray-600`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={tw`flex-1 bg-[#ED1C24] p-4 rounded-xl ml-2 items-center shadow-lg shadow-red-500/30`}
                onPress={confirmLogout}
              >
                <Text style={tw`font-bold text-white`}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
