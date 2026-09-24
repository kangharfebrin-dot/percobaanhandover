import os
path = r'd:\UKSW\Pertamina\HandoverApp\frontend\screens\shared\HandoverDetailScreen.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """            {/* Catatan */}
            {!isBaik && parsed.catatan ? (
              <View style={tw`mt-3 bg-red-50 p-3 rounded-xl border border-red-100`}>
                <Text style={tw`text-xs font-bold text-red-800 uppercase tracking-wider mb-1`}>Catatan:</Text>
                <Text style={tw`text-sm text-red-700 leading-5`}>{parsed.catatan}</Text>
              </View>
            ) : null}
          </View>"""
replacement = """            {/* Catatan */}
            {!isBaik && parsed.catatan ? (
              <View style={tw`mt-3 bg-red-50 p-3 rounded-xl border border-red-100`}>
                <Text style={tw`text-xs font-bold text-red-800 uppercase tracking-wider mb-1`}>Catatan:</Text>
                <Text style={tw`text-sm text-red-700 leading-5`}>{parsed.catatan}</Text>
              </View>
            ) : null}

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
                  <TouchableOpacity onPress={() => setSelectedPhoto(`${API_URL}/${item.repairPhotoUrl}`)}>
                    <Image source={{ uri: `${API_URL}/${item.repairPhotoUrl}` }} style={tw`w-full h-32 rounded-lg mt-2`} />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>"""

content = content.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced')
