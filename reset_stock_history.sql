-- SQL to Full Reset All Stock Data
-- This will delete ALL stock items and their history (restocks/usages)

-- 1. Delete all records from stock_restocks (Optional as it cascades)
DELETE FROM stock_restocks;

-- 2. Delete all records from stock_usages (Optional as it cascades)
DELETE FROM stock_usages;

-- 3. Delete all stock items
DELETE FROM stock_items;

-- Note: Use with caution!
