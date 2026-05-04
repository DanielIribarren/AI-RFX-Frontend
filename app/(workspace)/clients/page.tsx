"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { budyApi, type ClientRecord } from "@/lib/api-budy";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    company_phone: "",
    industry: "",
  });

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await budyApi.getClients();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await budyApi.createClient(form);
      setForm({
        company_name: "",
        contact_name: "",
        contact_email: "",
        company_phone: "",
        industry: "",
      });
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the client");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading clients..." fullScreen />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Clients"
        description="Lightweight CRM layer built on top of the existing companies and requesters."
        icon={Building2}
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>New client</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={form.company_name}
                  onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Primary contact</Label>
                <Input
                  value={form.contact_name}
                  onChange={(event) => setForm((current) => ({ ...current, contact_name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact email</Label>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(event) => setForm((current) => ({ ...current, contact_email: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.company_phone}
                  onChange={(event) => setForm((current) => ({ ...current, company_phone: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  value={form.industry}
                  onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full">
                Save client
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Opportunities</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id || client.name}>
                    <TableCell>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-xs text-muted-foreground">{client.email || client.phone || "No direct contact"}</div>
                    </TableCell>
                    <TableCell>
                      {client.contacts.length === 0
                        ? "No contacts"
                        : client.contacts.map((contact) => contact.name || contact.email).join(", ")}
                    </TableCell>
                    <TableCell>{client.industry || "Unspecified"}</TableCell>
                    <TableCell>{client.opportunities_count}</TableCell>
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
