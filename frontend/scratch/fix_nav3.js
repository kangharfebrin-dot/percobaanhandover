const fs = require('fs');
const path = require('path');

const screens = [
  'admin/AdminDashboardScreen.js',
  'admin/ChecklistManagerScreen.js',
  'pengawas/MessageCenterScreen.js',
  'pengawas/PengawasDashboardScreen.js',
  'user/UserDashboardScreen.js',
  'shared/HistoryScreen.js'
];

const mobileLogoutRegex = /<TouchableOpacity style=\{tw`items-center justify-center px-4 relative`\}(?: onPress=\{handleLogout\})?>\s*<Feather name="log-out".*?\s*<\/TouchableOpacity>/g;

const staticLogoutRegex = /<TouchableOpacity style=\{tw`items-center justify-center px-4 relative`\} onPress=\{handleLogout\}>\s*<Feather name="log-out" size=\{26\} color="#9CA3AF" \/>\s*<\/TouchableOpacity>/g;

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

screens.forEach(file => {
  const filePath = path.join(__dirname, '..', 'screens', file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix handleLogout missing in ChecklistManagerScreen
  if (file === 'admin/ChecklistManagerScreen.js' && !content.includes('const handleLogout =')) {
    const hookAnchor = "const slideInterpolate = slideAnim.interpolate";
    const insertIndex = content.indexOf(hookAnchor);
    if (insertIndex !== -1) {
      const handleLogoutStr = `
  const handleLogout = () => {
    setPreviousMenu(activeMenu);
    setActiveMenu('Logout');
    setIsLogoutVisible(true);
  };
  
  const handleCancelLogout = () => {
    setIsLogoutVisible(false);
    setActiveMenu(previousMenu);
  };
`;
      const before = content.substring(0, insertIndex);
      const after = content.substring(insertIndex);
      content = before + handleLogoutStr + after;
    }
  }

  // Replace static logout with rainbow logout
  if (content.match(staticLogoutRegex)) {
    content = content.replace(staticLogoutRegex, rainbowLogoutMobile.trim());
    console.log(`Replaced static logout in ${file}`);
  } else if (content.match(mobileLogoutRegex)) {
    content = content.replace(mobileLogoutRegex, rainbowLogoutMobile.trim());
    console.log(`Replaced mobile logout via regex 1 in ${file}`);
  }

  // Double check ChecklistManager handleCancelLogout in modal
  if (file === 'admin/ChecklistManagerScreen.js') {
    content = content.replace(/onRequestClose=\{handleLogout\}/g, 'onRequestClose={handleCancelLogout}');
    content = content.replace(/onPress=\{handleLogout\}/g, 'onPress={handleCancelLogout}'); // if it was used for cancel button
  }

  fs.writeFileSync(filePath, content, 'utf-8');
});
