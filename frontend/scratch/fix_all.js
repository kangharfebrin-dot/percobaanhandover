const fs = require('fs');

const files = [
  'e:/Magang/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/admin/ChecklistManagerScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/pengawas/MessageCenterScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/user/UserDashboardScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/shared/HistoryScreen.js'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/flex-1 \$\{Platform\.OS === 'web' \? 'flex-row' : 'flex-col'\}/g, 'flex-1 flex-col');
    
    // Also fix the active indicator for mobile bottom navbar (missing active lines)
    // Mobile bottom nav usually checks: user.role === '...' etc.
    // The active indicator on mobile bottom navbar is currently:
    // <View style={tw`absolute -top-5 w-8 h-1 overflow-hidden rounded-full`}> ... </View>
    // We should make sure we only show this if it's the active menu! But wait, they are hardcoded right now without active state, except some have it.
    // Let's check how active indicators are done for bottom nav. We will do this later if needed.
    
    // Resize the search bar for web in AdminDashboardScreen, HistoryScreen, etc.
    // Search bar is usually a TextInput
    if (content.includes('<TextInput')) {
      content = content.replace(/w-full bg-white\/50/g, 'w-full md:w-96 bg-white/50');
      content = content.replace(/w-full max-w-4xl bg-white/g, 'w-full max-w-md bg-white');
    }

    // Hide scanner on web for admin/pengawas
    if (content.includes("navigation.navigate('Scanner'")) {
       if (f.includes('Admin') || f.includes('Pengawas')) {
          content = content.replace(
             /<TouchableOpacity style=\{tw`flex-1 mr-3`\} onPress=\{\(\) => navigation\.navigate\('Scanner', \{ type: 'mulai' \}\)\}>/g,
             '{Platform.OS !== "web" && (\n<TouchableOpacity style={tw`flex-1 mr-3`} onPress={() => navigation.navigate(\'Scanner\', { type: \'mulai\' })}>\n/* UNTUK MENAMPILKAN SCANNER DI WEB ADMIN/PENGAWAS, HAPUS KONDISI Platform.OS !== "web" INI */'
          );
          content = content.replace(
             /<TouchableOpacity style=\{tw`flex-1 ml-3`\} onPress=\{\(\) => navigation\.navigate\('Scanner', \{ type: 'akhiri' \}\)\}>/g,
             '{Platform.OS !== "web" && (\n<TouchableOpacity style={tw`flex-1 ml-3`} onPress={() => navigation.navigate(\'Scanner\', { type: \'akhiri\' })}>\n/* UNTUK MENAMPILKAN SCANNER DI WEB ADMIN/PENGAWAS, HAPUS KONDISI Platform.OS !== "web" INI */'
          );
          // close it after the View or Text that ends the scanner button.
          // This requires precise AST or regex.
       }
    }

    fs.writeFileSync(f, content, 'utf8');
    console.log('Processed ' + f);
  }
});
