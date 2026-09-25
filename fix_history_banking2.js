const fs = require('fs');

const file = 'e:/Magang/HandoverApp/frontend/screens/shared/HistoryScreen.js';
let code = fs.readFileSync(file, 'utf8');

const yearChipStr = `{selectedYear !== 'Semua' && (
                <TouchableOpacity onPress={() => setSelectedYear('Semua')} style={tw\`flex-row items-center bg-[#0055A5] px-3 py-2 rounded-full\`}>
                  <Ionicons name="calendar" size={12} color="white" style={tw\`mr-1\`} />
                  <Text style={tw\`text-white text-xs font-bold mr-1\`}>{selectedYear}</Text>
                  <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}`;

const monthChipStr = `{selectedMonth !== 'Semua' && (
                <TouchableOpacity onPress={() => setSelectedMonth('Semua')} style={tw\`flex-row items-center bg-[#0055A5] px-3 py-2 rounded-full\`}>
                  <Ionicons name="calendar-outline" size={12} color="white" style={tw\`mr-1\`} />
                  <Text style={tw\`text-white text-xs font-bold mr-1\`}>{selectedMonth}</Text>
                  <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}`;

code = code.replace(yearChipStr, '');
code = code.replace(monthChipStr, '');

fs.writeFileSync(file, code);
console.log('Cleaned up year and month chips');
