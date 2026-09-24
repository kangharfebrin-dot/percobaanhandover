import React, { useEffect, useState } from 'react';
import { API_URL } from '../../config';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Platform, Animated, Easing, Modal } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';

const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

import AsyncStorage from '@react-native-async-storage/async-storage';
export default function HandoverDetailScreen({ route, navigation }) {
  const { handover } = route.params;

  const floatAnim1 = React.useRef(new Animated.Value(0)).current;
  const floatAnim2 = React.useRef(new Animated.Value(0)).current;
  const floatAnim3 = React.useRef(new Animated.Value(0)).current;

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim3, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim3, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const orb1TranslateY = floatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const orb2TranslateY = floatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
  const orb3TranslateY = floatAnim3.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });

  const isNormal = handover.status === 'Siap Operasi (Normal)';
  const isResolved = handover.issue && handover.issue.status === 'RESOLVED';

  // Parse items by category
  const itemsA = (handover.items || []).filter(i => i.category === 'A');
  const itemsB = (handover.items || []).filter(i => i.category === 'B');
  const itemsC = (handover.items || []).filter(i => i.category === 'C');

  // Parse name to extract original name, severity, and catatan
  // Format from submit: "Nama Item [SEVERITY] - catatan"
  const parseItemName = (rawName) => {
    let name = rawName;
    let severity = null;
    let catatan = '';

    // Extract severity [MAJOR] or [MINOR]
    const severityMatch = name.match(/\s*\[(MAJOR|MINOR)\]/i);
    if (severityMatch) {
      severity = severityMatch[1];
      name = name.replace(severityMatch[0], '');
    }

    // Extract catatan after " - "
    const catatanIdx = name.indexOf(' - ');
    if (catatanIdx !== -1) {
      catatan = name.substring(catatanIdx + 3).trim();
      name = name.substring(0, catatanIdx).trim();
    }

    return { name: name.trim(), severity, catatan };
  };

  const photos = handover.photos || [];

  const renderChecklistItem = (item, index) => {
    const parsed = parseItemName(item.name);
    const isBaik = item.isGood;

    const cleanParsedName = parsed.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase();
    const damagePhoto = photos.find(p => {
      if (!p.type || !p.type.toLowerCase().startsWith('kerusakan:')) return false;
      try {
        const decodedType = decodeURIComponent(p.type).toLowerCase();
        return decodedType.includes(cleanParsedName) || decodedType.replace(/[^a-zA-Z0-9 ]/g, "").includes(cleanParsedName.replace(/ /g, ""));
      } catch (e) {
        return p.type.toLowerCase().includes(cleanParsedName);
      }
    });

    return (
      <View key={item.id || index} style={tw`border-b border-gray-100 py-4 px-5`}>
        <View style={tw`flex-row items-start`}>
          {/* Status Icon */}
          <View style={tw`w-10 h-10 rounded-full items-center justify-center mr-3 mt-0.5 ${isBaik ? 'bg-green-100' : 'bg-red-100'}`}>
            <Ionicons
              name={isBaik ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={isBaik ? '#00A651' : '#ED1C24'}
            />
          </View>

          {/* Item Details */}
          <View style={tw`flex-1`}>
            <Text style={tw`font-bold text-base ${isBaik ? 'text-gray-800' : 'text-red-700'}`}>
              {parsed.name}
            </Text>

            <View style={tw`flex-row items-center mt-1.5 flex-wrap gap-2`}>
              {/* Status Badge */}
              <View style={tw`px-3 py-1 rounded-full ${isBaik ? 'bg-green-100' : 'bg-red-100'}`}>
                <Text style={tw`text-xs font-bold ${isBaik ? 'text-green-700' : 'text-red-600'}`}>
                  {item.category === 'A'
                    ? (isBaik ? 'BAIK' : 'RUSAK')
                    : (isBaik ? 'ADA' : 'TIDAK ADA')
                  }
                </Text>
              </View>

              {/* Severity Badge (only for non-good items) */}
              {!isBaik && parsed.severity && (
                <View style={tw`px-3 py-1 rounded-full ${parsed.severity.toUpperCase() === 'MAJOR' ? 'bg-red-500' : 'bg-yellow-400'}`}>
                  <Text style={tw`text-xs font-bold ${parsed.severity.toUpperCase() === 'MAJOR' ? 'text-white' : 'text-yellow-900'}`}>
                    {parsed.severity.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Catatan */}
            {!isBaik && parsed.catatan ? (
              <View style={tw`mt-3 bg-red-50 p-3 rounded-xl border border-red-100`}>
                <Text style={tw`text-xs font-bold text-red-800 uppercase tracking-wider mb-1`}>Catatan:</Text>
                <Text style={tw`text-sm text-red-700 leading-5`}>{parsed.catatan}</Text>
              </View>
            ) : null}

            {/* Foto Kerusakan */}
            {!isBaik && damagePhoto && (
              <View style={tw`mt-3 bg-red-50 p-3 rounded-xl border border-red-100`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <Ionicons name="camera" size={16} color="#ED1C24" style={tw`mr-2`} />
                  <Text style={tw`text-xs font-bold text-red-800 uppercase tracking-wider`}>Foto Kerusakan</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPhoto(damagePhoto)}>
                  <Image source={{ uri: `${API_URL}/${damagePhoto.thumbnailUrl || damagePhoto.previewUrl || damagePhoto.url}` }} style={tw`w-full h-32 rounded-lg mt-1`} />
                </TouchableOpacity>
              </View>
            )}

            {/* Repair Info */}
            {item.isRepaired && (
              <View style={tw`mt-3 bg-green-50 p-3 rounded-xl border border-green-200`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <Ionicons name="construct" size={16} color="#00A651" style={tw`mr-2`} />
                  <Text style={tw`text-xs font-bold text-green-800 uppercase tracking-wider`}>Sudah Diperbaiki</Text>
                </View>
                {item.repairNote ? (
                  <Text style={tw`text-sm text-green-700 leading-5 mb-2`}>{item.repairNote}</Text>
                ) : null}
                {item.repairPhotoUrl ? (
                  <TouchableOpacity onPress={() => setSelectedPhoto({ type: 'Perbaikan', url: item.repairPhotoUrl })}>
                    <Image source={{ uri: `${API_URL}/${item.repairPhotoUrl}` }} style={tw`w-full h-32 rounded-lg mt-2`} />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const generalPhotos = photos.filter(p => !p.type?.toLowerCase().startsWith('kerusakan:'));

  return (
    <View style={tw`flex-1 bg-[#F4F7FA]`}>
      {/* Animated Background Orbs */}
      <Animated.View style={[tw`absolute -top-20 -left-10 w-[35rem] h-[35rem] rounded-full opacity-15`, { transform: [{ translateY: orb1TranslateY }] }]}>
        <LinearGradient colors={['#0055A5', '#003366']} style={tw`flex-1 rounded-full`} />
      </Animated.View>
      <Animated.View style={[tw`absolute -top-20 -right-20 w-[25rem] h-[25rem] rounded-full opacity-15`, { transform: [{ translateY: orb3TranslateY }] }]}>
        <LinearGradient colors={['#00A651', '#007A3B']} style={tw`flex-1 rounded-full`} />
      </Animated.View>
      <Animated.View style={[tw`absolute -bottom-40 -right-10 w-[30rem] h-[30rem] rounded-full opacity-15`, { transform: [{ translateY: orb2TranslateY }] }]}>
        <LinearGradient colors={['#ED1C24', '#B30000']} style={tw`flex-1 rounded-full`} />
      </Animated.View>

      <SafeAreaView style={tw`flex-1 relative`}>
        {/* Navbar */}
        <View style={[tw`flex-row items-center px-5 py-3 mx-5 mt-4 mb-2 rounded-3xl border border-white/60 relative z-20`, { backgroundColor: 'rgba(255,255,255,0.85)', ...glassStyle, shadowColor: '#0055A5', shadowOpacity: 0.15, shadowRadius: 25, shadowOffset: { width: 0, height: 10 } }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-gray-100 rounded-full mr-4 shadow-sm z-30`}>
            <Ionicons name="arrow-back" size={24} color="#0055A5" />
          </TouchableOpacity>
          <Text style={tw`text-2xl font-black text-gray-800 tracking-tight z-30`}>Detail Handover</Text>
        </View>

        <ScrollView contentContainerStyle={tw`p-6 pb-32 w-full max-w-4xl mx-auto`} showsVerticalScrollIndicator={false}>

          {/* Header Card */}
          <View style={tw`bg-white p-6 rounded-3xl mb-5 shadow-md border border-gray-100`}>
            <View style={tw`flex-row justify-between items-start mb-4`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View style={tw`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${isNormal ? 'bg-green-100' : (isResolved ? 'bg-blue-100' : 'bg-red-100')}`}>
                  <Ionicons
                    name={isNormal ? 'checkmark-circle' : (isResolved ? 'checkmark-done-circle' : 'warning')}
                    size={32}
                    color={isNormal ? '#00A651' : (isResolved ? '#0055A5' : '#ED1C24')}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-2xl font-black text-gray-800 tracking-tight`}>{handover.noPolisi}</Text>
                  <Text style={tw`text-sm text-gray-500 font-medium mt-1`}>{handover.shift} • {handover.user?.name || '-'}</Text>
                </View>
              </View>
              <View style={tw`px-4 py-2 rounded-full ${isNormal ? 'bg-green-100' : (isResolved ? 'bg-blue-100' : 'bg-red-500')}`}>
                <Text style={tw`text-xs font-black ${isNormal ? 'text-green-700' : (isResolved ? 'text-blue-700' : 'text-white')}`}>
                  {isNormal ? 'NORMAL' : (isResolved ? 'SELESAI' : 'ISU')}
                </Text>
              </View>
            </View>

            <View style={tw`bg-gray-50 rounded-2xl p-4`}>
              <View style={tw`flex-row items-center mb-3`}>
                <View style={tw`bg-blue-100 p-2 rounded-xl mr-3`}>
                  <Ionicons name="calendar" size={18} color="#0055A5" />
                </View>
                <View>
                  <Text style={tw`text-xs text-gray-400 font-bold uppercase tracking-wider`}>Tanggal & Waktu</Text>
                  <Text style={tw`text-sm font-bold text-gray-800`}>{new Date(handover.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</Text>
                </View>
              </View>

              {handover.locationLat && handover.locationLng && (
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-green-100 p-2 rounded-xl mr-3`}>
                    <Ionicons name="location" size={18} color="#00A651" />
                  </View>
                  <View>
                    <Text style={tw`text-xs text-gray-400 font-bold uppercase tracking-wider`}>Lokasi GPS</Text>
                    <Text style={tw`text-sm font-bold text-gray-800`}>{handover.locationLat.toFixed(5)}, {handover.locationLng.toFixed(5)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Kategori A */}
          {itemsA.length > 0 && (
            <View style={tw`bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mb-5`}>
              <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={tw`p-5 flex-row items-center border-b border-gray-200`}>
                <View style={tw`bg-green-100 p-2 rounded-xl mr-3 shadow-sm`}>
                  <Ionicons name="construct" size={24} color="#00A651" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`font-extrabold text-lg text-gray-800`}>A. Perlengkapan Tangki</Text>
                  <Text style={tw`text-xs text-gray-400 font-medium mt-0.5`}>{itemsA.filter(i => i.isGood).length}/{itemsA.length} item baik</Text>
                </View>
                <View style={tw`px-3 py-1.5 rounded-full ${itemsA.every(i => i.isGood) ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text style={tw`text-xs font-bold ${itemsA.every(i => i.isGood) ? 'text-green-700' : 'text-red-600'}`}>
                    {itemsA.every(i => i.isGood) ? 'SEMUA BAIK' : `${itemsA.filter(i => !i.isGood).length} ISU`}
                  </Text>
                </View>
              </LinearGradient>
              {itemsA.map((item, idx) => renderChecklistItem(item, idx))}
            </View>
          )}

          {/* Kategori B */}
          {itemsB.length > 0 && (
            <View style={tw`bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mb-5`}>
              <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={tw`p-5 flex-row items-center border-b border-gray-200`}>
                <View style={tw`bg-blue-100 p-2 rounded-xl mr-3 shadow-sm`}>
                  <Ionicons name="person-circle" size={24} color="#0055A5" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`font-extrabold text-lg text-gray-800`}>B. Perlengkapan AMT</Text>
                  <Text style={tw`text-xs text-gray-400 font-medium mt-0.5`}>{itemsB.filter(i => i.isGood).length}/{itemsB.length} item lengkap</Text>
                </View>
                <View style={tw`px-3 py-1.5 rounded-full ${itemsB.every(i => i.isGood) ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text style={tw`text-xs font-bold ${itemsB.every(i => i.isGood) ? 'text-green-700' : 'text-red-600'}`}>
                    {itemsB.every(i => i.isGood) ? 'SEMUA ADA' : `${itemsB.filter(i => !i.isGood).length} ISU`}
                  </Text>
                </View>
              </LinearGradient>
              {itemsB.map((item, idx) => renderChecklistItem(item, idx))}
            </View>
          )}

          {/* Kategori C */}
          {itemsC.length > 0 && (
            <View style={tw`bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mb-5`}>
              <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={tw`p-5 flex-row items-center border-b border-gray-200`}>
                <View style={tw`bg-amber-100 p-2 rounded-xl mr-3 shadow-sm`}>
                  <Ionicons name="speedometer" size={24} color="#D97706" />
                </View>
                <Text style={tw`font-extrabold text-lg text-gray-800`}>C. Info Tambahan</Text>
              </LinearGradient>
              {itemsC.map((item, idx) => (
                <View key={item.id || idx} style={tw`py-4 px-5 flex-row items-center border-b border-gray-100`}>
                  <View style={tw`w-10 h-10 rounded-full items-center justify-center mr-3 bg-amber-50`}>
                    <Ionicons name="information-circle" size={24} color="#D97706" />
                  </View>
                  <Text style={tw`font-bold text-base text-gray-800 flex-1`}>{item.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Foto Kendaraan */}
          {generalPhotos.length > 0 && (
            <View style={tw`bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mb-5`}>
              <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={tw`p-5 flex-row items-center border-b border-gray-200`}>
                <View style={tw`bg-red-50 p-2 rounded-xl mr-3 shadow-sm`}>
                  <Ionicons name="camera" size={24} color="#ED1C24" />
                </View>
                <Text style={tw`font-extrabold text-lg text-gray-800`}>Foto Kendaraan</Text>
              </LinearGradient>
              <View style={tw`flex-row flex-wrap p-4 gap-3`}>
                {generalPhotos.map((photo, idx) => (
                  <TouchableOpacity
                    key={photo.id || idx}
                    style={tw`w-[47%] aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm`}
                    onPress={() => setSelectedPhoto(photo)}
                  >
                    <Image
                      source={{ uri: `${API_URL}/${photo.thumbnailUrl || photo.previewUrl || photo.url}` }}
                      style={tw`w-full h-full`}
                      resizeMode="cover"
                    />
                    <View style={tw`absolute bottom-0 left-0 right-0 bg-black/60 py-2 px-3`}>
                      <Text style={tw`text-white text-xs font-bold`}>{photo.type || `Foto ${idx + 1}`}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Issue Status Card */}
          {handover.issue && (
            <View style={tw`bg-white rounded-3xl shadow-md border overflow-hidden mb-5 ${isResolved ? 'border-blue-200' : 'border-red-200'}`}>
              <LinearGradient colors={isResolved ? ['#EFF6FF', '#DBEAFE'] : ['#FEF2F2', '#FEE2E2']} style={tw`p-5 flex-row items-center`}>
                <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-4 ${isResolved ? 'bg-blue-100' : 'bg-red-100'}`}>
                  <Ionicons
                    name={isResolved ? 'checkmark-done-circle' : 'alert-circle'}
                    size={28}
                    color={isResolved ? '#0055A5' : '#ED1C24'}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`font-black text-base ${isResolved ? 'text-blue-800' : 'text-red-800'}`}>
                    {isResolved ? 'Isu Telah Diselesaikan' : 'Isu Sedang Ditangani'}
                  </Text>
                  {isResolved && handover.issue.resolvedAt && (
                    <Text style={tw`text-xs text-blue-500 font-medium mt-1`}>
                      Diselesaikan: {new Date(handover.issue.resolvedAt).toLocaleString('id-ID')}
                    </Text>
                  )}
                  {!isResolved && (
                    <Text style={tw`text-xs text-red-500 font-medium mt-1`}>
                      Menunggu tindak lanjut dari pengawas/admin
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* Modal Full Screen Image Viewer (Premium Theme) */}
      <Modal visible={!!selectedPhoto} transparent={true} animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
        <View style={tw`flex-1 bg-black/90 justify-center items-center`}>
          {/* Glass Navbar */}
          <View style={tw`absolute top-0 w-full pt-12 pb-5 px-6 flex-row justify-between items-center z-50 bg-black/50 border-b border-white/10`}>
            <View>
              <Text style={tw`text-white font-black text-2xl tracking-wide`}>
                Preview Foto
              </Text>
              <Text style={tw`text-blue-300 font-bold text-xs uppercase tracking-widest mt-1 flex-row items-center`}>
                Sisi {selectedPhoto?.type || 'Kendaraan'}
              </Text>
            </View>
            <TouchableOpacity
              style={tw`p-3 bg-white/20 rounded-full border border-white/30`}
              onPress={() => setSelectedPhoto(null)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {selectedPhoto && (
            <View style={tw`w-full h-full justify-center items-center p-4 pt-20`}>
              <View style={tw`w-full h-[80%] bg-black/50 rounded-[40px] overflow-hidden border border-white/20 shadow-2xl relative`}>
                <Image
                  source={{ uri: `${API_URL}/${selectedPhoto.url}` }}
                  style={tw`w-full h-full`}
                  resizeMode="contain"
                />

                {/* Overlay Gradient for Aesthetics */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={tw`absolute bottom-0 w-full p-6 pt-20`}
                  pointerEvents="none"
                >
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-12 h-12 bg-[#0055A5] rounded-2xl items-center justify-center mr-4 border border-white/30`}>
                      <Ionicons name="camera" size={24} color="white" />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-white font-extrabold text-base tracking-wider`}>Dokumentasi Visual</Text>
                      <Text style={tw`text-blue-200 font-medium text-xs mt-0.5`}>{new Date(handover.timestamp).toLocaleString('id-ID')}</Text>
                      {handover.locationLat && handover.locationLng && (
                        <Text style={tw`text-[#2ECC71] font-bold text-xs mt-1`}>
                          📍 {handover.locationLat.toFixed(5)}, {handover.locationLng.toFixed(5)}
                        </Text>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
