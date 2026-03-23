import { db } from "../src/lib/db";

async function main() {
  const stockItems = await db.stockItem.findMany();
  console.log("Existing Stock Items:");
  stockItems.forEach((item: any) => {
    console.log(`- ID: ${item.id}, Name: ${item.name}, Unit: ${item.unit}, Qty: ${item.currentQty}`);
  });
}

main();
