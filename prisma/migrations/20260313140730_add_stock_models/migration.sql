-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "unit" TEXT NOT NULL,
    "current_qty" DECIMAL(19,8) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_restocks" (
    "id" TEXT NOT NULL,
    "stock_item_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "quantity" DECIMAL(19,8) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_restocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_usages" (
    "id" TEXT NOT NULL,
    "stock_item_id" TEXT NOT NULL,
    "quantity" DECIMAL(19,8) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checker_name" TEXT,
    "checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_usages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stock_restocks" ADD CONSTRAINT "stock_restocks_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_usages" ADD CONSTRAINT "stock_usages_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
