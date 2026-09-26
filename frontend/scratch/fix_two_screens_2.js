const fs = require('fs');
const path = require('path');

const files = [
  { path: 'admin/ChecklistManagerScreen.js', activeMenu: 'Checklist', oldNav: '{/* ADMIN BOTTOM NAVBAR MOCK (Identik dengan Dashboard) */}' },
  { path: 'pengawas/MessageCenterScreen.js', activeMenu: 'Messages', oldNav: '{/* BOTTOM NAVBAR */}' }
];

files.forEach(f => {
  const filePath = path.join(__dirname, '..', 'screens', f.path);
  let content = fs.readFileSync(filePath, 'utf-8');

  // We need to replace from f.oldNav to the end of the file, then re-append the modal and closing tags.
  const startIdx = content.indexOf(f.oldNav);

  if (startIdx !== -1) {
    // Cut the content before bottom nav
    content = content.slice(0, startIdx);

    // Append our custom bottom nav + Modal + closing tags
    const newBottomNavAndModal = `
      {/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY) */}
      {!isLargeScreen && (
        <View style={tw\`absolute bottom-8 self-center w-11/12 bg-white rounded-full flex-row justify-around items-center py-5 shadow-2xl shadow-gray-400/50 z-50\`}>
          
          <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={() => navigation.navigate(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'AdminDashboard' : user?.role === 'PENGAWAS' ? 'PengawasDashboard' : 'UserDashboard')}>
            {activeMenu === 'Home' && (
              <>
                <View style={tw\`absolute -top-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
                <View style={tw\`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
              </>
            )}
            <Feather name="home" size={26} color={activeMenu === 'Home' ? '#0055A5' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={() => { setActiveMenu('Checklist'); navigation.navigate('ChecklistManager'); }}>
            {activeMenu === 'Checklist' && (
              <>
                <View style={tw\`absolute -top-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
                <View style={tw\`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
              </>
            )}
            <Feather name="check-square" size={26} color={activeMenu === 'Checklist' ? '#00A651' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={() => { setActiveMenu('Messages'); navigation.navigate('MessageCenter'); }}>
            {activeMenu === 'Messages' && (
              <>
                <View style={tw\`absolute -top-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
                <View style={tw\`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
              </>
            )}
            <View>
              <Feather name="message-square" size={26} color={activeMenu === 'Messages' ? '#0055A5' : '#9CA3AF'} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={handleLogout}>
            {activeMenu === 'Logout' && (
              <>
                <View style={tw\`absolute -top-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
                <View style={tw\`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
              </>
            )}
            <Feather name="log-out" size={26} color={activeMenu === 'Logout' ? '#ED1C24' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Logout Modal */}
      <Modal
        visible={isLogoutVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={tw\`flex-1 justify-center items-center bg-black/60 px-6\`}>
          <View style={tw\`bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-2xl relative overflow-hidden\`}>
            <View style={tw\`w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4\`}>
              <Feather name="log-out" size={32} color="#ED1C24" />
            </View>
            <Text style={tw\`text-2xl font-black text-gray-800 mb-2\`}>Konfirmasi Keluar</Text>
            <Text style={tw\`text-base text-gray-500 text-center mb-8 px-4\`}>Apakah Anda yakin ingin keluar dari akun Anda?</Text>
            
            <View style={tw\`flex-row w-full justify-between gap-3\`}>
              <TouchableOpacity
                style={tw\`flex-1 py-4 bg-gray-100 rounded-2xl items-center\`}
                onPress={handleCancelLogout}
              >
                <Text style={tw\`text-gray-600 font-bold text-lg\`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw\`flex-1 py-4 bg-red-500 rounded-2xl items-center shadow-lg shadow-red-500/30\`}
                onPress={confirmLogout}
              >
                <Text style={tw\`text-white font-bold text-lg\`}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
`;
    content += newBottomNavAndModal;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fully patched bottom nav for ${f.path}`);
  } else {
    console.log(`Could not find old bottom nav for ${f.path}`);
  }
});
