const fs = require('fs');

const files = [
  'e:/Magang/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/user/UserDashboardScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/admin/ChecklistManagerScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/pengawas/MessageCenterScreen.js',
  'e:/Magang/HandoverApp/frontend/screens/shared/HistoryScreen.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Backgrounds
    content = content.replace(/bg-\[\#F4F7FA\](?! dark:)/g, 'bg-[#F4F7FA] dark:bg-gray-900');
    content = content.replace(/bg-white(?! dark:)/g, 'bg-white dark:bg-gray-800');
    content = content.replace(/bg-gray-50(?! dark:)/g, 'bg-gray-50 dark:bg-gray-800');
    
    // Texts
    content = content.replace(/text-gray-800(?! dark:)/g, 'text-gray-800 dark:text-gray-100');
    content = content.replace(/text-gray-700(?! dark:)/g, 'text-gray-700 dark:text-gray-200');
    content = content.replace(/text-gray-600(?! dark:)/g, 'text-gray-600 dark:text-gray-300');
    content = content.replace(/text-gray-500(?! dark:)/g, 'text-gray-500 dark:text-gray-400');
    
    // Borders
    content = content.replace(/border-gray-100(?! dark:)/g, 'border-gray-100 dark:border-gray-700');
    content = content.replace(/border-gray-200(?! dark:)/g, 'border-gray-200 dark:border-gray-700');
    content = content.replace(/border-white\/60(?! dark:)/g, 'border-white/60 dark:border-gray-700/60');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Added dark mode classes to ' + file);
  }
});
