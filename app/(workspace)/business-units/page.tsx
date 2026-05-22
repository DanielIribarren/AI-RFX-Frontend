"use client";

import { FormEvent, useEffect, useState } from "react";
import { BriefcaseBusiness, Pencil, X } from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganization } from "@/contexts/OrganizationContext";
import { budyApi, type BusinessUnit } from "@/lib/api-budy";

// Service types offered in the UI dropdown. Values are the stable
// internal industry_context ids that the backend's INDUSTRY_PROFILES
// dict (backend/services/business_unit_context.py) understands; labels
// are the English names shown to the user. Only the two Sabra-relevant
// types are exposed in the dropdown; existing business_units with other
// values in the DB still render via SERVICE_LABELS below.
const SERVICE_TYPES = [
  { value: "corporate_catering", label: "Catering" },
  { value: "construction_ve", label: "Construction" },
] as const;

// English label lookup used by the table cell. Covers every
// industry_context the backend may return, so legacy BUs still display
// readable text even when the user can't pick them from the dropdown.
const SERVICE_LABELS: Record<string, string> = {
  corporate_catering: "Catering",
  construction_ve: "Construction",
  food_safety_testing: "Food safety",
  industrial_food_management: "Industrial food",
  services: "General services",
};

const EMPTY_FORM = {
  name: "",
  slug: "",
  industry_context: "corporate_catering",
};

export default function BusinessUnitsPage() {
  const {
    businessUnits,
    refreshBusinessUnits,
    isBusinessUnitsLoading,
  } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      await refreshBusinessUnits();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const startEdit = (unit: BusinessUnit) => {
    setEditingUnit(unit);
    setForm({
      name: unit.name || "",
      slug: unit.slug || "",
      industry_context: unit.industry_context || "services",
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingUnit(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      if (editingUnit) {
        await budyApi.updateBusinessUnit(editingUnit.id, form);
        setEditingUnit(null);
      } else {
        await budyApi.createBusinessUnit(form);
      }
      setForm({ ...EMPTY_FORM });
      await loadUnits();
    } catch (err) {
      setError(err instanceof Error ? err.message : editingUnit ? "Failed to update service" : "Failed to create service");
    }
  };

  if (loading || isBusinessUnitsLoading) {
    return <LoadingSpinner text="Loading services..." fullScreen />;
  }

  const isEditing = editingUnit !== null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Services"
        description="Each service defines a processing flow (catering, construction) for the AI pipeline."
        icon={BriefcaseBusiness}
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{isEditing ? `Edit: ${editingUnit.name}` : "New service"}</CardTitle>
              {isEditing && (
                <Button variant="ghost" size="icon" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Service name</Label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="e.g. BizBites"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug or internal identifier</Label>
                <Input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="bizbites"
                  disabled={isEditing}
                />
                <p className="text-xs text-muted-foreground">{isEditing ? "Slug cannot be changed after creation." : "Used in internal routes and configuration."}</p>
              </div>
              <div className="space-y-2">
                <Label>Type of service</Label>
                <Select
                  value={form.industry_context}
                  onValueChange={(value) => setForm((current) => ({ ...current, industry_context: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Drives the processing flow. Construction activates the scope-extraction agent for partidas (APU).
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {isEditing ? "Save changes" : "Create service"}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configured services</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Service type</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessUnits.map((unit) => (
                  <TableRow key={unit.id} className={editingUnit?.id === unit.id ? "bg-muted/50" : undefined}>
                    <TableCell className="font-medium">
                      {unit.name}
                      {unit.is_default && <span className="ml-2 text-xs text-muted-foreground">Default</span>}
                    </TableCell>
                    <TableCell>{SERVICE_LABELS[unit.industry_context] || unit.industry_context}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(unit)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
