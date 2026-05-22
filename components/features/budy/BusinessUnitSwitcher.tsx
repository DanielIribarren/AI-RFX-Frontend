"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BusinessUnit } from "@/lib/api-budy";

interface BusinessUnitSwitcherProps {
  businessUnits: BusinessUnit[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  includeAll?: boolean;
  allLabel?: string;
  disabled?: boolean;
}

export function BusinessUnitSwitcher({
  businessUnits,
  value,
  onValueChange,
  label = "Service",
  includeAll = false,
  allLabel = "All services",
  disabled = false,
}: BusinessUnitSwitcherProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full md:w-[280px]">
          <SelectValue placeholder="Select a service" />
        </SelectTrigger>
        <SelectContent>
          {includeAll && (
            <SelectItem value="all">{allLabel}</SelectItem>
          )}
          {businessUnits.map((unit) => (
            <SelectItem key={unit.id} value={unit.id}>
              {unit.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
