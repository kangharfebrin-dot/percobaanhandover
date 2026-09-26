const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'screens', 'pengawas', 'MessageCenterScreen.js');
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('const [activeMenu, setActiveMenu]')) {
  const insertIndex = content.indexOf('const [isLogoutVisible, setIsLogoutVisible] = useState(false);');
  if (insertIndex !== -1) {
    const injections = `
  const [activeMenu, setActiveMenu] = useState('Messages');
  const [previousMenu, setPreviousMenu] = useState('Messages');
`;
    content = content.substring(0, insertIndex) + injections + content.substring(insertIndex);
  }
}

content = content.replace(/const handleLogout = \(\) => setIsLogoutVisible\(true\);/, `
  const handleLogout = () => {
    setPreviousMenu(activeMenu);
    setActiveMenu('Logout');
    setIsLogoutVisible(true);
  };
  
  const handleCancelLogout = () => {
    setIsLogoutVisible(false);
    setActiveMenu(previousMenu);
  };
`);

content = content.replace(/onRequestClose=\{handleLogout\}/g, 'onRequestClose={handleCancelLogout}');
content = content.replace(/<TouchableOpacity\s+style=\{tw\`flex-1 bg-gray-100 p-4 rounded-xl mr-2 items-center\`\}\s+onPress=\{.*?\}\s*>/, `<TouchableOpacity style={tw\`flex-1 bg-gray-100 p-4 rounded-xl mr-2 items-center\`} onPress={handleCancelLogout}>`);

fs.writeFileSync(filePath, content, 'utf-8');
