const fs = require('fs');
let content = fs.readFileSync('frontend/screens/admin/VehicleListScreen.js', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('placeholder="Misal: Tangki 16KL"'));
if(start !== -1) {
  lines.splice(start - 2, 4,
    '                <View style={tw`mb-4`}>',
    '                  <Text style={tw`text-xs font-bold text-gray-500 uppercase mb-2`}>Tipe / Kapasitas (KL)</Text>',
    '                  <View style={tw`flex-row flex-wrap justify-between`}>',
    '                    {[\'5 KL\', \'8 KL\', \'16 KL\', \'24 KL\'].map((kapasitas) => (',
    '                      <TouchableOpacity',
    '                        key={kapasitas}',
    '                        style={tw`w-[48%] bg-${newType === kapasitas ? \'[#0055A5]\' : \'slate-50\'} p-3 rounded-xl border border-${newType === kapasitas ? \'[#0055A5]\' : \'slate-200\'} items-center mb-3 shadow-sm`}',
    '                        onPress={() => setNewType(kapasitas)}',
    '                      >',
    '                        <Text style={tw`font-bold ${newType === kapasitas ? \'text-white\' : \'text-gray-700\'}`}>{kapasitas}</Text>',
    '                      </TouchableOpacity>',
    '                    ))}',
    '                  </View>',
    '                </View>'
  );
  fs.writeFileSync('frontend/screens/admin/VehicleListScreen.js', lines.join('\n'), 'utf8');
  console.log('Done');
} else { console.log('Not found'); }
