import { db } from "../src/lib/db";

async function main() {
    console.log("Checking Stock Items (Simple)...");
    try {
        const items = await db.stockItem.findMany();
        console.log(JSON.stringify(items, null, 2));
    } catch (error) {
        console.error("Error fetching stock items:", error);
    }
}

main();
