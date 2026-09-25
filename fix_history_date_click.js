const fs = require('fs');

const file = 'e:/Magang/HandoverApp/frontend/screens/shared/HistoryScreen.js';
let code = fs.readFileSync(file, 'utf8');

const oldStartDateInput = `<input 
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          style={{ padding: 12, borderRadius: 16, border: '1px solid #E5E7EB', width: '100%', outline: 'none', fontFamily: 'inherit', backgroundColor: '#F9FAFB', fontWeight: 'bold', color: '#1F2937' }}
                        />`;

const newStartDateInput = `<input 
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          onClick={(e) => e.target.showPicker && e.target.showPicker()}
                          style={{ padding: 12, borderRadius: 16, border: '1px solid #E5E7EB', width: '100%', outline: 'none', fontFamily: 'inherit', backgroundColor: '#F9FAFB', fontWeight: 'bold', color: '#1F2937', cursor: 'pointer' }}
                        />`;

const oldEndDateInput = `<input 
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          style={{ padding: 12, borderRadius: 16, border: '1px solid #E5E7EB', width: '100%', outline: 'none', fontFamily: 'inherit', backgroundColor: '#F9FAFB', fontWeight: 'bold', color: '#1F2937' }}
                        />`;

const newEndDateInput = `<input 
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          onClick={(e) => e.target.showPicker && e.target.showPicker()}
                          style={{ padding: 12, borderRadius: 16, border: '1px solid #E5E7EB', width: '100%', outline: 'none', fontFamily: 'inherit', backgroundColor: '#F9FAFB', fontWeight: 'bold', color: '#1F2937', cursor: 'pointer' }}
                        />`;

code = code.replace(oldStartDateInput, newStartDateInput);
code = code.replace(oldEndDateInput, newEndDateInput);

fs.writeFileSync(file, code);
console.log('Fixed date inputs to show picker on click');
