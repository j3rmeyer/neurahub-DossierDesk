// Nederlandse labels voor de UI

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  PARTICULIER: "Particulier",
  ZAKELIJK: "Zakelijk",
};

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  ACTIEF: "Actief",
  INACTIEF: "Inactief",
  PROSPECT: "Prospect",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  HOLDING: "Holding",
  BV: "B.V.",
  VOF: "V.O.F.",
  EENMANSZAAK: "Eenmanszaak",
  STICHTING: "Stichting",
  PARTICULIER: "Particulier",
  MAATSCHAP: "Maatschap",
  NV: "N.V.",
  FAMILIE: "Familie",
};

export const TASK_CATEGORY_LABELS: Record<string, string> = {
  BTW: "BTW",
  JAARREKENING: "Jaarrekening",
  IB: "IB",
  VPB: "VPB",
  LONEN: "Lonen",
  OVERIG: "Overig",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  NIET_GESTART: "Niet gestart",
  IN_BEHANDELING: "In behandeling",
  WACHT_OP_KLANT: "Wacht op klant",
  AFGEROND: "Afgerond",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LAAG: "Laag",
  NORMAAL: "Normaal",
  HOOG: "Hoog",
  URGENT: "Urgent",
};

export const RECURRENCE_LABELS: Record<string, string> = {
  MAANDELIJKS: "Maandelijks",
  PER_KWARTAAL: "Per kwartaal",
  JAARLIJKS: "Jaarlijks",
  EENMALIG: "Eenmalig",
};

export const TASK_CATEGORY_COLORS: Record<string, string> = {
  BTW: "bg-blue-100 text-blue-700 border-blue-200",
  JAARREKENING: "bg-purple-100 text-purple-700 border-purple-200",
  IB: "bg-emerald-100 text-emerald-700 border-emerald-200",
  VPB: "bg-amber-100 text-amber-700 border-amber-200",
  LONEN: "bg-pink-100 text-pink-700 border-pink-200",
  OVERIG: "bg-gray-100 text-gray-700 border-gray-200",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  NIET_GESTART: "bg-blue-50 text-blue-700",
  IN_BEHANDELING: "bg-amber-50 text-amber-700",
  WACHT_OP_KLANT: "bg-orange-50 text-orange-700",
  AFGEROND: "bg-emerald-50 text-emerald-700",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LAAG: "text-muted-foreground",
  NORMAAL: "text-foreground",
  HOOG: "text-amber-600",
  URGENT: "text-red-600",
};

export const MONTH_LABELS = [
  "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
];

export const MONTH_FULL_LABELS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

export const QUARTER_TO_END_MONTH: Record<string, number> = {
  Q1: 2,  // Maart (0-indexed)
  Q2: 5,  // Juni
  Q3: 8,  // September
  Q4: 11, // December
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Relaties", href: "/clients", icon: "Users" },
  { label: "Sjablonen", href: "/templates", icon: "FileText" },
] as const;
