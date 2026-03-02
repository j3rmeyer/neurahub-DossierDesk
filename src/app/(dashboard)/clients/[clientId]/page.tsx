"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserPlus,
  Plus,
  MoreHorizontal,
  Trash2,
  Hash,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClient, useUpdateClient } from "@/hooks/use-clients";
import {
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "@/hooks/use-contacts";
import {
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
} from "@/hooks/use-entities";
import { ClientForm } from "@/components/clients/client-form";
import { ContactForm } from "@/components/contacts/contact-form";
import { EntityForm } from "@/components/entities/entity-form";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContactData {
  id: string;
  firstName: string;
  lastName: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  bsn: string | null;
  dateOfBirth: string | null;
  notes: string | null;
}

interface EntityData {
  id: string;
  name: string;
  type: string;
  kvkNumber: string | null;
  btwNumber: string | null;
  fiscalNumber: string | null;
  fiscalYearEnd: string | null;
  parentEntityId: string | null;
  notes: string | null;
  tasks: { id: string; category: string; status: string }[];
  children: EntityData[];
}

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading } = useClient(clientId);
  const updateClient = useUpdateClient();
  const createContact = useCreateContact(clientId);
  const updateContact = useUpdateContact(clientId);
  const deleteContact = useDeleteContact(clientId);
  const createEntity = useCreateEntity(clientId);
  const updateEntity = useUpdateEntity(clientId);
  const deleteEntity = useDeleteEntity(clientId);

  const [editOpen, setEditOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [entityFormOpen, setEntityFormOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityData | null>(null);
  const [deletingEntityId, setDeletingEntityId] = useState<string | null>(null);

  // --- Client handlers ---
  async function handleUpdateClient(data: Record<string, string>) {
    try {
      await updateClient.mutateAsync({ id: clientId, ...data });
      setEditOpen(false);
      toast.success("Relatie bijgewerkt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fout bij bijwerken");
    }
  }

  // --- Contact handlers ---
  async function handleCreateContact(data: Record<string, string>) {
    try {
      await createContact.mutateAsync(data);
      setContactFormOpen(false);
      toast.success("Contactpersoon toegevoegd");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fout bij toevoegen");
    }
  }

  async function handleUpdateContact(data: Record<string, string>) {
    if (!editingContact) return;
    try {
      await updateContact.mutateAsync({ id: editingContact.id, ...data });
      setEditingContact(null);
      toast.success("Contactpersoon bijgewerkt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fout bij bijwerken");
    }
  }

  async function handleDeleteContact() {
    if (!deletingContactId) return;
    try {
      await deleteContact.mutateAsync(deletingContactId);
      setDeletingContactId(null);
      toast.success("Contactpersoon verwijderd");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fout bij verwijderen");
    }
  }

  // --- Entity handlers ---
  async function handleCreateEntity(data: Record<string, string>) {
    try {
      await createEntity.mutateAsync(data);
      setEntityFormOpen(false);
      toast.success("Entiteit toegevoegd");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fout bij toevoegen");
    }
  }

  async function handleUpdateEntity(data: Record<string, string>) {
    if (!editingEntity) return;
    try {
      await updateEntity.mutateAsync({ id: editingEntity.id, ...data });
      setEditingEntity(null);
      toast.success("Entiteit bijgewerkt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fout bij bijwerken");
    }
  }

  async function handleDeleteEntity() {
    if (!deletingEntityId) return;
    try {
      await deleteEntity.mutateAsync(deletingEntityId);
      setDeletingEntityId(null);
      toast.success("Entiteit verwijderd");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fout bij verwijderen");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!client) {
    return <p className="text-muted-foreground">Relatie niet gevonden</p>;
  }

  // Collect root entities for parent selection in form
  const rootEntities = (client.entities || [])
    .filter((e: EntityData) => !e.parentEntityId)
    .map((e: EntityData) => ({ id: e.id, name: e.name }));

  // Flatten entities for tax overview
  const allEntities: EntityData[] = (client.entities || [])
    .filter((e: EntityData) => !e.parentEntityId)
    .flatMap((e: EntityData) => [e, ...(e.children || [])]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">
              {CLIENT_TYPE_LABELS[client.type] || client.type}
            </Badge>
            <Badge variant={client.status === "ACTIEF" ? "default" : "outline"}>
              {CLIENT_STATUS_LABELS[client.status] || client.status}
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Bewerken
        </Button>
      </div>

      {/* Client info */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {client.phone}
            </div>
          )}
          {(client.address || client.city) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {[client.address, client.zipCode, client.city]
                .filter(Boolean)
                .join(", ")}
            </div>
          )}
          {client.notes && (
            <p className="col-span-full text-sm text-muted-foreground">
              {client.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Entiteiten */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Entiteiten</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingEntity(null);
                  setEntityFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Entiteit toevoegen
              </Button>
            </CardHeader>
            <CardContent>
              {!client.entities?.length ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8" />
                  <p>Nog geen entiteiten</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {client.entities
                    .filter((e: EntityData) => !e.parentEntityId)
                    .map((entity: EntityData) => (
                      <div key={entity.id}>
                        <EntityRow
                          entity={entity}
                          level={0}
                          onEdit={() => setEditingEntity(entity)}
                          onDelete={() => setDeletingEntityId(entity.id)}
                        />
                        {entity.children?.map((child: EntityData) => (
                          <EntityRow
                            key={child.id}
                            entity={child}
                            level={1}
                            onEdit={() => setEditingEntity(child)}
                            onDelete={() => setDeletingEntityId(child.id)}
                          />
                        ))}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contactpersonen */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Contactpersonen</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingContact(null);
                  setContactFormOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Toevoegen
              </Button>
            </CardHeader>
            <CardContent>
              {!client.contacts?.length ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nog geen contactpersonen
                </p>
              ) : (
                <div className="space-y-3">
                  {client.contacts.map((contact: ContactData) => (
                    <div key={contact.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {contact.firstName} {contact.lastName}
                          </p>
                          {contact.role && (
                            <p className="text-xs text-muted-foreground">
                              {contact.role}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingContactId(contact.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {contact.email && <span>{contact.email}</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                        {contact.bsn && (
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            BSN {contact.bsn}
                          </span>
                        )}
                      </div>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Belastingaangiftes overzicht */}
      {allEntities.some((e) => e.tasks?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Belastingaangiftes overzicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allEntities.map((entity) => {
                const categoryCounts: Record<string, { total: number; done: number }> = {};
                (entity.tasks || []).forEach((t) => {
                  if (!categoryCounts[t.category]) {
                    categoryCounts[t.category] = { total: 0, done: 0 };
                  }
                  categoryCounts[t.category].total++;
                  if (t.status === "AFGEROND") categoryCounts[t.category].done++;
                });

                if (Object.keys(categoryCounts).length === 0) return null;

                return (
                  <div key={entity.id} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{entity.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {ENTITY_TYPE_LABELS[entity.type] || entity.type}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(categoryCounts).map(([cat, counts]) => (
                        <div
                          key={cat}
                          className={cn(
                            "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium",
                            TASK_CATEGORY_COLORS[cat]
                          )}
                        >
                          <FileText className="h-3 w-3" />
                          {TASK_CATEGORY_LABELS[cat] || cat}
                          <span className="ml-1 opacity-70">
                            {counts.done}/{counts.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Dialogen === */}

      {/* Edit client */}
      <ClientForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdateClient}
        defaultValues={client}
        loading={updateClient.isPending}
      />

      {/* Create contact */}
      <ContactForm
        open={contactFormOpen}
        onOpenChange={setContactFormOpen}
        onSubmit={handleCreateContact}
        loading={createContact.isPending}
        title="Contactpersoon toevoegen"
      />

      {/* Edit contact */}
      <ContactForm
        open={!!editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
        onSubmit={handleUpdateContact}
        defaultValues={
          editingContact
            ? {
                firstName: editingContact.firstName,
                lastName: editingContact.lastName,
                email: editingContact.email || "",
                phone: editingContact.phone || "",
                role: editingContact.role || "",
                bsn: editingContact.bsn || "",
                dateOfBirth: editingContact.dateOfBirth || "",
                notes: editingContact.notes || "",
              }
            : undefined
        }
        loading={updateContact.isPending}
        title="Contactpersoon bewerken"
      />

      {/* Delete contact */}
      <AlertDialog
        open={!!deletingContactId}
        onOpenChange={(open) => !open && setDeletingContactId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contactpersoon verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze contactpersoon wilt verwijderen? Dit kan
              niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create entity */}
      <EntityForm
        open={entityFormOpen}
        onOpenChange={setEntityFormOpen}
        onSubmit={handleCreateEntity}
        parentEntities={rootEntities}
        loading={createEntity.isPending}
        title="Entiteit toevoegen"
      />

      {/* Edit entity */}
      <EntityForm
        open={!!editingEntity}
        onOpenChange={(open) => !open && setEditingEntity(null)}
        onSubmit={handleUpdateEntity}
        defaultValues={
          editingEntity
            ? {
                name: editingEntity.name,
                type: editingEntity.type,
                kvkNumber: editingEntity.kvkNumber || "",
                btwNumber: editingEntity.btwNumber || "",
                fiscalNumber: editingEntity.fiscalNumber || "",
                fiscalYearEnd: editingEntity.fiscalYearEnd || "",
                parentEntityId: editingEntity.parentEntityId || "",
                notes: editingEntity.notes || "",
              }
            : undefined
        }
        parentEntities={rootEntities.filter(
          (e: { id: string }) => e.id !== editingEntity?.id
        )}
        loading={updateEntity.isPending}
        title="Entiteit bewerken"
      />

      {/* Delete entity */}
      <AlertDialog
        open={!!deletingEntityId}
        onOpenChange={(open) => !open && setDeletingEntityId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entiteit verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze entiteit wilt verwijderen? Alle
              gekoppelde taken worden ook verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntity}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EntityRow({
  entity,
  level,
  onEdit,
  onDelete,
}: {
  entity: EntityData;
  level: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Count open tasks per category for inline badges
  const categoryCounts: Record<string, number> = {};
  (entity.tasks || []).forEach((t) => {
    if (t.status !== "AFGEROND") {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    }
  });

  return (
    <div
      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
      style={{ paddingLeft: `${12 + level * 24}px` }}
    >
      <a
        href={`entities/${entity.id}`}
        className="flex flex-1 items-center gap-3"
      >
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{entity.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {ENTITY_TYPE_LABELS[entity.type] || entity.type}
              {entity.kvkNumber && ` · KvK ${entity.kvkNumber}`}
            </span>
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <Badge
                key={cat}
                variant="outline"
                className={cn("h-5 px-1.5 text-[10px]", TASK_CATEGORY_COLORS[cat])}
              >
                {TASK_CATEGORY_LABELS[cat]} {count}
              </Badge>
            ))}
          </div>
        </div>
      </a>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Bewerken
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
