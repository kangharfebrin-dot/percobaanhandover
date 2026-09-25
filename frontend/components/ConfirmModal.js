import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import tw from 'twrnc';
import { Feather } from '@expo/vector-icons';

export default function ConfirmModal({ visible, title, message, onConfirm, onCancel, confirmText = 'Ya, Hapus', cancelText = 'Batal' }) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onCancel}>
      <View style={tw`flex-1 justify-center items-center bg-black/40 px-6`}>
        <View style={tw`bg-white w-full max-w-sm rounded-[35px] p-8 items-center shadow-2xl relative overflow-hidden`}>
          
          {/* Animated red glow effect */}
          <View style={tw`absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full`} />
          
          <View style={tw`w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-5 shadow-sm border-4 border-white z-10`}>
            <Feather name="trash-2" size={32} color="#EF4444" />
          </View>

          <Text style={tw`text-2xl font-black text-gray-800 mb-2 tracking-tight text-center z-10`}>{title}</Text>
          <Text style={tw`text-center text-gray-500 font-medium mb-8 z-10 px-2`}>{message}</Text>

          <View style={tw`flex-row justify-between w-full z-10`}>
            <TouchableOpacity 
              style={tw`flex-1 bg-gray-100 py-4 rounded-2xl items-center mr-2`} 
              onPress={onCancel}
            >
              <Text style={tw`text-gray-600 font-bold`}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={tw`flex-1 bg-red-500 py-4 rounded-2xl items-center ml-2 shadow-lg shadow-red-500/30`} 
              onPress={onConfirm}
            >
              <Text style={tw`text-white font-bold`}>{confirmText}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
