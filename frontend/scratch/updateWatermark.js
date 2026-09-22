const fs = require('fs');
const path = require('path');

const dashboards = [
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/UserDashboardScreen.js'
];

const subMenus = [
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/VehicleListScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/WorkerListScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/MessageCenterScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/shared/HistoryScreen.js'
];

for (const file of dashboards) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /<TextLogo style=\{\[tw`absolute opacity-15`, \{\s*top: 15, right: -10, transform: \[\{ scale: 0\.65 \}\]\s*\}\]\}\s*\/>/,
      '<TextLogo style={[tw`absolute`, { top: 15, right: -10, transform: [{ scale: 0.65 }] }]} />'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated opacity to 100% in:', file);
  }
}

for (const file of subMenus) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Using Regex to safely remove the entire watermark View wrapper
    // The wrapper looks like:
    // <View style={tw`absolute top-0 bottom-0 left-0 right-0 overflow-hidden rounded-3xl`}>
    //   <TextLogo style={[tw`absolute opacity-15`, { top: 15, right: -10, transform: [{ scale: 0.65 }] }]} />
    // </View>
    const regex = /<View style=\{tw`absolute top-0 bottom-0 left-0 right-0 overflow-hidden rounded-3xl`\}>\s*<TextLogo style=\{\[tw`absolute opacity-15`, \{\s*top: 15, right: -10, transform: \[\{ scale: 0\.65 \}\]\s*\}\]\}\s*\/>\s*<\/View>/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, '');
      fs.writeFileSync(file, content, 'utf8');
      console.log('Removed watermark from:', file);
    } else {
      console.log('Watermark not found or already removed in:', file);
    }
  }
}
