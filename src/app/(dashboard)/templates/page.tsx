export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sjablonen</h1>
          <p className="text-muted-foreground">
            Taak-sjablonen voor automatische takengeneratie
          </p>
        </div>
      </div>

      {/* Templates placeholder */}
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">
          Sjablonenbeheer wordt geladen zodra de database is verbonden...
        </p>
      </div>
    </div>
  );
}
