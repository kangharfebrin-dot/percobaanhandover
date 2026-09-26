const fs = require('fs');
const path = require('path');

const screens = [
  'frontend/screens/admin/AdminDashboardScreen.js',
  'frontend/screens/admin/ChecklistManagerScreen.js',
  'frontend/screens/pengawas/PengawasDashboardScreen.js',
  'frontend/screens/pengawas/MessageCenterScreen.js',
  'frontend/screens/user/UserDashboardScreen.js',
  'frontend/screens/shared/HistoryScreen.js'
];

screens.forEach(screen => {
  const filePath = path.join(__dirname, screen);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Add WebSidebar import
  if (!content.includes("import WebSidebar")) {
    // Find last import
    const lastImportIndex = content.lastIndexOf("import ");
    const nextLineIndex = content.indexOf("\n", lastImportIndex) + 1;
    let importPath = '../../components/WebSidebar';
    if (screen.includes('shared')) importPath = '../../components/WebSidebar';
    // we just use generic path resolution relative to screens/folder
    content = content.slice(0, nextLineIndex) + `import WebSidebar from '${importPath}';\n` + content.slice(nextLineIndex);
  }

  // 2. Change SafeAreaView to flex-row for Web
  content = content.replace(/<SafeAreaView style=\{tw`flex-1 flex-col`\}>/g, "<SafeAreaView style={tw`flex-1 ${Platform.OS === 'web' ? 'flex-row' : 'flex-col'}`}>\n        {Platform.OS === 'web' && <WebSidebar user={user} activeMenu={activeMenu} navigation={navigation} unreadNotificationsCount={unreadNotificationsCount} onLogout={handleLogout} />}");

  content = content.replace(/<SafeAreaView style=\{tw`flex-1`\}>/g, "<SafeAreaView style={tw`flex-1 ${Platform.OS === 'web' ? 'flex-row' : 'flex-col'}`}>\n        {Platform.OS === 'web' && <WebSidebar user={user} activeMenu={activeMenu} navigation={navigation} unreadNotificationsCount={unreadNotificationsCount} onLogout={handleLogout} />}");

  // 3. Wrap Bottom Navbar
  // AdminDashboard, PengawasDashboard, UserDashboard, HistoryScreen, ChecklistManager, MessageCenter
  // They have different comments but they all start with `{user && (` or `      {/* BOTTOM NAVBAR */}` or `{/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY) */}`
  
  // Let's replace the common pattern:
  // `{user && (` for bottom nav wrapper
  // But wait, there might be other `{user && (`
  
  // Let's use regex to find the bottom nav wrapper
  const bottomNavComments = [
    "{/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY) */}",
    "{/* BOTTOM NAVBAR */}",
    "{/* ADMIN BOTTOM NAVBAR MOCK (Identik dengan Dashboard) */}"
  ];

  for (let comment of bottomNavComments) {
    if (content.includes(comment)) {
      // Find the next {user && ( or similar.
      // Usually it's:
      // {user && (
      //   <View style={tw`absolute bottom-8 ...
      
      const commentIndex = content.indexOf(comment);
      const afterComment = content.slice(commentIndex);
      
      if (afterComment.includes("{user && (")) {
         // Replace the FIRST {user && ( after the comment
         const userAndIndex = afterComment.indexOf("{user && (");
         const absolutePos = commentIndex + userAndIndex;
         
         content = content.slice(0, absolutePos) + "{Platform.OS !== 'web' && user && (" + content.slice(absolutePos + "{user && (".length);
      } else {
         // For MessageCenter, it doesn't have {user && ( wrapping the navbar, it just has <View
         const viewIndex = afterComment.indexOf("<View style={tw`absolute bottom-8");
         if (viewIndex !== -1) {
             const absolutePos = commentIndex + viewIndex;
             // We need to wrap it
             // Let's find the matching closing tag.
             // Too complex, let's just do a string replace for the start
             content = content.slice(0, absolutePos) + "{Platform.OS !== 'web' && (\n" + content.slice(absolutePos);
             
             // Find the end of the file or SafeAreaView closing
             const safeAreaClose = content.lastIndexOf("</SafeAreaView>");
             // We need to put `)}` before it. But there might be other things.
             // Usually it's just before </SafeAreaView>. 
             // Actually, MessageCenter has:
             //       </View>
             //     </SafeAreaView>
             content = content.slice(0, safeAreaClose) + "      )}\n" + content.slice(safeAreaClose);
         }
      }
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${screen}`);
});
