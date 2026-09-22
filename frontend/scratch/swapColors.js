const fs = require('fs');

const files = [
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/AdminDashboardScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js',
  'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/UserDashboardScreen.js'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Swap Mulai Pekerjaan
    // 1. LinearGradient
    content = content.replace(
      /colors=\{\['#1e40af', '#172554'\]\} style=\{tw`p-5 rounded-\[40px\] shadow-xl shadow-blue-900\/20/g,
      "colors={PERTAMINA_GREEN} style={tw`p-5 rounded-[40px] shadow-xl shadow-green-900/20"
    );
    // 2. Text color
    content = content.replace(
      /text-blue-200 font-bold text-\[10px\] uppercase tracking-widest mb-1`\}>SCAN QR/g,
      "text-green-200 font-bold text-[10px] uppercase tracking-widest mb-1`}>SCAN QR"
    );

    // Swap Arsip Database (Lihat Seluruh Laporan)
    // 1. LinearGradient
    content = content.replace(
      /colors=\{PERTAMINA_GREEN\} start=\{\{ x: 0, y: 0 \}\} end=\{\{ x: 1, y: 1 \}\} style=\{tw`p-8 rounded-\[40px\] shadow-2xl shadow-green-500\/40/g,
      "colors={PERTAMINA_BLUE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-8 rounded-[40px] shadow-2xl shadow-blue-500/40"
    );
    // 2. Text color
    content = content.replace(
      /text-green-200 font-bold text-sm uppercase tracking-widest mb-2`\}>Arsip Database/g,
      "text-blue-200 font-bold text-sm uppercase tracking-widest mb-2`}>Arsip Database"
    );
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Swapped colors in:', file);
  }
}
