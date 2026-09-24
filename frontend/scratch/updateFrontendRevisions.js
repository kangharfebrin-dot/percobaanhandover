const fs = require('fs');

const updateHandoverForm = () => {
  let file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/HandoverFormScreen.js';
  let content = fs.readFileSync(file, 'utf8');

  // Add type to route params
  if (content.includes('const { noPolisi: initialNoPolisi } = route?.params || {};')) {
    content = content.replace(
      'const { noPolisi: initialNoPolisi } = route?.params || {};',
      'const { noPolisi: initialNoPolisi, type } = route?.params || {};'
    );
  }

  // Add amt1, amt2, and workers states
  if (!content.includes('const [amt1, setAmt1]')) {
    content = content.replace(
      'const [odoMeter, setOdoMeter] = useState(\'\');',
      `const [odoMeter, setOdoMeter] = useState('');
  const [amt1, setAmt1] = useState('');
  const [amt2, setAmt2] = useState('');
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers1, setFilteredWorkers1] = useState([]);
  const [filteredWorkers2, setFilteredWorkers2] = useState([]);
  const [showWorkers1, setShowWorkers1] = useState(false);
  const [showWorkers2, setShowWorkers2] = useState(false);`
    );
  }

  // Fetch workers
  if (!content.includes('axios.get(`${API_URL}/api/workers`)')) {
    content = content.replace(
      'const loadChecklist = async () => {',
      `
    const loadWorkers = async () => {
      try {
        const res = await axios.get(\`\${API_URL}/api/workers\`);
        setWorkers(res.data);
      } catch (e) {
        console.error("Gagal load workers:", e);
      }
    };
    loadWorkers();

    const loadChecklist = async () => {`
    );
  }

  // Add search logic
  if (!content.includes('const handleSearchAmt1 =')) {
    content = content.replace(
      '// UPDATE ITEMS LOGIC',
      `// AUTOCOMPLETE LOGIC
  const handleSearchAmt1 = (text) => {
    setAmt1(text);
    if(text.length > 0) {
      setFilteredWorkers1(workers.filter(w => w.name.toLowerCase().includes(text.toLowerCase())));
      setShowWorkers1(true);
    } else {
      setShowWorkers1(false);
    }
  };
  const handleSearchAmt2 = (text) => {
    setAmt2(text);
    if(text.length > 0) {
      setFilteredWorkers2(workers.filter(w => w.name.toLowerCase().includes(text.toLowerCase())));
      setShowWorkers2(true);
    } else {
      setShowWorkers2(false);
    }
  };
  const selectAmt1 = (name) => { setAmt1(name); setShowWorkers1(false); };
  const selectAmt2 = (name) => { setAmt2(name); setShowWorkers2(false); };

  // UPDATE ITEMS LOGIC`
    );
  }

  // Submit Logic - Back Navigation Fix
  if (content.includes("navigation.navigate('UserDashboard');")) {
    content = content.replace(/navigation\.navigate\('AdminDashboard'\);/g, "navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });");
    content = content.replace(/navigation\.navigate\('PengawasDashboard'\);/g, "navigation.reset({ index: 0, routes: [{ name: 'PengawasDashboard' }] });");
    content = content.replace(/navigation\.navigate\('UserDashboard'\);/g, "navigation.reset({ index: 0, routes: [{ name: 'UserDashboard' }] });");
  }

  // Submit Payload Fix (Adding amt1, amt2)
  if (!content.includes('amt1, amt2')) {
    content = content.replace(
      'formData.append("shift", shift);',
      'formData.append("shift", shift);\n      formData.append("amt1", amt1);\n      formData.append("amt2", amt2);'
    );
  }

  // Label Odometer and AMT inputs
  if (!content.includes('Odometer Awal')) {
    content = content.replace(
      /<Text style=\{tw`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2`\}>Odo Meter \(KM\)<\/Text>\s*<TextInput[\s\S]*?onChangeText=\{setOdoMeter\}\s*\/>/m,
      `<Text style={tw\`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2\`}>AMT 1</Text>
          <View style={tw\`relative z-20\`}>
            <TextInput style={tw\`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm mb-5\`} placeholder="Nama AMT 1" value={amt1} onChangeText={handleSearchAmt1} onFocus={() => amt1.length > 0 && setShowWorkers1(true)} />
            {showWorkers1 && filteredWorkers1.length > 0 && (
              <View style={tw\`absolute top-14 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-40\`}>
                <ScrollView nestedScrollEnabled={true}>
                  {filteredWorkers1.map(w => (
                    <TouchableOpacity key={w.id} style={tw\`p-3 border-b border-gray-100\`} onPress={() => selectAmt1(w.name)}>
                      <Text style={tw\`font-bold text-gray-800\`}>{w.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <Text style={tw\`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2\`}>AMT 2</Text>
          <View style={tw\`relative z-10\`}>
            <TextInput style={tw\`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm mb-5\`} placeholder="Nama AMT 2" value={amt2} onChangeText={handleSearchAmt2} onFocus={() => amt2.length > 0 && setShowWorkers2(true)} />
            {showWorkers2 && filteredWorkers2.length > 0 && (
              <View style={tw\`absolute top-14 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-40\`}>
                <ScrollView nestedScrollEnabled={true}>
                  {filteredWorkers2.map(w => (
                    <TouchableOpacity key={w.id} style={tw\`p-3 border-b border-gray-100\`} onPress={() => selectAmt2(w.name)}>
                      <Text style={tw\`font-bold text-gray-800\`}>{w.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <Text style={tw\`text-gray-500 font-bold text-xs uppercase tracking-wider mb-2\`}>{type === 'akhiri' ? 'Odometer Akhir' : 'Odometer Awal'}</Text>
          <TextInput
            style={tw\`bg-slate-50 p-4 rounded-2xl border border-slate-200 text-black font-bold text-base shadow-sm\`}
            placeholder="Misal: 150000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={odoMeter}
            onChangeText={setOdoMeter}
          />`
    );
  }

  // Button text
  if (content.includes('KIRIM LAPORAN')) {
    content = content.replace(
      /\{loading \? "MENGIRIM LAPORAN\.\.\." : "KIRIM LAPORAN"\}/g,
      "{loading ? \"MEMPROSES...\" : (type === 'akhiri' ? 'AKHIRI PERJALANAN' : 'MULAI PERJALANAN')}"
    );
  }

  // Ensure hardware back press behavior in React Navigation?
  // We used reset(), so back won't go to handover again.

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated HandoverFormScreen');
};

const updateScannerScreen = () => {
  let file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/ScannerScreen.js';
  let content = fs.readFileSync(file, 'utf8');

  if (content.includes("if (res && res.data && res.data.success && res.data.vehicle) {")) {
    content = content.replace(
      "setScannedNoPolisi(res.data.vehicle.noPolisi);\n        setLoading(false);\n        setScanResult('success');",
      `setScannedNoPolisi(res.data.vehicle.noPolisi);
        if (res.data.lastHandover) {
          setLastHandover(res.data.lastHandover);
          setScanResult('recap');
        } else {
          setScanResult('success');
        }
        setLoading(false);`
    );
  }

  if (content.includes("navigation.navigate('HandoverForm', { noPolisi: scannedNoPolisi });")) {
    content = content.replace(
      "navigation.navigate('HandoverForm', { noPolisi: scannedNoPolisi });",
      "navigation.navigate('HandoverForm', { noPolisi: scannedNoPolisi, type });"
    );
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ScannerScreen');
};

updateHandoverForm();
updateScannerScreen();
