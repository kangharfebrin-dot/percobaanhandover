const fs = require('fs');
const path = require('path');

const screens = [
  { file: 'admin/AdminDashboardScreen.js', menu: 'Home' },
  { file: 'admin/ChecklistManagerScreen.js', menu: 'Checklist' },
  { file: 'pengawas/MessageCenterScreen.js', menu: 'Messages' },
  { file: 'pengawas/PengawasDashboardScreen.js', menu: 'Home' },
  { file: 'user/UserDashboardScreen.js', menu: 'Home' },
  { file: 'shared/HistoryScreen.js', menu: 'History' },
  { file: 'shared/HandoverDetailScreen.js', menu: 'History' } // HandoverDetail might not have bottom nav, we will check
];

const mobileLogoutRegex = /<TouchableOpacity style=\{tw`items-center justify-center px-4 relative`\}>\s*<Feather name="log-out".*?\s*<\/TouchableOpacity>/g;

const rainbowLogoutMobile = `
            <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={handleLogout}>
              {activeMenu === 'Logout' && (
                <>
                  <View style={tw\`absolute -top-5 w-8 h-1 overflow-hidden rounded-full\`}>
                    <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                    </Animated.View>
                  </View>
                  <View style={tw\`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full\`}>
                    <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate || 0 }] }]}>
                      <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                    </Animated.View>
                  </View>
                </>
              )}
              <Feather name="log-out" size={26} color={activeMenu === 'Logout' ? '#ED1C24' : '#9CA3AF'} />
            </TouchableOpacity>
`;

screens.forEach(s => {
  const filePath = path.join(__dirname, '..', 'screens', s.file);
  if (!fs.existsSync(filePath)) {
    console.log(`Missing: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix 1: Add handleLogout and activeMenu to HandoverDetail if missing?
  // User said "kalau di amt pas di menu handoverni pas gw klik icon loqout gak ada garisnya di iconnya" -> HandoverDetailScreen?
  
  // Replace old mobile logout with rainbow logout
  if (content.match(mobileLogoutRegex)) {
    content = content.replace(mobileLogoutRegex, rainbowLogoutMobile.trim());
    console.log(`Replaced mobile logout in ${s.file}`);
  }

  // Remove AdminDashboard's hardcoded ULTRA PREMIUM SIDEBAR and replace with WebSidebar
  if (s.file === 'admin/AdminDashboardScreen.js') {
    const sidebarStart = content.indexOf('{/* ULTRA PREMIUM SIDEBAR */}');
    if (sidebarStart !== -1) {
      // Find the end of the isLargeScreen block
      const mainContentArea = content.indexOf('{/* MAIN CONTENT AREA */}');
      if (mainContentArea !== -1) {
        const replacement = `{/* ULTRA PREMIUM SIDEBAR */}
        {isLargeScreen && (
          <WebSidebar 
            user={user} 
            activeMenu={activeMenu} 
            navigation={navigation} 
            handleLogout={handleLogout} 
            unreadNotificationsCount={unreadNotificationsCount} 
          />
        )}
        
        `;
        content = content.substring(0, sidebarStart) + replacement + content.substring(mainContentArea);
        console.log(`Replaced Desktop Sidebar in AdminDashboardScreen`);
      }
    }
  }

  // Add WebSidebar to other screens if they don't have it
  // We need to inject import WebSidebar if not present
  if (!content.includes('import WebSidebar')) {
    const lastImport = content.lastIndexOf('import ');
    const nextLine = content.indexOf('\n', lastImport) + 1;
    let importPath = '../../components/WebSidebar';
    if (s.file.includes('shared')) importPath = '../../components/WebSidebar';
    content = content.substring(0, nextLine) + `import WebSidebar from '${importPath}';\n` + content.substring(nextLine);
  }

  // Add {isLargeScreen && WebSidebar} to the layout of History, ChecklistManager, MessageCenter, User, Pengawas
  // They usually have <SafeAreaView style={tw`flex-1 ${isLargeScreen ? 'flex-row' : 'flex-col'}`}>
  // Or just <SafeAreaView style={tw`flex-1 relative`}>
  
  // To make it easy, we will just find <SafeAreaView style={tw`flex-1
  if (s.file !== 'admin/AdminDashboardScreen.js' && s.file !== 'shared/HandoverDetailScreen.js') {
    const safeAreaRegex = /<SafeAreaView style=\{tw`flex-1[^>]*>\s*/;
    const match = content.match(safeAreaRegex);
    if (match) {
      // Check if WebSidebar is already injected
      if (!content.includes('<WebSidebar')) {
        const replacement = match[0] + `
        {isLargeScreen && (
          <WebSidebar 
            user={user} 
            activeMenu={'${s.menu}'} 
            navigation={navigation} 
            handleLogout={handleLogout || (() => { setIsLogoutVisible(true); })} 
            unreadNotificationsCount={unreadNotificationsCount || 0} 
          />
        )}
        `;
        content = content.replace(match[0], replacement);
        
        // Ensure flex-row is added to SafeAreaView
        content = content.replace(/<SafeAreaView style=\{tw`flex-1 relative`\}>/, "<SafeAreaView style={tw`flex-1 relative ${isLargeScreen ? 'flex-row' : 'flex-col'}`}>");
        content = content.replace(/<SafeAreaView style=\{tw`flex-1`\}>/, "<SafeAreaView style={tw`flex-1 ${isLargeScreen ? 'flex-row' : 'flex-col'}`}>");
        
        console.log(`Injected WebSidebar into ${s.file}`);
      }
    }
  }
  
  // For HandoverDetailScreen, the user mentioned it specifically:
  if (s.file === 'shared/HandoverDetailScreen.js') {
    // If it has logout icon, just ensure the activeMenu exists
    if (!content.includes('activeMenu')) {
        content = content.replace('export default function HandoverDetailScreen', `const activeMenu = 'History';\nexport default function HandoverDetailScreen`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
});
