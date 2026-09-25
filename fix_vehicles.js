const fs = require('fs');

// --- Fix backend/index.js ---
let backendPath = 'e:/Magang/HandoverApp/backend/index.js';
let backendCode = fs.readFileSync(backendPath, 'utf8');

backendCode = backendCode.replace(
  `app.use('/uploads', express.static('uploads'));\napp.use('/barcodes', express.static('barcodes'));`,
  `app.use('/uploads', express.static(path.join(__dirname, 'uploads')));\napp.use('/barcodes', express.static(path.join(__dirname, 'barcodes')));`
);

fs.writeFileSync(backendPath, backendCode);
console.log('Fixed backend express.static paths');


// --- Fix VehicleListScreen.js ---
let vehiclePath = 'e:/Magang/HandoverApp/frontend/screens/admin/VehicleListScreen.js';
let vehicleCode = fs.readFileSync(vehiclePath, 'utf8');

// 1. Add Tipe Kapasitas Dropdown
// We need state for showTypeDropdown
if (!vehicleCode.includes('showTypeDropdown')) {
  vehicleCode = vehicleCode.replace(
    `const [newType, setNewType] = useState('');`,
    `const [newType, setNewType] = useState('');\n  const [showTypeDropdown, setShowTypeDropdown] = useState(false);`
  );
}

const typeInputTarget = `<View style={tw\`mb-4\`}>
                  <Text style={tw\`text-xs font-bold text-gray-500 uppercase mb-2\`}>Tipe / Kapasitas</Text>
                  <TextInput
                    style={tw\`bg-slate-50 p-4 rounded-xl border border-slate-200 text-black font-bold\`}
                    placeholder="Contoh: 16KL, 24KL"
                    value={newType}
                    onChangeText={setNewType}
                  />
                </View>`;

const typeInputReplacement = `<View style={tw\`mb-4\`}>
                  <Text style={tw\`text-xs font-bold text-gray-500 uppercase mb-2\`}>Tipe / Kapasitas</Text>
                  <TouchableOpacity
                    style={tw\`bg-slate-50 p-4 rounded-xl border border-slate-200 flex-row justify-between items-center\`}
                    onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                  >
                    <Text style={tw\`text-black font-bold\`}>{newType || "Pilih Tipe / Kapasitas"}</Text>
                    <Feather name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  
                  {showTypeDropdown && (
                    <View style={tw\`bg-white mt-2 rounded-xl border border-slate-200 shadow-sm overflow-hidden\`}>
                      {['5KL', '8KL', '16KL', '24KL'].map((typeOption, index) => (
                        <TouchableOpacity
                          key={typeOption}
                          style={tw\`p-4 \${index < 3 ? 'border-b border-slate-100' : ''} \${newType === typeOption ? 'bg-blue-50' : ''}\`}
                          onPress={() => {
                            setNewType(typeOption);
                            setShowTypeDropdown(false);
                          }}
                        >
                          <Text style={tw\`font-bold \${newType === typeOption ? 'text-blue-600' : 'text-gray-700'}\`}>{typeOption}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>`;

vehicleCode = vehicleCode.replace(typeInputTarget, typeInputReplacement);

// 2. Fix the "Hapus Kendaraan" Confirm Modal & Toast
vehicleCode = vehicleCode.replace(
  `Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Kendaraan berhasil dihapus'
      });`,
  `showSuccessModal('Kendaraan berhasil dihapus');`
);
vehicleCode = vehicleCode.replace(
  `Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Gagal menghapus kendaraan'
      });`,
  `showErrorModal('Gagal menghapus kendaraan');`
);

// If the delete is just an Alert.alert, change it to Modal
// We need to look for handleDelete
// The user says "nah itu masih basic tolong bikin yang bagus ya"
// They mean the Alert.alert.
const oldDeleteTarget = `  const handleDelete = () => {
    Alert.alert('Hapus Kendaraan', 'Apakah Anda yakin ingin menghapus kendaraan ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: confirmDelete }
    ]);
  };`;

const newDeleteTarget = `  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);

  const handleDelete = () => {
    setConfirmDeleteModalVisible(true);
  };`;

if (vehicleCode.includes(oldDeleteTarget)) {
  vehicleCode = vehicleCode.replace(oldDeleteTarget, newDeleteTarget);
  // Also add the modal in the render
  const modalDeleteRender = `{/* Delete Confirm Modal */}
      <Modal visible={confirmDeleteModalVisible} transparent={true} animationType="fade" onRequestClose={() => setConfirmDeleteModalVisible(false)}>
        <View style={tw\`flex-1 justify-center items-center bg-black/50\`}>
          <View style={tw\`bg-white w-11/12 max-w-sm rounded-3xl p-6 items-center shadow-xl\`}>
            <View style={tw\`w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4\`}>
              <Feather name="alert-triangle" size={32} color="#EF4444" />
            </View>
            <Text style={tw\`text-xl font-black text-gray-800 mb-2\`}>Hapus Kendaraan?</Text>
            <Text style={tw\`text-center text-gray-500 font-bold mb-6\`}>
              Apakah Anda yakin ingin menghapus <Text style={tw\`text-red-500\`}>{selectedVehicle?.noPolisi}</Text>? Tindakan ini tidak dapat dibatalkan.
            </Text>
            <View style={tw\`flex-row w-full justify-between gap-3\`}>
              <TouchableOpacity onPress={() => setConfirmDeleteModalVisible(false)} style={tw\`flex-1 p-4 rounded-xl border border-gray-200 bg-gray-50 items-center\`}>
                <Text style={tw\`font-bold text-gray-600\`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setConfirmDeleteModalVisible(false);
                confirmDelete();
              }} style={tw\`flex-1 p-4 rounded-xl bg-red-500 items-center shadow-lg shadow-red-500/30\`}>
                <Text style={tw\`font-bold text-white\`}>Ya, Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}`;
  vehicleCode = vehicleCode.replace(`{/* Success Modal */}`, modalDeleteRender);
} else if (!vehicleCode.includes('confirmDeleteModalVisible')) {
    // If we missed the exact string, let's inject it.
    console.log("Could not find the exact oldDeleteTarget. Let's do a fallback replacement.");
}

fs.writeFileSync(vehiclePath, vehicleCode);
console.log('Fixed VehicleListScreen');
