import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const PERTAMINA_BLUE = ['#0055A5', '#003366'];
const PERTAMINA_RED = ['#ED1C24', '#B30000'];

export default function HistoryScreen({ navigation }) {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/handovers');
      setHandovers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isNormal = item.status === 'Siap Operasi (Normal)';
    return (
      <View style={tw`bg-white p-5 rounded-2xl mb-4 shadow-md border ${isNormal ? 'border-green-100' : 'border-red-200'}`}>
        <View style={tw`flex-row justify-between items-start mb-3`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-12 h-12 rounded-full items-center justify-center mr-3 ${isNormal ? 'bg-green-100' : 'bg-red-100'}`}>
              <Ionicons name={isNormal ? "checkmark-circle" : "warning"} size={28} color={isNormal ? "#00A651" : "#ED1C24"} />
            </View>
            <View>
              <Text style={tw`text-xl font-bold text-gray-800`}>{item.noPolisi}</Text>
              <Text style={tw`text-sm text-gray-500`}>{item.shift} • {item.user.name}</Text>
            </View>
          </View>
          <View style={tw`px-3 py-1 rounded-full ${isNormal ? 'bg-green-100' : 'bg-red-500'}`}>
            <Text style={tw`text-xs font-bold ${isNormal ? 'text-green-700' : 'text-white'}`}>
              {isNormal ? 'NORMAL' : 'ISU'}
            </Text>
          </View>
        </View>

        <Text style={tw`text-xs text-gray-400 mb-2`}>Tanggal: {new Date(item.timestamp).toLocaleString()}</Text>

        {!isNormal && (
          <View style={tw`mt-2 bg-red-50 p-3 rounded-xl border border-red-100`}>
            <Text style={tw`text-red-800 font-bold mb-1 text-sm`}>Detail Kendala:</Text>
            {item.items.filter(i => !i.isGood).map((issue, idx) => (
              <Text key={idx} style={tw`text-red-600 text-xs my-1`}>• {issue.name}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-[#0055A5] z-10 rounded-b-[30px] shadow-lg`}>
        <LinearGradient colors={PERTAMINA_BLUE} style={tw`pt-6 pb-6 px-4 rounded-b-[30px]`}>
          <View style={tw`w-full max-w-4xl mx-auto flex-row items-center`}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-white/20 rounded-full mr-4`}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={tw`text-2xl font-extrabold text-white`}>Riwayat Handover</Text>
          </View>
        </LinearGradient>
      </View>

      {loading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#0055A5" />
          <Text style={tw`mt-4 text-gray-500`}>Memuat Data...</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={tw`p-6 pt-8 w-full max-w-4xl mx-auto`}
          data={handovers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={tw`items-center mt-20`}>
              <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
              <Text style={tw`text-center text-gray-400 font-medium mt-4 text-lg`}>Belum ada riwayat handover.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
