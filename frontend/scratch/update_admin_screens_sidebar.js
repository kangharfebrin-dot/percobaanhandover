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

// ==========================================
// 1. UPDATE VehicleListScreen.js
// ==========================================
const vehicleScreenPath = path.join(__dirname, '..', 'screens', 'admin', 'VehicleListScreen.js');
let vehicleCode = fs.readFileSync(vehicleScreenPath, 'utf8');

// Imports
if (!vehicleCode.includes("import WebSidebar from '../../components/WebSidebar';")) {
  vehicleCode = "import WebSidebar from '../../components/WebSidebar';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\n" + vehicleCode;
}

// Load user in useEffect
if (!vehicleCode.includes("const loadUser = async () =>")) {
  vehicleCode = vehicleCode.replace(
    /const \[user, setUser\] = useState\(null\);/,
    `const [user, setUser] = useState(null);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));
      } catch (e) {
        console.log('Error loading user in VehicleList:', e);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => setIsLogoutVisible(true);
  const handleCancelLogout = () => setIsLogoutVisible(false);
  const confirmLogout = async () => {
    setIsLogoutVisible(false);
    await AsyncStorage.multiRemove(['user', 'token']);
    delete axios.defaults.headers.common['Authorization'];
    navigation.replace('Login');
  };`
  );
}

// Update SafeAreaView layout
const oldVehicleSafeRegex = /<SafeAreaView style=\{tw`flex-1 relative`\}>([\s\S]*?)<\/SafeAreaView>/;
if (oldVehicleSafeRegex.test(vehicleCode)) {
  vehicleCode = vehicleCode.replace(oldVehicleSafeRegex, (match, inner) => {
    // If arrow-back doesn't check canGoBack, make it graceful
    let updatedInner = inner.replace(
      /<TouchableOpacity onPress=\{\(\) => navigation\.goBack\(\)\} style=\{tw`p-2 bg-gray-100 rounded-full mr-4 shadow-sm z-30`\}>/,
      `<TouchableOpacity onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.replace('AdminDashboard'); }} style={tw\`p-2 bg-gray-100 rounded-full mr-4 shadow-sm z-30\`}>`
    );

    return `<SafeAreaView style={tw\`flex-1 \${isLargeScreen ? 'flex-row' : 'flex-col'}\`}>
        {isLargeScreen && (
          <WebSidebar
            user={user}
            activeMenu={'VehicleList'}
            navigation={navigation}
            handleLogout={handleLogout}
          />
        )}

        <View style={tw\`flex-1 relative\`}>
${updatedInner}
        </View>
      </SafeAreaView>`;
  });
}

// Add Logout Modal if not present
if (!vehicleCode.includes("isLogoutVisible") || !vehicleCode.includes("Konfirmasi Keluar")) {
  const logoutModal = `
      {/* Logout Modal */}
      <Modal
        visible={isLogoutVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={tw\`flex-1 justify-center items-center bg-black/60 px-6\`}>
          <View style={tw\`bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-2xl relative overflow-hidden\`}>
            <Image source={require('../../assets/logo.png')} style={[tw\`absolute opacity-10\`, { width: 250, height: 250, top: -50, right: -50 }]} resizeMode="contain" />
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
  vehicleCode = vehicleCode.replace(/(<\/View>\s*;\s*\}\s*)$/, logoutModal + '\n$1');
  if (!vehicleCode.includes("Konfirmasi Keluar")) {
    // alternative insertion before the final </View>
    vehicleCode = vehicleCode.replace(/(<\/View>\s*<\/View>\s*;\s*\}\s*)$/, logoutModal + '\n$1');
  }
}

if (validateJsx(vehicleCode, 'VehicleListScreen.js')) {
  fs.writeFileSync(vehicleScreenPath, vehicleCode, 'utf8');
  console.log('Successfully updated VehicleListScreen.js');
} else {
  process.exit(1);
}

// ==========================================
// 2. UPDATE WorkerListScreen.js
// ==========================================
const workerScreenPath = path.join(__dirname, '..', 'screens', 'admin', 'WorkerListScreen.js');
let workerCode = fs.readFileSync(workerScreenPath, 'utf8');

if (!workerCode.includes("import WebSidebar from '../../components/WebSidebar';")) {
  workerCode = "import WebSidebar from '../../components/WebSidebar';\n" + workerCode;
}

if (!workerCode.includes("const [isLogoutVisible, setIsLogoutVisible]")) {
  workerCode = workerCode.replace(
    /const \[user, setUser\] = useState\(null\);/,
    `const [user, setUser] = useState(null);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const handleLogout = () => setIsLogoutVisible(true);
  const handleCancelLogout = () => setIsLogoutVisible(false);
  const confirmLogout = async () => {
    setIsLogoutVisible(false);
    await AsyncStorage.multiRemove(['user', 'token']);
    delete axios.defaults.headers.common['Authorization'];
    navigation.replace('Login');
  };`
  );
}

const oldWorkerSafeRegex = /<SafeAreaView style=\{tw`flex-1 relative`\}>([\s\S]*?)<\/SafeAreaView>/;
if (oldWorkerSafeRegex.test(workerCode)) {
  workerCode = workerCode.replace(oldWorkerSafeRegex, (match, inner) => {
    return `<SafeAreaView style={tw\`flex-1 \${isLargeScreen ? 'flex-row' : 'flex-col'}\`}>
        {isLargeScreen && (
          <WebSidebar
            user={user}
            activeMenu={'WorkerList'}
            navigation={navigation}
            handleLogout={handleLogout}
          />
        )}

        <View style={tw\`flex-1 relative\`}>
${inner}
        </View>
      </SafeAreaView>`;
  });
}

const logoutModalWorker = `
      {/* Logout Modal */}
      <Modal
        visible={isLogoutVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={tw\`flex-1 justify-center items-center bg-black/60 px-6\`}>
          <View style={tw\`bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-2xl relative overflow-hidden\`}>
            <Image source={require('../../assets/logo.png')} style={[tw\`absolute opacity-10\`, { width: 250, height: 250, top: -50, right: -50 }]} resizeMode="contain" />
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

if (!workerCode.includes("Konfirmasi Keluar")) {
  workerCode = workerCode.replace(/(<\/View>\s*;\s*\}\s*)$/, logoutModalWorker + '\n$1');
}

if (validateJsx(workerCode, 'WorkerListScreen.js')) {
  fs.writeFileSync(workerScreenPath, workerCode, 'utf8');
  console.log('Successfully updated WorkerListScreen.js');
} else {
  process.exit(1);
}

// ==========================================
// 3. UPDATE PengawasListScreen.js
// ==========================================
const pengawasScreenPath = path.join(__dirname, '..', 'screens', 'admin', 'PengawasListScreen.js');
let pengawasCode = fs.readFileSync(pengawasScreenPath, 'utf8');

if (!pengawasCode.includes("import WebSidebar from '../../components/WebSidebar';")) {
  pengawasCode = "import WebSidebar from '../../components/WebSidebar';\n" + pengawasCode;
}

if (!pengawasCode.includes("const [isLogoutVisible, setIsLogoutVisible]")) {
  pengawasCode = pengawasCode.replace(
    /const \[user, setUser\] = useState\(null\);/,
    `const [user, setUser] = useState(null);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const handleLogout = () => setIsLogoutVisible(true);
  const handleCancelLogout = () => setIsLogoutVisible(false);
  const confirmLogout = async () => {
    setIsLogoutVisible(false);
    await AsyncStorage.multiRemove(['user', 'token']);
    delete axios.defaults.headers.common['Authorization'];
    navigation.replace('Login');
  };`
  );
}

const oldPengawasSafeRegex = /<SafeAreaView style=\{tw`flex-1 relative`\}>([\s\S]*?)<\/SafeAreaView>/;
if (oldPengawasSafeRegex.test(pengawasCode)) {
  pengawasCode = pengawasCode.replace(oldPengawasSafeRegex, (match, inner) => {
    return `<SafeAreaView style={tw\`flex-1 \${isLargeScreen ? 'flex-row' : 'flex-col'}\`}>
        {isLargeScreen && (
          <WebSidebar
            user={user}
            activeMenu={'PengawasList'}
            navigation={navigation}
            handleLogout={handleLogout}
          />
        )}

        <View style={tw\`flex-1 relative\`}>
${inner}
        </View>
      </SafeAreaView>`;
  });
}

if (!pengawasCode.includes("Konfirmasi Keluar")) {
  pengawasCode = pengawasCode.replace(/(<\/View>\s*;\s*\}\s*)$/, logoutModalWorker + '\n$1');
}

if (validateJsx(pengawasCode, 'PengawasListScreen.js')) {
  fs.writeFileSync(pengawasScreenPath, pengawasCode, 'utf8');
  console.log('Successfully updated PengawasListScreen.js');
} else {
  process.exit(1);
}

// ==========================================
// 4. UPDATE IssueListScreen.js
// ==========================================
const issueScreenPath = path.join(__dirname, '..', 'screens', 'pengawas', 'IssueListScreen.js');
let issueCode = fs.readFileSync(issueScreenPath, 'utf8');

if (!issueCode.includes("import WebSidebar from '../../components/WebSidebar';")) {
  issueCode = "import WebSidebar from '../../components/WebSidebar';\n" + issueCode;
}

if (!issueCode.includes("const [isLogoutVisible, setIsLogoutVisible]")) {
  issueCode = issueCode.replace(
    /const \[user, setUser\] = useState\(null\);/,
    `const [user, setUser] = useState(null);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const handleLogout = () => setIsLogoutVisible(true);
  const handleCancelLogout = () => setIsLogoutVisible(false);
  const confirmLogout = async () => {
    setIsLogoutVisible(false);
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.multiRemove(['user', 'token']);
    delete axios.defaults.headers.common['Authorization'];
    navigation.replace('Login');
  };`
  );
}

const oldIssueSafeRegex = /<SafeAreaView style=\{tw`flex-1 relative`\}>([\s\S]*?)<\/SafeAreaView>/;
if (oldIssueSafeRegex.test(issueCode)) {
  issueCode = issueCode.replace(oldIssueSafeRegex, (match, inner) => {
    return `<SafeAreaView style={tw\`flex-1 \${isLargeScreen ? 'flex-row' : 'flex-col'}\`}>
        {isLargeScreen && (
          <WebSidebar
            user={user}
            activeMenu={'IssueList'}
            navigation={navigation}
            handleLogout={handleLogout}
          />
        )}

        <View style={tw\`flex-1 relative\`}>
${inner}
        </View>
      </SafeAreaView>`;
  });
}

if (!issueCode.includes("Konfirmasi Keluar")) {
  issueCode = issueCode.replace(/(<\/View>\s*;\s*\}\s*)$/, logoutModalWorker + '\n$1');
}

if (validateJsx(issueCode, 'IssueListScreen.js')) {
  fs.writeFileSync(issueScreenPath, issueCode, 'utf8');
  console.log('Successfully updated IssueListScreen.js');
} else {
  process.exit(1);
}

console.log('ALL ADMIN SCREENS UPDATED WITH WEBSIDEBAR!');
