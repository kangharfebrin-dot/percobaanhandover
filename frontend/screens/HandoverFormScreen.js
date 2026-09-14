import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import tw from 'twrnc';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const CHECKLIST_A = [
  "Kondisi Rem", "Kondisi Ban", "Kondisi Wiper", "Kondisi Lampu-lampu",
  "Kondisi Kompartemen Tangki", "Keberadaan APAR", "Oli Mesin", "Air Radiator",
  "Keberadaan STNK", "Keberadaan Surat Keur", "Keberadaan Surat Tera",
  "Keberadaan Kotak P3K", "Keberadaan Flame Trap", "Keberadaan Ban Serep",
  "Keberadaan Tools Kit termasuk dongkrak", "Keberadaan Selang bongkar",
  "Keberadaan Grounding Cable", "Keberadaan Spill Kit"
];

const CHECKLIST_B = [
  "Membawa SIM Sesuai Kendaraan", "Surat Ijin Masuk Area TBBM berlaku",
  "Menggunakan Seragam Kerja", "Menggunakan Safety Shoes", "Menggunakan Safety Helm",
  "Menggunakan ID Card", "Menggunakan Safety Glove", "Membawa Jas Hujan",
  "Membawa Buku Saku AMT", "Membawa Catatan Perjalanan AMT"
];

const PERTAMINA_BLUE = ['#0055A5', '#003366'];
const PERTAMINA_RED = ['#ED1C24', '#B30000'];

export default function HandoverFormScreen({ route, navigation }) {
  const { noPolisi } = route.params;
  const [shift, setShift] = useState('Shift 1');
  const [odoMeter, setOdoMeter] = useState('');
  const [items, setItems] = useState([
    ...CHECKLIST_A.map(name => ({ category: 'A', name, isGood: true })),
    ...CHECKLIST_B.map(name => ({ category: 'B', name, isGood: true }))
  ]);

  const toggleItem = (index) => {
    const newItems = [...items];
    newItems[index].isGood = !newItems[index].isGood;
    setItems(newItems);
  };

  const handleNext = () => {
    if (!odoMeter) {
      Alert.alert("Error", "Harap isi Odo Meter.");
      return;
    }
    navigation.navigate('Camera', { noPolisi, shift, items, odoMeter });
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <LinearGradient colors={PERTAMINA_BLUE} style={tw`pt-6 pb-8 px-4 flex-row items-center rounded-b-[30px] shadow-lg z-10`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-white/20 rounded-full mr-4`}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={tw`text-2xl font-extrabold text-white`}>Form Handover</Text>
          <Text style={tw`text-blue-200 font-medium`}>{noPolisi}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={tw`flex-1 px-4 pt-6`} showsVerticalScrollIndicator={false}>
        <View style={tw`bg-white p-5 rounded-2xl mb-6 shadow-sm border border-gray-100`}>
          <View style={tw`flex-row items-center mb-4`}>
            <Ionicons name="car-sport" size={20} color="#0055A5" style={tw`mr-2`} />
            <Text style={tw`text-gray-800 font-bold text-lg`}>Info Perjalanan</Text>
          </View>
          
          <Text style={tw`text-gray-500 font-semibold text-xs uppercase mb-1`}>Shift</Text>
          <TextInput 
            style={tw`bg-gray-50 p-4 rounded-xl border border-gray-200 text-black mb-4 font-bold text-base`}
            value={shift}
            onChangeText={setShift}
          />
          
          <Text style={tw`text-gray-500 font-semibold text-xs uppercase mb-1`}>Odo Meter (KM)</Text>
          <TextInput 
            style={tw`bg-gray-50 p-4 rounded-xl border border-gray-200 text-black font-bold text-base`}
            placeholder="Misal: 150000"
            keyboardType="numeric"
            value={odoMeter}
            onChangeText={setOdoMeter}
          />
        </View>

        <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6`}>
          <View style={tw`bg-gray-100 p-4 flex-row items-center border-b border-gray-200`}>
            <Ionicons name="construct" size={20} color="#00A651" style={tw`mr-2`} />
            <Text style={tw`font-bold text-lg text-gray-800`}>A. Perlengkapan Mobil Tangki</Text>
          </View>
          {items.filter(i => i.category === 'A').map((item, idx) => {
            const originalIdx = items.findIndex(x => x.name === item.name);
            return (
              <View key={idx} style={tw`flex-row justify-between items-center py-4 px-4 border-b border-gray-100 ${!item.isGood ? 'bg-red-50' : ''}`}>
                <Text style={tw`flex-1 text-gray-700 font-medium ${!item.isGood ? 'text-red-700' : ''}`}>{item.name}</Text>
                <View style={tw`flex-row items-center ml-2`}>
                  <Text style={tw`mr-2 text-xs font-bold ${item.isGood ? 'text-green-600' : 'text-red-500'}`}>
                    {item.isGood ? 'BAIK' : 'RUSAK'}
                  </Text>
                  <Switch
                    value={item.isGood}
                    onValueChange={() => toggleItem(originalIdx)}
                    trackColor={{ false: "#fca5a5", true: "#86efac" }}
                    thumbColor={item.isGood ? "#00A651" : "#ED1C24"}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6`}>
          <View style={tw`bg-gray-100 p-4 flex-row items-center border-b border-gray-200`}>
            <Ionicons name="person-circle" size={20} color="#0055A5" style={tw`mr-2`} />
            <Text style={tw`font-bold text-lg text-gray-800`}>B. Perlengkapan AMT</Text>
          </View>
          {items.filter(i => i.category === 'B').map((item, idx) => {
            const originalIdx = items.findIndex(x => x.name === item.name);
            return (
              <View key={idx} style={tw`flex-row justify-between items-center py-4 px-4 border-b border-gray-100 ${!item.isGood ? 'bg-red-50' : ''}`}>
                <Text style={tw`flex-1 text-gray-700 font-medium ${!item.isGood ? 'text-red-700' : ''}`}>{item.name}</Text>
                <View style={tw`flex-row items-center ml-2`}>
                  <Text style={tw`mr-2 text-xs font-bold ${item.isGood ? 'text-green-600' : 'text-red-500'}`}>
                    {item.isGood ? 'ADA' : 'TIDAK'}
                  </Text>
                  <Switch
                    value={item.isGood}
                    onValueChange={() => toggleItem(originalIdx)}
                    trackColor={{ false: "#fca5a5", true: "#86efac" }}
                    thumbColor={item.isGood ? "#00A651" : "#ED1C24"}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={tw`h-10`} />
      </ScrollView>

      <View style={tw`p-4 bg-white border-t border-gray-200 shadow-2xl`}>
        <TouchableOpacity 
          style={tw`rounded-xl overflow-hidden shadow-lg`}
          onPress={handleNext}
        >
          <LinearGradient colors={PERTAMINA_BLUE} style={tw`p-4 items-center flex-row justify-center`}>
            <Ionicons name="camera" size={24} color="white" style={tw`mr-2`} />
            <Text style={tw`text-white font-bold text-lg`}>LANJUT AMBIL FOTO</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
