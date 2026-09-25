const fs = require('fs');

let c = fs.readFileSync('e:/Magang/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js', 'utf8');

const target = `<View style={tw\`flex-1 pr-2\`}>
                <Text style={tw\`text-gray-500 text-xs font-bold uppercase tracking-widest\`}>{getGreeting()}</Text>
                <Text style={tw\`text-gray-800 text-lg font-black max-w-[150px]\`} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
              </View>
            </View>
            

          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw\`\${isLargeScreen ? 'p-6 max-w-7xl mx-auto w-full' : 'p-6 pt-6 pb-32 w-full'}\`}>`;

const replacement = `<View style={tw\`flex-1 pr-2\`}>
                <Text style={tw\`text-gray-500 text-xs font-bold uppercase tracking-widest\`}>{getGreeting()}</Text>
                <Text style={tw\`text-gray-800 text-lg font-black max-w-[150px]\`} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={tw\`w-12 h-12 rounded-full bg-gray-50 border border-gray-100 items-center justify-center\`}
              onPress={() => setShowNotificationsModal(true)}
            >
              <Feather name="bell" size={22} color="#6B7280" />
              {unreadNotificationsCount > 0 && (
                <View style={tw\`absolute top-2 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white\`} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={tw\`\${isLargeScreen ? 'p-6 max-w-7xl mx-auto w-full' : 'p-6 pt-6 pb-32 w-full'}\`}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0055A5']} />
            }
          >`;

// Replace normalizing newlines to avoid CRLF mismatch in strings
c = c.replace(target.replace(/\r\n/g, '\n'), replacement.replace(/\r\n/g, '\n'));
c = c.replace(target, replacement);

fs.writeFileSync('e:/Magang/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js', c);
console.log("Replaced");
