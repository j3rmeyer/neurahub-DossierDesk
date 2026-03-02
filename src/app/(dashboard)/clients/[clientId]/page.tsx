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
import { ClientForm } from "@/components/clients/client-form";
import { ContactForm } from "@/components/contacts/contact-form";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
} from "@/lib/constants";
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

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading } = useClient(clientId);
  const updateClient = useUpdateClient();
  const createContact = useCreateContact(clientId);
  const updateContact = useUpdateContact(clientId);
  const deleteContact = useDeleteContact(clientId);

  const [editOpen, setEditOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  async function handleUpdateClient(data: Record<string, string>) {
    try {
      await updateClient.mutateAsync({ id: clientId, ...data });
      setEditOpen(false);
      toast.success("Relatie bijgewerkt");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fout bij bijwerken"
      );
    }
  }

  async function handleCreateContact(data: Record<string, string>) {
    try {
      await createContact.mutateAsync(data);
      setContactFormOpen(false);
      toast.success("Contactpersoon toegevoegd");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fout bij toevoegen"
      );
    }
  }

  async function handleUpdateContact(data: Record<string, string>) {
    if (!editingContact) return;
    try {
      await updateContact.mutateAsync({ id: editingContact.id, ...data });
      setEditingContact(null);
      toast.success("Contactpersoon bijgewerkt");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fout bij bijwerken"
      );
    }
  }

  async function handleDeleteContact() {
    if (!deletingContactId) return;
    try {
      await deleteContact.mutateAsync(deletingContactId);
      setDeletingContactId(null);
      toast.success("Contactpersoon verwijderd");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fout bij verwijderen"
      );
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
            <Badge
              variant={client.status === "ACTIEF" ? "default" : "outline"}
            >
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
              <Button size="sm">
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
                <div className="space-y-2">
                  {client.entities
                    .filter(
                      (e: { parentEntityId: string | null }) =>
                        !e.parentEntityId
                    )
                    .map(
                      (entity: {
                        id: string;
                        name: string;
                        type: string;
                        kvkNumber: string | null;
                        tasks: { id: string }[];
                        children: {
                          id: string;
                          name: string;
                          type: string;
                          kvkNumber: string | null;
                          tasks: { id: string }[];
                        }[];
                      }) => (
                        <div key={entity.id}>
                          <EntityRow entity={entity} level={0} />
                          {entity.children?.map(
                            (child: {
                              id: string;
                              name: string;
                              type: string;
                              kvkNumber: string | null;
                              tasks: { id: string }[];
                            }) => (
                              <EntityRow
                                key={child.id}
                                entity={child}
                                level={1}
                              />
                            )
                          )}
                        </div>
                      )
                    )}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingContact(contact)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setDeletingContactId(contact.id)
                              }
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

      {/* Edit client dialog */}
      <ClientForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdateClient}
        defaultValues={client}
        loading={updateClient.isPending}
      />

      {/* Create contact dialog */}
      <ContactForm
        open={contactFormOpen}
        onOpenChange={setContactFormOpen}
        onSubmit={handleCreateContact}
        loading={createContact.isPending}
        title="Contactpersoon toevoegen"
      />

      {/* Edit contact dialog */}
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

      {/* Delete confirmation */}
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
    </div>
  );
}

function EntityRow({
  entity,
  level,
}: {
  entity: {
    id: string;
    name: string;
    type: string;
    kvkNumber: string | null;
    tasks: { id: string }[];
  };
  level: number;
}) {
  return (
    <a
      href={`entities/${entity.id}`}
      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
      style={{ paddingLeft: `${12 + level * 24}px` }}
    >
      <div className="flex items-center gap-3">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{entity.name}</p>
          <p className="text-xs text-muted-foreground">
            {ENTITY_TYPE_LABELS[entity.type] || entity.type}
            {entity.kvkNumber && ` · KvK ${entity.kvkNumber}`}
          </p>
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {entity.tasks?.length || 0} open
      </Badge>
    </a>
  );
}
