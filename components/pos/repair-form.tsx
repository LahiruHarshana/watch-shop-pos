"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseLkrInput } from "@/lib/money/format";
import { toast } from "sonner";

export function RepairForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    watchBrand: "",
    watchModel: "",
    issueDescription: "",
    estimatedCost: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/repairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        estimatedCostCents: parseLkrInput(form.estimatedCost),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Failed to create ticket");
      return;
    }
    toast.success(`Ticket ${json.data.ticketId} created`);
    router.push(`/repairs/${json.data._id}/token`);
  }

  return (
    <Card className="pos-surface max-w-xl border-0">
      <CardHeader>
        <CardTitle>New repair ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {[
            ["customerName", "Customer name"],
            ["customerPhone", "Phone"],
            ["watchBrand", "Watch brand"],
            ["watchModel", "Model"],
          ].map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                required
                className="min-h-11"
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label>Issue description</Label>
            <Textarea
              required
              rows={4}
              value={form.issueDescription}
              onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Estimated cost (LKR)</Label>
            <Input
              required
              className="min-h-11"
              value={form.estimatedCost}
              onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
            />
          </div>
          <Button type="submit" className="min-h-11 w-full" disabled={loading}>
            {loading ? "Saving…" : "Create ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
