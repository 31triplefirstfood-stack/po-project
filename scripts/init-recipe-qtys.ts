import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
    console.log("Initializing recipe quantities and sort order...");

    const initialData = [
        { name: "แป้ง", recipeQty: 0.011536, sortOrder: 1 }, // 14.42 kg per 50 units, in bags (1 bag = 25kg) -> 14.42 / 50 / 25 = 0.011536
        { name: "เกลือ", recipeQty: 0.0064102, sortOrder: 2 }, // 0.32051 kg per 50 units -> 0.32051 / 50 = 0.0064102 kg
        { name: "สารกันบูด", recipeQty: 0.0038462, sortOrder: 3 }, // 0.19231 kg per 50 units -> 0.19231 / 50 = 0.0038462 kg
        { name: "น้ำมัน", recipeQty: 0.0192, sortOrder: 4 }, // 0.96 L per 50 units -> 0.96 / 50 = 0.0192 L
        { name: "โซเดียมไบคาร์บอเนต", recipeQty: 0.0064102, sortOrder: 5 }, // 0.32051 kg per 50 units -> 0.32051 / 50 = 0.0064102 kg
        { name: "สีผสมอาหาร สีเหลือง", recipeQty: 0.001, sortOrder: 6 }, // Custom default
        { name: "สีผสมอาหาร สีเขียว", recipeQty: 0.001, sortOrder: 7 }, // Custom default
    ];

    for (const item of initialData) {
        const dbItem = await prisma.stockItem.findFirst({
            where: { name: { contains: item.name, mode: "insensitive" } }
        });

        if (dbItem) {
            await prisma.stockItem.update({
                where: { id: dbItem.id },
                data: {
                    recipeQty: item.recipeQty,
                    sortOrder: item.sortOrder
                }
            });
            console.log(`Updated ${dbItem.name} to recipeQty = ${item.recipeQty}, sortOrder = ${item.sortOrder}`);
        } else {
            console.log(`Could not find stock item containing "${item.name}"`);
        }
    }

    console.log("Seeding complete!");
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
