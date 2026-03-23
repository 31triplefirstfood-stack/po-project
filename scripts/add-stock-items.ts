import "dotenv/config";
import { db } from "../src/lib/db";
import { Prisma } from "@prisma/client";

async function main() {
  console.log("Adding missing stock items...");
  const items = [
    { name: "เกลือ", unit: "กิโลกรัม", currentQty: new Prisma.Decimal(100) },
    { name: "สารกันบูด", unit: "กิโลกรัม", currentQty: new Prisma.Decimal(100) },
    { name: "น้ำมัน", unit: "ลิตร", currentQty: new Prisma.Decimal(100) },
  ];

  for (const item of items) {
    const existing = await db.stockItem.findFirst({
      where: { name: { contains: item.name, mode: "insensitive" } }
    });

    if (!existing) {
      const created = await db.stockItem.create({ data: item });
      console.log(`✅ Created item: ${created.name}`);
    } else {
      console.log(`ℹ️ Item already exists: ${existing.name}`);
    }
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
