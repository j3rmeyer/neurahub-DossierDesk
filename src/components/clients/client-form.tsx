"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENT_TYPE_LABELS, CLIENT_STATUS_LABELS } from "@/lib/constants";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, string>) => void;
  defaultValues?: Record<string, string>;
  loading?: boolean;
}

export function ClientForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading,
}: ClientFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    defaultValues || { type: "ZAKELIJK", status: "ACTIEF" }
  );

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Relatie bewerken" : "Nieuwe relatie"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Naam van de relatie"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={formData.type || "ZAKELIJK"}
                onValueChange={(v) => handleChange("type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLIENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status || "ACTIEF"}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLIENT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@voorbeeld.nl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoon</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="06-12345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Straat en huisnummer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Postcode</Label>
              <Input
                id="zipCode"
                value={formData.zipCode || ""}
                onChange={(e) => handleChange("zipCode", e.target.value)}
                placeholder="1234 AB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Amsterdam"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Vrij tekstveld..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Bezig..."
                : defaultValues
                  ? "Opslaan"
                  : "Aanmaken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
