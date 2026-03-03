"use client";

import { ReactNode } from "react";

interface RfxLayoutProps {
  children: ReactNode;
}

export default function RfxLayout({ children }: RfxLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
