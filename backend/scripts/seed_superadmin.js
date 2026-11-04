const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

async function seedSuperAdmin() {
  const username = process.env.SUPERADMIN_USERNAME || process.argv[2] || 'superadmin';
  const rawPassword = process.env.SUPERADMIN_PASSWORD || process.argv[3] || 'SuperAdmin123!';
  const name = process.env.SUPERADMIN_NAME || process.argv[4] || 'Super Administrator';
  const jabatan = process.env.SUPERADMIN_JABATAN || 'Super Administrator Pusat';

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      role: 'SUPER_ADMIN',
      password: hashedPassword,
      name,
      jabatan,
      deletedAt: null
    },
    create: {
      username,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      name,
      jabatan
    }
  });

  console.log('====================================================');
  console.log('✅ Akun SUPER_ADMIN berhasil diinjeksikan!');
  console.log(`   ID       : ${user.id}`);
  console.log(`   Username : ${user.username}`);
  console.log(`   Password : ${rawPassword}`);
  console.log(`   Role     : ${user.role}`);
  console.log(`   Nama     : ${user.name}`);
  console.log(`   Jabatan  : ${user.jabatan}`);
  console.log('====================================================');
}

seedSuperAdmin()
  .catch((err) => {
    console.error('❌ Gagal inject data Super Admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

