const fs = require('fs');

const run = () => {
  let adminDash = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js';
  let adminContent = fs.readFileSync(adminDash, 'utf8');

  // Revert back to showing Scanner actions for SuperAdmin/Admin
  if (adminContent.includes('const canSeeActions = isAMT;')) {
    adminContent = adminContent.replace(
      'const canSeeActions = isAMT;',
      'const canSeeActions = isSuperAdmin || isAMT;'
    );
    fs.writeFileSync(adminDash, adminContent, 'utf8');
    console.log('Reverted canSeeActions');
  } else {
    console.log('canSeeActions not found or already correct');
  }
};

run();
