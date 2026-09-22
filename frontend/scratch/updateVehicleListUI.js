const fs = require('fs');

const file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/VehicleListScreen.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Update loading indicator (full screen when loading initially)
const oldLoadingUI = `<View style={tw\`px-6 mt-4 mb-2 flex-row justify-between items-center\`}>
            <Text style={tw\`text-gray-500 font-bold uppercase tracking-widest text-xs\`}>{filteredVehicles.length} Kendaraan Terdaftar</Text>
            {loading && <ActivityIndicator size="small" color="#0055A5" />}
          </View>`;

const newLoadingUI = `<View style={tw\`px-6 mt-4 mb-2 flex-row justify-between items-center\`}>
            <Text style={tw\`text-gray-500 font-bold uppercase tracking-widest text-xs\`}>{filteredVehicles.length} Kendaraan Terdaftar</Text>
          </View>`;
content = content.replace(oldLoadingUI, newLoadingUI);

// Update Flatlist empty component to show a huge loading if loading is true
const oldEmptyList = `ListEmptyComponent={
              !loading && (
                <View style={tw\`items-center mt-20\`}>
                  <Ionicons name="car-sport-outline" size={60} color="#CBD5E1" />
                  <Text style={tw\`text-center text-gray-400 font-bold mt-4 text-lg\`}>Tidak ada kendaraan yang sesuai.</Text>
                </View>
              )
            }`;
const newEmptyList = `ListEmptyComponent={
              loading ? (
                <View style={tw\`flex-1 justify-center items-center mt-32\`}>
                  <ActivityIndicator size="large" color="#0055A5" />
                  <Text style={tw\`text-gray-500 font-bold mt-4\`}>Memuat Kendaraan...</Text>
                </View>
              ) : (
                <View style={tw\`items-center mt-20\`}>
                  <Ionicons name="car-sport-outline" size={60} color="#CBD5E1" />
                  <Text style={tw\`text-center text-gray-400 font-bold mt-4 text-lg\`}>Tidak ada kendaraan yang sesuai.</Text>
                </View>
              )
            }`;
content = content.replace(oldEmptyList, newEmptyList);

// 2. Change onPress behavior for all users to open the details Modal (manageModalVisible)
const oldRenderOnPress = `onPress={() => { if (user?.role === 'SUPER_ADMIN') openManageModal(item); else navigation.navigate('History', { noPolisi: item.noPolisi }); }}`;
const newRenderOnPress = `onPress={() => openManageModal(item)}`;
content = content.replace(oldRenderOnPress, newRenderOnPress);

// 3. Update the Manage Modal (now renamed in concept to Detail Modal) to show the QR Code and conditional Edit/Delete buttons based on role.
const oldModalSection = /<Modal visible=\{manageModalVisible\}([\s\S]*?)<\/Modal>/;
const newModalSection = `<Modal visible={manageModalVisible} transparent={true} animationType="slide" onRequestClose={() => setManageModalVisible(false)}>
            <View style={tw\`flex-1 justify-end bg-black/60\`}>
              {selectedVehicle && (
                <View style={tw\`bg-white w-full rounded-t-[30px] p-6 shadow-2xl\`}>
                  <View style={tw\`flex-row justify-between items-center mb-6 border-b border-gray-100 pb-4\`}>
                    <View>
                      <Text style={tw\`text-xl font-black text-gray-800\`}>Detail Kendaraan</Text>
                      <Text style={tw\`text-blue-600 font-bold\`}>{selectedVehicle.noPolisi}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setManageModalVisible(false)} style={tw\`p-2 bg-gray-100 rounded-full\`}>
                      <Ionicons name="close" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={tw\`flex-row mb-6\`}>
                    <View style={tw\`flex-1 justify-center\`}>
                      <Text style={tw\`text-xs text-gray-500 uppercase font-bold mb-1\`}>Merek / Tipe</Text>
                      <Text style={tw\`text-base font-black text-gray-800 mb-3\`}>{selectedVehicle.brand || '-'} {selectedVehicle.jenisKendaraan ? \`(\${selectedVehicle.jenisKendaraan})\` : ''}</Text>
                      
                      <Text style={tw\`text-xs text-gray-500 uppercase font-bold mb-1\`}>Status Truk</Text>
                      <Text style={tw\`text-base font-black \${selectedVehicle.status === 'Buruk' || selectedVehicle.status === 'Maintenance' ? 'text-red-600' : 'text-green-600'} mb-3\`}>
                        {selectedVehicle.status === 'Buruk' || selectedVehicle.status === 'Maintenance' ? 'Buruk (Maintenance)' : 'Baik (Active)'}
                      </Text>

                      <Text style={tw\`text-xs text-gray-500 uppercase font-bold mb-1\`}>Data Barcode</Text>
                      <Text style={tw\`text-base font-black text-gray-800\`}>{selectedVehicle.barcode}</Text>
                    </View>
                    
                    <View style={tw\`w-32 h-32 bg-gray-100 rounded-xl items-center justify-center p-2\`}>
                      <Image 
                        source={{ uri: \`http://192.168.1.25:3000/barcodes/\${selectedVehicle.barcode}.jpg\` }} 
                        style={tw\`w-full h-full\`} 
                        resizeMode="contain" 
                      />
                      <Text style={tw\`text-[8px] text-gray-400 mt-1 text-center\`}>Screenshot untuk di-print</Text>
                    </View>
                  </View>

                  <View style={tw\`flex-row justify-between\`}>
                    <TouchableOpacity 
                      style={tw\`bg-green-50 p-4 rounded-xl items-center flex-1 mr-2 border border-green-200\`} 
                      onPress={() => { setManageModalVisible(false); navigation.navigate('History', { noPolisi: selectedVehicle.noPolisi }); }}
                    >
                      <Text style={tw\`text-green-700 font-bold\`}>Lihat Riwayat</Text>
                    </TouchableOpacity>

                    {user?.role === 'SUPER_ADMIN' && (
                      <TouchableOpacity style={tw\`bg-blue-50 p-4 rounded-xl items-center flex-1 mx-1 border border-blue-200\`} onPress={() => openEditModal(selectedVehicle)}>
                        <Text style={tw\`text-blue-600 font-bold\`}>Edit</Text>
                      </TouchableOpacity>
                    )}

                    {user?.role === 'SUPER_ADMIN' && (
                      <TouchableOpacity style={tw\`bg-red-50 p-4 rounded-xl items-center flex-1 ml-2 border border-red-200\`} onPress={() => handleDeleteVehicle(selectedVehicle)}>
                        <Text style={tw\`text-red-600 font-bold\`}>Hapus</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          </Modal>`;

content = content.replace(oldModalSection, newModalSection);

// Fix modals mapping. Currently manageModalVisible and addModalVisible are inside `{user?.role === 'SUPER_ADMIN' && (<> ... </>)}`.
// We need to move the manageModalVisible OUTSIDE so all users can see it.
const modalBlockStart = `{user?.role === 'SUPER_ADMIN' && (
        <>
          {/* MANAGE VEHICLE MODAL */}
          <Modal visible={manageModalVisible}`;
          
const fixedModalBlockStart = `{/* DETAIL KENDARAAN MODAL (For All Users) */}
          <Modal visible={manageModalVisible}`;
content = content.replace(modalBlockStart, fixedModalBlockStart);

const modalBlockMid = `</View>
          </Modal>

          {/* ADD / EDIT VEHICLE MODAL */}`;
const fixedModalBlockMid = `</View>
          </Modal>

          {/* Modals for Admin Only */}
          {user?.role === 'SUPER_ADMIN' && (
            <>
              {/* ADD / EDIT VEHICLE MODAL */}`;
content = content.replace(modalBlockMid, fixedModalBlockMid);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed UI in VehicleListScreen.js for detail and loading');
