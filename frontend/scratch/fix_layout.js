const fs = require('fs');
const path = require('path');

const filesToFix = [
  'admin/ChecklistManagerScreen.js',
  'pengawas/MessageCenterScreen.js',
  'shared/HistoryScreen.js'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', 'screens', file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // We know WebSidebar is injected like this:
  // {isLargeScreen && (
  //   <WebSidebar ... />
  // )}
  // Right after that, we need to inject <View style={tw`flex-1 relative`}>
  // And right before the Mobile Navbar or Logout Modal, we need to close it: </View>

  const sidebarRegex = /(\{isLargeScreen && \(\s*<WebSidebar[\s\S]*?\/>\s*\)\s*\})/;
  const match = content.match(sidebarRegex);
  
  if (match && !content.includes('{/* MAIN CONTENT AREA */}')) {
    // Inject opening tag
    content = content.replace(match[1], match[1] + '\n\n        {/* MAIN CONTENT AREA */}\n        <View style={tw`flex-1 relative`}>');
    
    // Inject closing tag before the mobile navbar
    // Mobile navbar starts with: {/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY) */}
    const bottomNavIdx = content.indexOf('{/* ULTRA PREMIUM BOTTOM NAVIGATION (MOBILE ONLY) */}');
    if (bottomNavIdx !== -1) {
      content = content.slice(0, bottomNavIdx) + '        </View>\n\n        ' + content.slice(bottomNavIdx);
    } else {
        console.log("Could not find bottom nav in " + file);
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Wrapped main content in ${file}`);
  } else {
    console.log(`Already wrapped or no sidebar in ${file}`);
  }
});
