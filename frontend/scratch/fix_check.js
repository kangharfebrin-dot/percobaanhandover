const fs = require('fs');

const file = 'frontend/screens/admin/ChecklistManagerScreen.js';
let content = fs.readFileSync(file, 'utf8');

const brokenStart = "{!isLogoutVisible && <Animated.View style={[tw`h-full w-[64px]`]}>}";
const fixedStart = "{!isLogoutVisible && (<Animated.View style={[tw`h-full w-[64px]`]}>";

content = content.split(brokenStart).join(fixedStart);
content = content.replace(/<\/Animated\.View>/g, (match, offset, fullText) => {
  // If we just replaced the start tag before this, it should be closed with )} instead of just </Animated.View>
  // But wait! If I just do:
  // </Animated.View>
  // I need to change it to </Animated.View>)} only for the ones that were opened with {!isLogoutVisible && (
  return match;
});

fs.writeFileSync(file, content);
