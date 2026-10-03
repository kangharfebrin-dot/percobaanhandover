import WebSidebar from '../../components/WebSidebar';
import WebNavbar from '../../components/WebNavbar';
import Toast from 'react-native-toast-message';
import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { View, Text, FlatList, TouchableOpacity, Platform, Modal, Animated, Image, Easing, Alert, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';

const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

const API_BASE = { toString: () => `${API_URL}/api` };

const { Dimensions } = require('react-native');
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { useSubpageBackHandler } from '../../hooks/useSubpageBackHandler';
import { handleLogoutAndReset } from '../../utils/authHelper';

export default function IssueListScreen({ navigation }) {
  useRoleGuard(['SUPER_ADMIN', 'ADMIN', 'PENGAWAS', 'AMT']);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const isLargeScreen = Platform.OS === 'web' && screenWidth > 768;
  const numCols = isLargeScreen ? 3 : 1;
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);

  // Custom Modals State
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [user, setUser] = useState(null);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const handleLogout = () => setIsLogoutVisible(true);
  const handleCancelLogout = () => setIsLogoutVisible(false);
  const confirmLogout = async () => {
    setIsLogoutVisible(false);
    await handleLogoutAndReset(navigation);
  };

  useSubpageBackHandler({
    navigation,
    user,
    modals: [
      { isOpen: manageModalVisible, close: () => setManageModalVisible(false) },
      { isOpen: confirmModalVisible, close: () => setConfirmModalVisible(false) },
      { isOpen: successModalVisible, close: () => setSuccessModalVisible(false) },
      { isOpen: isLogoutVisible, close: handleCancelLogout },
    ]
  });

  const orb1TranslateY = React.useRef(new Animated.Value(0)).current;
  const orb2TranslateY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(orb1TranslateY, { toValue: -50, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(orb1TranslateY, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(orb2TranslateY, { toValue: 60, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(orb2TranslateY, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ])).start();

    const loadData = async () => {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
      fetchIssues();
    };
    loadData();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const [vehicleRes, issueRes] = await Promise.all([
        axios.get(`${API_BASE}/vehicles`),
        axios.get(`${API_BASE}/issues/ongoing`)
      ]);

      const activePolisi = vehicleRes.data.map(v => v.noPolisi);

      const activeIssues = issueRes.data
        .map(issue => ({
          ...issue.handover,
          issueId: issue.id,
          issueStatus: issue.status
        }))
        .filter(h => activePolisi.includes(h.noPolisi));

      setIssues(activeIssues);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openManageModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setManageModalVisible(true);
  };

  const toggleMaintenance = () => {
    if (!selectedVehicle) return;
    // Buka Custom Confirmation Modal
    setConfirmModalVisible(true);
  };

  const executeResolveIssue = async () => {
    setIsResolving(true);
    try {
      await axios.put(`${API_BASE}/issues/${selectedVehicle.issueId}/resolve`);
      setManageModalVisible(false);
      setConfirmModalVisible(false);
      fetchIssues();
      setSuccessModalVisible(true);

      // Auto close success modal after 2.5 seconds
      setTimeout(() => {
        setSuccessModalVisible(false);
      }, 2500);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: `Gagal`,
        text2: `Terjadi kesalahan server saat menyelesaikan isu.`
      });
    } finally {
      setIsResolving(false);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          tw`bg-white p-5 rounded-2xl mb-4 shadow-md border border-red-300 bg-red-50/50`,
          isLargeScreen ? { width: 'calc(33.333% - 11px)' } : tw`w-full`
        ]}
        onPress={() => { if (user?.role === 'SUPER_ADMIN' || user?.role === 'PENGAWAS' || user?.role === 'ADMIN') navigation.navigate('IssueDetail', { issueId: item.issueId }); }}
        activeOpacity={0.7}
      >
        <View style={tw`flex-row justify-between items-start mb-3 gap-2`}>
          <View style={[tw`flex-row items-center flex-1 mr-2`, { minWidth: 0 }]}>
            <View style={[tw`w-12 h-12 rounded-full items-center justify-center mr-3 bg-red-200`, { flexShrink: 0 }]}>
              <Ionicons name="build" size={26} color="#991B1B" />
            </View>
            <View style={[tw`flex-1`, { minWidth: 0 }]}>
              <Text style={tw`text-xl font-black text-red-900 tracking-tight`}>{item.noPolisi}</Text>
              <Text style={tw`text-xs font-bold text-gray-500 mt-0.5`} numberOfLines={1} ellipsizeMode="tail">
                Pelapor: {item.user?.name || '-'}
              </Text>
            </View>
          </View>
          <View style={[tw`px-2.5 py-1 rounded-full ${item.issueStatus === 'PENDING_APPROVAL' ? 'bg-orange-500' : 'bg-red-600'}`, { flexShrink: 0 }]}>
            <Text style={tw`text-[11px] font-bold text-white tracking-wide`}>
              {item.issueStatus === 'PENDING_APPROVAL' ? 'PERSETUJUAN' : 'SEDANG DIPERBAIKI'}
            </Text>
          </View>
        </View>

        <Text style={tw`text-xs font-medium text-gray-400 mb-2`}>Inspeksi Terakhir: {new Date(item.timestamp).toLocaleString('id-ID')}</Text>

        <View style={tw`mt-2 bg-red-100 p-3 rounded-xl border border-red-200`}>
          <Text style={tw`text-red-800 font-bold mb-1 text-sm`}>Isu Ditemukan:</Text>
          {item.items && item.items.filter(i => !i.isGood).map((issue, idx) => (
            <Text key={idx} style={tw`text-red-700 text-xs my-1 font-medium`}>• {issue.name}</Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`flex-1 bg-[#F4F7FA]`}>
      <Animated.View style={[tw`absolute -top-20 -left-10 w-[35rem] h-[35rem] rounded-full opacity-15`, { transform: [{ translateY: orb1TranslateY }] }]}>
        <LinearGradient colors={['#ED1C24', '#B30000']} style={tw`flex-1 rounded-full`} />
      </Animated.View>
      <Animated.View style={[tw`absolute -bottom-40 -right-10 w-[30rem] h-[30rem] rounded-full opacity-15`, { transform: [{ translateY: orb2TranslateY }] }]}>
        <LinearGradient colors={['#991B1B', '#7F1D1D']} style={tw`flex-1 rounded-full`} />
      </Animated.View>

      <SafeAreaView style={tw`flex-1 ${isLargeScreen ? 'flex-row' : 'flex-col'}`}>
        {isLargeScreen && (
          <WebSidebar
            user={user}
            activeMenu={'IssueList'}
            navigation={navigation}
            handleLogout={handleLogout}
          />
        )}

        <View style={[tw`flex-1 relative`, Platform.OS === 'web' ? { height: '100vh', maxHeight: '100vh', overflow: 'hidden' } : {}]}>

          <WebNavbar
            user={user}
            activeMenu={'IssueList'}
            title="Isu Ditemukan"
            onBack={() => {
              if (navigation && navigation.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else if (navigation && typeof navigation.replace === 'function') {
                navigation.replace(user?.role === 'PENGAWAS' ? 'PengawasDashboard' : user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'AdminDashboard' : 'UserDashboard');
              }
            }}
            showBack={true}
            navigation={navigation}
          />

          <FlatList key={numCols} numColumns={numCols} columnWrapperStyle={isLargeScreen ? tw`justify-start gap-4` : undefined}
            style={tw`flex-1`}
            contentContainerStyle={tw`p-6 pb-20 w-full max-w-7xl mx-auto`}
            data={issues}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            initialNumToRender={Platform.OS === 'web' ? 100 : 20}
            maxToRenderPerBatch={Platform.OS === 'web' ? 50 : 20}
            windowSize={Platform.OS === 'web' ? 30 : 10}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={
              <View style={tw`items-center mt-20`}>
                <Ionicons name="checkmark-circle-outline" size={60} color="#CBD5E1" />
                <Text style={tw`text-center text-gray-400 font-bold mt-4 text-lg`}>Tidak ada isu ditemukan. Semua aman.</Text>
              </View>
            }
          />

        </View>
      </SafeAreaView>

      {/* MANAGE VEHICLE MODAL */}
      <Modal visible={manageModalVisible} transparent={true} animationType="fade" onRequestClose={() => setManageModalVisible(false)}>
        <View style={tw`flex-1 justify-center items-center bg-black/60 px-6`}>
          {selectedVehicle && (
            <View style={tw`bg-white w-full max-w-sm rounded-[35px] p-8 items-center shadow-2xl border border-red-100 relative overflow-hidden`}>
              {/* Background Accent */}
              <View style={tw`absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full`} />
              <View style={tw`absolute -bottom-10 -left-10 w-32 h-32 bg-orange-50 rounded-full`} />

              {/* Logo Digihandover background watermark */}
              <Image source={require('../../assets/logo.png')} style={[tw`absolute opacity-5`, { width: 250, height: 250, top: -50, right: -50 }]} resizeMode="contain" />

              <View style={tw`w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-5 shadow-lg shadow-red-500/30 z-10 border-4 border-white`}>
                <Ionicons name="build" size={40} color="#ED1C24" />
              </View>

              <Text style={tw`text-xs font-bold text-red-500 uppercase tracking-widest z-10 mb-1`}>KENDARAAN BERMASALAH</Text>
              <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter z-10 text-center mb-8`}>{selectedVehicle.noPolisi}</Text>

              <TouchableOpacity
                style={tw`bg-green-500 w-full p-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-green-500/40 z-10 mb-3`}
                onPress={toggleMaintenance}
              >
                <Ionicons name="checkmark-circle" size={24} color="white" style={tw`mr-2`} />
                <Text style={tw`text-white font-black text-lg tracking-wide`}>SUDAH DIPERBAIKI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`bg-gray-100 w-full p-4 rounded-2xl items-center flex-row justify-center z-10 mb-6`}
                onPress={() => setManageModalVisible(false)}
              >
                <Text style={tw`text-gray-500 font-bold text-base`}>Batal</Text>
              </TouchableOpacity>

              {/* Small Footer Logo */}
              <View style={tw`flex-row items-center justify-center z-10`}>
                <View style={tw`flex-row items-center mr-2`}>
                  <View style={tw`w-1 h-4 rounded-full bg-[#ED1C24] mr-0.5`} />
                  <View style={tw`w-1 h-4 rounded-full bg-[#2ECC71] mr-0.5`} />
                  <View style={tw`w-1 h-4 rounded-full bg-[#0055A5]`} />
                </View>
                <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-widest`}>DigiHandover</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* CUSTOM CONFIRMATION MODAL */}
      <Modal visible={confirmModalVisible} transparent={true} animationType="fade" onRequestClose={() => !isResolving && setConfirmModalVisible(false)}>
        <View style={tw`flex-1 justify-center items-center bg-black/60 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-3xl p-8 items-center shadow-2xl`}>
            <View style={tw`w-20 h-20 bg-orange-50 rounded-full items-center justify-center mb-5`}>
              <Ionicons name="warning" size={40} color="#F59E0B" />
            </View>
            <Text style={tw`text-xl font-black text-gray-800 text-center mb-2`}>Selesaikan Isu?</Text>
            <Text style={tw`text-sm text-gray-500 text-center mb-8 font-medium leading-5`}>
              Apakah Anda yakin kendaraan <Text style={tw`font-bold text-gray-800`}>{selectedVehicle?.noPolisi}</Text> sudah diperbaiki dan benar-benar siap beroperasi normal kembali?
            </Text>

            <View style={tw`w-full flex-row justify-between gap-4`}>
              <TouchableOpacity
                style={tw`flex-1 py-4 rounded-2xl items-center bg-gray-100`}
                onPress={() => setConfirmModalVisible(false)}
                disabled={isResolving}
              >
                <Text style={tw`text-gray-500 font-bold`}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`flex-1 py-4 rounded-2xl items-center bg-green-500 shadow-md shadow-green-500/30 flex-row justify-center`}
                onPress={executeResolveIssue}
                disabled={isResolving}
              >
                {isResolving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-bold`}>Ya, Selesai</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM SUCCESS MODAL */}
      <Modal visible={successModalVisible} transparent={true} animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-black/50 px-6`}>
          <View style={tw`bg-white w-full max-w-sm rounded-3xl p-8 items-center shadow-2xl border border-green-100`}>
            {/* Background Accent */}
            <View style={tw`absolute -top-10 -right-10 w-32 h-32 bg-green-50 rounded-full`} />

            <View style={tw`w-24 h-24 bg-green-500 rounded-full items-center justify-center mb-6 shadow-xl shadow-green-500/40 border-4 border-white z-10`}>
              <Ionicons name="checkmark" size={60} color="white" />
            </View>
            <Text style={tw`text-3xl font-black text-green-500 tracking-tighter mb-2 z-10`}>SUKSES!</Text>
            <Text style={tw`text-sm font-medium text-gray-500 text-center z-10`}>
              Isu pada kendaraan {selectedVehicle?.noPolisi} telah diselesaikan.
            </Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}
