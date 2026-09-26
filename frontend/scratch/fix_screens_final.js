const fs = require('fs');

const files = [
  'frontend/screens/admin/ChecklistManagerScreen.js',
  'frontend/screens/pengawas/MessageCenterScreen.js',
  'frontend/screens/shared/HistoryScreen.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // 1. Revert the broken end tags
  content = content.replace(/<\/Animated\.View>\}/g, '</Animated.View>');
  
  // 2. Revert the broken start tags
  const brokenStartTag = "{!isLogoutVisible && <Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>}";
  const fixedStartTag = "<Animated.View style={[tw`h-full w-[64px]`, { transform: [{ translateX: slideInterpolate }] }]}>";
  
  content = content.split(brokenStartTag).join(fixedStartTag);
  
  // 3. Intelligently wrap the Animated.View with {!isLogoutVisible && ( ... )}
  const blockToReplace = `<Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate }] }]}>
                        <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                      </Animated.View>`;
                      
  const safeWrappedBlock = `{!isLogoutVisible && (
                      <Animated.View style={[tw\`h-full w-[64px]\`, { transform: [{ translateX: slideInterpolate }] }]}>
                        <LinearGradient colors={['#0055A5', '#ED1C24', '#00A651', '#0055A5', '#ED1C24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw\`flex-1\`} />
                      </Animated.View>
                    )}`;
                    
  content = content.split(blockToReplace).join(safeWrappedBlock);
  
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
