"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, List, Users, Warehouse, Factory } from 'lucide-react';

export default function NavTabs() {
    const pathname = usePathname();

    const tabs = [
        { name: 'สร้างออเดอร์', href: '/purchase-orders/create', icon: FileText },
        { name: 'PO ทั้งหมด', href: '/purchase-orders', icon: List },
        { name: 'หน้าการผลิต', href: '/production', icon: Factory },
        { name: 'ข้อมูลลูกค้า', href: '/customers', icon: Users },
        { name: 'จัดการสต็อก', href: '/stock', icon: Warehouse },
    ];

    return (
        <div className="flex justify-start sm:justify-center overflow-x-auto space-x-2 sm:space-x-4 my-2 sm:my-4 px-4 pb-2 no-scrollbar">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "flex items-center space-x-2 px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap text-sm sm:text-base flex-shrink-0",
                            isActive
                                ? "bg-[#1a3dbf] text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        )}
                    >
                        <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>{tab.name}</span>
                    </Link>
                );
            })}
        </div>
    );
}
