const fs = require('fs');

const filesToFix = [
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/IssueListScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/WorkerListScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/VehicleListScreen.js'
];

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Rename the constant
  content = content.replace(/const API_URL = `\$\{API_URL\}\/api`;/g, 'const API_BASE = `${API_URL}/api`;');
  content = content.replace(/const API_URL = `\$\{API_URL\}\/api`; \/\/ Sesuaikan IP backend/g, 'const API_BASE = `${API_URL}/api`; // Sesuaikan IP backend');

  // 2. Replace instances in backticks except the import and the const assignment we just changed.
  // The ones we want to change are like `${API_URL}/vehicles` -> `${API_BASE}/vehicles`
  // Because the local API_URL in these files stood for the base with /api.
  content = content.replace(/\$\{API_URL\}\/(vehicles|issues|workers|barcodes)/g, '${API_BASE}/$1');
  
  // Also fix VehicleListScreen which has:
  // const imageUrl = `${API_URL.replace('/api', '')}/barcodes/...`
  // We can change that to `${API_URL}/barcodes/...` directly since API_URL is now without /api.
  content = content.replace(/\$\{API_URL\.replace\('\/api', ''\)\}/g, '${API_URL}');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
