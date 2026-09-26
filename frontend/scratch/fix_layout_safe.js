const fs = require('fs');
const path = require('path');

const files = [
  'admin/ChecklistManagerScreen.js',
  'pengawas/MessageCenterScreen.js'
];

files.forEach(f => {
  const filePath = path.join(__dirname, '..', 'screens', f);
  let content = fs.readFileSync(filePath, 'utf-8');

  // We are looking for:
  // {isLargeScreen && (
  //   <WebSidebar ... />
  // )}
  // And we want to inject right after it.
  
  if (content.includes('{isLargeScreen && (') && !content.includes('{/* MAIN CONTENT AREA */}')) {
    const sidebarRegex = /(\{isLargeScreen && \(\s*<WebSidebar[\s\S]*?\/>\s*\)\s*\})/;
    const match = content.match(sidebarRegex);
    
    if (match) {
      // 1. Inject <View> after WebSidebar
      content = content.replace(match[0], match[0] + '\n\n        {/* MAIN CONTENT AREA */}\n        <View style={tw`flex-1 relative`}>');
      
      // 2. Inject </View> before </SafeAreaView>
      content = content.replace(/<\/SafeAreaView>/, '</View>\n      </SafeAreaView>');
      
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Successfully wrapped layout in ${f}`);
    } else {
      console.log(`Could not find WebSidebar in ${f}`);
    }
  } else {
    console.log(`Already wrapped or no WebSidebar in ${f}`);
  }
});
