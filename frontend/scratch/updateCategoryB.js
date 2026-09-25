const fs = require('fs');

// 1. Update FixVerificationScreen.js
const fixPath = 'E:/Magang/HandoverApp/frontend/screens/user/FixVerificationScreen.js';
let fixCode = fs.readFileSync(fixPath, 'utf8');

// Update validation inside submitVerification
const oldValStart = '    // Check if notes and photos are provided for BAIK items';
const oldValEnd = '    setSubmitting(true);';
const newVal = `    // Check if notes and photos are provided for BAIK items
    for (const item of itemsToRepair) {
      const isCategoryB = item.category === 'B' || item.name.toLowerCase().includes('buku saku');
      if (!item.repairNote.trim()) {
        Toast.show({
          type: 'info',
          text1: 'Peringatan',
          text2: isCategoryB 
            ? \`Catatan kelengkapan untuk \${item.name} wajib diisi.\`
            : \`Catatan perbaikan untuk \${item.name} wajib diisi.\`
        });
        return;
      }
      if (!isCategoryB && !item.photo) {
        Toast.show({
          type: 'info',
          text1: 'Peringatan',
          text2: \`Bukti foto untuk perbaikan \${item.name} wajib dilampirkan.\`
        });
        return;
      }
    }

    setSubmitting(true);`;

const valStartIdx = fixCode.indexOf(oldValStart);
const valEndIdx = fixCode.indexOf(oldValEnd, valStartIdx);
if (valStartIdx !== -1 && valEndIdx !== -1) {
  fixCode = fixCode.substring(0, valStartIdx) + newVal + fixCode.substring(valEndIdx + oldValEnd.length);
}

// Update brokenItems.map inside JSX
const oldMapStart = '        ) : (\r\n          brokenItems.map((item, index) => (';
const oldMapStartLF = '        ) : (\n          brokenItems.map((item, index) => (';
const oldMapEnd = '          ))\r\n        )}';
const oldMapEndLF = '          ))\n        )}';

let mapStartIdx = fixCode.indexOf(oldMapStart);
let startLen = oldMapStart.length;
if (mapStartIdx === -1) {
  mapStartIdx = fixCode.indexOf(oldMapStartLF);
  startLen = oldMapStartLF.length;
}

let mapEndIdx = fixCode.indexOf(oldMapEnd, mapStartIdx);
let endLen = oldMapEnd.length;
if (mapEndIdx === -1) {
  mapEndIdx = fixCode.indexOf(oldMapEndLF, mapStartIdx);
  endLen = oldMapEndLF.length;
}

if (mapStartIdx !== -1 && mapEndIdx !== -1) {
  const newMapContent = `        ) : (
          brokenItems.map((item, index) => {
            const isCategoryB = item.category === 'B' || item.name.toLowerCase().includes('buku saku');
            const statusPrevLabel = isCategoryB ? 'STATUS SEBELUMNYA: TIDAK ADA' : 'STATUS SEBELUMNYA: RUSAK';
            const btnDoneLabel = isCategoryB ? 'SUDAH ADA' : 'SUDAH DIPERBAIKI';
            const btnNotDoneLabel = isCategoryB ? 'BELUM ADA' : 'BELUM DIPERBAIKI';
            const noteLabel = isCategoryB ? 'Catatan Kelengkapan' : 'Catatan Perbaikan';
            const notePlaceholder = isCategoryB ? 'Contoh: Buku saku AMT sudah dibawa dan lengkap...' : 'Contoh: Komponen sudah diganti/diperbaiki...';
            const photoLabel = isCategoryB ? 'Bukti Foto (Opsional)' : 'Bukti Foto';

            return (
              <View key={item.id} style={tw\`bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100\`}>
                <View style={tw\`flex-row justify-between items-start mb-3\`}>
                  <View style={tw\`flex-1 mr-4\`}>
                    <Text style={tw\`text-xs font-bold text-gray-400 uppercase tracking-wider mb-1\`}>
                      {isCategoryB ? 'B. PERLENGKAPAN AMT' : 'A. PERLENGKAPAN TANGKI'}
                    </Text>
                    <Text style={tw\`font-bold text-gray-800 text-base mb-1\`}>{item.name}</Text>
                    <Text style={tw\`text-xs \${isCategoryB ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50'} font-bold self-start px-2 py-1 rounded\`}>
                      {statusPrevLabel}
                    </Text>
                    {item.adminRejectionNote ? (
                      <View style={tw\`bg-red-100 p-3 rounded-lg mt-3 border border-red-200\`}>
                        <Text style={tw\`text-xs font-bold text-red-800 mb-1\`}>DITOLAK ADMIN:</Text>
                        <Text style={tw\`text-sm text-red-700\`}>{item.adminRejectionNote}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={tw\`flex-row bg-gray-100 p-1 rounded-xl mb-4\`}>
                  <TouchableOpacity
                    style={tw\`flex-1 py-2 rounded-lg items-center \${item.repairStatus === 'BAIK' ? 'bg-green-500 shadow' : 'bg-transparent'}\`}
                    onPress={() => setItemStatus(index, 'BAIK')}
                  >
                    <Text style={tw\`font-bold text-xs \${item.repairStatus === 'BAIK' ? 'text-white' : 'text-gray-500'}\`}>{btnDoneLabel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={tw\`flex-1 py-2 rounded-lg items-center \${item.repairStatus === 'RUSAK' ? 'bg-red-500 shadow' : 'bg-transparent'}\`}
                    onPress={() => setItemStatus(index, 'RUSAK')}
                  >
                    <Text style={tw\`font-bold text-xs \${item.repairStatus === 'RUSAK' ? 'text-white' : 'text-gray-500'}\`}>{btnNotDoneLabel}</Text>
                  </TouchableOpacity>
                </View>

                {item.repairStatus === 'BAIK' && (
                  <View style={tw\`mt-2 border-t border-gray-100 pt-3\`}>
                    <Text style={tw\`text-gray-700 font-semibold mb-2 text-sm\`}>{noteLabel} <Text style={tw\`text-red-500\`}>*</Text></Text>
                    <TextInput
                      style={tw\`bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-sm text-gray-700 min-h-[80px]\`}
                      placeholder={notePlaceholder}
                      placeholderTextColor="#9CA3AF"
                      multiline
                      value={item.repairNote}
                      onChangeText={(text) => updateItemNote(index, text)}
                    />

                    <Text style={tw\`text-gray-700 font-semibold mb-2 text-sm\`}>
                      {photoLabel} {!isCategoryB && <Text style={tw\`text-red-500\`}>*</Text>}
                    </Text>
                    {item.photo ? (
                      <View style={tw\`relative mb-2\`}>
                        <Image source={{ uri: item.photo.uri }} style={tw\`w-full h-40 rounded-xl\`} />
                        <TouchableOpacity 
                          style={tw\`absolute top-2 right-2 bg-red-500 p-2 rounded-full\`}
                          onPress={() => {
                            const newItems = [...brokenItems];
                            newItems[index].photo = null;
                            setBrokenItems(newItems);
                          }}
                        >
                          <Ionicons name="trash" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={tw\`bg-blue-50 border border-blue-200 border-dashed rounded-xl p-6 items-center justify-center mb-2\`}
                        onPress={() => openCamera(item.id)}
                      >
                        <Ionicons name="camera" size={32} color="#0055A5" />
                        <Text style={tw\`text-blue-700 font-semibold mt-2\`}>Ambil Foto Bukti</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}`;

  fixCode = fixCode.substring(0, mapStartIdx) + newMapContent + fixCode.substring(mapEndIdx + endLen);
  fs.writeFileSync(fixPath, fixCode, 'utf8');
  console.log('Successfully updated FixVerificationScreen.js with Category B handling!');
} else {
  console.error('Could not locate brokenItems.map bounds:', mapStartIdx, mapEndIdx);
}

// 2. Update IssueDetailScreen.js
const detailPath = 'E:/Magang/HandoverApp/frontend/screens/pengawas/IssueDetailScreen.js';
let detailCode = fs.readFileSync(detailPath, 'utf8');

detailCode = detailCode.replace(
  '<Ionicons name="construct" size={20} color="#ED1C24" />',
  '<Ionicons name={item.category === "B" ? "person" : "construct"} size={20} color={item.category === "B" ? "#0055A5" : "#ED1C24"} />'
);

detailCode = detailCode.replace(
  '<View style={tw`w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3`}>',
  '<View style={tw`w-10 h-10 rounded-full ${item.category === "B" ? "bg-blue-100" : "bg-red-100"} items-center justify-center mr-3`}>'
);

detailCode = detailCode.replace(
  '<Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider`}>{item.category}</Text>',
  '<Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider`}>{item.category === "B" ? "B. PERLENGKAPAN AMT" : "A. PERLENGKAPAN TANGKI"}</Text>'
);

detailCode = detailCode.replace(
  '<Text style={tw`text-xs font-bold text-blue-800 mb-1`}>Catatan Perbaikan (AMT):</Text>',
  '<Text style={tw`text-xs font-bold text-blue-800 mb-1`}>{item.category === "B" ? "Catatan Kelengkapan (AMT):" : "Catatan Perbaikan (AMT):"}</Text>'
);

detailCode = detailCode.replace(
  '<Text style={tw`text-xs font-bold text-gray-500 mb-2`}>Foto Bukti Perbaikan:</Text>',
  '<Text style={tw`text-xs font-bold text-gray-500 mb-2`}>{item.category === "B" ? "Foto Bukti Kelengkapan:" : "Foto Bukti Perbaikan:"}</Text>'
);

fs.writeFileSync(detailPath, detailCode, 'utf8');
console.log('Successfully updated IssueDetailScreen.js with Category B handling!');
