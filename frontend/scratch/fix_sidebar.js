const fs = require('fs');

const files = [
  {
    path: 'e:/Magang/HandoverApp/frontend/screens/admin/ChecklistManagerScreen.js',
    menu: 'ChecklistManager'
  },
  {
    path: 'e:/Magang/HandoverApp/frontend/screens/pengawas/MessageCenterScreen.js',
    menu: 'MessageCenter'
  },
  {
    path: 'e:/Magang/HandoverApp/frontend/screens/shared/HistoryScreen.js',
    menu: 'History'
  }
];

files.forEach(f => {
  let content = fs.readFileSync(f.path, 'utf8');

  // Replace SafeAreaView
  if (content.includes('<SafeAreaView style={tw`flex-1 relative`}>')) {
    content = content.replace(
      '<SafeAreaView style={tw`flex-1 relative`}>',
      '<SafeAreaView style={tw`flex-1 ${Platform.OS === \'web\' ? \'flex-row\' : \'flex-col\'} relative`}>\n        {Platform.OS === \'web\' && <WebSidebar user={user} activeMenu="' + f.menu + '" navigation={navigation} unreadNotificationsCount={typeof unreadNotificationsCount !== \'undefined\' ? unreadNotificationsCount : (typeof messages !== \'undefined\' ? messages.filter(m=>!m.read).length : 0)} onLogout={typeof handleLogout !== \'undefined\' ? handleLogout : async () => { await AsyncStorage.removeItem(\'user\'); navigation.replace(\'Login\'); }} />}\n        <View style={tw`flex-1`}>'
    );
  } else if (content.includes('<SafeAreaView style={tw`flex-1 bg-[#F4F7FA] relative`}>')) {
    content = content.replace(
      '<SafeAreaView style={tw`flex-1 bg-[#F4F7FA] relative`}>',
      '<SafeAreaView style={tw`flex-1 ${Platform.OS === \'web\' ? \'flex-row\' : \'flex-col\'} bg-[#F4F7FA] relative`}>\n        {Platform.OS === \'web\' && <WebSidebar user={user} activeMenu="' + f.menu + '" navigation={navigation} unreadNotificationsCount={typeof unreadNotificationsCount !== \'undefined\' ? unreadNotificationsCount : 0} onLogout={typeof handleLogout !== \'undefined\' ? handleLogout : async () => { await AsyncStorage.removeItem(\'user\'); navigation.replace(\'Login\'); }} />}\n        <View style={tw`flex-1`}>'
    );
  } else if (content.includes('<SafeAreaView style={tw`flex-1 bg-white relative`}>')) {
    content = content.replace(
      '<SafeAreaView style={tw`flex-1 bg-white relative`}>',
      '<SafeAreaView style={tw`flex-1 ${Platform.OS === \'web\' ? \'flex-row\' : \'flex-col\'} bg-white relative`}>\n        {Platform.OS === \'web\' && <WebSidebar user={user} activeMenu="' + f.menu + '" navigation={navigation} unreadNotificationsCount={typeof unreadNotificationsCount !== \'undefined\' ? unreadNotificationsCount : 0} onLogout={typeof handleLogout !== \'undefined\' ? handleLogout : async () => { await AsyncStorage.removeItem(\'user\'); navigation.replace(\'Login\'); }} />}\n        <View style={tw`flex-1`}>'
    );
  } else if (content.includes('<SafeAreaView style={tw`flex-1`}>')) {
     content = content.replace(
      '<SafeAreaView style={tw`flex-1`}>',
      '<SafeAreaView style={tw`flex-1 ${Platform.OS === \'web\' ? \'flex-row\' : \'flex-col\'}`}>\n        {Platform.OS === \'web\' && <WebSidebar user={user} activeMenu="' + f.menu + '" navigation={navigation} unreadNotificationsCount={typeof unreadNotificationsCount !== \'undefined\' ? unreadNotificationsCount : 0} onLogout={typeof handleLogout !== \'undefined\' ? handleLogout : async () => { await AsyncStorage.removeItem(\'user\'); navigation.replace(\'Login\'); }} />}\n        <View style={tw`flex-1`}>'
    );
  }

  // Find closing </SafeAreaView>
  // We need to replace only the LAST occurrence if there are multiple, or just the main one.
  // We can just find `</SafeAreaView>` and replace it with `</View>\n      </SafeAreaView>`
  // But wait, there might be multiple or it could be nested. Usually it's the outermost.
  const lastIndex = content.lastIndexOf('</SafeAreaView>');
  if (lastIndex !== -1) {
    content = content.substring(0, lastIndex) + '</View>\n      </SafeAreaView>' + content.substring(lastIndex + '</SafeAreaView>'.length);
  }

  fs.writeFileSync(f.path, content, 'utf8');
  console.log('Updated ' + f.path);
});
