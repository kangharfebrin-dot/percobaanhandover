const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const vehicleCount = await prisma.vehicle.count();
  console.log(`Users: ${userCount}, Vehicles: ${vehicleCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
