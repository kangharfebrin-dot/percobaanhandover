const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.handover.findUnique({
  where: { id: "cmum2szxs000jpugianz2hiwm" },
  include: { photos: true }
}).then(h => console.log(JSON.stringify(h.photos, null, 2)))
.catch(console.error).finally(() => prisma.$disconnect());
