
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const items = await prisma.stockItem.findMany()
  console.log('---ITEMS_START---')
  console.log(JSON.stringify(items, null, 2))
  console.log('---ITEMS_END---')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
