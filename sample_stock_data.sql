-- Sample data for Stock Management System
-- Tables: stock_items, stock_restocks, stock_usages

-- 1. Insert Stock Items
INSERT INTO stock_items (id, name, unit, current_qty, created_at, updated_at) VALUES
('item-flour', 'แป้ง', 'ถุง', 100, NOW(), NOW()),
('item-salt', 'เกลือ', 'กิโลกรัม', 50, NOW(), NOW()),
('item-preservative', 'สารกันบูด', 'กิโลกรัม', 10, NOW(), NOW()),
('item-oil', 'น้ำมัน', 'ลิตร', 20, NOW(), NOW()),
('item-soda', 'โซเดียมไบคาร์บอเนต', 'กิโลกรัม', 5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    unit = EXCLUDED.unit,
    current_qty = EXCLUDED.current_qty,
    updated_at = NOW();

-- 2. Insert Stock Restock History (การเติมสต็อก)
INSERT INTO stock_restocks (id, stock_item_id, receipt_number, quantity, date, created_at) VALUES
('restock-001', 'item-flour', 'RE-2026-003', 50, '2026-03-10 09:00:00', NOW()),
('restock-002', 'item-flour', 'RE-2026-005', 50, '2026-02-15 10:30:00', NOW()),
('restock-003', 'item-salt', 'RE-2026-002', 20, '2026-03-12 11:00:00', NOW()),
('restock-004', 'item-oil', 'RE-2026-003', 10, '2026-03-15 14:00:00', NOW()),
('restock-005', 'item-oil', 'RE-2026-007', 10, '2026-03-03 08:45:00', NOW()),
('restock-006', 'item-preservative', 'RE-2026-004', 5, '2026-03-20 13:20:00', NOW()),
('restock-007', 'item-soda', 'RE-2026-006', 2, '2026-02-20 09:15:00', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Stock Usage History (การเบิกใช้งาน)
INSERT INTO stock_usages (id, stock_item_id, quantity, date, checker_name, checked_at, note, created_at) VALUES
('usage-001', 'item-flour', 5, '2026-03-11 08:30:00', 'สมชาย ใจดี', NOW(), 'เบิกใช้ผลิตคิวเช้า', NOW()),
('usage-002', 'item-flour', 5, '2026-03-11 13:30:00', 'สมชาย ใจดี', NOW(), 'เบิกใช้ผลิตคิวบ่าย', NOW()),
('usage-003', 'item-salt', 2, '2026-03-13 09:00:00', 'วิชัย รักดี', NOW(), 'ใช้ในสูตรมาตรฐาน', NOW()),
('usage-004', 'item-oil', 2, '2026-03-16 10:00:00', 'มาลี มีความสุข', NOW(), 'เบิกใช้ทอดเส้น', NOW()),
('usage-005', 'item-preservative', 0.5, '2026-03-21 11:00:00', 'สมชาย ใจดี', NOW(), 'ผสมในตัวอย่างผลิตใหม่', NOW()),
('usage-006', 'item-flour', 10, '2026-03-16 08:00:00', 'วิชัย รักดี', NOW(), 'ล้อตผลิตใหญ่ประจำสัปดาห์', NOW()),
('usage-007', 'item-soda', 1, '2026-03-21 14:00:00', 'มาลี มีความสุข', NOW(), 'เบิกใช้ทดลองสูตร', NOW())
ON CONFLICT (id) DO NOTHING;
