import { db } from "../src/lib/db";
import { Prisma } from "@prisma/client";

async function main() {
  console.log("Checking Stock Items...");
  const names = ["แป้ง", "เกลือ", "สารกันบูด", "น้ำมัน"];

  for (const name of names) {
    const item = await db.stockItem.findFirst({
      where: { name: { contains: name, mode: "insensitive" } }
    });
    if (item) {
      console.log(`✅ Found ${name}: ${item.name} (Qty: ${item.currentQty})`);
    } else {
      console.log(`❌ Missing ${name}`);
    }
  }

  // Test Calculation
  const qty = 156; // 78 * 2
  const scalingFactor = qty / 78;
  console.log(`Test Calculation for Qty: ${qty} (Factor: ${scalingFactor})`);
  const ingredients = [
    { name: "แป้ง", standardAmount: 22.5 },
    { name: "เกลือ", standardAmount: 0.5 },
    { name: "สารกันบูด", standardAmount: 0.3 },
    { name: "น้ำมัน", standardAmount: 1.5 },
  ];

  ingredients.forEach(ing => {
    console.log(`- ${ing.name}: ${ing.standardAmount * scalingFactor} units`);
  });
}

main().catch(console.error);
