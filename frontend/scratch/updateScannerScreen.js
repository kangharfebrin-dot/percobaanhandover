const fs = require('fs');
const path = 'E:/Magang/HandoverApp/frontend/screens/user/ScannerScreen.js';
let code = fs.readFileSync(path, 'utf8');

// 1. Replace Step 1, Step 2, and Step 7 logic in handleBarcodeScanned
const startMarker = '// === STEP 1: Cek apakah kendaraan sedang dalam perbaikan';
const endMarker = 'setLoading(false);\r\n\r\n    } catch (error) {';
const endMarkerLF = 'setLoading(false);\n\n    } catch (error) {';

const startIdx = code.indexOf(startMarker);
let endIdx = code.indexOf(endMarker, startIdx);
let markerLen = endMarker.length;
if (endIdx === -1) {
  endIdx = code.indexOf(endMarkerLF, startIdx);
  markerLen = endMarkerLF.length;
}

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find ScannerScreen steps bounds:', startIdx, endIdx);
  process.exit(1);
}

// Keep Step 3, 4, 5, 6 intact, just update Step 1 & 2 at top and Step 7 at bottom
const oldBlock = code.substring(startIdx, endIdx + markerLen);

// Let's replace the whole section from Step 1 to end of Step 7
const newBlock = `// === STEP 1: Cek apakah kendaraan sedang dalam perbaikan (ada issue ONGOING / PENDING_APPROVAL) ===
      const activeIssue = ongoingIssues.find(issue => issue.handover && issue.handover.noPolisi === vehicleNoPolisi);
      const isUnderRepair = !!activeIssue;
      const isPendingApproval = activeIssue?.status === 'PENDING_APPROVAL';
      const hasAnyMajorItem = activeIssue?.handover?.items?.some(item => item.name.includes('[MAJOR]'));
      const hasUnrepairedMajor = activeIssue?.handover?.items?.some(item => item.name.includes('[MAJOR]') && !item.isGood && !item.isRepaired);
      const hasUnrepairedMinor = activeIssue?.handover?.items?.some(item => !item.name.includes('[MAJOR]') && !item.isGood && !item.isRepaired);

      // Cek apakah user ini berhak melakukan verifikasi perbaikan
      const isReporter = String(activeIssue?.handover?.userId) === String(userId);
      const isAmt1 = activeIssue?.handover?.amt1 && user?.name && activeIssue.handover.amt1.trim().toLowerCase() === user.name.trim().toLowerCase();
      const isAmt2 = activeIssue?.handover?.amt2 && user?.name && activeIssue.handover.amt2.trim().toLowerCase() === user.name.trim().toLowerCase();
      const canRepair = isUnderRepair ? (isAmt1 || isAmt2 || (isReporter && !isAdminOrPengawas) || userRole === 'SUPER_ADMIN') : false;

      // === STEP 1.5: Handle kendaraan yang sedang menunggu respon/persetujuan dari Admin ===
      if (isUnderRepair && isPendingApproval) {
        if (hasAnyMajorItem) {
          // Kerusakan major telah dilaporkan selesai diperbaiki, sekarang MENUNGGU RESPON ADMIN
          setScanResult('pending_approval');
          setLoading(false);
          return;
        }
      }

      // === STEP 2: Handle kendaraan dengan issue Major yang belum diperbaiki (DIBLOKIR) ===
      if (isUnderRepair && hasUnrepairedMajor) {
        if (!canRepair) {
          setErrorMessage('Kendaraan ini sedang dalam perbaikan (Kerusakan Major). Hanya AMT 1 dan AMT 2 yang bertugas yang dapat mengirim laporan perbaikan.');
          setScanResult('error');
          setLoading(false);
          return;
        }
        // AMT bertugas → tampilkan opsi verifikasi perbaikan
        setScanResult('repair');
        setLoading(false);
        return;
      }

      // === STEP 3: Handle status Maintenance (tanpa issue ONGOING — dead end) ===
      if (res.data.vehicle.status === 'Maintenance' && !isUnderRepair) {
        setScanResult('maintenance');
        setLoading(false);
        return;
      }

      // === STEP 4: Untuk Akhiri Pekerjaan — blokir jika ada issue Minor yang masih ONGOING ===
      // (Mobil Minor masih bisa jalan, jadi Akhiri tetap boleh — TIDAK diblokir)

      // === STEP 5: Cek apakah user sedang aktif di mobil LAIN ===
      if (!isAdminOrPengawas && res.data.activeUserHandover) {
        const activePolisi = res.data.activeUserHandover.noPolisi;
        if (activePolisi !== vehicleNoPolisi) {
          setErrorMessage(\`Anda sedang aktif di pekerjaan kendaraan \${activePolisi}. Selesaikan (Akhiri) pekerjaan tersebut terlebih dahulu.\`);
          setLoading(false);
          setScanResult('error');
          return;
        }
      }

      // === STEP 6: Validasi urutan Mulai → Akhiri ===
      let finalResult = 'success';

      if (res.data.lastHandover) {
        const lastType = res.data.lastHandover.type;
        const lastHasIssue = !!res.data.lastHandover.issue;

        if (!isAdminOrPengawas) {
          if (type === 'mulai' && lastType === 'mulai') {
            // Boleh mulai lagi jika handover terakhir punya issue (mobil rusak, sudah diverifikasi/resolved)
            if (!lastHasIssue) {
              setErrorMessage('Kendaraan ini belum menyelesaikan pekerjaannya (Belum Akhiri Pekerjaan).');
              setLoading(false);
              setScanResult('error');
              return;
            }
          } else if (type === 'akhiri' && lastType !== 'mulai') {
            setErrorMessage('Kendaraan ini belum memulai pekerjaan (Belum Mulai Pekerjaan).');
            setLoading(false);
            setScanResult('error');
            return;
          }
        }

        // Tampilkan recap jika ada data items dari handover terakhir
        if (res.data.lastHandover.items && res.data.lastHandover.items.length > 0) {
          setLastHandover(res.data.lastHandover);
          finalResult = 'recap';
        } else {
          setLastHandover(null);
          finalResult = 'success';
        }
      } else {
        // Belum ada handover sama sekali
        if (type === 'akhiri' && !isAdminOrPengawas) {
          setErrorMessage('Kendaraan ini belum memulai pekerjaan.');
          setLoading(false);
          setScanResult('error');
          return;
        }
        finalResult = 'success';
      }

      // === STEP 7: Handle issue Minor yang belum diperbaiki (masih bisa lanjut kerja) ===
      if (isUnderRepair && hasUnrepairedMinor && canRepair) {
        setNextScanResult(finalResult);
        setScanResult('repair_minor');
      } else {
        setScanResult(finalResult);
      }
      setLoading(false);

    } catch (error) {`;

code = code.substring(0, startIdx) + newBlock + code.substring(endIdx + markerLen);

// 2. Add scanResult === 'pending_approval' modal right before scanResult === 'repair'
const repairModalMarker = "{scanResult === 'repair' && (";
const pendingModal = `{scanResult === 'pending_approval' && (
        <View style={tw\`absolute inset-0 bg-black/70 justify-center items-center px-6 z-50\`}>
          <View style={tw\`bg-white w-full max-w-sm rounded-[30px] p-8 items-center shadow-2xl border-4 border-amber-300 relative\`}>
            <TouchableOpacity 
              style={tw\`absolute top-4 right-4 z-50 p-2 bg-gray-100 rounded-full\`}
              onPress={() => setScanResult(null)}
            >
              <Ionicons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>

            <View style={tw\`w-24 h-24 bg-amber-50 rounded-full items-center justify-center mb-5 shadow-lg shadow-amber-200 border-4 border-amber-100\`}>
              <Ionicons name="hourglass" size={48} color="#D97706" />
            </View>

            <View style={tw\`bg-amber-100 px-3 py-1 rounded-full mb-3\`}>
              <Text style={tw\`text-amber-800 font-bold text-[11px] uppercase tracking-wider\`}>MENUNGGU PERSETUJUAN</Text>
            </View>

            <Text style={tw\`text-2xl font-black text-gray-800 mb-2 text-center\`}>Menunggu Respon{"\\n"}Admin</Text>
            
            <Text style={tw\`text-gray-500 text-center mb-6 font-medium text-sm leading-5\`}>
              Laporan perbaikan untuk truk ini telah dikirimkan dan saat ini sedang menunggu respon serta persetujuan dari Admin / Pengawas.
            </Text>

            <View style={tw\`w-full bg-amber-50/80 rounded-2xl p-4 border border-amber-200/60 mb-6\`}>
              <View style={tw\`flex-row justify-between items-center mb-2\`}>
                <Text style={tw\`text-xs text-amber-900/70 font-semibold\`}>Truk:</Text>
                <Text style={tw\`text-xs text-amber-900 font-extrabold\`}>{scannedNoPolisi}</Text>
              </View>
              <View style={tw\`flex-row justify-between items-center\`}>
                <Text style={tw\`text-xs text-amber-900/70 font-semibold\`}>Status:</Text>
                <View style={tw\`bg-amber-200/80 px-2 py-0.5 rounded-md\`}>
                  <Text style={tw\`text-amber-900 font-bold text-[11px]\`}>Menunggu Evaluasi Admin</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={tw\`w-full bg-[#0055A5] p-4 rounded-2xl items-center shadow-lg shadow-blue-500/20\`}
              onPress={() => { setScanResult(null); navigation.goBack(); }}
            >
              <Text style={tw\`text-white font-bold text-[15px]\`}>Kembali ke Beranda</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      `;

if (code.includes(repairModalMarker)) {
  code = code.replace(repairModalMarker, pendingModal + repairModalMarker);
} else {
  console.error('Could not find repairModalMarker');
  process.exit(1);
}

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated ScannerScreen.js');
