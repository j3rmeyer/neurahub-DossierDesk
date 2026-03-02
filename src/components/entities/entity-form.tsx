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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENTITY_TYPE_LABELS, TASK_CATEGORY_LABELS, TASK_CATEGORY_COLORS } from "@/lib/constants";
import { getSuggestedCategories } from "@/lib/task-templates";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = ["BTW", "VPB", "IB", "JAARREKENING", "LONEN"] as const;

interface EntityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
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
  isEdit?: boolean;
}

export function EntityForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  parentEntities = [],
  loading,
  title = "Entiteit",
  isEdit = false,
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
      // Don't auto-select categories when editing
      if (isEdit) {
        setSelectedCategories([]);
      }
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
      setSelectedCategories(getSuggestedCategories("BV"));
    }
  }, [defaultValues, open, isEdit]);

  // Update suggested categories when type changes (only for new entities)
  function handleTypeChange(newType: string) {
    setForm({ ...form, type: newType });
    if (!isEdit) {
      setSelectedCategories(getSuggestedCategories(newType));
    }
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, unknown> = { ...form };
    if (!data.parentEntityId) delete data.parentEntityId;
    if (!isEdit) {
      data.categories = selectedCategories;
      data.year = new Date().getFullYear();
    }
    await onSubmit(data);
  }

  const showParent = parentEntities.length > 0;
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
                onValueChange={handleTypeChange}
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

          {/* Tax categories - only show when creating */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>Belastingaangiftes</Label>
              <p className="text-xs text-muted-foreground">
                Selecteer welke aangiftes aangemaakt moeten worden
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                {ALL_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                      selectedCategories.includes(cat)
                        ? TASK_CATEGORY_COLORS[cat]
                        : "border-border text-muted-foreground hover:border-foreground/20"
                    )}
                  >
                    <Checkbox
                      checked={selectedCategories.includes(cat)}
                      onCheckedChange={() => toggleCategory(cat)}
                    />
                    {TASK_CATEGORY_LABELS[cat]}
                  </label>
                ))}
              </div>
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
