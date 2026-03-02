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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useClient, useUpdateClient } from "@/hooks/use-clients";
import { ClientForm } from "@/components/clients/client-form";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
} from "@/lib/constants";
import { toast } from "sonner";

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading } = useClient(clientId);
  const updateClient = useUpdateClient();
  const [editOpen, setEditOpen] = useState(false);

  async function handleUpdate(data: Record<string, string>) {
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
                  {/* Build tree: show root entities, then children indented */}
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
              <Button size="sm" variant="outline">
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
                  {client.contacts.map(
                    (contact: {
                      id: string;
                      firstName: string;
                      lastName: string;
                      role: string | null;
                      email: string | null;
                      phone: string | null;
                    }) => (
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
                        </div>
                        {(contact.email || contact.phone) && (
                          <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                            {contact.email && <span>{contact.email}</span>}
                            {contact.phone && <span>{contact.phone}</span>}
                          </div>
                        )}
                        <Separator className="mt-3" />
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      <ClientForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdate}
        defaultValues={client}
        loading={updateClient.isPending}
      />
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
