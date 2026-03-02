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
  BTW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  JAARREKENING: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  IB: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  VPB: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LONEN: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  OVERIG: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  NIET_GESTART: "bg-status-open/20 text-blue-400",
  IN_BEHANDELING: "bg-status-bezig/20 text-amber-400",
  WACHT_OP_KLANT: "bg-status-wacht/20 text-orange-400",
  AFGEROND: "bg-status-afgerond/20 text-emerald-400",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LAAG: "text-muted-foreground",
  NORMAAL: "text-foreground",
  HOOG: "text-amber-400",
  URGENT: "text-red-400",
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Relaties", href: "/clients", icon: "Users" },
  { label: "Sjablonen", href: "/templates", icon: "FileText" },
] as const;
