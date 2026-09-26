const fs = require('fs');

const files = [
  { file: 'e:/Magang/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js', active: 'Home' },
  { file: 'e:/Magang/HandoverApp/frontend/screens/admin/ChecklistManagerScreen.js', active: 'Checklist' },
  { file: 'e:/Magang/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js', active: 'Home' },
  { file: 'e:/Magang/HandoverApp/frontend/screens/pengawas/MessageCenterScreen.js', active: 'Messages' },
  { file: 'e:/Magang/HandoverApp/frontend/screens/user/UserDashboardScreen.js', active: 'Home' },
  { file: 'e:/Magang/HandoverApp/frontend/screens/shared/HistoryScreen.js', active: 'History' }
];

const renderActiveIndicator = `
            <View style={tw\`absolute -top-5 w-8 h-1 overflow-hidden rounded-full\`}>
              <Animated.View style={[tw\`h-full w-[64px]\`, typeof slideInterpolate !== 'undefined' ? { transform: [{ translateX: slideInterpolate }] } : {}]}>
                <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw\`flex-1\`} />
              </Animated.View>
            </View>
            <View style={tw\`absolute -bottom-5 w-8 h-1 overflow-hidden rounded-full\`}>
              <Animated.View style={[tw\`h-full w-[64px]\`, typeof slideInterpolate !== 'undefined' ? { transform: [{ translateX: slideInterpolate }] } : {}]}>
                <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw\`flex-1\`} />
              </Animated.View>
            </View>
`;

files.forEach(({file, active}) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Build the correct bottom navbar replacement
    const bottomNavReplacement = `
      {/* BOTTOM NAVBAR */}
      {Platform.OS !== 'web' && user && (
        <View style={tw\`absolute bottom-8 self-center w-11/12 max-w-md bg-white rounded-full flex-row justify-around items-center py-5 shadow-2xl shadow-gray-400/50 z-50\`}>
          
          <TouchableOpacity 
            style={tw\`items-center justify-center px-4 relative\`} 
            onPress={() => {
              if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
                navigation.replace('AdminDashboard');
              } else if (user.role === 'PENGAWAS') {
                navigation.replace('PengawasDashboard');
              } else {
                navigation.replace('UserDashboard');
              }
            }}
          >
            ${active === 'Home' ? renderActiveIndicator : ''}
            <Feather name="grid" size={26} color="${active === 'Home' ? '#1F2937' : '#9CA3AF'}" />
          </TouchableOpacity>

          {(user.role === 'SUPER_ADMIN') && (
            <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={() => navigation.replace('ChecklistManager')}>
              ${active === 'Checklist' ? renderActiveIndicator : ''}
              <Feather name="check-square" size={26} color="${active === 'Checklist' ? '#1F2937' : '#9CA3AF'}" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={() => navigation.replace('History')}>
            ${active === 'History' ? renderActiveIndicator : ''}
            <Feather name="file-text" size={26} color="${active === 'History' ? '#1F2937' : '#9CA3AF'}" />
          </TouchableOpacity>

          {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PENGAWAS' || user.role === 'USER' || user.role === 'AMT') && (
            <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={() => navigation.replace('MessageCenter')}>
              ${active === 'Messages' ? renderActiveIndicator : ''}
              <View style={tw\`relative\`}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color="${active === 'Messages' ? '#1F2937' : '#9CA3AF'}" />
                {typeof unreadNotificationsCount !== 'undefined' && unreadNotificationsCount > 0 && (
                  <View style={tw\`absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[14px] min-h-[14px] items-center justify-center border-2 border-white\`}>
                    <Text style={tw\`text-white text-[8px] font-bold\`}>{unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}</Text>
                  </View>
                )}
                {typeof messages !== 'undefined' && messages.some(m => !m.read) && typeof unreadNotificationsCount === 'undefined' && (
                  <View style={tw\`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white\`} />
                )}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={tw\`items-center justify-center px-4 relative\`} onPress={typeof handleLogout !== 'undefined' ? handleLogout : async () => { await AsyncStorage.removeItem('user'); navigation.replace('Login'); }}>
            ${active === 'Logout' ? renderActiveIndicator : ''}
            <Feather name="log-out" size={26} color="${active === 'Logout' ? '#ED1C24' : '#9CA3AF'}" />
          </TouchableOpacity>

        </View>
      )}
    `;

    // Regex or string replacement for the old bottom navbar
    // The bottom nav usually starts with "{Platform.OS !== 'web' && user && (" or similar.
    // It's safer to use the comment {/* ADMIN BOTTOM NAVBAR MOCK */} or {/* BOTTOM NAVBAR */}
    
    // We can do a string split between `{Platform.OS !== 'web' && user && (` and the matching `)}`
    // but a regex might be easier if we match from `{Platform.OS !== 'web'` up to the `)}` that ends the View.
    // Let's just find the start and end indices manually.
    
    let startIndex = content.indexOf("{Platform.OS !== 'web' && user && (");
    if (startIndex !== -1) {
      // search backwards for comment if any
      let commentIndex = content.lastIndexOf('{/* BOTTOM NAVBAR', startIndex);
      if (commentIndex === -1) commentIndex = content.lastIndexOf('{/* ADMIN BOTTOM NAVBAR', startIndex);
      if (commentIndex === -1) commentIndex = content.lastIndexOf('{/* USER BOTTOM NAVBAR', startIndex);
      if (commentIndex === -1) commentIndex = content.lastIndexOf('{/* BOTTOM NAV', startIndex);
      
      let startRepl = commentIndex !== -1 && (startIndex - commentIndex < 100) ? commentIndex : startIndex;
      
      // find end index by counting brackets
      let openBrackets = 0;
      let endIndex = -1;
      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '(') openBrackets++;
        if (content[i] === ')') {
          openBrackets--;
          if (openBrackets === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      if (endIndex !== -1) {
        // Only replace if we found the end
        // Also check if there's a subsequent `)}` on the next line because of JSX ending.
        if (content.substr(endIndex, 2) === '}' || content.substr(endIndex, 3) === '}\n' || content.substr(endIndex, 3) === '}\r') {
           endIndex++;
        }
        content = content.substring(0, startRepl) + bottomNavReplacement + content.substring(endIndex);
      }
    }

    // Fix scanner logic
    content = content.replace(
      /\{\s*Platform\.OS !== "web"\s*&&\s*\(\s*<TouchableOpacity style=\{tw\`flex-1 mr-3\`\} onPress=\{\(\) => navigation\.navigate\('Scanner', \{ type: 'mulai' \}\)\}>\n\/\* UNTUK MENAMPILKAN SCANNER DI WEB ADMIN\/PENGAWAS, HAPUS KONDISI Platform\.OS !== "web" INI \*\//g,
      "{Platform.OS !== 'web' && (\n<TouchableOpacity style={tw`flex-1 mr-3`} onPress={() => navigation.navigate('Scanner', { type: 'mulai' })}>\n/* UNTUK MENAMPILKAN SCANNER DI WEB ADMIN/PENGAWAS, HAPUS KONDISI Platform.OS !== 'web' INI */"
    );
    // Add the missing closing bracket for Scanner
    // I need to find the `</LinearGradient>\n                </TouchableOpacity>` and append `\n)}`
    content = content.replace(
       /<\/LinearGradient>\s*<\/TouchableOpacity>\s*\{Platform/g,
       "</LinearGradient>\n                </TouchableOpacity>\n                )}\n                {Platform"
    );
    content = content.replace(
       /<\/LinearGradient>\s*<\/TouchableOpacity>\s*<\/View>\s*\)\}/g,
       "</LinearGradient>\n                </TouchableOpacity>\n                )}\n              </View>\n            )}"
    );
    
    // Also `slideInterpolate` definition check for HistoryScreen, ChecklistManagerScreen if they lack it.
    if (!content.includes('slideInterpolate =')) {
      const effectIndex = content.indexOf('useEffect(() => {');
      if (effectIndex !== -1 && content.includes('slideAnim')) {
         content = content.replace('const slideAnim', 'const slideAnim'); // just to check
         if (!content.includes('slideInterpolate')) {
            content = content.replace('if (!user)', 'const slideInterpolate = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -32] });\n\n  if (!user)');
            content = content.replace('const orb1TranslateY', 'const slideAnim = React.useRef(new Animated.Value(0)).current;\n  const slideInterpolate = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -32] });\n  const orb1TranslateY');
         }
      }
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed nav for ' + file);
  }
});
