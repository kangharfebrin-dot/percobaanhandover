const fs = require('fs');
const path = require('path');

// --- 1. Fix PengawasListScreen.js ---
let pengawasPath = 'e:/Magang/HandoverApp/frontend/screens/admin/PengawasListScreen.js';
let pengawasCode = fs.readFileSync(pengawasPath, 'utf8');

// Remove `<ConfirmModal ... />`
pengawasCode = pengawasCode.replace(
  /<ConfirmModal visible=\{confirmModalVisible\}.*?\/>/g,
  ''
);

// Replace notification modal with a beautiful success modal like in VehicleListScreen.js
const oldNotifModal = `<Modal
        animationType="fade"
        transparent={true}
        visible={notificationModal.visible}
        onRequestClose={() => setNotificationModal({ ...notificationModal, visible: false })}
      >
        <View style={tw\`flex-1 justify-center items-center bg-black/50 px-4\`}>
          <View style={tw\`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl\`}>
            <View style={tw\`\${notificationModal.type === 'success' ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-full mb-4\`}>
              <Ionicons name={notificationModal.type === 'success' ? 'checkmark-circle' : notificationModal.type === 'info' ? 'information-circle' : 'close-circle'} size={40} color={notificationModal.type === 'success' ? '#10B981' : notificationModal.type === 'info' ? '#3B82F6' : '#EF4444'} />
            </View>
            <Text style={tw\`text-2xl font-black text-gray-800 mb-2\`}>{notificationModal.title}</Text>
            <Text style={tw\`text-gray-500 text-center text-base mb-6 leading-relaxed\`}>
              {notificationModal.message}
            </Text>
            <TouchableOpacity
              style={tw\`w-full \${notificationModal.type === 'success' ? 'bg-[#4F46E5]' : notificationModal.type === 'info' ? 'bg-[#3B82F6]' : 'bg-[#ED1C24]'} py-4 rounded-2xl items-center shadow-md\`}
              onPress={() => setNotificationModal({ ...notificationModal, visible: false })}
            >
              <Text style={tw\`text-white font-bold\`}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>`;

const newNotifModal = `<Modal visible={notificationModal.visible} transparent={true} animationType="fade">
        <View style={tw\`flex-1 justify-center items-center bg-black/40 px-6 z-50\`}>
          <View style={tw\`bg-white w-full max-w-sm rounded-[35px] p-8 items-center shadow-2xl \${notificationModal.type === 'success' ? 'border-green-100' : 'border-red-100'} relative overflow-hidden\`}>
            
            <View style={tw\`absolute -top-10 -right-10 w-32 h-32 \${notificationModal.type === 'success' ? 'bg-green-50' : 'bg-red-50'} rounded-full\`} />
            <View style={tw\`absolute -bottom-10 -left-10 w-32 h-32 \${notificationModal.type === 'success' ? 'bg-blue-50' : 'bg-orange-50'} rounded-full\`} />

            <View style={tw\`w-20 h-20 \${notificationModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'} rounded-full items-center justify-center mb-5 shadow-lg \${notificationModal.type === 'success' ? 'shadow-green-500/30' : 'shadow-red-500/30'} z-10 border-4 border-white\`}>
              <Feather name={notificationModal.type === 'success' ? 'check-circle' : 'alert-triangle'} size={40} color={notificationModal.type === 'success' ? '#00A651' : '#ED1C24'} />
            </View>

            <Text style={tw\`text-2xl font-black text-gray-800 mb-2 tracking-tight z-10 text-center\`}>{notificationModal.title}</Text>
            <Text style={tw\`text-center text-gray-500 font-medium mb-8 z-10 px-4\`}>
              {notificationModal.message}
            </Text>

            <TouchableOpacity
              style={tw\`\${notificationModal.type === 'success' ? 'bg-[#00A651]' : 'bg-[#ED1C24]'} px-8 py-4 rounded-2xl shadow-lg z-10 w-full items-center\`}
              onPress={() => setNotificationModal({ ...notificationModal, visible: false })}
            >
              <Text style={tw\`text-white text-sm font-black tracking-widest uppercase\`}>OK, MENGERTI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>`;

if (pengawasCode.includes(oldNotifModal)) {
    pengawasCode = pengawasCode.replace(oldNotifModal, newNotifModal);
}

fs.writeFileSync(pengawasPath, pengawasCode);
console.log('Fixed PengawasListScreen.js');

// --- 2. Remove photo upload for "Tidak Ada" AMT equipment ---
// Check HandoverScreen or related screen
const userScreensDir = 'e:/Magang/HandoverApp/frontend/screens/user';
const userScreens = fs.readdirSync(userScreensDir);
let foundHandoverScreen = false;
for (const file of userScreens) {
    if (file === 'NewHandoverScreen.js' || file === 'HandoverScreen.js') {
        const p = path.join(userScreensDir, file);
        let code = fs.readFileSync(p, 'utf8');
        
        // Let's modify the condition where it requires photo if it's "Tidak Ada"
        // Wait, I should first read the file to see how it's implemented. 
        // I will do that via grep_search or read_file if needed.
    }
}
