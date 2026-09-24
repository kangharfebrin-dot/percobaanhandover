const fs = require('fs');

const run = () => {
  let file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/PengawasListScreen.js';
  let content = fs.readFileSync(file, 'utf8');

  // Remove the scrollview filter chips entirely
  // It starts with <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row`}>
  // Ends with </ScrollView>
  const startIdx = content.indexOf('<ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row`}>');
  if (startIdx !== -1) {
    const endIdx = content.indexOf('</ScrollView>', startIdx);
    if (endIdx !== -1) {
      const stringToRemove = content.substring(startIdx, endIdx + '</ScrollView>'.length);
      content = content.replace(stringToRemove, '');
    }
  }

  // Also fix the text "Pekerja Terdaftar" -> "Pengawas Terdaftar"
  content = content.replace('Pekerja Terdaftar', 'Pengawas Terdaftar');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Filters removed successfully.');
};

run();
