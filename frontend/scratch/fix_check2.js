const fs = require('fs');
const file = 'frontend/screens/admin/ChecklistManagerScreen.js';
let content = fs.readFileSync(file, 'utf8');

const brokenBlock = `{!isLogoutVisible && <Animated.View style={[tw\`h-full w-[64px]\`]}>}
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw\`flex-1\`} />
                  </Animated.View>`;

const fixedBlock = `{!isLogoutVisible && (
                  <Animated.View style={[tw\`h-full w-[64px]\`]}>
                    <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw\`flex-1\`} />
                  </Animated.View>
                )}`;

content = content.split(brokenBlock).join(fixedBlock);
fs.writeFileSync(file, content);
