import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  username = '',
  onUsernameChange,
}) {
  const [internalUsername, setInternalUsername] = useState(username);

  useEffect(() => {
    setInternalUsername(username);
  }, [username, visible]);

  const handleTextChange = (text) => {
    setInternalUsername(text);
    if (onUsernameChange) {
      onUsernameChange(text);
    }
  };

  const handleConfirm = () => {
    if (onSubmit) {
      onSubmit(internalUsername);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[
        tw`flex-1 justify-center items-center bg-black/60 px-4`,
        Platform.OS === 'web' ? { zIndex: 99999 } : {}
      ]}>
        <View style={tw`bg-white w-full max-w-sm rounded-[32px] p-7 items-center shadow-2xl relative overflow-hidden`}>
          {/* Decorative Glow */}
          <View style={tw`absolute -top-10 -right-10 w-28 h-28 bg-red-50 rounded-full`} />

          <View style={tw`w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm`}>
            <Ionicons name="key" size={32} color="#ED1C24" />
          </View>

          <Text style={tw`text-2xl font-black text-gray-800 mb-2 tracking-tight text-center`}>
            Reset Password
          </Text>

          <Text style={tw`text-gray-500 text-center text-sm mb-5 leading-5 px-1`}>
            Ajukan permohonan reset password kepada Admin. Notifikasi resmi akan dikirimkan langsung ke dashboard Admin.
          </Text>

          {/* Username Input / Confirmation Badge */}
          <View style={tw`w-full mb-6`}>
            <Text style={tw`text-gray-400 font-extrabold mb-1.5 ml-1 text-[10px] uppercase tracking-wider`}>
              Username Akun
            </Text>
            <View style={tw`flex-row items-center bg-slate-50 border-2 border-slate-100 rounded-2xl px-3.5 py-1`}>
              <Ionicons name="person-outline" size={18} color="#6B7280" />
              <TextInput
                style={tw`flex-1 py-2.5 px-3 text-gray-800 font-bold text-sm`}
                placeholder="Masukkan username Anda"
                value={internalUsername}
                onChangeText={handleTextChange}
                autoCapitalize="none"
                editable={!isSubmitting}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={tw`w-full flex-row justify-between`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-100 py-3.5 rounded-2xl mr-2 items-center`}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={tw`text-gray-600 font-bold text-sm`}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-1 ${isSubmitting ? 'bg-red-300' : 'bg-[#ED1C24]'} py-3.5 rounded-2xl ml-2 items-center shadow-md flex-row justify-center`}
              onPress={handleConfirm}
              disabled={isSubmitting || !internalUsername?.trim()}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={tw`mr-2`} />
                  <Text style={tw`text-white font-bold text-sm`}>Mengirim...</Text>
                </>
              ) : (
                <Text style={tw`text-white font-bold text-sm`}>Kirim Permintaan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
