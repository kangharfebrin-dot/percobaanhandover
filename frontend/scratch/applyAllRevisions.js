const fs = require('fs');

const run = () => {
  // 1. UPDATE HandoverFormScreen.js
  let handoverForm = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/HandoverFormScreen.js';
  let hfContent = fs.readFileSync(handoverForm, 'utf8');

  // Add locks for amt
  if (!hfContent.includes('const [isAmt1Locked, setIsAmt1Locked]')) {
    hfContent = hfContent.replace(
      'const [amt2, setAmt2] = useState(\'\');',
      `const [amt2, setAmt2] = useState('');
  const [isAmt1Locked, setIsAmt1Locked] = useState(false);
  const [isAmt2Locked, setIsAmt2Locked] = useState(false);`
    );
  }

  // Auto-fill logic based on user
  if (hfContent.includes('setUserRole(user.role || \'USER\');')) {
    hfContent = hfContent.replace(
      /setUserRole\(user\.role \|\| 'USER'\);\s*\}/,
      `setUserRole(user.role || 'USER');
          
          if (user.role === 'AMT' || user.role === 'USER') {
            const jbt = (user.jabatan || '').toUpperCase();
            if (jbt.includes('2')) {
              setAmt2(user.name);
              setIsAmt2Locked(true);
            } else {
              setAmt1(user.name);
              setIsAmt1Locked(true);
            }
          }
        }`
    );
  }

  // Make TextInput disabled if locked
  if (!hfContent.includes('editable={!isAmt1Locked}')) {
    hfContent = hfContent.replace(
      '<TextInput style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm mb-5`} placeholder="Nama AMT 1" value={amt1} onChangeText={handleSearchAmt1} onFocus={() => amt1.length > 0 && setShowWorkers1(true)} />',
      '<TextInput style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm mb-5 ${isAmt1Locked ? "text-gray-400 bg-gray-100" : ""}`} placeholder="Nama AMT 1" value={amt1} editable={!isAmt1Locked} onChangeText={handleSearchAmt1} onFocus={() => amt1.length > 0 && setShowWorkers1(true)} />'
    );
    
    hfContent = hfContent.replace(
      '<TextInput style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm mb-5`} placeholder="Nama AMT 2" value={amt2} onChangeText={handleSearchAmt2} onFocus={() => amt2.length > 0 && setShowWorkers2(true)} />',
      '<TextInput style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm mb-5 ${isAmt2Locked ? "text-gray-400 bg-gray-100" : ""}`} placeholder="Nama AMT 2" value={amt2} editable={!isAmt2Locked} onChangeText={handleSearchAmt2} onFocus={() => amt2.length > 0 && setShowWorkers2(true)} />'
    );
  }

  // Faster Camera
  if (hfContent.includes('setTimeout(async () => {')) {
    hfContent = hfContent.replace(
      `setTimeout(async () => {
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });`,
      `// Langsung eksekusi tanpa setTimeout
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, skipProcessing: true });`
    );
    hfContent = hfContent.replace(
      `} finally {
          setLoading(false);
        }
      }, 50); // 50ms sudah cukup untuk 3 frame UI (60fps)`,
      `} finally {
          setLoading(false);
        }`
    );
  }

  fs.writeFileSync(handoverForm, hfContent, 'utf8');

  // 2. UPDATE BACKEND index.js for Scanner Issue check
  let backendIndex = 'd:/UKSW/Pertamina/HandoverApp/backend/index.js';
  let beContent = fs.readFileSync(backendIndex, 'utf8');

  if (!beContent.includes('const ongoingIssue = await prisma.issue.findFirst')) {
    beContent = beContent.replace(
      `const lastHandover = await prisma.handover.findFirst({
      where: { noPolisi: vehicle.noPolisi },`,
      `const ongoingIssue = await prisma.issue.findFirst({
      where: { status: 'ONGOING', handover: { noPolisi: vehicle.noPolisi } }
    });
    
    if (ongoingIssue) {
      return res.json({ success: false, isUnderRepair: true, message: 'Kendaraan sedang dalam perbaikan (Isu Aktif)' });
    }

    const lastHandover = await prisma.handover.findFirst({
      where: { noPolisi: vehicle.noPolisi },`
    );
    fs.writeFileSync(backendIndex, beContent, 'utf8');
  }

  // 3. UPDATE ScannerScreen.js
  let scannerScreen = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/ScannerScreen.js';
  let scanContent = fs.readFileSync(scannerScreen, 'utf8');

  if (!scanContent.includes('if (res.data.isUnderRepair)')) {
    scanContent = scanContent.replace(
      `if (res && res.data && res.data.success && res.data.vehicle) {
        if (res.data.vehicle.status === 'Maintenance') {`,
      `if (res && res.data && res.data.isUnderRepair) {
        Alert.alert("KENDARAAN DALAM PERBAIKAN", "Truk ini sedang dalam masa perbaikan (Isu belum diselesaikan admin). Tidak dapat melakukan perjalanan.");
        setLoading(false);
        return;
      }
      
      if (res && res.data && res.data.success && res.data.vehicle) {
        if (res.data.vehicle.status === 'Maintenance') {`
    );
    fs.writeFileSync(scannerScreen, scanContent, 'utf8');
  }

  // 4. UPDATE DASHBOARDS (Live Feed)
  let adminDash = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js';
  let adminContent = fs.readFileSync(adminDash, 'utf8');
  if (adminContent.includes('useEffect(() => {\n    fetchStats();') && !adminContent.includes('setInterval(fetchAlerts, 5000)')) {
    adminContent = adminContent.replace(
      `useEffect(() => {
    fetchStats();
    fetchAlerts();
  }, []);`,
      `useEffect(() => {
    fetchStats();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);
    return () => clearInterval(interval);
  }, []);`
    );
    fs.writeFileSync(adminDash, adminContent, 'utf8');
  }

  let pengawasDash = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js';
  let pengawasContent = fs.readFileSync(pengawasDash, 'utf8');
  if (pengawasContent.includes('useEffect(() => {\n    fetchStats();') && !pengawasContent.includes('setInterval(fetchAlerts, 5000)')) {
    pengawasContent = pengawasContent.replace(
      `useEffect(() => {
    fetchStats();
    fetchAlerts();
  }, []);`,
      `useEffect(() => {
    fetchStats();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);
    return () => clearInterval(interval);
  }, []);`
    );
    fs.writeFileSync(pengawasDash, pengawasContent, 'utf8');
  }

  // 5. UPDATE HandoverDetailScreen.js to hide Major/Minor for Users
  let detailScreen = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/shared/HandoverDetailScreen.js';
  let detailContent = fs.readFileSync(detailScreen, 'utf8');
  
  if (!detailContent.includes('const [userRole, setUserRole] = useState')) {
    detailContent = detailContent.replace(
      'export default function HandoverDetailScreen({ route, navigation }) {',
      `import AsyncStorage from '@react-native-async-storage/async-storage';\nexport default function HandoverDetailScreen({ route, navigation }) {`
    );
    detailContent = detailContent.replace(
      'const [resolving, setResolving] = useState(false);',
      `const [resolving, setResolving] = useState(false);
  const [userRole, setUserRole] = useState('USER');
  
  useEffect(() => {
    AsyncStorage.getItem('user').then(str => {
      if(str) {
        const u = JSON.parse(str);
        setUserRole(u.role || 'USER');
      }
    });
  }, []);`
    );
  }

  // Hide severity
  if (!detailContent.includes('userRole === \'SUPER_ADMIN\' || userRole === \'PENGAWAS\' ?')) {
    detailContent = detailContent.replace(
      /<Text style=\{tw`text-xs font-bold \$\{item\.severity === 'Major' \? 'text-red-700' : 'text-orange-700'\}`\}>\s*\{item\.severity\}\s*<\/Text>/g,
      `{(userRole === 'SUPER_ADMIN' || userRole === 'PENGAWAS') && (
        <Text style={tw\`text-xs font-bold \${item.severity === 'Major' ? 'text-red-700' : 'text-orange-700'}\`}>
          {item.severity}
        </Text>
      )}`
    );
    fs.writeFileSync(detailScreen, detailContent, 'utf8');
  }
  
  console.log("All patches applied.");
};

run();
