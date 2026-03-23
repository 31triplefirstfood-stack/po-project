const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  console.log("Adding items...");
  const items = [
    { name: "เกลือ", unit: "กิโลกรัม", currentQty: 100 },
    { name: "สารกันบูด", unit: "กิโลกรัม", currentQty: 100 },
    { name: "น้ำมัน", unit: "ลิตร", currentQty: 100 },
  ];

  for (const item of items) {
    try {
      const created = await db.stockItem.create({ data: item });
      console.log("Created:", created.name);
    } catch (e) {
      console.log("Error or already exists for:", item.name);
    }
  }
  process.exit(0);
}

main();
