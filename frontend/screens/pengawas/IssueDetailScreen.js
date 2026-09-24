import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../../config';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

export default function IssueDetailScreen({ route, navigation }) {
  const { issueId } = route.params;
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // evaluations: { [itemId]: { approved: true/false, reason: string } }
  const [evaluations, setEvaluations] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIssueDetail();
  }, []);

  const fetchIssueDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/issues`); // Get all to find
      const foundIssue = res.data.find(i => i.id === issueId);
      if (foundIssue) {
        setIssue(foundIssue);
        // Initialize evaluations for items that are not good
        const initialEvals = {};
        const brokenItems = foundIssue.handover.items.filter(i => !i.isGood);
        brokenItems.forEach(item => {
          // Default to approved if it was repaired, otherwise null
          initialEvals[item.id] = { 
            approved: null, // null means not yet evaluated
            reason: '' 
          };
        });
        setEvaluations(initialEvals);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat detail isu.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (itemId) => {
    setEvaluations(prev => ({ ...prev, [itemId]: { approved: true, reason: '' } }));
  };

  const handleReject = (itemId) => {
    setEvaluations(prev => ({ ...prev, [itemId]: { ...prev[itemId], approved: false } }));
  };

  const updateReason = (itemId, text) => {
    setEvaluations(prev => ({ ...prev, [itemId]: { ...prev[itemId], reason: text } }));
  };

  const submitEvaluation = async () => {
    // Validasi: semua item harus sudah dievaluasi
    const brokenItems = issue.handover.items.filter(i => !i.isGood);
    const hasUnevaluated = brokenItems.some(i => evaluations[i.id].approved === null);
    
    if (hasUnevaluated) {
      Alert.alert('Belum Selesai', 'Mohon evaluasi semua kerusakan (Terima/Tolak) sebelum mengirim.');
      return;
    }

    const hasRejectedWithoutReason = brokenItems.some(i => evaluations[i.id].approved === false && evaluations[i.id].reason.trim() === '');
    
    if (hasRejectedWithoutReason) {
      Alert.alert('Alasan Diperlukan', 'Untuk perbaikan yang ditolak, alasan penolakan wajib diisi.');
      return;
    }

    Alert.alert(
      "Konfirmasi Evaluasi",
      "Kirim hasil evaluasi ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Kirim", 
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const evalArray = Object.keys(evaluations).map(itemId => ({
                itemId,
                approved: evaluations[itemId].approved,
                reason: evaluations[itemId].reason
              }));

              await axios.post(`${API_URL}/api/issues/${issueId}/evaluate-repair`, { evaluations: evalArray });
              Alert.alert('Sukses', 'Evaluasi perbaikan berhasil dikirim.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error(error);
              Alert.alert('Gagal', 'Terjadi kesalahan saat mengirim evaluasi.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-[#F4F7FA]`}>
        <ActivityIndicator size="large" color="#ED1C24" />
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-[#F4F7FA]`}>
        <Text style={tw`text-gray-500 font-bold`}>Isu tidak ditemukan.</Text>
      </View>
    );
  }

  const brokenItems = issue.handover.items.filter(i => !i.isGood);

  return (
    <KeyboardAvoidingView style={tw`flex-1 bg-[#F4F7FA]`} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`flex-row items-center px-5 py-4 bg-white shadow-sm z-20`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-gray-100 rounded-full mr-4`}>
            <Ionicons name="arrow-back" size={24} color="#ED1C24" />
          </TouchableOpacity>
          <View>
            <Text style={tw`text-xl font-black text-gray-800 tracking-tight`}>Evaluasi Perbaikan</Text>
            <Text style={tw`text-sm font-bold text-gray-500`}>{issue.handover.noPolisi}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={tw`p-5 pb-30`} showsVerticalScrollIndicator={false}>
          {issue.status === 'ONGOING' ? (
            <View style={tw`bg-white rounded-2xl p-6 items-center justify-center shadow-sm border border-gray-100 mt-10`}>
              <View style={tw`w-20 h-20 bg-yellow-100 rounded-full items-center justify-center mb-4`}>
                <Ionicons name="time-outline" size={40} color="#D97706" />
              </View>
              <Text style={tw`text-lg font-bold text-gray-800 text-center mb-2`}>Menunggu Perbaikan AMT</Text>
              <Text style={tw`text-sm text-gray-500 text-center`}>
                AMT belum mengirimkan foto bukti perbaikan atau sedang melakukan perbaikan ulang berdasarkan evaluasi Anda sebelumnya.
              </Text>
            </View>
          ) : (
            brokenItems.map((item, index) => {
            const evalState = evaluations[item.id];
            const isApproved = evalState?.approved === true;
            const isRejected = evalState?.approved === false;

            return (
              <View key={item.id} style={tw`bg-white p-5 rounded-2xl mb-6 shadow-md border ${isApproved ? 'border-green-300' : isRejected ? 'border-red-300' : 'border-gray-200'}`}>
                <View style={tw`flex-row items-center mb-3`}>
                  <View style={tw`w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3`}>
                    <Ionicons name="construct" size={20} color="#ED1C24" />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider`}>{item.category}</Text>
                    <Text style={tw`text-lg font-black text-gray-800`}>{item.name}</Text>
                  </View>
                </View>

                {/* Info AMT */}
                {item.repairNote ? (
                  <View style={tw`bg-blue-50 p-3 rounded-xl mb-4 border border-blue-100`}>
                    <Text style={tw`text-xs font-bold text-blue-800 mb-1`}>Catatan Perbaikan (AMT):</Text>
                    <Text style={tw`text-sm text-gray-700`}>{item.repairNote}</Text>
                  </View>
                ) : (
                  <Text style={tw`text-sm text-orange-600 mb-4 font-medium`}>Belum ada catatan perbaikan / Belum dikirim AMT.</Text>
                )}

                {item.repairPhotoUrl && (
                  <View style={tw`mb-4`}>
                    <Text style={tw`text-xs font-bold text-gray-500 mb-2`}>Foto Bukti Perbaikan:</Text>
                    <Image 
                      source={{ uri: `${API_URL}/${item.repairPhotoUrl}` }} 
                      style={tw`w-full h-48 rounded-xl bg-gray-100`} 
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Actions */}
                <Text style={tw`text-xs font-bold text-gray-500 mb-2 mt-2`}>Evaluasi Admin:</Text>
                <View style={tw`flex-row gap-3 mb-3`}>
                  <TouchableOpacity 
                    style={tw`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${isApproved ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}
                    onPress={() => handleApprove(item.id)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={isApproved ? "white" : "#9CA3AF"} style={tw`mr-2`} />
                    <Text style={tw`font-bold ${isApproved ? 'text-white' : 'text-gray-500'}`}>Selesai</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={tw`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${isRejected ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}
                    onPress={() => handleReject(item.id)}
                  >
                    <Ionicons name="close-circle" size={20} color={isRejected ? "white" : "#9CA3AF"} style={tw`mr-2`} />
                    <Text style={tw`font-bold ${isRejected ? 'text-white' : 'text-gray-500'}`}>Ditolak</Text>
                  </TouchableOpacity>
                </View>

                {/* Input reason if rejected */}
                {isRejected && (
                  <View style={tw`mt-2`}>
                    <Text style={tw`text-xs font-bold text-red-500 mb-1`}>Alasan Penolakan (Wajib):</Text>
                    <TextInput
                      style={tw`bg-red-50 border border-red-200 p-3 rounded-xl text-gray-800`}
                      placeholder="Misal: Wiper masih robek..."
                      placeholderTextColor="#999"
                      value={evalState.reason}
                      onChangeText={(text) => updateReason(item.id, text)}
                      multiline
                    />
                  </View>
                )}
              </View>
            );
          })}
          )}
        </ScrollView>

        {/* Floating Submit Button - Only show if PENDING_APPROVAL */}
        {issue.status !== 'ONGOING' && (
          <View style={tw`absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 shadow-lg`}>
            <TouchableOpacity 
              style={tw`w-full bg-[#0055A5] p-4 rounded-2xl items-center shadow-lg ${isSubmitting ? 'opacity-70' : ''}`}
              onPress={submitEvaluation}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white font-black text-lg`}>Kirim Evaluasi</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
