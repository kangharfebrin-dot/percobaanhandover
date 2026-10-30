import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { getFlashModeInfo, getNextFlashMode, FLASH_MODES } from '../utils/cameraFlashHelper';

/**
 * CameraFlashControl Component
 * 
 * Tombol kontrol Flash/Senter kamera tanpa dropdown:
 * - Setiap kali ditekan langsung berganti mode (cycle).
 * - Pada Scanner (isScanner=true): hanya 2 mode (MATI <-> NYALA).
 * - Pada Foto Kendaraan (isScanner=false): 3 mode (OFF -> AUTO -> ON -> OFF).
 * - Mendukung variant 'circular' (untuk bawah kanan kamera) dan 'pill' (untuk atas kanan).
 */
export default function CameraFlashControl({
  mode = FLASH_MODES.OFF,
  onModeChange,
  style,
  isScanner = false,
  variant = 'pill',
  disabled = false,
}) {
  const info = getFlashModeInfo(mode, isScanner);

  const handlePress = () => {
    const nextMode = getNextFlashMode(mode, isScanner);
    if (Platform.OS === 'web' && nextMode !== FLASH_MODES.OFF) {
      Toast.show({
        type: 'info',
        text1: 'Flash Tidak Tersedia',
        text2: 'Lampu flash/senter tidak didukung pada browser web.',
      });
    }

    if (onModeChange) {
      onModeChange(nextMode);
    }
  };

  if (variant === 'circular') {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        disabled={disabled}
        accessibilityLabel={`Kontrol Flash: ${info.label}. Tekan untuk beralih mode.`}
        accessibilityRole="button"
        style={[
          tw`w-16 h-16 rounded-full border-2 items-center justify-center shadow-2xl`,
          {
            backgroundColor: mode === FLASH_MODES.ON
              ? 'rgba(20, 20, 20, 0.9)'
              : mode === FLASH_MODES.AUTO
              ? 'rgba(12, 74, 110, 0.5)'
              : 'rgba(255, 255, 255, 0.15)',
            borderColor: info.borderColor,
          },
          style,
        ]}
      >
        <Ionicons name={info.icon} size={24} color={info.color} />
        <Text style={[tw`text-[10px] font-black tracking-wider uppercase mt-0.5`, { color: info.color }]}>
          {info.label}
        </Text>
      </TouchableOpacity>
    );
  }

  // Default: variant 'pill' (kapsul horizontal)
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={`Kontrol Flash: ${info.label}. Tekan untuk beralih mode.`}
      accessibilityRole="button"
      style={[
        tw`flex-row items-center px-4 py-2.5 rounded-full border shadow-xl`,
        {
          backgroundColor: mode === FLASH_MODES.ON
            ? 'rgba(20, 20, 20, 0.9)'
            : mode === FLASH_MODES.AUTO
            ? 'rgba(12, 74, 110, 0.5)'
            : 'rgba(15, 23, 42, 0.75)',
          borderColor: info.borderColor,
        },
        style,
      ]}
    >
      <Ionicons name={info.icon} size={20} color={info.color} style={tw`mr-1.5`} />
      <Text style={[tw`text-[12px] font-black tracking-wider uppercase`, { color: info.color }]}>
        {info.label}
      </Text>
    </TouchableOpacity>
  );
}
