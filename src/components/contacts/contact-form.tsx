"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  defaultValues?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    bsn?: string;
    dateOfBirth?: string;
    notes?: string;
  };
  loading?: boolean;
  title?: string;
}

export function ContactForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading,
  title = "Contactpersoon",
}: ContactFormProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    bsn: "",
    dateOfBirth: "",
    notes: "",
  });

  useEffect(() => {
    if (defaultValues) {
      setForm({
        firstName: defaultValues.firstName || "",
        lastName: defaultValues.lastName || "",
        email: defaultValues.email || "",
        phone: defaultValues.phone || "",
        role: defaultValues.role || "",
        bsn: defaultValues.bsn || "",
        dateOfBirth: defaultValues.dateOfBirth
          ? new Date(defaultValues.dateOfBirth).toISOString().split("T")[0]
          : "",
        notes: defaultValues.notes || "",
      });
    } else {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "",
        bsn: "",
        dateOfBirth: "",
        notes: "",
      });
    }
  }, [defaultValues, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Achternaam *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Input
              id="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="bijv. Eigenaar, Partner, Boekhouder"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bsn">BSN</Label>
              <Input
                id="bsn"
                value={form.bsn}
                onChange={(e) => setForm({ ...form, bsn: e.target.value })}
                placeholder="123456789"
                maxLength={9}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Geboortedatum</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm({ ...form, dateOfBirth: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
