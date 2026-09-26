const fs = require('fs');

const files = [
  'e:/Magang/HandoverApp/frontend/screens/admin/ChecklistManagerScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/pengawas/MessageCenterScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/shared/HistoryScreen.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace import
    content = content.replace(
      /import WebSidebar from '..\/..\/components\/WebSidebar';/g,
      "import TopHeader from '../../components/TopHeader';"
    );
    
    // Replace component
    let activeMenu = 'MessageCenter';
    if (file.includes('Checklist')) activeMenu = 'ChecklistManager';
    if (file.includes('History')) activeMenu = 'History';

    let repl = `{Platform.OS === 'web' && <TopHeader user={user} navigation={navigation} activeMenu='${activeMenu}' onLogout={typeof handleLogout !== 'undefined' ? handleLogout : async () => { await AsyncStorage.multiRemove(['user', 'token']); navigation.replace('Login'); }} />}`;
    content = content.replace(
      /\{Platform\.OS === 'web' && <WebSidebar[^>]*\/>\}/g,
      repl
    );
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed TopHeader in ' + file);
  }
});
