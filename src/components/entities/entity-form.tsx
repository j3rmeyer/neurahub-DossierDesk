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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENTITY_TYPE_LABELS } from "@/lib/constants";

interface EntityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  defaultValues?: {
    name?: string;
    type?: string;
    kvkNumber?: string;
    btwNumber?: string;
    fiscalNumber?: string;
    fiscalYearEnd?: string;
    parentEntityId?: string;
    notes?: string;
  };
  parentEntities?: { id: string; name: string }[];
  loading?: boolean;
  title?: string;
}

export function EntityForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  parentEntities = [],
  loading,
  title = "Entiteit",
}: EntityFormProps) {
  const [form, setForm] = useState({
    name: "",
    type: "BV",
    kvkNumber: "",
    btwNumber: "",
    fiscalNumber: "",
    fiscalYearEnd: "31-12",
    parentEntityId: "",
    notes: "",
  });

  useEffect(() => {
    if (defaultValues) {
      setForm({
        name: defaultValues.name || "",
        type: defaultValues.type || "BV",
        kvkNumber: defaultValues.kvkNumber || "",
        btwNumber: defaultValues.btwNumber || "",
        fiscalNumber: defaultValues.fiscalNumber || "",
        fiscalYearEnd: defaultValues.fiscalYearEnd || "31-12",
        parentEntityId: defaultValues.parentEntityId || "",
        notes: defaultValues.notes || "",
      });
    } else {
      setForm({
        name: "",
        type: "BV",
        kvkNumber: "",
        btwNumber: "",
        fiscalNumber: "",
        fiscalYearEnd: "31-12",
        parentEntityId: "",
        notes: "",
      });
    }
  }, [defaultValues, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, string> = { ...form };
    if (!data.parentEntityId) delete data.parentEntityId;
    await onSubmit(data);
  }

  // Hide parent fields for types that don't typically have parents
  const showParent = parentEntities.length > 0;

  // Show KvK/BTW for business types, not for FAMILIE/PARTICULIER
  const isBusinessType = !["FAMILIE", "PARTICULIER"].includes(form.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entityName">Naam *</Label>
            <Input
              id="entityName"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="bijv. MeyerIT B.V."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYearEnd">Boekjaar einde</Label>
              <Input
                id="fiscalYearEnd"
                value={form.fiscalYearEnd}
                onChange={(e) =>
                  setForm({ ...form, fiscalYearEnd: e.target.value })
                }
                placeholder="31-12"
              />
            </div>
          </div>

          {isBusinessType && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kvkNumber">KvK-nummer</Label>
                <Input
                  id="kvkNumber"
                  value={form.kvkNumber}
                  onChange={(e) =>
                    setForm({ ...form, kvkNumber: e.target.value })
                  }
                  placeholder="12345678"
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="btwNumber">BTW-nummer</Label>
                <Input
                  id="btwNumber"
                  value={form.btwNumber}
                  onChange={(e) =>
                    setForm({ ...form, btwNumber: e.target.value })
                  }
                  placeholder="NL123456789B01"
                />
              </div>
            </div>
          )}

          {isBusinessType && (
            <div className="space-y-2">
              <Label htmlFor="fiscalNumber">Fiscaal nummer (RSIN)</Label>
              <Input
                id="fiscalNumber"
                value={form.fiscalNumber}
                onChange={(e) =>
                  setForm({ ...form, fiscalNumber: e.target.value })
                }
                placeholder="123456789"
              />
            </div>
          )}

          {showParent && (
            <div className="space-y-2">
              <Label>Moederentiteit</Label>
              <Select
                value={form.parentEntityId || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, parentEntityId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Geen (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen (top-level)</SelectItem>
                  {parentEntities.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="entityNotes">Notities</Label>
            <Textarea
              id="entityNotes"
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
