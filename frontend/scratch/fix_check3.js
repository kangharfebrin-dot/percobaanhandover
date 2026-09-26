const fs = require('fs');

const file = 'frontend/screens/admin/ChecklistManagerScreen.js';
let content = fs.readFileSync(file, 'utf8');

// The issue is this line:
// {!isLogoutVisible && <Animated.View style={[tw`h-full w-[64px]`]}>}
// And it ends with </Animated.View>

content = content.replace(
  /\{\!isLogoutVisible && <Animated\.View style=\{\[tw\`h-full w-\[64px\]\`\]\}>\}/g,
  "{!isLogoutVisible && (<Animated.View style={[tw`h-full w-[64px]`]}>"
);

// But now they end with </Animated.View>. We need them to end with </Animated.View>)}
// So we replace:
// <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={tw`flex-1`} />
// </Animated.View>
// with
// <LinearGradient ... />
// </Animated.View>)}
// Wait, I can just do this:

content = content.replace(
  /\{\!isLogoutVisible && \(\<Animated\.View style=\{\[tw\`h-full w-\[64px\]\`\]\}>[\s\S]*?<\/Animated\.View>/g,
  match => match + ")}"
);

fs.writeFileSync(file, content);
