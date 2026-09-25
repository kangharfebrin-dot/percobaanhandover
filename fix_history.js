const fs = require('fs');
const path = require('path');

const targetFile = 'e:/Magang/HandoverApp/frontend/screens/shared/HistoryScreen.js';
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Add states for startDate and endDate
if (!code.includes('const [startDate, setStartDate]')) {
    code = code.replace(
        "const [selectedYear, setSelectedYear] = useState('Semua');",
        "const [selectedYear, setSelectedYear] = useState('Semua');\n  const [startDate, setStartDate] = useState('');\n  const [endDate, setEndDate] = useState('');\n  const [tempStartDate, setTempStartDate] = useState('');\n  const [tempEndDate, setTempEndDate] = useState('');"
    );
}

// 2. Add to resetTempFilters
if (!code.includes("setTempStartDate('');")) {
    code = code.replace(
        "setTempYear('Semua');\n  };",
        "setTempYear('Semua');\n    setTempStartDate('');\n    setTempEndDate('');\n  };"
    );
}

// 3. Add to resetAllFilters
if (!code.includes("setStartDate('');")) {
    code = code.replace(
        "setSelectedYear('Semua');\n    fetchHistory",
        "setSelectedYear('Semua');\n    setStartDate('');\n    setEndDate('');\n    fetchHistory"
    );
}

// 4. Add to applyFilters
if (!code.includes("setStartDate(tempStartDate);")) {
    code = code.replace(
        "setSelectedYear(tempYear);",
        "setSelectedYear(tempYear);\n    setStartDate(tempStartDate);\n    setEndDate(tempEndDate);"
    );
}

// 5. Add to activeFilterCount logic
if (!code.includes("if (startDate) count++;")) {
    code = code.replace(
        "if (selectedYear !== 'Semua') count++;",
        "if (selectedYear !== 'Semua') count++;\n    if (startDate) count++;\n    if (endDate) count++;"
    );
}

// 6. Add Date Range logic to filtering
const filterLogic = `
    let matchesMonth = true;
`;
const newFilterLogic = `
    let matchesDateRange = true;
    if (startDate || endDate) {
      const itemDate = new Date(item.timestamp);
      // set to midnight for accurate comparison
      itemDate.setHours(0,0,0,0);
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0,0,0,0);
        if (itemDate < sDate) matchesDateRange = false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23,59,59,999);
        if (itemDate > eDate) matchesDateRange = false;
      }
    }

    let matchesMonth = true;
`;
if (!code.includes("let matchesDateRange = true;")) {
    code = code.replace(filterLogic, newFilterLogic);
    
    code = code.replace(
        "return matchesSearch && matchesStatus && matchesShift && matchesMonth && matchesYear;",
        "return matchesSearch && matchesStatus && matchesShift && matchesMonth && matchesYear && matchesDateRange;"
    );
}

// 7. Add UI to Active Filter Chips
const oldChips = `{selectedYear !== 'Semua' && (`;
const newChips = `{startDate !== '' && (
                <TouchableOpacity onPress={() => setStartDate('')} style={tw\`flex-row items-center bg-[#0055A5] px-3 py-2 rounded-full\`}>
                  <Ionicons name="calendar" size={12} color="white" style={tw\`mr-1\`} />
                  <Text style={tw\`text-white text-xs font-bold mr-1\`}>Mulai: {startDate}</Text>
                  <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
              {endDate !== '' && (
                <TouchableOpacity onPress={() => setEndDate('')} style={tw\`flex-row items-center bg-[#0055A5] px-3 py-2 rounded-full\`}>
                  <Ionicons name="calendar" size={12} color="white" style={tw\`mr-1\`} />
                  <Text style={tw\`text-white text-xs font-bold mr-1\`}>Sampai: {endDate}</Text>
                  <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
              {selectedYear !== 'Semua' && (`;

if (!code.includes("Mulai: {startDate}")) {
    code = code.replace(oldChips, newChips);
}

// 8. Add UI to the Filter Modal
const yearFilterSection = `{/* Year Filter */}`;
const dateRangeUI = `
                  {/* Date Range Filter */}
                  <Text style={tw\`text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex-row items-center\`}>
                    <Ionicons name="calendar" size={14} color="#9CA3AF" />  Range Tanggal
                  </Text>
                  <View style={tw\`flex-row items-center justify-between mb-5\`}>
                    <View style={tw\`flex-1\`}>
                      <Text style={tw\`text-xs text-gray-400 mb-1 font-bold\`}>Dari Tanggal</Text>
                      {Platform.OS === 'web' ? (
                        <input 
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          style={{ padding: 10, borderRadius: 12, border: '1px solid #D1D5DB', width: '100%', outline: 'none', fontFamily: 'inherit' }}
                        />
                      ) : (
                         <TextInput
                          style={tw\`p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800\`}
                          placeholder="YYYY-MM-DD"
                          value={tempStartDate}
                          onChangeText={setTempStartDate}
                        />
                      )}
                    </View>
                    <View style={tw\`px-3\`}>
                      <Text style={tw\`text-gray-400 font-bold\`}>-</Text>
                    </View>
                    <View style={tw\`flex-1\`}>
                      <Text style={tw\`text-xs text-gray-400 mb-1 font-bold\`}>Sampai Tanggal</Text>
                      {Platform.OS === 'web' ? (
                        <input 
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          style={{ padding: 10, borderRadius: 12, border: '1px solid #D1D5DB', width: '100%', outline: 'none', fontFamily: 'inherit' }}
                        />
                      ) : (
                        <TextInput
                          style={tw\`p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-800\`}
                          placeholder="YYYY-MM-DD"
                          value={tempEndDate}
                          onChangeText={setTempEndDate}
                        />
                      )}
                    </View>
                  </View>

                  {/* Year Filter */}`;

if (!code.includes("Range Tanggal")) {
    code = code.replace(yearFilterSection, dateRangeUI);
}

fs.writeFileSync(targetFile, code);
console.log('Fixed HistoryScreen.js');
