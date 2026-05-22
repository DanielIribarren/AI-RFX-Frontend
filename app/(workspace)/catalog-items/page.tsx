"use client";

import { FormEvent, useEffect, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { BusinessUnitSwitcher } from "@/components/features/budy/BusinessUnitSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganization } from "@/contexts/OrganizationContext";
import { budyApi, type CatalogItem } from "@/lib/api-budy";

export default function CatalogItemsPage() {
  const {
    organization,
    businessUnits,
    activeBusinessUnitId,
    setActiveBusinessUnitId,
    isBusinessUnitsLoading,
  } = useOrganization();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    business_unit_id: "",
    name: "",
    category: "",
    unit: "service",
    base_price_usd: "",
  });

  const loadData = async (businessUnitId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const catalogItems = await budyApi.getCatalogItems(businessUnitId || undefined);
      setItems(catalogItems);
      if (!form.business_unit_id && businessUnitId) {
        setForm((current) => ({ ...current, business_unit_id: businessUnitId }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load catalog items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isBusinessUnitsLoading) {
      loadData(activeBusinessUnitId || undefined);
    }
  }, [activeBusinessUnitId, isBusinessUnitsLoading]);

  useEffect(() => {
    if (activeBusinessUnitId) {
      setForm((current) => ({ ...current, business_unit_id: activeBusinessUnitId }));
    }
  }, [activeBusinessUnitId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await budyApi.createCatalogItem({
        business_unit_id: form.business_unit_id,
        name: form.name,
        category: form.category,
        unit: form.unit,
        base_price_usd: Number(form.base_price_usd || 0),
      });
      setForm((current) => ({ ...current, name: "", category: "", unit: "service", base_price_usd: "" }));
      await loadData(activeBusinessUnitId || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the catalog item");
    }
  };

  if (loading || isBusinessUnitsLoading) {
    return <LoadingSpinner text="Loading catalog items..." fullScreen />;
  }

  if (organization && businessUnits.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">Create a service before creating catalog items.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Catalog items"
        description="Future commercial offers by service. This is not the AI pricing catalog in Phase 1."
        icon={BriefcaseBusiness}
      />

      <BusinessUnitSwitcher
        businessUnits={businessUnits}
        value={activeBusinessUnitId || ""}
        onValueChange={(value) => {
          setActiveBusinessUnitId(value);
          loadData(value);
        }}
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>New sellable item</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <BusinessUnitSwitcher
                businessUnits={businessUnits}
                value={form.business_unit_id}
                onValueChange={(value) => setForm((current) => ({ ...current, business_unit_id: value }))}
                label="Service"
                includeAll={false}
              />
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="e.g. Corporate coffee break"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="e.g. Catering, maintenance, supplies"
                />
              </div>
              <div className="space-y-2">
                <Label>Sales unit</Label>
                <Input
                  value={form.unit}
                  onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                  placeholder="e.g. service, shift, package"
                />
              </div>
              <div className="space-y-2">
                <Label>Base price in USD</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.base_price_usd}
                  onChange={(event) => setForm((current) => ({ ...current, base_price_usd: event.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full">
                Save catalog item
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loaded items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Base price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category || "Uncategorized"}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.base_price_usd || 0)}
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
