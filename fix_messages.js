const fs = require('fs');
const path = require('path');

const applyFixes = () => {
  const adminFile = 'e:/Magang/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js';
  const pengawasFile = 'e:/Magang/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js';
  const msgFile = 'e:/Magang/HandoverApp/frontend/screens/pengawas/MessageCenterScreen.js'; // Actually it's in shared maybe? Wait, path is in `pengawas` in the previous grep: `frontend/screens/pengawas/MessageCenterScreen.js`

  const filesToFix = [adminFile, pengawasFile];
  filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
      let code = fs.readFileSync(file, 'utf8');
      
      // 1. Add unreadMessages state
      if (!code.includes('const [unreadMessages, setUnreadMessages]')) {
        code = code.replace(
          'const [user, setUser] = useState(null);',
          'const [user, setUser] = useState(null);\n  const [unreadMessages, setUnreadMessages] = useState(0);'
        );
      }

      // 2. Add fetchNotifications logic
      if (!code.includes('fetchNotifications')) {
        const fetchCode = `
  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(\`\${API_URL}/api/notifications\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.data.success) {
        const unread = res.data.notifications.filter(n => !n.isRead).length;
        setUnreadMessages(unread);
      }
    } catch (error) {
      console.log('Error fetching notifications:', error.message);
    }
  };
`;
        // Insert after fetchStats or loadDashboardData
        code = code.replace('const handleLogout', fetchCode + '\n  const handleLogout');
      }

      // 3. Call fetchNotifications inside useEffect
      if (!code.includes('fetchNotifications();')) {
        code = code.replace(
          'fetchStats();',
          'fetchStats();\n      fetchNotifications();'
        );
        // Also add polling
        const pollingCode = `
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    return () => { clearInterval(interval); subscription?.remove(); };
`;
        if (code.includes('return () => subscription?.remove();')) {
             code = code.replace('return () => subscription?.remove();', pollingCode);
        }
      }

      // 4. Update the red dot badge in the JSX
      const oldBadge = `{alerts.length > 0 && <View style={tw\`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white\`} />}`;
      const newBadge = `{unreadMessages > 0 && (
                    <View style={tw\`absolute -top-2 -right-2 bg-red-500 rounded-full min-w-5 min-h-5 items-center justify-center border-2 border-white px-1\`}>
                      <Text style={tw\`text-white text-[10px] font-bold\`}>{unreadMessages}</Text>
                    </View>
                  )}`;
      if (code.includes(oldBadge)) {
         code = code.replace(oldBadge, newBadge);
      }

      fs.writeFileSync(file, code);
      console.log('Fixed ' + file);
    }
  });

  // Fix MessageCenterScreen
  if (fs.existsSync(msgFile)) {
    let code = fs.readFileSync(msgFile, 'utf8');

    if (!code.includes('selectedMessage')) {
        code = code.replace(
          'const [isLogoutVisible, setIsLogoutVisible] = useState(false);',
          'const [isLogoutVisible, setIsLogoutVisible] = useState(false);\n  const [selectedMessage, setSelectedMessage] = useState(null);'
        );
        
        // Update markAsRead to also setSelectedMessage
        const newRenderMessage = `const renderMessage = ({ item }) => {`;
        const replacementRenderMessage = `const renderMessage = ({ item }) => {
    const handlePress = () => {
      setSelectedMessage(item);
      if (!item.read) markAsRead(item.id);
    };`;
        code = code.replace(newRenderMessage, replacementRenderMessage);

        code = code.replace(
          `onPress={() => markAsRead(item.id)}`,
          `onPress={handlePress}`
        );

        const modalJSX = `
        {/* MODAL DESKRIPSI PESAN */}
        <Modal visible={!!selectedMessage} transparent={true} animationType="fade">
          <View style={tw\`flex-1 justify-center items-center bg-black/50 px-6\`}>
            <View style={tw\`bg-white w-full max-w-sm rounded-[30px] p-6 shadow-2xl\`}>
              <View style={tw\`flex-row items-center mb-4 pb-4 border-b border-gray-100\`}>
                <View style={tw\`w-10 h-10 rounded-full items-center justify-center mr-3 \${selectedMessage?.type === 'auth' ? 'bg-amber-100' : (selectedMessage?.type === 'issue' ? 'bg-red-100' : 'bg-blue-100')}\`}>
                  <Ionicons name={selectedMessage?.type === 'auth' ? 'key' : (selectedMessage?.type === 'issue' ? 'warning' : 'information-circle')} size={20} color={selectedMessage?.type === 'auth' ? '#F59E0B' : (selectedMessage?.type === 'issue' ? '#ED1C24' : '#3B82F6')} />
                </View>
                <View style={tw\`flex-1\`}>
                  <Text style={tw\`text-lg font-black text-gray-800\`}>{selectedMessage?.title}</Text>
                  <Text style={tw\`text-xs text-gray-400 font-bold\`}>{selectedMessage?.time}</Text>
                </View>
              </View>
              <ScrollView style={tw\`max-h-60 mb-6\`}>
                <Text style={tw\`text-gray-600 text-sm leading-relaxed\`}>
                  {selectedMessage?.message}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={tw\`w-full bg-[#0055A5] py-4 rounded-2xl items-center shadow-md\`}
                onPress={() => setSelectedMessage(null)}
              >
                <Text style={tw\`text-white font-bold\`}>Kembali</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        `;

        if (!code.includes('MODAL DESKRIPSI PESAN')) {
            code = code.replace('</SafeAreaView>', modalJSX + '\n      </SafeAreaView>');
        }
        
        fs.writeFileSync(msgFile, code);
        console.log('Fixed MessageCenterScreen.js');
    }
  }
};
applyFixes();
