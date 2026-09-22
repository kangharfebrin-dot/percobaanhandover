import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

export default function TextLogo({ style, textWhite = false }) {
  return (
    <View style={[tw`flex-row items-center justify-center`, style]}>
      <View style={tw`w-2 h-8 rounded-full bg-[#ED1C24] mr-1`} />
      <View style={tw`w-2 h-8 rounded-full bg-[#2ECC71] mr-1`} />
      <View style={tw`w-2 h-8 rounded-full bg-[#0055A5] mr-2`} />
      <Text style={tw`text-2xl font-black ${textWhite ? 'text-white' : 'text-gray-800'} tracking-tighter`}>DIGI</Text>
      <Text style={tw`text-2xl font-black ${textWhite ? 'text-blue-200' : 'text-[#0055A5]'} tracking-tighter`}>Handover</Text>
    </View>
  );
}
