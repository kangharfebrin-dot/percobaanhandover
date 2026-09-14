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
  // Reset data to avoid unique constraint errors during re-seed
  await prisma.user.deleteMany({});

  const adminUsername = 'yoan';
  const adminPassword = '969111';

  const userUsername = 'haula';
  const userPassword = '672023';

  await prisma.user.create({
    data: {
      username: adminUsername,
      password: adminPassword,
      role: 'ADMIN',
      name: 'Yoan' // Diganti sesuai permintaan
    }
  });

  await prisma.user.create({
    data: {
      username: userUsername,
      password: userPassword,
      role: 'USER',
      name: 'Haula' // Diganti sesuai permintaan
    }
  });

  console.log('--- SEEDING DONE ---');
  console.log('Admin Login:');
  console.log('Username:', adminUsername);
  console.log('Password:', adminPassword);
  console.log('--------------------');
  console.log('User Login:');
  console.log('Username:', userUsername);
  console.log('Password:', userPassword);
  console.log('--------------------');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
