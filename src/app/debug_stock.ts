
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const items = await prisma.stockItem.findMany()
  console.log(JSON.stringify(items, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())

export {};
