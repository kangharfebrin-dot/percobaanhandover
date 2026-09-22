const fs = require('fs');
const file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/VehicleListScreen.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state variable for full screen barcode
if (!content.includes('const [fullScreenBarcode, setFullScreenBarcode]')) {
  content = content.replace(
    "const [manageModalVisible, setManageModalVisible] = useState(false);",
    "const [manageModalVisible, setManageModalVisible] = useState(false);\n  const [fullScreenBarcode, setFullScreenBarcode] = useState(false);"
  );
}

// 2. Change the Image view to TouchableOpacity
const oldImageView = `<View style={tw\`w-32 h-32 bg-gray-100 rounded-xl items-center justify-center p-2\`}>
                      <Image 
                        source={{ uri: \`http://192.168.151.137:3000/barcodes/\${selectedVehicle.barcode}.jpg\` }} 
                        style={tw\`w-full h-full\`} 
                        resizeMode="contain" 
                      />
                      <Text style={tw\`text-[8px] text-gray-400 mt-1 text-center\`}>Screenshot untuk di-print</Text>
                    </View>`;

const newImageView = `<TouchableOpacity 
                      style={tw\`w-32 h-32 bg-gray-100 rounded-xl items-center justify-center p-2\`}
                      onPress={() => setFullScreenBarcode(true)}
                    >
                      <Image 
                        source={{ uri: \`http://192.168.151.137:3000/barcodes/\${selectedVehicle.barcode}.jpg\` }} 
                        style={tw\`w-full h-full\`} 
                        resizeMode="contain" 
                      />
                      <Text style={tw\`text-[8px] text-gray-400 mt-1 text-center font-bold\`}>TAP UNTUK PERBESAR</Text>
                    </TouchableOpacity>`;
content = content.replace(oldImageView, newImageView);

// 3. Add the Full Screen Barcode Modal right after the Detail Modal
const fullScreenModal = `

          {/* FULL SCREEN BARCODE MODAL */}
          <Modal visible={fullScreenBarcode} transparent={true} animationType="fade" onRequestClose={() => setFullScreenBarcode(false)}>
            <View style={tw\`flex-1 bg-black/90 justify-center items-center\`}>
              {selectedVehicle && (
                <>
                  <View style={tw\`absolute top-10 right-5 z-50\`}>
                    <TouchableOpacity onPress={() => setFullScreenBarcode(false)} style={tw\`p-3 bg-white/20 rounded-full\`}>
                      <Ionicons name="close" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <Text style={tw\`text-white text-2xl font-black mb-10\`}>{selectedVehicle.noPolisi}</Text>
                  <View style={tw\`w-80 h-80 bg-white rounded-3xl p-4\`}>
                    <Image 
                      source={{ uri: \`http://192.168.151.137:3000/barcodes/\${selectedVehicle.barcode}.jpg\` }} 
                      style={tw\`w-full h-full\`} 
                      resizeMode="contain" 
                    />
                  </View>
                  <Text style={tw\`text-gray-300 text-sm mt-6 text-center px-10\`}>Silakan screenshot layar ini untuk menyimpan atau mencetak barcode.</Text>
                </>
              )}
            </View>
          </Modal>`;

if (!content.includes('FULL SCREEN BARCODE MODAL')) {
  // Insert before the Admin only modals
  content = content.replace(
    "{/* Modals for Admin Only */}",
    fullScreenModal + "\n\n          {/* Modals for Admin Only */}"
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Added Full Screen Barcode modal');
