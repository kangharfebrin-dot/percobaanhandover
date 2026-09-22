import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, Modal, Animated, Image, Easing, Alert } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';

const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

const MOCK_ISSUES = [];

export default function IssueListScreen({ navigation }) {
  const [issues, setIssues] = useState(MOCK_ISSUES);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [user, setUser] = useState(null);

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

    const loadUser = async () => {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
    };
    loadUser();
  }, []);

  const openManageModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setManageModalVisible(true);
  };

  const toggleMaintenance = () => {
    if (!selectedVehicle) return;
    const isCurrentlyMaintenance = selectedVehicle.isMaintenance;
    
    Alert.alert(
      isCurrentlyMaintenance ? "Buka Blokir Kendaraan" : "Blokir Kendaraan",
      isCurrentlyMaintenance 
        ? `Apakah Anda yakin ingin membuka blokir ${selectedVehicle.noPolisi}? Truk ini akan kembali bisa digunakan.` 
        : `Apakah Anda yakin ingin memblokir ${selectedVehicle.noPolisi} untuk maintenance? AMT tidak akan bisa menggunakan truk ini.`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: isCurrentlyMaintenance ? "Ya, Buka Blokir" : "Ya, Blokir", 
          style: isCurrentlyMaintenance ? "default" : "destructive",
          onPress: () => {
            setIssues(prev => prev.map(v => 
              v.id === selectedVehicle.id ? { ...v, isMaintenance: !isCurrentlyMaintenance } : v
            ));
            setManageModalVisible(false);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isMaintenance = item.isMaintenance;

    return (
      <TouchableOpacity 
        style={tw`bg-white p-5 rounded-2xl mb-4 shadow-md border ${isMaintenance ? 'border-red-500 bg-red-50' : 'border-red-200'}`}
        onPress={() => { if (user?.role === 'SUPER_ADMIN') openManageModal(item); }}
        activeOpacity={user?.role === 'SUPER_ADMIN' ? 0.7 : 1}
      >
        <View style={tw`flex-row justify-between items-start mb-3`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-3 ${isMaintenance ? 'bg-red-200' : 'bg-red-100'}`}>
              <Ionicons name={isMaintenance ? "build" : "warning"} size={28} color={isMaintenance ? "#991B1B" : "#ED1C24"} />
            </View>
            <View>
              <Text style={tw`text-xl font-black ${isMaintenance ? 'text-red-900' : 'text-gray-800'}`}>{item.noPolisi}</Text>
              <Text style={tw`text-sm font-bold text-gray-500`}>{item.brand} • {item.type}</Text>
            </View>
          </View>
          <View style={tw`px-3 py-1 rounded-full ${isMaintenance ? 'bg-red-600' : 'bg-red-500'}`}>
            <Text style={tw`text-xs font-bold text-white`}>
              {isMaintenance ? 'MAINTENANCE' : 'ADA ISU'}
            </Text>
          </View>
        </View>

        <Text style={tw`text-xs font-medium text-gray-400 mb-2`}>Inspeksi Terakhir: {new Date(item.lastInspection).toLocaleString('id-ID')} oleh {item.reportedBy}</Text>

        <View style={tw`mt-2 bg-red-50 p-3 rounded-xl border border-red-100`}>
          <Text style={tw`text-red-800 font-bold mb-1 text-sm`}>Isu Ditemukan:</Text>
          {item.issues.map((issue, idx) => (
            <Text key={idx} style={tw`text-red-600 text-xs my-1 font-medium`}>• {issue}</Text>
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

      <SafeAreaView style={tw`flex-1 relative`}>
        <View style={[tw`flex-row items-center px-5 py-3 mx-5 mt-4 mb-6 rounded-3xl border border-white/60 relative z-20`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#ED1C24', shadowOpacity: 0.15, shadowRadius: 25, shadowOffset: {width: 0, height: 10} }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-gray-100 rounded-full mr-4 shadow-sm z-30`}>
            <Ionicons name="arrow-back" size={24} color="#ED1C24" />
          </TouchableOpacity>
          <Text style={tw`text-2xl font-black text-gray-800 tracking-tight z-30`}>Isu Ditemukan</Text>
        </View>

        <FlatList
          contentContainerStyle={tw`p-6 pb-20 w-full max-w-4xl mx-auto`}
          data={issues}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={tw`items-center mt-20`}>
              <Ionicons name="checkmark-circle-outline" size={60} color="#CBD5E1" />
              <Text style={tw`text-center text-gray-400 font-bold mt-4 text-lg`}>Tidak ada isu ditemukan. Semua aman.</Text>
            </View>
          }
        />
      </SafeAreaView>

      {/* MANAGE VEHICLE MODAL */}
      <Modal visible={manageModalVisible} transparent={true} animationType="fade" onRequestClose={() => setManageModalVisible(false)}>
        <View style={tw`flex-1 justify-center items-center bg-black/60 px-4`}>
          {selectedVehicle && (
            <View style={tw`bg-white w-full max-w-sm rounded-[30px] p-6 shadow-2xl`}>
              <View style={tw`flex-row justify-between items-center mb-6`}>
                <Text style={tw`text-xl font-black text-gray-800`}>Tindakan Admin</Text>
                <TouchableOpacity onPress={() => setManageModalVisible(false)} style={tw`p-2 bg-gray-100 rounded-full`}><Ionicons name="close" size={20} color="#6B7280" /></TouchableOpacity>
              </View>
              
              <View style={tw`items-center mb-6`}>
                <View style={tw`w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-3 border-4 ${selectedVehicle.isMaintenance ? 'border-red-500 bg-red-100' : 'border-red-100'}`}>
                  <Ionicons name={selectedVehicle.isMaintenance ? 'build' : 'warning'} size={40} color={'#ED1C24'} />
                </View>
                <Text style={tw`text-3xl font-black text-gray-800 tracking-tighter`}>{selectedVehicle.noPolisi}</Text>
                {selectedVehicle.isMaintenance && (
                   <Text style={tw`text-red-600 font-black uppercase text-xs mt-3 bg-red-100 px-3 py-1 rounded-full`}>STATUS: MAINTENANCE (DIBLOKIR)</Text>
                )}
              </View>

              <View style={tw`gap-3`}>
                <TouchableOpacity 
                  style={tw`p-4 rounded-2xl items-center flex-row justify-center ${selectedVehicle.isMaintenance ? 'bg-green-600' : 'bg-red-600'}`}
                  onPress={toggleMaintenance}
                >
                  <Ionicons name={selectedVehicle.isMaintenance ? 'checkmark-circle' : 'construct'} size={20} color="white" style={tw`mr-2`} />
                  <Text style={tw`text-white font-bold text-base`}>
                    {selectedVehicle.isMaintenance ? 'Selesai Perbaikan (Aktifkan)' : 'Blokir untuk Maintenance'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

    </View>
  );
}
