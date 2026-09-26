const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'screens', 'admin', 'ChecklistManagerScreen.js');
let content = fs.readFileSync(filePath, 'utf-8');

// Inject handleLogout and animations
if (!content.includes('const slideAnim =')) {
  const insertIndex = content.indexOf('const [modalVisible, setModalVisible] = useState(false);');
  if (insertIndex !== -1) {
    const injections = `
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [activeMenu, setActiveMenu] = useState('Checklist');
  const [previousMenu, setPreviousMenu] = useState('Checklist');
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: true })
      ])
    ).start();
  }, [slideAnim]);

  const slideInterpolate = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -32] });

  const handleLogout = () => {
    setPreviousMenu(activeMenu);
    setActiveMenu('Logout');
    setIsLogoutVisible(true);
  };
  
  const handleCancelLogout = () => {
    setIsLogoutVisible(false);
    setActiveMenu(previousMenu);
  };

  const confirmLogout = () => {
    setIsLogoutVisible(false);
    navigation.replace('Login');
  };
`;
    content = content.substring(0, insertIndex) + injections + content.substring(insertIndex);
  }
}

// Add the Logout Modal at the very end before the last </View>
if (!content.includes('Konfirmasi Keluar')) {
  const modalHTML = `
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
            <Text style={tw\`text-center text-gray-500 font-medium mb-8 px-4\`}>
              Apakah Anda yakin ingin keluar dari akun ini?
            </Text>
            <View style={tw\`flex-row w-full\`}>
              <TouchableOpacity
                style={tw\`flex-1 bg-gray-100 p-4 rounded-xl mr-2 items-center\`}
                onPress={handleCancelLogout}
              >
                <Text style={tw\`font-bold text-gray-600\`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw\`flex-1 bg-[#ED1C24] p-4 rounded-xl ml-2 items-center shadow-lg shadow-red-500/30\`}
                onPress={confirmLogout}
              >
                <Text style={tw\`font-bold text-white\`}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
`;
  const viewEnd = content.lastIndexOf('</View>');
  content = content.substring(0, viewEnd) + modalHTML + content.substring(viewEnd);
}

// Ensure Animated, Easing, LinearGradient, Feather are imported
if (!content.includes('import { Animated,')) content = content.replace('import { View,', 'import { View, Animated, Easing,');
if (!content.includes('LinearGradient')) content = content.replace('import tw', "import { LinearGradient } from 'expo-linear-gradient';\nimport tw");

fs.writeFileSync(filePath, content, 'utf-8');
