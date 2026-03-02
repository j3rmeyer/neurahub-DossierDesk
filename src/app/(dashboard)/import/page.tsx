"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  Trello,
  Check,
  AlertCircle,
  Download,
  X,
  Users,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ImportStep = "upload" | "preview" | "importing" | "done";

interface ParsedRow {
  [key: string]: string;
}

interface ImportResult {
  imported: number;
  skipped?: number;
  errors?: string[];
}

// Column mapping for clients
const CLIENT_COLUMN_MAP: Record<string, string> = {
  naam: "name",
  name: "name",
  bedrijfsnaam: "name",
  "company name": "name",
  type: "type",
  email: "email",
  "e-mail": "email",
  telefoon: "phone",
  phone: "phone",
  tel: "phone",
  adres: "address",
  address: "address",
  straat: "address",
  postcode: "zipCode",
  "zip code": "zipCode",
  "postal code": "zipCode",
  plaats: "city",
  stad: "city",
  city: "city",
  woonplaats: "city",
  notities: "notes",
  notes: "notes",
  opmerkingen: "notes",
  status: "status",
};

// Column mapping for contacts
const CONTACT_COLUMN_MAP: Record<string, string> = {
  voornaam: "firstName",
  "first name": "firstName",
  firstname: "firstName",
  achternaam: "lastName",
  "last name": "lastName",
  lastname: "lastName",
  relatie: "clientName",
  client: "clientName",
  bedrijf: "clientName",
  "company": "clientName",
  email: "email",
  "e-mail": "email",
  telefoon: "phone",
  phone: "phone",
  tel: "phone",
  rol: "role",
  role: "role",
  functie: "role",
  bsn: "bsn",
  geboortedatum: "dateOfBirth",
  "date of birth": "dateOfBirth",
  notities: "notes",
  notes: "notes",
};

function mapColumns(
  rows: ParsedRow[],
  columnMap: Record<string, string>
): ParsedRow[] {
  return rows.map((row) => {
    const mapped: ParsedRow = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.toLowerCase().trim();
      const mappedKey = columnMap[normalizedKey] || key;
      mapped[mappedKey] = String(value || "").trim();
    }
    return mapped;
  });
}

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importeren</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Importeer relaties, contactpersonen en taken vanuit Excel of Trello
        </p>
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Relaties (Excel)
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Contacten (Excel)
          </TabsTrigger>
          <TabsTrigger value="trello" className="gap-2">
            <Trello className="h-4 w-4" />
            Taken (Trello)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <ExcelImportSection
            type="clients"
            title="Relaties importeren"
            description="Upload een Excel-bestand (.xlsx, .xls, .csv) met relaties/bedrijven."
            columnMap={CLIENT_COLUMN_MAP}
            requiredField="name"
            requiredLabel="Naam"
            exampleColumns={["Naam", "Type", "Email", "Telefoon", "Adres", "Postcode", "Plaats"]}
            apiUrl="/api/import/clients"
            dataKey="clients"
          />
        </TabsContent>

        <TabsContent value="contacts">
          <ExcelImportSection
            type="contacts"
            title="Contactpersonen importeren"
            description="Upload een Excel-bestand met contactpersonen. De kolom 'Relatie' of 'Bedrijf' wordt gebruikt om de contactpersoon aan een bestaande relatie te koppelen."
            columnMap={CONTACT_COLUMN_MAP}
            requiredField="firstName"
            requiredLabel="Voornaam"
            exampleColumns={["Voornaam", "Achternaam", "Relatie", "Email", "Telefoon", "Rol", "BSN"]}
            apiUrl="/api/import/contacts"
            dataKey="contacts"
          />
        </TabsContent>

        <TabsContent value="trello">
          <TrelloImportSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExcelImportSection({
  type,
  title,
  description,
  columnMap,
  requiredField,
  requiredLabel,
  exampleColumns,
  apiUrl,
  dataKey,
}: {
  type: string;
  title: string;
  description: string;
  columnMap: Record<string, string>;
  requiredField: string;
  requiredLabel: string;
  exampleColumns: string[];
  apiUrl: string;
  dataKey: string;
}) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [mappedRows, setMappedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: ParsedRow[] = XLSX.utils.sheet_to_json(firstSheet, {
          defval: "",
        });

        if (rows.length === 0) {
          toast.error("Het bestand bevat geen gegevens");
          return;
        }

        setRawRows(rows);
        const mapped = mapColumns(rows, columnMap);
        setMappedRows(mapped);
        setStep("preview");
      } catch {
        toast.error("Fout bij het lezen van het bestand");
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    // Filter out rows without required field
    const validRows = mappedRows.filter((r) => r[requiredField]);

    if (validRows.length === 0) {
      toast.error(`Geen rijen met ${requiredLabel} gevonden`);
      return;
    }

    setImporting(true);
    setStep("importing");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [dataKey]: validRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import mislukt");
      }

      setResult(data);
      setStep("done");
      toast.success(`${data.imported} ${type === "clients" ? "relaties" : "contactpersonen"} ge\u00EFmporteerd`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Import mislukt"
      );
      setStep("preview");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStep("upload");
    setRawRows([]);
    setMappedRows([]);
    setFileName("");
    setResult(null);
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([exampleColumns]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Import");
    XLSX.writeFile(wb, `${type}-template.xlsx`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {step === "upload" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-12">
              <div className="text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Sleep een Excel-bestand hierheen of klik om te uploaden
                </p>
                <label className="mt-4 inline-block">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Bestand kiezen
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download sjabloon
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
                <Badge variant="secondary">{mappedRows.length} rijen</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="mr-2 h-4 w-4" />
                Opnieuw
              </Button>
            </div>

            {/* Preview table */}
            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(mappedRows[0] || {})
                      .slice(0, 6)
                      .map((key) => (
                        <TableHead key={key} className="text-xs">
                          {key}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedRows.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row)
                        .slice(0, 6)
                        .map((val, j) => (
                          <TableCell key={j} className="text-xs">
                            {val || "-"}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {mappedRows.length > 10 && (
              <p className="text-xs text-muted-foreground">
                Toont 10 van {mappedRows.length} rijen
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Annuleren
              </Button>
              <Button onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" />
                Importeer {mappedRows.filter((r) => r[requiredField]).length}{" "}
                {type === "clients" ? "relaties" : "contactpersonen"}
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8 text-center">
            <p className="text-sm font-medium">Importeren...</p>
            <Progress value={50} className="mx-auto max-w-xs" />
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold">Import voltooid</p>
              <p className="text-sm text-muted-foreground">
                {result.imported} ge\u00EFmporteerd
                {result.skipped ? `, ${result.skipped} overgeslagen` : ""}
              </p>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  Waarschuwingen
                </div>
                <ul className="mt-2 space-y-1 text-xs text-amber-600">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-center">
              <Button variant="outline" onClick={reset}>
                Nieuwe import
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrelloImportSection() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [trelloData, setTrelloData] = useState<Record<string, unknown> | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const data = JSON.parse(text);

        if (!data.cards || !data.lists) {
          toast.error(
            "Ongeldig Trello-bestand. Exporteer je bord via Menu > Meer > JSON exporteren"
          );
          return;
        }

        const activeCards = data.cards.filter(
          (c: { closed: boolean }) => !c.closed
        );
        setTrelloData(data);
        setCardCount(activeCards.length);
        setStep("preview");
      } catch {
        toast.error("Fout bij het lezen van het JSON-bestand");
      }
    };

    reader.readAsText(file);
  }

  async function handleImport() {
    if (!trelloData) return;

    setImporting(true);
    setStep("importing");

    try {
      const res = await fetch("/api/import/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trelloData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import mislukt");

      setResult(data);
      setStep("done");
      toast.success(`${data.imported} taken ge\u00EFmporteerd vanuit Trello`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Import mislukt"
      );
      setStep("preview");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStep("upload");
    setTrelloData(null);
    setCardCount(0);
    setFileName("");
    setResult(null);
  }

  const lists = trelloData
    ? (trelloData.lists as Array<{ id: string; name: string; closed: boolean }>)
        .filter((l) => !l.closed)
    : [];
  const cards = trelloData
    ? (trelloData.cards as Array<{
        name: string;
        idList: string;
        closed: boolean;
        due: string | null;
        labels: Array<{ name: string }>;
      }>).filter((c) => !c.closed)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trello-taken importeren</CardTitle>
        <p className="text-sm text-muted-foreground">
          Exporteer je Trello-bord als JSON (Menu &rarr; Meer &rarr; Print en
          exporteer &rarr; JSON) en upload het hier.
        </p>
      </CardHeader>
      <CardContent>
        {step === "upload" && (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-12">
            <div className="text-center">
              <Trello className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Upload een Trello JSON-export
              </p>
              <label className="mt-4 inline-block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    JSON bestand kiezen
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trello className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
                <Badge variant="secondary">{cardCount} kaarten</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="mr-2 h-4 w-4" />
                Opnieuw
              </Button>
            </div>

            {/* Lists overview */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Lijsten in het bord:</p>
              <div className="flex flex-wrap gap-2">
                {lists.map((list) => {
                  const count = cards.filter(
                    (c) => c.idList === list.id
                  ).length;
                  return (
                    <Badge key={list.id} variant="outline">
                      {list.name} ({count})
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Preview cards */}
            <div className="max-h-60 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Kaart</TableHead>
                    <TableHead className="text-xs">Lijst</TableHead>
                    <TableHead className="text-xs">Labels</TableHead>
                    <TableHead className="text-xs">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.slice(0, 15).map((card, i) => {
                    const list = lists.find((l) => l.id === card.idList);
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">
                          {card.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          {list?.name || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {card.labels?.map((l) => l.name).join(", ") || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {card.due
                            ? new Date(card.due).toLocaleDateString("nl-NL")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {cards.length > 15 && (
              <p className="text-xs text-muted-foreground">
                Toont 15 van {cards.length} kaarten
              </p>
            )}

            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <p className="font-medium">Mapping:</p>
              <ul className="mt-1 space-y-0.5">
                <li>
                  Trello-lijsten worden gemapt naar status (To Do → Niet
                  gestart, Doing → In behandeling, Done → Afgerond)
                </li>
                <li>
                  Labels met BTW, IB, VPB, Lonen, Jaarrekening worden als
                  categorie herkend
                </li>
                <li>Toegewezen leden worden overgenomen</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Annuleren
              </Button>
              <Button onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" />
                Importeer {cardCount} taken
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8 text-center">
            <p className="text-sm font-medium">Importeren...</p>
            <Progress value={50} className="mx-auto max-w-xs" />
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold">Import voltooid</p>
              <p className="text-sm text-muted-foreground">
                {result.imported} taken ge\u00EFmporteerd vanuit Trello
              </p>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  Waarschuwingen
                </div>
                <ul className="mt-2 space-y-1 text-xs text-amber-600">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-center">
              <Button variant="outline" onClick={reset}>
                Nieuwe import
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
