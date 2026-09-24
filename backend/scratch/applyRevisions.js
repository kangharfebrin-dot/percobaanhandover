const fs = require('fs');

// 1. UPDATE SCHEMA.PRISMA
let prismaFile = 'd:/UKSW/Pertamina/HandoverApp/backend/prisma/schema.prisma';
let prismaContent = fs.readFileSync(prismaFile, 'utf8');

if (!prismaContent.includes('amt1')) {
  prismaContent = prismaContent.replace(
    'status      String\n  locationLat Float?',
    'status      String\n  amt1        String?\n  amt2        String?\n  locationLat Float?'
  );
  fs.writeFileSync(prismaFile, prismaContent, 'utf8');
  console.log('Updated schema.prisma');
}

// 2. UPDATE BACKEND ROUTES (backend/index.js)
let backendIndex = 'd:/UKSW/Pertamina/HandoverApp/backend/index.js';
let backendContent = fs.readFileSync(backendIndex, 'utf8');

// 2a. Update Scan Route
if (!backendContent.includes('lastHandover = await prisma.handover.findFirst')) {
  backendContent = backendContent.replace(
    /const vehicle = await prisma\.vehicle\.findUnique\(\{ where: \{ barcode: req\.params\.barcode \} \}\);\n    if \(!vehicle\) return res\.status\(404\)\.json\(\{ error: 'Kendaraan tidak ditemukan' \}\);\n    res\.json\(\{ success: true, vehicle \}\);/,
    `const vehicle = await prisma.vehicle.findUnique({ where: { barcode: req.params.barcode } });
    if (!vehicle) return res.status(404).json({ error: 'Kendaraan tidak ditemukan' });
    
    const lastHandover = await prisma.handover.findFirst({
      where: { noPolisi: vehicle.noPolisi },
      orderBy: { timestamp: 'desc' },
      include: {
        user: true,
        items: true
      }
    });
    
    res.json({ success: true, vehicle, lastHandover });`
  );
}

// 2b. Update Post Handover Route to accept amt1 and amt2
if (!backendContent.includes('const { userId, noPolisi, shift, locationLat, locationLng, items, amt1, amt2 } = req.body;')) {
  backendContent = backendContent.replace(
    'const { userId, noPolisi, shift, locationLat, locationLng, items } = req.body;',
    'const { userId, noPolisi, shift, locationLat, locationLng, items, amt1, amt2 } = req.body;'
  );
  
  backendContent = backendContent.replace(
    'status,\n        locationLat:',
    'status,\n        amt1,\n        amt2,\n        locationLat:'
  );
}
fs.writeFileSync(backendIndex, backendContent, 'utf8');
console.log('Updated backend/index.js');
