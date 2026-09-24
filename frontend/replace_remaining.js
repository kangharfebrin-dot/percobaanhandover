const fs = require('fs');

function replaceFileContent(file, regex, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(regex, replacement);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
}

replaceFileContent(
  'e:/Magang/HandoverApp/frontend/screens/admin/WorkerListScreen.js',
  /Alert\.alert\("Gagal", (.*?)\);/g,
  "Toast.show({ type: 'error', text1: 'Gagal', text2: $1 });"
);

replaceFileContent(
  'e:/Magang/HandoverApp/frontend/screens/admin/PengawasListScreen.js',
  /Alert\.alert\("Gagal", (.*?)\);/g,
  "Toast.show({ type: 'error', text1: 'Gagal', text2: $1 });"
);

replaceFileContent(
  'e:/Magang/HandoverApp/frontend/screens/admin/VehicleListScreen.js',
  /Alert\.alert\('Gagal', (.*?)\);/g,
  "Toast.show({ type: 'error', text1: 'Gagal', text2: $1 });"
);

// CameraScreen.js with formatting
replaceFileContent(
  'e:/Magang/HandoverApp/frontend/screens/CameraScreen.js',
  /Alert\.alert\(\s*'Sukses',\s*'Handover berhasil disimpan!',\s*\[\s*\{\s*text:\s*'OK',\s*onPress:\s*\(\)\s*=>\s*navigation\.replace\('History'\)\s*\}\s*\]\s*\);/,
  "Toast.show({ type: 'success', text1: 'Sukses', text2: 'Handover berhasil disimpan!' }); setTimeout(() => navigation.replace('History'), 1000);"
);

