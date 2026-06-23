const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'adamijjai1@gmail.com' } });
  console.log('User:', user);
  const users = await prisma.user.findMany();
  console.log('All Users:', users);
}
main().catch(console.error).finally(() => prisma.$disconnect());