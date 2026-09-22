const fs = require('fs');

const file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/VehicleListScreen.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /<View style=\{tw`mb-4`\}>\s*<Text style=\{tw`text-xs font-bold text-gray-500 uppercase mb-2`\}>Status Truk<\/Text>\s*<View style=\{tw`flex-row`\}>\s*<TouchableOpacity\s*style=\{tw`flex-1 py-3 items-center rounded-l-xl border \\`\}\s*onPress=\{\(\) => setNewStatus\('Baik'\)\}>\s*<Text style=\{tw`font-bold \\`\}>Baik<\/Text>\s*<\/TouchableOpacity>\s*<TouchableOpacity\s*style=\{tw`flex-1 py-3 items-center rounded-r-xl border border-l-0 \\`\}\s*onPress=\{\(\) => setNewStatus\('Buruk'\)\}>\s*<Text style=\{tw`font-bold \\`\}>Buruk<\/Text>\s*<\/TouchableOpacity>\s*<\/View>\s*<\/View>/;

const correctUI = `
                <View style={tw\`mb-4\`}>
                  <Text style={tw\`text-xs font-bold text-gray-500 uppercase mb-2\`}>Status Truk</Text>
                  <View style={tw\`flex-row\`}>
                    <TouchableOpacity 
                      style={tw\`flex-1 py-3 items-center rounded-l-xl border \${newStatus === 'Baik' ? 'bg-[#00A651] border-[#00A651]' : 'bg-white border-gray-200'}\`} 
                      onPress={() => setNewStatus('Baik')}>
                      <Text style={tw\`font-bold \${newStatus === 'Baik' ? 'text-white' : 'text-gray-500'}\`}>Baik</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={tw\`flex-1 py-3 items-center rounded-r-xl border border-l-0 \${newStatus === 'Buruk' ? 'bg-[#ED1C24] border-[#ED1C24]' : 'bg-white border-gray-200'}\`} 
                      onPress={() => setNewStatus('Buruk')}>
                      <Text style={tw\`font-bold \${newStatus === 'Buruk' ? 'text-white' : 'text-gray-500'}\`}>Buruk</Text>
                    </TouchableOpacity>
                  </View>
                </View>
`;

content = content.replace(regex, correctUI.trim());
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed UI in VehicleListScreen.js');
