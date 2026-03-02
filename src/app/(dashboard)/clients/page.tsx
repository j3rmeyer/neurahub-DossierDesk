import { ClientList } from "@/components/clients/client-list";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relaties</h1>
        <p className="text-muted-foreground">
          Beheer alle relaties van het kantoor
        </p>
      </div>
      <ClientList />
    </div>
  );
}
