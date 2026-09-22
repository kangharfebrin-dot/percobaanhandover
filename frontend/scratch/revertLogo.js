const fs = require('fs');

const files = [
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/UserDashboardScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/shared/HistoryScreen.js'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const orig = content;
    content = content.replace(
      /<TextLogo style=\{\[tw`absolute opacity-10`,\s*\{\s*top:\s*-20,\s*right:\s*-40,\s*transform:\s*\[\{\s*scale:\s*1\.5\s*\}\]\s*\}\]\}\s*\/>/,
      `<Image source={require('../../assets/logo.png')} style={[tw\`absolute opacity-10\`, { width: 250, height: 250, top: -50, right: -50 }]} resizeMode="contain" />`
    );
    if (content !== orig) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Reverted in:', file);
    }
  }
}
