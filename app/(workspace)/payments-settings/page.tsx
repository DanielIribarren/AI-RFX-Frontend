"use client";

import { FormEvent, useEffect, useState } from "react";
import { HandCoins } from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { BusinessUnitSwitcher } from "@/components/features/budy/BusinessUnitSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/contexts/OrganizationContext";
import { budyApi, type PaymentMethod } from "@/lib/api-budy";

export default function PaymentSettingsPage() {
  const {
    organization,
    businessUnits,
    activeBusinessUnitId,
    setActiveBusinessUnitId,
    isBusinessUnitsLoading,
  } = useOrganization();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    business_unit_id: "",
    method_type: "pago_movil",
    display_name: "",
    account_holder: "",
    bank_name: "",
    phone: "",
    national_id: "",
    email: "",
    account_number: "",
    instructions: "",
  });

  const loadData = async (businessUnitId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const methods = await budyApi.getPaymentMethods(businessUnitId || undefined);
      setPaymentMethods(methods);
      if (!form.business_unit_id && businessUnitId) {
        setForm((current) => ({ ...current, business_unit_id: businessUnitId }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payment settings");
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
      await budyApi.createPaymentMethod(form);
      setForm((current) => ({
        ...current,
        display_name: "",
        account_holder: "",
        bank_name: "",
        phone: "",
        national_id: "",
        email: "",
        account_number: "",
        instructions: "",
      }));
      await loadData(activeBusinessUnitId || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the payment method");
    }
  };

  if (loading || isBusinessUnitsLoading) {
    return <LoadingSpinner text="Loading payment settings..." fullScreen />;
  }

  if (organization && businessUnits.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">Create a business unit before configuring payment methods.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Payment settings"
        description="Define how each business unit gets paid and what the client sees on the public proposal."
        icon={HandCoins}
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

      <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>New payment method</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <BusinessUnitSwitcher
                businessUnits={businessUnits}
                value={form.business_unit_id}
                onValueChange={(value) => setForm((current) => ({ ...current, business_unit_id: value }))}
                label="Business unit"
                includeAll={false}
              />
              <div className="space-y-2">
                <Label>Method type</Label>
                <Input
                  value={form.method_type}
                  onChange={(event) => setForm((current) => ({ ...current, method_type: event.target.value }))}
                  placeholder="e.g. pago_movil, bank_transfer, zelle"
                />
              </div>
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input
                  value={form.display_name}
                  onChange={(event) => setForm((current) => ({ ...current, display_name: event.target.value }))}
                  placeholder="e.g. Pago Movil Banesco"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Account holder</Label>
                <Input value={form.account_holder} onChange={(event) => setForm((current) => ({ ...current, account_holder: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Bank or platform</Label>
                <Input value={form.bank_name} onChange={(event) => setForm((current) => ({ ...current, bank_name: event.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>National ID or tax ID</Label>
                  <Input value={form.national_id} onChange={(event) => setForm((current) => ({ ...current, national_id: event.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Account number</Label>
                  <Input value={form.account_number} onChange={(event) => setForm((current) => ({ ...current, account_number: event.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Client instructions</Label>
                <Textarea value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} />
              </div>
              <Button type="submit" className="w-full">
                Save payment method
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configured methods</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.display_name}</TableCell>
                    <TableCell>{method.method_type}</TableCell>
                    <TableCell>{method.email || method.phone || method.account_number || "Configured"}</TableCell>
                    <TableCell>{method.is_active ? "Active" : "Inactive"}</TableCell>
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
