import { z } from "zod";

// Client
export const createClientSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  type: z.enum(["PARTICULIER", "ZAKELIJK"]),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIEF", "INACTIEF", "PROSPECT"]).optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Entity
export const createEntitySchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  type: z.enum([
    "HOLDING",
    "BV",
    "VOF",
    "EENMANSZAAK",
    "STICHTING",
    "PARTICULIER",
    "MAATSCHAP",
    "NV",
  ]),
  kvkNumber: z.string().optional(),
  btwNumber: z.string().optional(),
  fiscalNumber: z.string().optional(),
  fiscalYearEnd: z.string().optional(),
  parentEntityId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateEntitySchema = createEntitySchema.partial();

// Contact
export const createContactSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
  bsn: z.string().optional(),
  notes: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

// Task
export const createTaskSchema = z.object({
  entityId: z.string().optional(),
  contactId: z.string().optional(),
  title: z.string().min(1, "Titel is verplicht"),
  category: z.enum(["BTW", "JAARREKENING", "IB", "VPB", "LONEN", "OVERIG"]),
  status: z
    .enum(["NIET_GESTART", "IN_BEHANDELING", "WACHT_OP_KLANT", "AFGEROND"])
    .optional(),
  deadline: z.string().optional(),
  priority: z.enum(["LAAG", "NORMAAL", "HOOG", "URGENT"]).optional(),
  recurrence: z
    .enum(["MAANDELIJKS", "PER_KWARTAAL", "JAARLIJKS", "EENMALIG"])
    .optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  year: z.number().int(),
  period: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  status: z
    .enum(["NIET_GESTART", "IN_BEHANDELING", "WACHT_OP_KLANT", "AFGEROND"])
    .optional(),
  deadline: z.string().optional(),
  priority: z.enum(["LAAG", "NORMAAL", "HOOG", "URGENT"]).optional(),
  assignedTo: z.string().nullable().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

// Template
export const createTemplateSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  entityType: z.enum([
    "HOLDING",
    "BV",
    "VOF",
    "EENMANSZAAK",
    "STICHTING",
    "PARTICULIER",
    "MAATSCHAP",
    "NV",
  ]),
  items: z.array(
    z.object({
      title: z.string().min(1),
      category: z.enum([
        "BTW",
        "JAARREKENING",
        "IB",
        "VPB",
        "LONEN",
        "OVERIG",
      ]),
      recurrence: z
        .enum(["MAANDELIJKS", "PER_KWARTAAL", "JAARLIJKS", "EENMALIG"])
        .nullable()
        .optional(),
      deadlineOffset: z.number().int().nullable().optional(),
    })
  ),
});

export const applyTemplateSchema = z.object({
  templateId: z.string().min(1),
  entityId: z.string().min(1),
  year: z.number().int(),
});
