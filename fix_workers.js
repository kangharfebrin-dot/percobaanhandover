const fs = require('fs');
let path = 'e:/Magang/HandoverApp/frontend/screens/admin/WorkerListScreen.js';
let code = fs.readFileSync(path, 'utf8');

// 1. Tambah state jabatanDropdownVisible
if (!code.includes('const [showJabatanDropdown, setShowJabatanDropdown] = useState(false);')) {
    code = code.replace(
        "const [jabatan, setJabatan] = useState('');",
        "const [jabatan, setJabatan] = useState('');\n  const [showJabatanDropdown, setShowJabatanDropdown] = useState(false);"
    );
}

// 2. Edit Regex Username
code = code.replace(
    "/^[a-zA-Z0-9]+$/.test(username);",
    "/^[a-zA-Z0-9\\s.\\-_]+$/.test(username);" // Allow spaces, dots, dashes, underscores just in case
);
code = code.replace(
    "showNotification('Format Tidak Valid', 'Username hanya boleh berisi huruf dan angka tanpa spasi.', 'info');",
    "showNotification('Format Tidak Valid', 'Username hanya boleh berisi huruf, angka, spasi, titik, strip atau underscore.', 'info');"
);

// 3. Edit Dropdown Jabatan di Form
let formTarget = `            <View style={tw\`mb-4\`}>
              <Text style={tw\`text-xs font-bold text-gray-500 uppercase mb-2\`}>Jabatan</Text>
              <View style={tw\`flex-row justify-between mb-4\`}>
                <TouchableOpacity
                  style={tw\`flex-1 p-4 rounded-xl border \${jabatan === 'AMT I' ? 'border-[#0055A5] bg-[#0055A5]' : 'border-slate-200 bg-slate-50'} mr-2 items-center\`}
                  onPress={() => setJabatan('AMT I')}
                >
                  <Text style={tw\`font-bold \${jabatan === 'AMT I' ? 'text-white' : 'text-gray-600'}\`}>AMT I</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw\`flex-1 p-4 rounded-xl border \${jabatan === 'AMT II' ? 'border-[#0055A5] bg-[#0055A5]' : 'border-slate-200 bg-slate-50'} ml-2 items-center\`}
                  onPress={() => setJabatan('AMT II')}
                >
                  <Text style={tw\`font-bold \${jabatan === 'AMT II' ? 'text-white' : 'text-gray-600'}\`}>AMT II</Text>
                </TouchableOpacity>
              </View>
            </View>`;

let formReplacement = `            <View style={tw\`mb-4\`}>
              <Text style={tw\`text-xs font-bold text-gray-500 uppercase mb-2\`}>Jabatan</Text>
              <TouchableOpacity
                style={tw\`bg-slate-50 p-4 rounded-xl border border-slate-200 flex-row justify-between items-center\`}
                onPress={() => setShowJabatanDropdown(!showJabatanDropdown)}
              >
                <Text style={tw\`text-black font-bold\`}>{jabatan || "Pilih Jabatan"}</Text>
                <Feather name={showJabatanDropdown ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              {showJabatanDropdown && (
                <View style={tw\`bg-white mt-2 rounded-xl border border-slate-200 shadow-sm overflow-hidden\`}>
                  <TouchableOpacity
                    style={tw\`p-4 border-b border-slate-100 \${jabatan === 'AMT I' ? 'bg-blue-50' : ''}\`}
                    onPress={() => {
                      setJabatan('AMT I');
                      setShowJabatanDropdown(false);
                    }}
                  >
                    <Text style={tw\`font-bold \${jabatan === 'AMT I' ? 'text-blue-600' : 'text-gray-700'}\`}>AMT I</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={tw\`p-4 \${jabatan === 'AMT II' ? 'bg-blue-50' : ''}\`}
                    onPress={() => {
                      setJabatan('AMT II');
                      setShowJabatanDropdown(false);
                    }}
                  >
                    <Text style={tw\`font-bold \${jabatan === 'AMT II' ? 'text-blue-600' : 'text-gray-700'}\`}>AMT II</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>`;

code = code.replace(formTarget, formReplacement);

// 4. Update Toast to showNotification on Success Save
code = code.replace(
    `Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Data pekerja berhasil disimpan.',
      });`,
    `showNotification('Berhasil', 'Data pekerja berhasil disimpan.', 'success');`
);

code = code.replace(
    `Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Pekerja berhasil dihapus.',
      });`,
    `showNotification('Berhasil', 'Pekerja berhasil dihapus.', 'success');`
);

fs.writeFileSync(path, code);
console.log('Fixed WorkerListScreen');
