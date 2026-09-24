const fs = require('fs');
let file = 'e:/Magang/HandoverApp/frontend/screens/pengawas/IssueDetailScreen.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /Alert\.alert\('Sukses',\s*'Evaluasi perbaikan berhasil dikirim\.',\s*\[\s*\{\s*text:\s*'OK',\s*onPress:\s*\(\)\s*=>\s*navigation\.goBack\(\)\s*\}\s*\]\s*\);/,
  "Toast.show({ type: 'success', text1: 'Sukses', text2: 'Evaluasi perbaikan berhasil dikirim.' }); setTimeout(() => navigation.goBack(), 1000);"
);
fs.writeFileSync(file, content);

file = 'e:/Magang/HandoverApp/frontend/screens/CameraScreen.js';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /Alert\.alert\('Sukses',\s*'Handover berhasil disimpan!',\s*\[\s*\{\s*text:\s*'OK',\s*onPress:\s*\(\)\s*=>\s*navigation\.replace\((['"`])History\1\)\s*\}\s*\]\s*\);/,
  "Toast.show({ type: 'success', text1: 'Sukses', text2: 'Handover berhasil disimpan!' }); setTimeout(() => navigation.replace('History'), 1000);"
);
fs.writeFileSync(file, content);
