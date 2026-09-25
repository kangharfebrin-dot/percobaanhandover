const fs = require('fs');

const path = 'e:/Magang/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js';
let content = fs.readFileSync(path, 'utf8');

const target = `              <View style={tw\`flex-1 pr-2\`}>
                <Text style={tw\`text-gray-500 text-xs font-bold uppercase tracking-widest\`}>{getGreeting()}</Text>
                <Text style={tw\`text-gray-800 text-lg font-black max-w-[150px]\`} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
              </View>
            </View>
            

          </View>`;

const replacement = `              <View style={tw\`flex-1 pr-2\`}>
                <Text style={tw\`text-gray-500 text-xs font-bold uppercase tracking-widest\`}>{getGreeting()}</Text>
                <Text style={tw\`text-gray-800 text-lg font-black max-w-[150px]\`} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={() => setShowNotificationsModal(true)} style={tw\`relative ml-2 p-2 bg-white rounded-full shadow-sm\`}>
              <Feather name="bell" size={24} color="#0055A5" />
              {unreadNotificationsCount > 0 && (
                <View style={tw\`absolute top-1 right-1 w-3 h-3 bg-[#ED1C24] rounded-full border-2 border-white\`} />
              )}
            </TouchableOpacity>

          </View>`;

content = content.replace(target, replacement);

// Fallback if pr-24 is still there
const target2 = `              <View style={tw\`flex-1 pr-24\`}>
                <Text style={tw\`text-gray-500 text-xs font-bold uppercase tracking-widest\`}>{getGreeting()}</Text>
                <Text style={tw\`text-gray-800 text-lg font-black max-w-[150px]\`} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
              </View>
            </View>
            

          </View>`;

content = content.replace(target2, replacement);

fs.writeFileSync(path, content);
console.log('Replaced successfully');
