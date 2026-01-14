"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ReactNode } from "react";

interface RfxLayoutProps {
  children: ReactNode;
}

export default function RfxLayout({ children }: RfxLayoutProps) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  
  const isDataView = pathname?.includes("/data/");
  const isBudgetView = pathname?.includes("/budget/");

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border bg-background">
        <div className="px-4 py-2">
          <nav className="flex gap-6" aria-label="Tabs">
            <Link
              href={`/rfx-result-wrapper-v2/data/${id}`}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${isDataView
                  ? "border-primary-light text-primary"
                  : "border-transparent text-muted-foreground hover:text-gray-700 hover:border-input"
                }
              `}
              aria-current={isDataView ? "page" : undefined}
            >
              Datos
            </Link>
            <Link
              href={`/rfx-result-wrapper-v2/budget/${id}`}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${isBudgetView
                  ? "border-primary-light text-primary"
                  : "border-transparent text-muted-foreground hover:text-gray-700 hover:border-input"
                }
              `}
              aria-current={isBudgetView ? "page" : undefined}
            >
              Presupuesto
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
