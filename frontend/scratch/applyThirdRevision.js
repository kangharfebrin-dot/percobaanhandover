const fs = require('fs');
const path = require('path');

const run = () => {
  // 1. FIX SCANNER ISSUE (Frontend only, no backend restart needed)
  let scannerScreen = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/ScannerScreen.js';
  let scanContent = fs.readFileSync(scannerScreen, 'utf8');

  // Remove the old buggy frontend check from my previous patch (if any) and replace with API call
  if (!scanContent.includes('const issueRes = await axios.get(`${API_URL}/api/issues/ongoing`);')) {
    scanContent = scanContent.replace(
      `const fetchPromise = axios.get(\`\${API_URL}/api/vehicles/scan/\${scannedText}\`);`,
      `const fetchPromise = axios.get(\`\${API_URL}/api/vehicles/scan/\${scannedText}\`);
      const issueRes = await axios.get(\`\${API_URL}/api/issues/ongoing\`);
      const ongoingIssues = issueRes.data || [];`
    );

    scanContent = scanContent.replace(
      `if (res && res.data && res.data.isUnderRepair) {
        Alert.alert("KENDARAAN DALAM PERBAIKAN", "Truk ini sedang dalam masa perbaikan (Isu belum diselesaikan admin). Tidak dapat melakukan perjalanan.");
        setLoading(false);
        return;
      }`,
      ``
    );

    scanContent = scanContent.replace(
      `if (res.data.vehicle.status === 'Maintenance') {`,
      `const isUnderRepair = ongoingIssues.some(issue => issue.handover && issue.handover.noPolisi === res.data.vehicle.noPolisi);
        
        if (isUnderRepair) {
          Alert.alert("KENDARAAN DALAM PERBAIKAN", "Truk ini sedang dalam masa perbaikan (Isu belum diselesaikan admin). Tidak dapat melakukan perjalanan.");
          setLoading(false);
          return;
        }

        if (res.data.vehicle.status === 'Maintenance') {`
    );
    fs.writeFileSync(scannerScreen, scanContent, 'utf8');
  }

  // 2. FIX ADMIN DASHBOARD (Hide Scanner cards from Admin)
  let adminDash = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js';
  let adminContent = fs.readFileSync(adminDash, 'utf8');

  adminContent = adminContent.replace(
    "const canSeeActions = isSuperAdmin || isAMT;",
    "const canSeeActions = isAMT;"
  );

  // Add "Daftar Pengawas" card
  if (!adminContent.includes("navigation.navigate('PengawasList')")) {
    const pengawasCard = `
                {/* Daftar Pengawas Full Width Card */}
                <TouchableOpacity
                  style={[tw\`w-full p-6 rounded-[35px] border border-white/60 mb-10 flex-row items-center justify-between\`, { backgroundColor: 'rgba(255,255,255,0.8)', ...glassStyle, shadowColor: '#F59E0B', shadowOpacity: 0.1, shadowRadius: 20 }]}
                  onPress={() => navigation.navigate('PengawasList')}
                >
                  <View style={tw\`flex-row items-center flex-1\`}>
                    <View style={tw\`w-14 h-14 bg-orange-100 rounded-full items-center justify-center mr-4\`}>
                      <Feather name="shield" size={26} color="#F59E0B" />
                    </View>
                    <View>
                      <Text style={tw\`text-2xl font-black text-gray-800 tracking-tighter\`}>Daftar Pengawas</Text>
                      <Text style={tw\`text-xs text-orange-600 font-black uppercase tracking-widest mt-1\`}>Manajemen Akun</Text>
                    </View>
                  </View>
                  <View style={tw\`w-10 h-10 bg-orange-50 rounded-full items-center justify-center\`}>
                    <Feather name="chevron-right" size={20} color="#F59E0B" />
                  </View>
                </TouchableOpacity>
`;
    adminContent = adminContent.replace(
      "{/* Action Card */}",
      pengawasCard + "\n            {/* Action Card */}"
    );
    fs.writeFileSync(adminDash, adminContent, 'utf8');
  }

  // 3. CREATE PengawasListScreen.js
  let workerList = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/WorkerListScreen.js';
  let pengawasList = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/PengawasListScreen.js';
  
  if (!fs.existsSync(pengawasList)) {
    let workerContent = fs.readFileSync(workerList, 'utf8');
    let pengawasContent = workerContent
      .replace(/WorkerListScreen/g, 'PengawasListScreen')
      .replace(/api\/workers/g, 'api/pengawas')
      .replace(/Daftar Pekerja/g, 'Daftar Pengawas')
      .replace(/Pekerja berhasil/g, 'Pengawas berhasil')
      .replace(/Tambah Pekerja/g, 'Tambah Pengawas')
      .replace(/Edit Pekerja/g, 'Edit Pengawas')
      .replace(/Informasi Pekerja/g, 'Informasi Pengawas')
      .replace(/Hapus Pekerja/g, 'Hapus Pengawas')
      .replace(/Hapus pekerja/g, 'Hapus pengawas')
      .replace(/worker/g, 'pengawas')
      .replace(/Worker/g, 'Pengawas')
      .replace(/WORKER/g, 'PENGAWAS')
      .replace(/setRole\('AMT'\)/g, "setRole('PENGAWAS')")
      .replace(/<Picker\.Item label="Awak Mobil Tangki \(AMT\)" value="AMT" \/>/g, '<Picker.Item label="Pengawas" value="PENGAWAS" />\n                      <Picker.Item label="Admin" value="ADMIN" />')
      .replace(/<Picker\.Item label="User Biasa" value="USER" \/>/g, '');
    
    fs.writeFileSync(pengawasList, pengawasContent, 'utf8');
  }

  // 4. Register PengawasListScreen in App.js
  let appJs = 'd:/UKSW/Pertamina/HandoverApp/frontend/App.js';
  let appContent = fs.readFileSync(appJs, 'utf8');
  
  if (!appContent.includes("import PengawasListScreen")) {
    appContent = appContent.replace(
      "import WorkerListScreen from './screens/admin/WorkerListScreen';",
      "import WorkerListScreen from './screens/admin/WorkerListScreen';\nimport PengawasListScreen from './screens/admin/PengawasListScreen';"
    );
    appContent = appContent.replace(
      '<Stack.Screen name="WorkerList" component={WorkerListScreen} />',
      '<Stack.Screen name="WorkerList" component={WorkerListScreen} />\n        <Stack.Screen name="PengawasList" component={PengawasListScreen} />'
    );
    fs.writeFileSync(appJs, appContent, 'utf8');
  }

  // 5. UPDATE BACKEND for /api/pengawas
  let backendIndex = 'd:/UKSW/Pertamina/HandoverApp/backend/index.js';
  let beContent = fs.readFileSync(backendIndex, 'utf8');
  
  if (!beContent.includes("app.get('/api/pengawas'")) {
    const pengawasRoutes = `
// --- PENGAWAS ROUTES ---
app.get('/api/pengawas', async (req, res) => {
  try {
    const pengawas = await prisma.user.findMany({
      where: { role: { in: ['PENGAWAS', 'ADMIN'] } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pengawas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/pengawas', async (req, res) => {
  try {
    const { name, username, password, role, jabatan } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.status(400).json({ error: 'Username sudah digunakan' });
    const newPengawas = await prisma.user.create({
      data: { name, username, password: password ? password : username, role: role || 'PENGAWAS', jabatan: jabatan || null }
    });
    res.status(201).json({ success: true, pengawas: newPengawas });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/pengawas/:id', async (req, res) => {
  try {
    const { name, username, role, password, jabatan } = req.body;
    const updateData = { name, username, role, jabatan };
    if (password && password.trim() !== '') updateData.password = password;
    const updatedPengawas = await prisma.user.update({ where: { id: req.params.id }, data: updateData });
    res.json({ success: true, pengawas: updatedPengawas });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/pengawas/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Pengawas berhasil dihapus' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});
`;
    beContent = beContent.replace("// --- CHECKLIST ROUTES ---", pengawasRoutes + "\n// --- CHECKLIST ROUTES ---");
    fs.writeFileSync(backendIndex, beContent, 'utf8');
  }

  console.log("All fixes applied successfully.");
};

run();
