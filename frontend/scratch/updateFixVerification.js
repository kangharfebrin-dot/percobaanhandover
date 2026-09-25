const fs = require('fs');
const path = 'E:/Magang/HandoverApp/frontend/screens/user/FixVerificationScreen.js';
let code = fs.readFileSync(path, 'utf8');

// 1. replace quality
code = code.replace('quality: 0.7', 'quality: 0.5');

// 2. replace submitVerification
const startIdx = code.indexOf('  const submitVerification = async () => {');
const endMarker = '    } finally {\r\n      setSubmitting(false);\r\n    }';
const endMarkerLF = '    } finally {\n      setSubmitting(false);\n    }';

let endIdx = code.indexOf(endMarker, startIdx);
let markerLen = endMarker.length;
if (endIdx === -1) {
  endIdx = code.indexOf(endMarkerLF, startIdx);
  markerLen = endMarkerLF.length;
}

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find submitVerification bounds:', startIdx, endIdx);
  process.exit(1);
}

const newSubmit = `  const submitVerification = async () => {
    if (submitting) return;

    // Validate
    const itemsToRepair = brokenItems.filter(i => i.repairStatus === 'BAIK');
    if (itemsToRepair.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Peringatan',
        text2: 'Tidak ada item yang diverifikasi sebagai BAIK.'
      });
      return;
    }

    // Check if notes and photos are provided for BAIK items
    for (const item of itemsToRepair) {
      if (!item.repairNote.trim()) {
        Toast.show({
          type: 'info',
          text1: 'Peringatan',
          text2: \`Catatan perbaikan untuk \${item.name} wajib diisi.\`
        });
        return;
      }
      if (!item.photo) {
        Toast.show({
          type: 'info',
          text1: 'Peringatan',
          text2: \`Bukti foto untuk perbaikan \${item.name} wajib dilampirkan.\`
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      const itemsData = itemsToRepair.map(i => ({
        id: i.id,
        repairNote: i.repairNote
      }));
      formData.append('itemsData', JSON.stringify(itemsData));

      // Append photos
      itemsToRepair.forEach(item => {
        if (item.photo) {
          const rawFilename = item.photo.uri.split('/').pop() || \`photo_\${item.id}.jpg\`;
          const match = /\\.(\\w+)$/.exec(rawFilename);
          const ext = match ? match[1].toLowerCase() : 'jpg';
          const type = ext === 'png' ? 'image/png' : 'image/jpeg';
          const filename = rawFilename.endsWith('.jpg') || rawFilename.endsWith('.jpeg') || rawFilename.endsWith('.png')
            ? rawFilename
            : \`\${rawFilename}.jpg\`;

          formData.append(\`photo_\${item.id}\`, {
            uri: Platform.OS === 'android' ? item.photo.uri : item.photo.uri.replace('file://', ''),
            name: filename,
            type
          });
        }
      });

      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(\`\${API_URL}/api/issues/\${issue.id}/verify-repair\`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': \`Bearer \${token}\`
        },
        timeout: 45000,
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Submit verification error:', error?.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: 'Gagal Mengirim',
        text2: error?.response?.data?.error || 'Gagal mengirim verifikasi perbaikan. Periksa koneksi internet.'
      });
    } finally {
      setSubmitting(false);
    }`;

code = code.substring(0, startIdx) + newSubmit + code.substring(endIdx + markerLen);

// 3. Add back button on brokenItems.length === 0
const emptyMarker = 'Bukti perbaikan Anda telah dikirim dan saat ini sedang ditinjau oleh Admin.';
if (code.includes(emptyMarker)) {
  const replaceOld = `            <Text style={tw\`text-gray-500 text-center font-medium px-4 leading-6\`}>
              Bukti perbaikan Anda telah dikirim dan saat ini sedang ditinjau oleh Admin.
            </Text>
          </View>`;
  const replaceNew = `            <Text style={tw\`text-gray-500 text-center font-medium px-4 leading-6 mb-6\`}>
              Bukti perbaikan Anda telah dikirim dan saat ini sedang ditinjau oleh Admin / Pengawas.
            </Text>
            <TouchableOpacity 
              style={tw\`bg-[#0055A5] px-6 py-3 rounded-xl items-center shadow-md\`}
              onPress={() => navigation.goBack()}
            >
              <Text style={tw\`text-white font-bold\`}>Kembali ke Beranda</Text>
            </TouchableOpacity>
          </View>`;

  // Handle CRLF or LF in replacement
  if (code.includes('\r\n')) {
    code = code.replace(replaceOld.replace(/\n/g, '\r\n'), replaceNew.replace(/\n/g, '\r\n'));
  } else {
    code = code.replace(replaceOld, replaceNew);
  }
}

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated FixVerificationScreen.js');
