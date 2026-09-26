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

const logoutRegex = /<TouchableOpacity style=\{tw`items-center justify-center px-4 relative`\} onPress=\{handleLogout\}>\s*\{activeMenu === 'Logout'.*?<\/TouchableOpacity>/gs;

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

  // If the file matches the regex, replace it to ensure it's uniform
  if (content.match(logoutRegex)) {
    content = content.replace(logoutRegex, rainbowLogoutMobile.trim());
    console.log(`Replaced animated logout in ${file}`);
  } else {
    console.log(`No animated logout block found in ${file}`);
  }

  // Final check: Inject handleLogout into ChecklistManager if missing
  // Did this in fix_checklist.js, but let's double check.

  fs.writeFileSync(filePath, content, 'utf-8');
});
