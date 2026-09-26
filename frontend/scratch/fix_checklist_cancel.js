const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'screens', 'admin', 'ChecklistManagerScreen.js');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(/<TouchableOpacity style=\{tw\`items-center justify-center px-4 relative\`\} onPress=\{handleCancelLogout\}>/g, '<TouchableOpacity style={tw`items-center justify-center px-4 relative`} onPress={handleLogout}>');

fs.writeFileSync(filePath, content, 'utf-8');
