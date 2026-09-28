const xlsx = require('xlsx');

const workbook = xlsx.readFile('../Template Handover Report excel.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log("Sheet Name:", sheetName);
console.log("Excel Template Content (First 20 rows):");
data.slice(0, 20).forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row);
});
