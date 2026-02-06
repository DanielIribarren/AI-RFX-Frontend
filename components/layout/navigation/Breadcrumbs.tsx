"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (!pathname || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [];
  let href = "";

  for (const segment of segments) {
    href += `/${segment}`;
    
    // Map segments to user-friendly labels
    let label = segment;
    switch (segment) {
      case "dashboard":
        label = "Dashboard";
        break;
      case "history":
        label = "History";
        break;
      case "budget-settings":
        label = "Budget Settings";
        break;
      case "profile":
        label = "Profile";
        break;
      case "rfx-result-wrapper-v2":
        label = "RFX";
        break;
      case "data":
        label = "Data";
        break;
      case "budget":
        label = "Budget";
        break;
      default:
        // For UUIDs or other IDs, show generic label
        if (segment.match(/^[0-9a-f-]{20,}$/i)) {
          label = "Detail";
        } else {
          label = segment.charAt(0).toUpperCase() + segment.slice(1);
        }
        break;
    }
    
    breadcrumbs.push({ label, href, segment });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href} className="cursor-pointer">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
