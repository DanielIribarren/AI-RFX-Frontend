"use client";

import { FormEvent, useEffect, useState } from "react";
import { BriefcaseBusiness, Pencil, X } from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganization } from "@/contexts/OrganizationContext";
import { budyApi, type BusinessUnit } from "@/lib/api-budy";

const EMPTY_FORM = {
  name: "",
  slug: "",
  industry_context: "services",
  brand_name: "",
  brand_tagline: "",
  support_email: "",
  logo_url: "",
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
      setError(err instanceof Error ? err.message : "Failed to load business units");
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
      brand_name: unit.brand_name || "",
      brand_tagline: unit.brand_tagline || "",
      support_email: unit.support_email || "",
      logo_url: unit.logo_url || "",
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
      setError(err instanceof Error ? err.message : editingUnit ? "Failed to update business unit" : "Failed to create business unit");
    }
  };

  if (loading || isBusinessUnitsLoading) {
    return <LoadingSpinner text="Loading business units..." fullScreen />;
  }

  const isEditing = editingUnit !== null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Business units"
        description="These internal lines control AI context, payment methods, branding, and reporting."
        icon={BriefcaseBusiness}
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{isEditing ? `Edit: ${editingUnit.name}` : "New business unit"}</CardTitle>
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
                <Label>Business unit name</Label>
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
                <Label>Industry context</Label>
                <Input
                  value={form.industry_context}
                  onChange={(event) => setForm((current) => ({ ...current, industry_context: event.target.value }))}
                  placeholder="e.g. corporate_catering, food_safety_testing"
                />
                <p className="text-xs text-muted-foreground">Helps Budy understand what this unit sells.</p>
              </div>
              <div className="space-y-2">
                <Label>Display brand name</Label>
                <Input
                  value={form.brand_name}
                  onChange={(event) => setForm((current) => ({ ...current, brand_name: event.target.value }))}
                  placeholder="e.g. BizBites by Sabra"
                />
              </div>
              <div className="space-y-2">
                <Label>Brand tagline</Label>
                <Input
                  value={form.brand_tagline}
                  onChange={(event) => setForm((current) => ({ ...current, brand_tagline: event.target.value }))}
                  placeholder="e.g. Catering made simple"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={form.logo_url}
                  onChange={(event) => setForm((current) => ({ ...current, logo_url: event.target.value }))}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">Shown on public proposals. Upload image to storage and paste the URL.</p>
              </div>
              <div className="space-y-2">
                <Label>Support email</Label>
                <Input
                  type="email"
                  value={form.support_email}
                  onChange={(event) => setForm((current) => ({ ...current, support_email: event.target.value }))}
                  placeholder="sales@yourdomain.com"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {isEditing ? "Save changes" : "Create business unit"}
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
            <CardTitle>Configured business units</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business unit</TableHead>
                  <TableHead>Brand name</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessUnits.map((unit) => (
                  <TableRow key={unit.id} className={editingUnit?.id === unit.id ? "bg-muted/50" : undefined}>
                    <TableCell className="font-medium">
                      {unit.logo_url && (
                        <img src={unit.logo_url} alt="" className="h-5 w-5 rounded object-contain inline-block mr-2" />
                      )}
                      {unit.name}
                      {unit.is_default && <span className="ml-2 text-xs text-muted-foreground">Default</span>}
                    </TableCell>
                    <TableCell>{unit.brand_name || unit.name}</TableCell>
                    <TableCell>{unit.industry_context}</TableCell>
                    <TableCell>{unit.support_email || <span className="text-muted-foreground text-xs">No email</span>}</TableCell>
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
