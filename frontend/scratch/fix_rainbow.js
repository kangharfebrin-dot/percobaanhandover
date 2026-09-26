const fs = require('fs');

const file = 'e:/Magang/HandoverApp/frontend/components/TopHeader.js';
let content = fs.readFileSync(file, 'utf8');

const activeIndicatorStr = `
              {activeMenu === '%%MENU%%' && (
                <View style={tw\`absolute -bottom-4 left-1/2 -ml-3 w-6 h-1 overflow-hidden rounded-full\`}>
                  <Animated.View style={[tw\`h-full w-[48px]\`, { transform: [{ translateX: slideInterpolate }] }]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw\`flex-1\`} />
                  </Animated.View>
                </View>
              )}
`;

content = content.replace(
  /<TouchableOpacity style=\{tw`px-3`\} onPress=\{navigateHome\}>\s*<Feather name="grid" size=\{22\} color=\{activeMenu === 'Home' \? \(isDarkMode \? '#60A5FA' : '#0055A5'\) : \(isDarkMode \? '#9CA3AF' : '#6B7280'\)\} \/>\s*<\/TouchableOpacity>/,
  `<TouchableOpacity style={tw\`px-3 relative\`} onPress={navigateHome}>
              <Feather name="grid" size={22} color={activeMenu === 'Home' ? (isDarkMode ? '#60A5FA' : '#0055A5') : (isDarkMode ? '#9CA3AF' : '#6B7280')} />
` + activeIndicatorStr.replace('%%MENU%%', 'Home') + `
            </TouchableOpacity>`
);

content = content.replace(
  /<TouchableOpacity style=\{tw`px-3`\} onPress=\{\(\) => navigation\.replace\('ChecklistManager'\)\}>\s*<Feather name="check-square" size=\{22\} color=\{activeMenu === 'ChecklistManager' \? \(isDarkMode \? '#60A5FA' : '#0055A5'\) : \(isDarkMode \? '#9CA3AF' : '#6B7280'\)\} \/>\s*<\/TouchableOpacity>/,
  `<TouchableOpacity style={tw\`px-3 relative\`} onPress={() => navigation.replace('ChecklistManager')}>
              <Feather name="check-square" size={22} color={activeMenu === 'ChecklistManager' ? (isDarkMode ? '#60A5FA' : '#0055A5') : (isDarkMode ? '#9CA3AF' : '#6B7280')} />
` + activeIndicatorStr.replace('%%MENU%%', 'ChecklistManager') + `
            </TouchableOpacity>`
);

content = content.replace(
  /<TouchableOpacity style=\{tw`px-3`\} onPress=\{\(\) => navigation\.replace\('History'\)\}>\s*<Feather name="file-text" size=\{22\} color=\{activeMenu === 'History' \? \(isDarkMode \? '#60A5FA' : '#0055A5'\) : \(isDarkMode \? '#9CA3AF' : '#6B7280'\)\} \/>\s*<\/TouchableOpacity>/,
  `<TouchableOpacity style={tw\`px-3 relative\`} onPress={() => navigation.replace('History')}>
              <Feather name="file-text" size={22} color={activeMenu === 'History' ? (isDarkMode ? '#60A5FA' : '#0055A5') : (isDarkMode ? '#9CA3AF' : '#6B7280')} />
` + activeIndicatorStr.replace('%%MENU%%', 'History') + `
            </TouchableOpacity>`
);

// For MessageCenter which has a nested view
content = content.replace(
  /<TouchableOpacity style=\{tw`px-3`\} onPress=\{\(\) => navigation\.replace\('MessageCenter'\)\}>/,
  `<TouchableOpacity style={tw\`px-3 relative\`} onPress={() => navigation.replace('MessageCenter')}>`
);
content = content.replace(
  /<\/View>\s*<\/TouchableOpacity>\s*<TouchableOpacity style=\{tw`px-3 ml-2`\} onPress=\{toggleTheme\}>/,
  `</View>` + activeIndicatorStr.replace('%%MENU%%', 'MessageCenter') + `
            </TouchableOpacity>

            <TouchableOpacity style={tw\`px-3 ml-2\`} onPress={toggleTheme}>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed TopHeader rainbow lines.');
