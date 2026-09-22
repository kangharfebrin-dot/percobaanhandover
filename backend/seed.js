const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateRandomNumberString(length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

async function main() {
  // --- SEED USERS ---
  const users = [
    { username: 'yoan', password: '123', role: 'SUPER_ADMIN', name: 'Yoan' },
    { username: 'sekar', password: '123', role: 'PENGAWAS', name: 'Sekar' },
    { username: 'haula', password: '123', role: 'AMT', name: 'Haula' },
    { username: 'budi', password: '123', role: 'AMT', name: 'Budi Santoso' },
    { username: 'andi', password: '123', role: 'AMT', name: 'Andi Pratama' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password: u.password, role: u.role, name: u.name },
      create: u
    });
  }

  // --- SEED VEHICLES ---
  const vehicles = [
    { noPolisi: 'B 1234 CD', barcode: 'TRK-001', jenisKendaraan: 'Truk Tangki 8KL' },
    { noPolisi: 'B 5678 EF', barcode: 'TRK-002', jenisKendaraan: 'Truk Tangki 16KL' },
    { noPolisi: 'B 9101 GH', barcode: 'TRK-003', jenisKendaraan: 'Truk Tangki 24KL' },
    { noPolisi: 'B 1121 IJ', barcode: 'TRK-004', jenisKendaraan: 'Truk Tangki 8KL' },
    { noPolisi: 'B 3141 KL', barcode: 'TRK-005', jenisKendaraan: 'Truk Tangki 16KL' }
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { noPolisi: v.noPolisi },
      update: { barcode: v.barcode, jenisKendaraan: v.jenisKendaraan },
      create: v
    });
  }

  console.log('--- SEEDING DONE ---');
  console.log('Truk dan Pekerja telah ditambahkan ke database.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
