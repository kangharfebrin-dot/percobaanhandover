const fs = require('fs');

const file = 'e:/Magang/HandoverApp/frontend/screens/pengawas/MessageCenterScreen.js';
let code = fs.readFileSync(file, 'utf8');

const mockBadge = `{/* RED DOT BADGE MOCK */}
              {messages.some(m => !m.read) && (
                <View style={tw\`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white\`} />
              )}`;

const realBadge = `{/* RED DOT BADGE */}
              {messages.filter(m => !m.isRead).length > 0 && (
                <View style={tw\`absolute -top-2 -right-2 bg-red-500 rounded-full min-w-5 min-h-5 items-center justify-center border-2 border-white px-1\`}>
                  <Text style={tw\`text-white text-[10px] font-bold\`}>{messages.filter(m => !m.isRead).length}</Text>
                </View>
              )}`;

code = code.replace(mockBadge, realBadge);
fs.writeFileSync(file, code);
console.log('Fixed MessageCenter badge to show unread count');
