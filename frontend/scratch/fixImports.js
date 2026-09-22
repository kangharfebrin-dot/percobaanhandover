const fs = require('fs');

const files = [
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/VehicleListScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/WorkerListScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/MessageCenterScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/shared/HistoryScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/UserDashboardScreen.js'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const orig = content;
    
    // Check if TextLogo is used
    if (content.includes('TextLogo') && !content.includes('import TextLogo')) {
      // Determine relative path to components/TextLogo
      const depth = file.split('/').length - 'd:/UKSW/Pertamina/HandoverApp/frontend/'.split('/').length;
      let importPath = '';
      if (depth === 1) { // screens/
        importPath = '../components/TextLogo';
      } else if (depth === 2) { // screens/admin/
        importPath = '../../components/TextLogo';
      }

      content = content.replace(/import React(.*?)\n/, `import React$1\nimport TextLogo from '${importPath}';\n`);
      
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed import in:', file);
    }
  }
}
