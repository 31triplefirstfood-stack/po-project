import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("--- START VERIFICATION ---");
  try {
    const stockItems = await db.stockItem.findMany({ take: 5 });
    console.log("Stock Items found:", stockItems.length);
    stockItems.forEach(item => console.log(`- ${item.name}`));
    
    const keywords = ["แป้ง", "เกลือ", "สารกันบูด", "น้ำมัน"];
    for (const kw of keywords) {
      const found = await db.stockItem.findFirst({
        where: { name: { contains: kw, mode: "insensitive" } }
      });
      if (found) {
        console.log(`✅ Keyword '${kw}' matched: ${found.name}`);
      } else {
        console.log(`❌ Keyword '${kw}' NOT matched`);
      }
    }
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await db.$disconnect();
  }
  console.log("--- END VERIFICATION ---");
}

main();
