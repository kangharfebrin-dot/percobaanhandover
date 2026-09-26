const fs = require('fs');
const path = require('path');

const files = [
  'admin/ChecklistManagerScreen.js',
  'pengawas/MessageCenterScreen.js'
];

files.forEach(f => {
  const filePath = path.join(__dirname, '..', 'screens', f);
  let content = fs.readFileSync(filePath, 'utf-8');

  // We know <View style={tw`flex-1 relative`}> was injected but not closed.
  // The easiest way is to close it right before </SafeAreaView>.
  
  if (content.includes('{/* MAIN CONTENT AREA */}') && !content.includes('</View>\n      </SafeAreaView>')) {
    content = content.replace(/<\/SafeAreaView>/, '</View>\n      </SafeAreaView>');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed unclosed View in ${f}`);
  }
});
