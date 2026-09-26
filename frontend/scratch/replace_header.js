const fs = require('fs');

const files = [
  'e:/Magang/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/user/UserDashboardScreen.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace import
    content = content.replace(
      "import WebSidebar from '../../components/WebSidebar';",
      "import TopHeader from '../../components/TopHeader';"
    );
    
    // Remove <WebSidebar ... />
    content = content.replace(
      /\{Platform\.OS === 'web' && <WebSidebar[^>]*\/>\}/g,
      ""
    );
    
    // Replace STICKY NAVBAR block with TopHeader
    // Find {/* STICKY NAVBAR
    let startIdx = content.indexOf('{/* STICKY NAVBAR');
    if (startIdx !== -1) {
      // Find the end of the <View> that wraps the STICKY NAVBAR
      // It's usually the next `</View>` after the block ends. Let's find it.
      let nextScrollView = content.indexOf('<ScrollView', startIdx);
      if (nextScrollView !== -1) {
        let viewEnd = content.lastIndexOf('</View>', nextScrollView);
        if (viewEnd !== -1) {
           let block = content.substring(startIdx, viewEnd + 7);
           content = content.replace(block, '<TopHeader user={user} navigation={navigation} activeMenu={activeMenu || "Home"} unreadNotificationsCount={unreadNotificationsCount} onLogout={handleLogout} />');
        }
      }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed TopHeader in ' + file);
  }
});
