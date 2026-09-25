const fs = require('fs');

const file = 'e:/Magang/HandoverApp/frontend/screens/shared/HistoryScreen.js';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove tempMonth, tempYear, selectedMonth, selectedYear
// In HistoryScreen.js we have selectedMonth, setSelectedMonth etc.
// Let's just replace the UI part of the filter modal for Date Range.

const oldDateRangeFilter = `{/* Date Range Filter */}
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
                  </View>`;

const newDateRangeFilter = `{/* Rentang Waktu Cepat (Banking App Style) */}
                  <Text style={tw\`text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex-row items-center\`}>
                    <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />  Pilih Cepat
                  </Text>
                  <View style={tw\`flex-row flex-wrap mb-5\`}>
                    {[
                      { label: 'Hari Ini', getRange: () => { const d = new Date(); const s = d.toISOString().split('T')[0]; return [s, s] } },
                      { label: '7 Hari Terakhir', getRange: () => { const d = new Date(); const e = d.toISOString().split('T')[0]; d.setDate(d.getDate() - 7); const s = d.toISOString().split('T')[0]; return [s, e] } },
                      { label: 'Bulan Ini', getRange: () => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 2).toISOString().split('T')[0]; const e = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().split('T')[0]; return [s, e] } },
                    ].map(preset => (
                      <TouchableOpacity
                        key={preset.label}
                        style={tw\`px-3 py-2 rounded-full mr-2 mb-2 bg-blue-50 border border-blue-200\`}
                        onPress={() => {
                          const [s, e] = preset.getRange();
                          setTempStartDate(s);
                          setTempEndDate(e);
                          setTempYear('Semua');
                          setTempMonth('Semua');
                        }}
                      >
                        <Text style={tw\`text-xs font-bold text-[#0055A5]\`}>{preset.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Date Range Filter Custom */}
                  <Text style={tw\`text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex-row items-center\`}>
                    <Ionicons name="calendar" size={14} color="#9CA3AF" />  Rentang Kustom
                  </Text>
                  <View style={tw\`flex-row items-center justify-between mb-5\`}>
                    <View style={tw\`flex-1\`}>
                      <Text style={tw\`text-xs text-gray-400 mb-1 font-bold\`}>Dari Tanggal</Text>
                      {Platform.OS === 'web' ? (
                        <input 
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          style={{ padding: 12, borderRadius: 16, border: '1px solid #E5E7EB', width: '100%', outline: 'none', fontFamily: 'inherit', backgroundColor: '#F9FAFB', fontWeight: 'bold', color: '#1F2937' }}
                        />
                      ) : (
                         <TextInput
                          style={tw\`p-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-800 font-bold\`}
                          placeholder="YYYY-MM-DD"
                          value={tempStartDate}
                          onChangeText={setTempStartDate}
                        />
                      )}
                    </View>
                    <View style={tw\`px-3 mt-4\`}>
                      <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                    </View>
                    <View style={tw\`flex-1\`}>
                      <Text style={tw\`text-xs text-gray-400 mb-1 font-bold\`}>Sampai Tanggal</Text>
                      {Platform.OS === 'web' ? (
                        <input 
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          style={{ padding: 12, borderRadius: 16, border: '1px solid #E5E7EB', width: '100%', outline: 'none', fontFamily: 'inherit', backgroundColor: '#F9FAFB', fontWeight: 'bold', color: '#1F2937' }}
                        />
                      ) : (
                        <TextInput
                          style={tw\`p-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-800 font-bold\`}
                          placeholder="YYYY-MM-DD"
                          value={tempEndDate}
                          onChangeText={setTempEndDate}
                        />
                      )}
                    </View>
                  </View>`;

code = code.replace(oldDateRangeFilter, newDateRangeFilter);

const yearFilterStr = `{/* Year Filter */}
                  <Text style={tw\`text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex-row items-center\`}>
                    <Ionicons name="calendar" size={14} color="#9CA3AF" />  Tahun
                  </Text>
                  <View style={tw\`flex-row flex-wrap mb-5\`}>
                    {['Semua', ...uniqueYears.map(String)].map(year => (
                      <TouchableOpacity
                        key={year}
                        style={tw\`px-4 py-2.5 rounded-full mr-2 mb-2 border \${tempYear === year ? 'bg-[#0055A5] border-[#0055A5]' : 'bg-transparent border-gray-300'}\`}
                        onPress={() => setTempYear(year)}
                      >
                        <Text style={tw\`text-sm font-bold \${tempYear === year ? 'text-white' : 'text-gray-600'}\`}>{year}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Month Filter */}
                  <Text style={tw\`text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex-row items-center\`}>
                    <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />  Bulan
                  </Text>
                  <View style={tw\`flex-row flex-wrap mb-8\`}>
                    {['Semua', ...uniqueMonths].map(month => (
                      <TouchableOpacity
                        key={month}
                        style={tw\`px-4 py-2.5 rounded-full mr-2 mb-2 border \${tempMonth === month ? 'bg-[#0055A5] border-[#0055A5]' : 'bg-transparent border-gray-300'}\`}
                        onPress={() => setTempMonth(month)}
                      >
                        <Text style={tw\`text-sm font-bold \${tempMonth === month ? 'text-white' : 'text-gray-600'}\`}>{month}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>`;

code = code.replace(yearFilterStr, '');

fs.writeFileSync(file, code);
console.log('Fixed HistoryScreen date filter');
