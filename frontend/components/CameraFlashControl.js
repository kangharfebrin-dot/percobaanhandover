import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { getFlashModeInfo, FLASH_MODES } from '../utils/cameraFlashHelper';

/**
 * CameraFlashControl Component
 * 
 * Komponen kontrol Flash/Senter kamera pojok kanan atas:
 * - OFF: Flash mati total
 * - AUTO: Flash menyala otomatis saat jepret foto (pada QR Scanner tidak menyalakan senter terus-menerus)
 * - ON: Senter LED HP menyala terus (torch mode)
 */
export default function CameraFlashControl({
  mode = FLASH_MODES.OFF,
  onModeChange,
  style,
  isScanner = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const info = getFlashModeInfo(mode);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handleSelect = (newMode) => {
    if (Platform.OS === 'web' && newMode !== FLASH_MODES.OFF) {
      Toast.show({
        type: 'info',
        text1: 'Flash Tidak Tersedia',
        text2: 'Lampu flash/senter tidak didukung pada browser web.',
      });
    }

    if (onModeChange) {
      onModeChange(newMode);
    }
    setIsOpen(false);
  };

  const modes = [FLASH_MODES.OFF, FLASH_MODES.AUTO, FLASH_MODES.ON];

  return (
    <View style={[tw`items-end z-50`, style]}>
      {/* Tombol Utama Flash (Pojok Kanan Atas) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsOpen(!isOpen)}
        disabled={disabled}
        accessibilityLabel={`Kontrol Flash Kamera. Mode aktif: ${info.label}`}
        accessibilityRole="button"
        style={[
          tw`flex-row items-center px-3.5 py-2.5 rounded-full border shadow-xl`,
          {
            backgroundColor: mode === FLASH_MODES.ON ? 'rgba(20, 20, 20, 0.9)' : 'rgba(15, 23, 42, 0.75)',
            borderColor: info.borderColor,
          },
        ]}
      >
        <Ionicons name={info.icon} size={20} color={info.color} style={tw`mr-1.5`} />
        <Text style={[tw`text-[12px] font-black tracking-wider uppercase`, { color: info.color }]}>
          {info.label}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={info.color}
          style={tw`ml-1.5`}
        />
      </TouchableOpacity>

      {/* Menu Dropdown Pilihan Mode (OFF, AUTO, ON) */}
      {isOpen && (
        <Animated.View
          style={[
            tw`mt-2 bg-[#0F172A]/95 p-1.5 rounded-2xl border border-white/20 shadow-2xl flex-row items-center`,
            { opacity: fadeAnim },
          ]}
        >
          {modes.map((m) => {
            const mInfo = getFlashModeInfo(m);
            const isActive = mode === m;
            return (
              <TouchableOpacity
                key={m}
                activeOpacity={0.7}
                onPress={() => handleSelect(m)}
                accessibilityLabel={`Pilih mode ${mInfo.label}`}
                style={[
                  tw`flex-row items-center px-3 py-2 rounded-xl`,
                  isActive
                    ? [
                        tw`border`,
                        {
                          backgroundColor: m === FLASH_MODES.ON 
                            ? 'rgba(250, 204, 21, 0.25)' 
                            : 'rgba(0, 85, 165, 0.5)',
                          borderColor: mInfo.color,
                        },
                      ]
                    : tw`bg-transparent`,
                ]}
              >
                <Ionicons
                  name={mInfo.icon}
                  size={16}
                  color={isActive ? mInfo.color : '#9CA3AF'}
                  style={tw`mr-1.5`}
                />
                <Text
                  style={[
                    tw`text-[11.5px] font-bold tracking-wider uppercase`,
                    { color: isActive ? '#FFFFFF' : '#9CA3AF' },
                  ]}
                >
                  {mInfo.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}
