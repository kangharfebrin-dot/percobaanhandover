const fs = require('fs');

// 1. Update IssueDetailScreen.js
const detailPath = 'E:/Magang/HandoverApp/frontend/screens/pengawas/IssueDetailScreen.js';
let detailCode = fs.readFileSync(detailPath, 'utf8');

// Replace Header title if wanted:
detailCode = detailCode.replace(
  'Evaluasi Perbaikan',
  'Verifikasi Perbaikan'
);

// Replace Toast text:
detailCode = detailCode.replace(
  "Toast.show({ type: 'success', text1: 'Sukses', text2: 'Evaluasi perbaikan berhasil dikirim.' });",
  "Toast.show({ type: 'success', text1: 'Sukses', text2: 'Verifikasi perbaikan berhasil dikirim.' });"
);

// Replace Floating button text:
detailCode = detailCode.replace(
  '<Text style={tw`text-white font-black text-lg`}>Kirim Evaluasi</Text>',
  '<Text style={tw`text-white font-black text-lg`}>Kirim Verifikasi</Text>'
);

// Replace ConfirmModal invocation:
const oldConfirmModal = `<ConfirmModal
          visible={confirmModalVisible}
          title="Konfirmasi Evaluasi"
          message="Kirim hasil evaluasi ini?"
          onConfirm={confirmEvaluate}
          onCancel={() => setConfirmModalVisible(false)}
        />`;

const newConfirmModal = `<ConfirmModal
          visible={confirmModalVisible}
          title="Konfirmasi Verifikasi"
          message="Apakah Anda yakin ingin mengirim hasil verifikasi perbaikan ini?"
          confirmText="Ya, Verifikasi"
          confirmColor="#0055A5"
          icon="check-circle"
          onConfirm={confirmEvaluate}
          onCancel={() => setConfirmModalVisible(false)}
        />`;

if (detailCode.includes(oldConfirmModal.replace(/\n/g, '\r\n'))) {
  detailCode = detailCode.replace(oldConfirmModal.replace(/\n/g, '\r\n'), newConfirmModal.replace(/\n/g, '\r\n'));
} else {
  detailCode = detailCode.replace(oldConfirmModal, newConfirmModal);
}

fs.writeFileSync(detailPath, detailCode, 'utf8');
console.log('Successfully updated IssueDetailScreen.js');

// 2. Update IssueListScreen.js to ensure ADMIN role can also navigate to IssueDetail
const listPath = 'E:/Magang/HandoverApp/frontend/screens/pengawas/IssueListScreen.js';
let listCode = fs.readFileSync(listPath, 'utf8');
listCode = listCode.replace(
  "user?.role === 'SUPER_ADMIN' || user?.role === 'PENGAWAS'",
  "user?.role === 'SUPER_ADMIN' || user?.role === 'PENGAWAS' || user?.role === 'ADMIN'"
);
fs.writeFileSync(listPath, listCode, 'utf8');
console.log('Successfully updated IssueListScreen.js');
