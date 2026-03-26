
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const suppliers = await prisma.supplier.count();
    const products = await prisma.product.count();
    const users = await prisma.user.count();
    console.log(`Suppliers: ${suppliers}`);
    console.log(`Products: ${products}`);
    console.log(`Users: ${users}`);
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

export {};
