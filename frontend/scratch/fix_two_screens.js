const fs = require('fs');
const path = require('path');

const files = [
  { path: 'admin/ChecklistManagerScreen.js', activeMenu: 'Checklist' },
  { path: 'pengawas/MessageCenterScreen.js', activeMenu: 'Messages' }
];

files.forEach(f => {
  const filePath = path.join(__dirname, '..', 'screens', f.path);
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Add WebSidebar import
  if (!content.includes('WebSidebar')) {
    content = content.replace(
      "import { Ionicons, Feather } from '@expo/vector-icons';",
      "import { Ionicons, Feather } from '@expo/vector-icons';\nimport WebSidebar from '../../components/WebSidebar';"
    );
  }

  // 2. Add Animated and Modal to react-native imports if not there
  if (!content.includes('Animated') && content.includes("import { View,")) {
    content = content.replace("import { View,", "import { View, Animated, Modal,");
  } else if (!content.includes('Animated')) {
    content = content.replace("import { View, Text", "import { View, Text, Animated, Modal");
  }

  // 3. Add states inside the component
  const stateInjection = `
  // Navigation State
  const [activeMenu, setActiveMenu] = useState('${f.activeMenu}');
  const [previousMenu, setPreviousMenu] = useState('${f.activeMenu}');
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(Dimensions.get('window').width > 768);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const updateLayout = () => {
      setIsLargeScreen(Dimensions.get('window').width > 768);
    };
    const sub = Dimensions.addEventListener('change', updateLayout);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [slideAnim]);

  const slideInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 32] // Moves line
  });

  const handleLogout = () => {
    setPreviousMenu(activeMenu);
    setActiveMenu('Logout');
    setIsLogoutVisible(true);
  };

  const handleCancelLogout = () => {
    setIsLogoutVisible(false);
    setActiveMenu(previousMenu);
  };

  const confirmLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      navigation.replace('Login');
    } catch (error) {
      console.log('Logout Error:', error);
    }
  };
`;
  
  if (!content.includes('handleLogout = () =>')) {
    // find where to inject: after const [isLoading, setIsLoading] = useState(false); or similar
    const useStateMatch = content.match(/const \[.*\] = useState\(.*\);/g);
    if (useStateMatch) {
      const lastUseState = useStateMatch[useStateMatch.length - 1];
      content = content.replace(lastUseState, lastUseState + '\n' + stateInjection);
    }
  }

  // 4. Inject WebSidebar and wrap main content in <View style={tw`flex-1 relative`}>
  // Replace <SafeAreaView style={tw`flex-1 bg-gray-50`}> or similar
  const safeAreaRegex = /<SafeAreaView style=\{tw`(.*?)`\}>/;
  const saMatch = content.match(safeAreaRegex);
  if (saMatch && !content.includes('WebSidebar user=')) {
    content = content.replace(saMatch[0], `<SafeAreaView style={tw\`flex-1 relative \${isLargeScreen ? 'flex-row' : 'flex-col'}\`}>
      {isLargeScreen && (
        <WebSidebar 
          user={user} 
          activeMenu={activeMenu} 
          navigation={navigation} 
          handleLogout={handleLogout} 
          unreadNotificationsCount={0} 
        />
      )}
      {/* MAIN CONTENT AREA */}
      <View style={tw\`flex-1 relative\`}>`);
  }

  // 5. Replace bottom nav entirely
  // We need to replace from {/* Bottom Navigation */} to the end of the file, then re-append the modal and closing tags.
  const bottomNavStart = content.indexOf('{/* Bottom Navigation */}');
  const bottomNavStart2 = content.indexOf('{/* BOTTOM NAVIGATION */}');
  const startIdx = bottomNavStart !== -1 ? bottomNavStart : bottomNavStart2;

  if (startIdx !== -1) {
    // Cut the content before bottom nav
    content = content.slice(0, startIdx);

    // Append our custom bottom nav + Modal + closing tags
    const newBottomNavAndModal = `
        {/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY) */}
        {!isLargeScreen && (
          <View style={tw\`absolute bottom-8 self-center w-11/12 bg-white rounded-full flex-row justify-around items-center py-5 shadow-2xl shadow-gray-400/50 z-50\`}>
            
            <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={() => navigation.navigate('AdminDashboard')}>
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
      </View>

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
    </SafeAreaView>
  );
}
`;
    content += newBottomNavAndModal;
  }

  // Handle Dimensions import
  if (!content.includes('Dimensions') && content.includes('react-native')) {
    content = content.replace("import {", "import { Dimensions,");
  }

  // Handle LinearGradient import
  if (!content.includes('LinearGradient')) {
    content = `import { LinearGradient } from 'expo-linear-gradient';\n` + content;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Fully patched ${f.path}`);
});
