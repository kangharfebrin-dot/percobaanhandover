const fs = require('fs');

// --- Fix WorkerListScreen.js ---
let workerPath = 'e:/Magang/HandoverApp/frontend/screens/admin/WorkerListScreen.js';
let workerCode = fs.readFileSync(workerPath, 'utf8');

// Fix the search crash when item.name or item.username is null
workerCode = workerCode.replace(
  `const matchesSearch = item.name.toLowerCase().includes(searchLower) || item.username.toLowerCase().includes(searchLower);`,
  `const matchesSearch = (item.name || '').toLowerCase().includes(searchLower) || (item.username || '').toLowerCase().includes(searchLower);`
);

fs.writeFileSync(workerPath, workerCode);


// --- Fix PengawasListScreen.js ---
let pengawasPath = 'e:/Magang/HandoverApp/frontend/screens/admin/PengawasListScreen.js';
let pengawasCode = fs.readFileSync(pengawasPath, 'utf8');

// 1. Remove Jabatan Filter buttons
const filterTarget = `<TouchableOpacity onPress={() => setFilterJabatan('Semua')} style={tw\`px-4 py-2 rounded-full mr-2 border \${filterJabatan === 'Semua' ? 'bg-[#4F46E5] border-[#4F46E5]' : 'bg-white border-gray-200'}\`}>
                <Text style={tw\`text-xs font-bold \${filterJabatan === 'Semua' ? 'text-white' : 'text-gray-500'}\`}>Semua AMT</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterJabatan('AMT I')} style={tw\`px-4 py-2 rounded-full mr-2 border \${filterJabatan === 'AMT I' ? 'bg-[#4F46E5] border-[#4F46E5]' : 'bg-white border-gray-200'}\`}>
                <Text style={tw\`text-xs font-bold \${filterJabatan === 'AMT I' ? 'text-white' : 'text-gray-500'}\`}>AMT I</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterJabatan('AMT II')} style={tw\`px-4 py-2 rounded-full mr-4 border \${filterJabatan === 'AMT II' ? 'bg-[#4F46E5] border-[#4F46E5]' : 'bg-white border-gray-200'}\`}>
                <Text style={tw\`text-xs font-bold \${filterJabatan === 'AMT II' ? 'text-white' : 'text-gray-500'}\`}>AMT II</Text>
              </TouchableOpacity>`;

pengawasCode = pengawasCode.replace(filterTarget, '');

// 2. Fix the search crash
pengawasCode = pengawasCode.replace(
  `const matchesSearch = item.name.toLowerCase().includes(searchLower) ||
                          item.username.toLowerCase().includes(searchLower);`,
  `const matchesSearch = (item.name || '').toLowerCase().includes(searchLower) || (item.username || '').toLowerCase().includes(searchLower);`
);

// 3. Always matchesJabatan
pengawasCode = pengawasCode.replace(
  `let matchesJabatan = true;
    if (filterJabatan !== 'Semua') {
      matchesJabatan = item.jabatan === filterJabatan;
    }

    return matchesSearch && matchesJabatan;`,
  `return matchesSearch;`
);

// 4. Update username regex
pengawasCode = pengawasCode.replace(
  `/^[a-zA-Z0-9]+$/.test(username);`,
  `/^[a-zA-Z0-9\\s.\\-_]+$/.test(username);`
);
pengawasCode = pengawasCode.replace(
  `showNotification('Format Tidak Valid', 'Username hanya boleh berisi huruf dan angka tanpa spasi.', 'info');`,
  `showNotification('Format Tidak Valid', 'Username hanya boleh berisi huruf, angka, spasi, titik, strip atau underscore.', 'info');`
);

// 5. Update delete notification (if it uses Toast before, change to showNotification)
pengawasCode = pengawasCode.replace(
  `Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Data pengawas berhasil disimpan.',
      });`,
  `showNotification('Berhasil', 'Data pengawas berhasil disimpan.', 'success');`
);
pengawasCode = pengawasCode.replace(
  `Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Pengawas berhasil dihapus.',
      });`,
  `showNotification('Berhasil', 'Pengawas berhasil dihapus.', 'success');`
);

// We need to add the beautiful confirm modal for deleting in PengawasListScreen
const modalConfirmStr = `{/* Modal Konfirmasi Hapus */}
      <Modal visible={confirmModalVisible} animationType="fade" transparent={true} onRequestClose={() => setConfirmModalVisible(false)}>
        <View style={tw\`flex-1 justify-center items-center bg-black/50\`}>
          <View style={tw\`bg-white w-11/12 max-w-sm rounded-3xl p-6 items-center shadow-xl\`}>
            <View style={tw\`w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4\`}>
              <Feather name="alert-triangle" size={32} color="#EF4444" />
            </View>
            <Text style={tw\`text-xl font-black text-gray-800 mb-2\`}>Hapus Pengawas?</Text>
            <Text style={tw\`text-center text-gray-500 font-bold mb-6\`}>
              Apakah Anda yakin ingin menghapus <Text style={tw\`text-red-500\`}>{pengawasToDelete?.name}</Text>? Tindakan ini tidak dapat dibatalkan.
            </Text>
            <View style={tw\`flex-row w-full justify-between gap-3\`}>
              <TouchableOpacity onPress={() => setConfirmModalVisible(false)} style={tw\`flex-1 p-4 rounded-xl border border-gray-200 bg-gray-50 items-center\`}>
                <Text style={tw\`font-bold text-gray-600\`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeletePengawas} style={tw\`flex-1 p-4 rounded-xl bg-red-500 items-center shadow-lg shadow-red-500/30\`}>
                <Text style={tw\`font-bold text-white\`}>Ya, Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>`;

// Replace old Alert.alert confirm or whatever if there's no modal.
// Wait, looking at the code, it uses setConfirmModalVisible(true) for delete!
// Let's check if the confirm modal is already there. If not, add it.
if (!pengawasCode.includes('Modal Konfirmasi Hapus')) {
    pengawasCode = pengawasCode.replace(
      `</Modal>`,
      `</Modal>\n\n      ${modalConfirmStr}`
    );
}


fs.writeFileSync(pengawasPath, pengawasCode);
console.log('Fixed PengawasListScreen and WorkerListScreen search');
