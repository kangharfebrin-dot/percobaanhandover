const fs = require('fs');

const run = () => {
  let file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/ScannerScreen.js';
  let content = fs.readFileSync(file, 'utf8');

  // Replace Alert.alert for 'isUnderRepair'
  content = content.replace(
    /Alert\.alert\(\"KENDARAAN DALAM PERBAIKAN\", \"Truk ini sedang dalam masa perbaikan \(Isu belum diselesaikan admin\)\. Tidak dapat melakukan perjalanan\.\"\);/g,
    `setScanResult('repair');`
  );

  // Replace Alert.alert for 'Maintenance'
  content = content.replace(
    /Alert\.alert\(\s*\"KENDARAAN DIBLOKIR\",\s*\"Truk ini sedang dalam status MAINTENANCE\. Tidak dapat digunakan untuk perjalanan\.\"\s*\);/g,
    `setScanResult('maintenance');`
  );

  const newModals = `
      {scanResult === 'repair' && (
        <View style={tw\`absolute inset-0 bg-black/70 justify-center items-center px-6 z-50\`}>
          <View style={tw\`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl border-4 border-red-100\`}>
            <View style={tw\`w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6 shadow-lg shadow-red-200\`}>
              <Ionicons name="construct" size={50} color="#ED1C24" />
            </View>
            <Text style={tw\`text-2xl font-black text-gray-800 mb-2 text-center\`}>Truk Dalam{"\\n"}Perbaikan!</Text>
            <Text style={tw\`text-gray-500 text-center mb-8 font-semibold\`}>Truk ini sedang dalam masa perbaikan (Isu aktif belum diselesaikan admin). Tidak dapat melanjutkan perjalanan.</Text>
            <TouchableOpacity
              style={tw\`w-full bg-red-600 p-4 rounded-2xl items-center shadow-lg shadow-red-500/30\`}
              onPress={() => { setScanResult(null); navigation.goBack(); }}
            >
              <Text style={tw\`text-white font-bold text-lg\`}>Kembali ke Beranda</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {scanResult === 'maintenance' && (
        <View style={tw\`absolute inset-0 bg-black/70 justify-center items-center px-6 z-50\`}>
          <View style={tw\`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl border-4 border-red-100\`}>
            <View style={tw\`w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6 shadow-lg shadow-red-200\`}>
              <Ionicons name="lock-closed" size={50} color="#ED1C24" />
            </View>
            <Text style={tw\`text-2xl font-black text-gray-800 mb-2 text-center\`}>Kendaraan{"\\n"}Diblokir</Text>
            <Text style={tw\`text-gray-500 text-center mb-8 font-semibold\`}>Truk ini sedang dalam status MAINTENANCE total. Tidak dapat digunakan untuk operasional.</Text>
            <TouchableOpacity
              style={tw\`w-full bg-red-600 p-4 rounded-2xl items-center shadow-lg shadow-red-500/30\`}
              onPress={() => { setScanResult(null); navigation.goBack(); }}
            >
              <Text style={tw\`text-white font-bold text-lg\`}>Kembali ke Beranda</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
`;

  if (!content.includes("scanResult === 'repair'")) {
    content = content.replace(
      "{scanResult === 'error' && (",
      newModals + "\n      {scanResult === 'error' && ("
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log("Scanner modal updated.");
  } else {
    console.log("Scanner modal already updated.");
  }
};

run();
