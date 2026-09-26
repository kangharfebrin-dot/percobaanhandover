const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

function validateJsx(code, filename) {
  try {
    parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
    console.log(`[VALID JSX] ${filename}`);
    return true;
  } catch (err) {
    console.error(`[SYNTAX ERROR] ${filename}:`, err.message);
    return false;
  }
}

// 1. UPDATE WebSidebar.js
const webSidebarPath = path.join(__dirname, '..', 'components', 'WebSidebar.js');
let webSidebarCode = `import React from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';

const GLASS_BG = 'rgba(255, 255, 255, 0.7)';
const glassStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {};

export default function WebSidebar({ user, activeMenu, navigation, handleLogout, unreadNotificationsCount = 0 }) {
  if (Platform.OS !== 'web' || !user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isPengawas = user.role === 'PENGAWAS' || user.role === 'ADMIN';

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isPengawas) return 'Pengawas';
    return 'Awak Mobil Tangki';
  };

  const getInitials = () => {
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return 'AD';
    if (user.role === 'PENGAWAS') return 'PS';
    const parts = (user.name || '').trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (user.name || 'U').substring(0, 2).toUpperCase();
  };

  return (
    <View style={[
      tw\`w-72 my-6 ml-6 rounded-[40px] border border-white/50 overflow-hidden\`,
      {
        backgroundColor: GLASS_BG,
        ...glassStyle,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 30,
        height: Platform.OS === 'web' ? 'calc(100vh - 48px)' : undefined,
        maxHeight: Platform.OS === 'web' ? 'calc(100vh - 48px)' : undefined,
      }
    ]}>
      <ScrollView
        style={tw\`flex-1\`}
        contentContainerStyle={tw\`p-6 pb-8\`}
        showsVerticalScrollIndicator={true}
      >
        {/* Profile Card */}
        <View style={tw\`items-center mb-8\`}>
          <View style={tw\`w-20 h-20 bg-blue-600 rounded-[26px] items-center justify-center mb-4 shadow-xl shadow-blue-500/30 rotate-3\`}>
            <Text style={tw\`text-2xl font-black text-white -rotate-3\`}>{getInitials()}</Text>
          </View>
          <Text style={tw\`text-xl font-black text-gray-800 text-center tracking-tight\`}>{user.name}</Text>
          <View style={tw\`bg-blue-100 mt-2 px-3 py-1 rounded-full\`}>
            <Text style={tw\`text-[11px] text-[#0055A5] font-black uppercase tracking-widest\`}>{getRoleLabel()}</Text>
          </View>
        </View>

        {/* 1. Beranda */}
        <TouchableOpacity
          style={tw\`flex-row items-center p-4 mb-3 rounded-2xl \${activeMenu === 'Home' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}\`}
          onPress={() => {
            if (user.role === 'SUPER_ADMIN') navigation.replace('AdminDashboard');
            else if (user.role === 'PENGAWAS' || user.role === 'ADMIN') navigation.replace('PengawasDashboard');
            else navigation.replace('UserDashboard');
          }}
        >
          <Feather name="grid" size={22} color={activeMenu === 'Home' ? 'white' : '#6B7280'} />
          <Text style={tw\`ml-4 font-bold text-[15px] \${activeMenu === 'Home' ? 'text-white' : 'text-gray-500'}\`}>Beranda</Text>
        </TouchableOpacity>

        {/* 2. Log Riwayat */}
        <TouchableOpacity
          style={tw\`flex-row items-center p-4 mb-3 rounded-2xl \${activeMenu === 'History' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}\`}
          onPress={() => navigation.replace('History')}
        >
          <Feather name="file-text" size={22} color={activeMenu === 'History' ? 'white' : '#6B7280'} />
          <Text style={tw\`ml-4 font-bold text-[15px] \${activeMenu === 'History' ? 'text-white' : 'text-gray-500'}\`}>Log Riwayat</Text>
        </TouchableOpacity>

        {/* 3. Manajer Checklist (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw\`flex-row items-center p-4 mb-3 rounded-2xl \${activeMenu === 'Checklist' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}\`}
            onPress={() => navigation.replace('ChecklistManager')}
          >
            <Feather name="check-square" size={22} color={activeMenu === 'Checklist' ? 'white' : '#6B7280'} />
            <Text style={tw\`ml-4 font-bold text-[15px] \${activeMenu === 'Checklist' ? 'text-white' : 'text-gray-500'}\`}>Manajer Checklist</Text>
          </TouchableOpacity>
        )}

        {/* 4. Daftar Kendaraan (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw\`flex-row items-center p-4 mb-3 rounded-2xl \${activeMenu === 'VehicleList' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}\`}
            onPress={() => navigation.replace('VehicleList')}
          >
            <Feather name="truck" size={22} color={activeMenu === 'VehicleList' ? 'white' : '#6B7280'} />
            <Text style={tw\`ml-4 font-bold text-[15px] \${activeMenu === 'VehicleList' ? 'text-white' : 'text-gray-500'}\`}>Daftar Kendaraan</Text>
          </TouchableOpacity>
        )}

        {/* 5. Daftar Kendala (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw\`flex-row items-center p-4 mb-3 rounded-2xl \${activeMenu === 'IssueList' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}\`}
            onPress={() => navigation.replace('IssueList')}
          >
            <Feather name="alert-triangle" size={22} color={activeMenu === 'IssueList' ? 'white' : '#6B7280'} />
            <Text style={tw\`ml-4 font-bold text-[15px] \${activeMenu === 'IssueList' ? 'text-white' : 'text-gray-500'}\`}>Daftar Kendala</Text>
          </TouchableOpacity>
        )}

        {/* 6. Daftar Pekerja (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw\`flex-row items-center p-4 mb-3 rounded-2xl \${activeMenu === 'WorkerList' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}\`}
            onPress={() => navigation.replace('WorkerList')}
          >
            <Feather name="users" size={22} color={activeMenu === 'WorkerList' ? 'white' : '#6B7280'} />
            <Text style={tw\`ml-4 font-bold text-[15px] \${activeMenu === 'WorkerList' ? 'text-white' : 'text-gray-500'}\`}>Daftar Pekerja</Text>
          </TouchableOpacity>
        )}

        {/* 7. Daftar Pengawas (isSuperAdmin) */}
        {isSuperAdmin && (
          <TouchableOpacity
            style={tw\`flex-row items-center p-4 mb-3 rounded-2xl \${activeMenu === 'PengawasList' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}\`}
            onPress={() => navigation.replace('PengawasList')}
          >
            <Feather name="shield" size={22} color={activeMenu === 'PengawasList' ? 'white' : '#6B7280'} />
            <Text style={tw\`ml-4 font-bold text-[15px] \${activeMenu === 'PengawasList' ? 'text-white' : 'text-gray-500'}\`}>Daftar Pengawas</Text>
          </TouchableOpacity>
        )}

        {/* 8. Pesan (Semua Pengguna: Super Admin, Pengawas, AMT/User) */}
        <TouchableOpacity
          style={tw\`flex-row items-center justify-between p-4 mb-3 rounded-2xl \${activeMenu === 'Messages' ? 'bg-[#0055A5] shadow-lg shadow-blue-500/40' : 'bg-transparent'}\`}
          onPress={() => navigation.replace('MessageCenter')}
        >
          <View style={tw\`flex-row items-center\`}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={activeMenu === 'Messages' ? 'white' : '#6B7280'} />
            <Text style={tw\`ml-4 font-bold text-[15px] \${activeMenu === 'Messages' ? 'text-white' : 'text-gray-500'}\`}>Pesan</Text>
          </View>
          {unreadNotificationsCount > 0 && (
            <View style={tw\`bg-red-500 px-2 py-0.5 rounded-full\`}>
              <Text style={tw\`text-white text-xs font-bold\`}>{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 9. Sign Out Button */}
        <View style={tw\`mt-4 pt-4 border-t border-gray-100\`}>
          <TouchableOpacity
            style={tw\`flex-row items-center p-4 rounded-2xl bg-red-50 border border-red-100\`}
            onPress={handleLogout || (() => {})}
          >
            <Feather name="log-out" size={22} color="#ED1C24" />
            <Text style={tw\`ml-4 font-bold text-[15px] text-[#ED1C24]\`}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
`;

if (validateJsx(webSidebarCode, 'WebSidebar.js')) {
  fs.writeFileSync(webSidebarPath, webSidebarCode, 'utf8');
  console.log('Successfully written WebSidebar.js');
} else {
  process.exit(1);
}

// 2. UPDATE MessageCenterScreen.js
const msgCenterPath = path.join(__dirname, '..', 'screens', 'pengawas', 'MessageCenterScreen.js');
let msgCenter = fs.readFileSync(msgCenterPath, 'utf8');

// Ensure activeMenu and previousMenu are declared
if (!msgCenter.includes("const [activeMenu, setActiveMenu]")) {
  msgCenter = msgCenter.replace(
    /const \[user, setUser\] = useState\(null\);/,
    "const [user, setUser] = useState(null);\n  const [activeMenu, setActiveMenu] = useState('Messages');\n  const [previousMenu, setPreviousMenu] = useState('Messages');"
  );
}

// Ensure handleLogout and handleCancelLogout set activeMenu
msgCenter = msgCenter.replace(
  /const handleLogout = \(\) => setIsLogoutVisible\(true\);/,
  `const handleLogout = () => {\n    setPreviousMenu(activeMenu);\n    setActiveMenu('Logout');\n    setIsLogoutVisible(true);\n  };`
);

msgCenter = msgCenter.replace(
  /const handleCancelLogout = \(\) => setIsLogoutVisible\(false\);/,
  `const handleCancelLogout = () => {\n    setIsLogoutVisible(false);\n    setActiveMenu(previousMenu);\n  };`
);

msgCenter = msgCenter.replace(
  /const confirmLogout = async \(\) => \{[\s\S]*?navigation\.replace\('Login'\);\s*\};/,
  `const confirmLogout = async () => {\n    setIsLogoutVisible(false);\n    await AsyncStorage.multiRemove(['user', 'token']);\n    delete axios.defaults.headers.common['Authorization'];\n    navigation.replace('Login');\n  };`
);

// Ensure the MessageCenter bottom bar tab respects activeMenu === 'Messages' && !isLogoutVisible
const oldMessageTabRegex = /<TouchableOpacity style=\{tw`items-center justify-center px-4 relative`\}>[\s\S]*?<View style=\{tw`relative`\}>[\s\S]*?<Ionicons name="chatbubble-ellipses-outline"[\s\S]*?<\/TouchableOpacity>/;

const newMessageTab = `<TouchableOpacity style={tw\`items-center justify-center px-4 relative\`}>
            {activeMenu === 'Messages' && !isLogoutVisible && (
              <>
                <View style={tw\`absolute -top-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
                <View style={tw\`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
              </>
            )}
            <View style={tw\`relative\`}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color={activeMenu === 'Messages' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'} />
              {messages.some(m => !m.read) && (
                <View style={tw\`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white\`} />
              )}
            </View>
          </TouchableOpacity>`;

msgCenter = msgCenter.replace(oldMessageTabRegex, newMessageTab);

if (validateJsx(msgCenter, 'MessageCenterScreen.js')) {
  fs.writeFileSync(msgCenterPath, msgCenter, 'utf8');
  console.log('Successfully written MessageCenterScreen.js');
} else {
  process.exit(1);
}

// 3. UPDATE HistoryScreen.js to ensure active indicator hides when isLogoutVisible is true
const historyPath = path.join(__dirname, '..', 'screens', 'shared', 'HistoryScreen.js');
let historyCode = fs.readFileSync(historyPath, 'utf8');

const oldHistoryActiveRegex = /\{user && \(user\.role === 'AMT' \|\| user\.role === 'USER'\) && \([\s\S]*?<TouchableOpacity style=\{tw`items-center justify-center px-4 relative`\} onPress=\{\(\) => navigation\.replace\('History'\)\}>[\s\S]*?<Feather name="file-text" size=\{26\} color=\{!isLogoutVisible \? '#1F2937' : '#9CA3AF'\} \/>\s*<\/TouchableOpacity>\s*\)\}/;

const newHistoryActive = `{user && (user.role === 'AMT' || user.role === 'USER') && (
                <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={() => navigation.replace('History')}>
                  {activeMenu === 'History' && !isLogoutVisible && (
                    <>
                      <View style={tw\`absolute -top-5 w-8 h-1 overflow-hidden rounded-full\`}>
                        <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate }] }]}>
                          <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                        </Animated.View>
                      </View>
                      <View style={tw\`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full\`}>
                        <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate }] }]}>
                          <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                        </Animated.View>
                      </View>
                    </>
                  )}
                  <Feather name="file-text" size={26} color={activeMenu === 'History' && !isLogoutVisible ? '#1F2937' : '#9CA3AF'} />
                </TouchableOpacity>
              )}`;

if (oldHistoryActiveRegex.test(historyCode)) {
  historyCode = historyCode.replace(oldHistoryActiveRegex, newHistoryActive);
  if (validateJsx(historyCode, 'HistoryScreen.js')) {
    fs.writeFileSync(historyPath, historyCode, 'utf8');
    console.log('Successfully updated HistoryScreen.js');
  }
}

console.log('Finished step 1, 2, and HistoryScreen');
