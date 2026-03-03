import {
  getBtwDeadline,
  getBtwMonthlyDeadline,
  getVpbDeadline,
  getIbDeadline,
  getJaarrekeningDeadline,
  getPublicatieDeadline,
  getLonenDeadline,
} from "./date-utils";

interface TemplateTask {
  title: string;
  category: string;
  recurrence: string | null;
  deadlineOffset: number | null;
}

interface GeneratedTask {
  title: string;
  category: string;
  recurrence: string | null;
  deadline: Date;
  year: number;
  period: string | null;
}

// Default template definitions
export const DEFAULT_TEMPLATES: Record<
  string,
  { name: string; entityType: string; tasks: TemplateTask[] }
> = {
  BV: {
    name: "Standaard BV / Werkmaatschappij",
    entityType: "BV",
    tasks: [
      { title: "BTW-aangifte Q1", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "BTW-aangifte Q2", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "BTW-aangifte Q3", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "BTW-aangifte Q4", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "Jaarrekening", category: "JAARREKENING", recurrence: "JAARLIJKS", deadlineOffset: 150 },
      { title: "VPB-aangifte", category: "VPB", recurrence: "JAARLIJKS", deadlineOffset: null },
      { title: "Publicatie KvK", category: "JAARREKENING", recurrence: "JAARLIJKS", deadlineOffset: 365 },
      { title: "Loonheffing januari", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing februari", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing maart", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing april", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing mei", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing juni", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing juli", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing augustus", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing september", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing oktober", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing november", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
      { title: "Loonheffing december", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    ],
  },
  HOLDING: {
    name: "Standaard Holding",
    entityType: "HOLDING",
    tasks: [
      { title: "BTW-aangifte Q1", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "BTW-aangifte Q2", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "BTW-aangifte Q3", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "BTW-aangifte Q4", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "Jaarrekening", category: "JAARREKENING", recurrence: "JAARLIJKS", deadlineOffset: 150 },
      { title: "VPB-aangifte", category: "VPB", recurrence: "JAARLIJKS", deadlineOffset: null },
    ],
  },
  PARTICULIER: {
    name: "Standaard Particulier",
    entityType: "PARTICULIER",
    tasks: [
      { title: "IB-aangifte", category: "IB", recurrence: "JAARLIJKS", deadlineOffset: null },
    ],
  },
  EENMANSZAAK: {
    name: "Standaard Eenmanszaak",
    entityType: "EENMANSZAAK",
    tasks: [
      { title: "BTW-aangifte Q1", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "BTW-aangifte Q2", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "BTW-aangifte Q3", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "BTW-aangifte Q4", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
      { title: "IB-aangifte", category: "IB", recurrence: "JAARLIJKS", deadlineOffset: null },
      { title: "Jaarrekening", category: "JAARREKENING", recurrence: "JAARLIJKS", deadlineOffset: 150 },
    ],
  },
  FAMILIE: {
    name: "Standaard Familie",
    entityType: "FAMILIE",
    tasks: [
      { title: "IB-aangifte partner 1", category: "IB", recurrence: "JAARLIJKS", deadlineOffset: null },
      { title: "IB-aangifte partner 2", category: "IB", recurrence: "JAARLIJKS", deadlineOffset: null },
    ],
  },
};

// All available task definitions per category
export const CATEGORY_TASKS: Record<string, TemplateTask[]> = {
  BTW: [
    { title: "BTW-aangifte Q1", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
    { title: "BTW-aangifte Q2", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
    { title: "BTW-aangifte Q3", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
    { title: "BTW-aangifte Q4", category: "BTW", recurrence: "PER_KWARTAAL", deadlineOffset: 30 },
  ],
  BTW_MAANDELIJKS: [
    { title: "BTW-aangifte januari", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte februari", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte maart", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte april", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte mei", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte juni", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte juli", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte augustus", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte september", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte oktober", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte november", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "BTW-aangifte december", category: "BTW", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
  ],
  VPB: [
    { title: "VPB-aangifte", category: "VPB", recurrence: "JAARLIJKS", deadlineOffset: null },
  ],
  IB: [
    { title: "IB-aangifte", category: "IB", recurrence: "JAARLIJKS", deadlineOffset: null },
  ],
  JAARREKENING: [
    { title: "Jaarrekening", category: "JAARREKENING", recurrence: "JAARLIJKS", deadlineOffset: 150 },
    { title: "Publicatie KvK", category: "JAARREKENING", recurrence: "JAARLIJKS", deadlineOffset: 365 },
  ],
  LONEN: [
    { title: "Loonheffing januari", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing februari", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing maart", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing april", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing mei", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing juni", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing juli", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing augustus", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing september", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing oktober", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing november", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
    { title: "Loonheffing december", category: "LONEN", recurrence: "MAANDELIJKS", deadlineOffset: 30 },
  ],
};

// Get suggested categories for an entity type
export function getSuggestedCategories(entityType: string): string[] {
  switch (entityType) {
    case "BV":
      return ["BTW", "VPB", "JAARREKENING", "LONEN"];
    case "HOLDING":
      return ["BTW", "VPB", "JAARREKENING"];
    case "EENMANSZAAK":
      return ["BTW", "IB", "JAARREKENING"];
    case "VOF":
      return ["BTW", "IB", "JAARREKENING", "LONEN"];
    case "FAMILIE":
    case "PARTICULIER":
      return ["IB"];
    case "STICHTING":
    case "NV":
      return ["BTW", "VPB", "JAARREKENING"];
    case "MAATSCHAP":
      return ["BTW", "IB", "JAARREKENING"];
    default:
      return [];
  }
}

// Generate tasks for specific categories
export function expandCategories(
  categories: string[],
  year: number
): GeneratedTask[] {
  const tasks: TemplateTask[] = [];
  for (const cat of categories) {
    if (CATEGORY_TASKS[cat]) {
      tasks.push(...CATEGORY_TASKS[cat]);
    }
  }
  return expandTemplate(tasks, year);
}

// Expand a template for a specific year, generating concrete tasks with deadlines
export function expandTemplate(
  templateTasks: TemplateTask[],
  year: number
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  for (const t of templateTasks) {
    if (t.category === "BTW" && t.recurrence === "PER_KWARTAAL" && t.title.includes("Q")) {
      const quarter = parseInt(t.title.match(/Q(\d)/)?.[1] || "0");
      if (quarter >= 1 && quarter <= 4) {
        tasks.push({
          title: `${t.title} ${year}`,
          category: t.category,
          recurrence: t.recurrence,
          deadline: getBtwDeadline(year, quarter),
          year,
          period: `Q${quarter}`,
        });
      }
    } else if (t.category === "BTW" && t.recurrence === "MAANDELIJKS") {
      const months = [
        "januari", "februari", "maart", "april", "mei", "juni",
        "juli", "augustus", "september", "oktober", "november", "december",
      ];
      const monthIdx = months.findIndex((m) =>
        t.title.toLowerCase().includes(m)
      );
      if (monthIdx >= 0) {
        tasks.push({
          title: `${t.title} ${year}`,
          category: t.category,
          recurrence: t.recurrence,
          deadline: getBtwMonthlyDeadline(year, monthIdx),
          year,
          period: months[monthIdx],
        });
      }
    } else if (t.category === "VPB") {
      tasks.push({
        title: `${t.title} ${year}`,
        category: t.category,
        recurrence: t.recurrence,
        deadline: getVpbDeadline(year),
        year,
        period: null,
      });
    } else if (t.category === "IB") {
      tasks.push({
        title: `${t.title} ${year}`,
        category: t.category,
        recurrence: t.recurrence,
        deadline: getIbDeadline(year),
        year,
        period: null,
      });
    } else if (
      t.category === "JAARREKENING" &&
      t.title.toLowerCase().includes("publicatie")
    ) {
      tasks.push({
        title: `${t.title} ${year}`,
        category: t.category,
        recurrence: t.recurrence,
        deadline: getPublicatieDeadline(year),
        year,
        period: null,
      });
    } else if (t.category === "JAARREKENING") {
      tasks.push({
        title: `${t.title} ${year}`,
        category: t.category,
        recurrence: t.recurrence,
        deadline: getJaarrekeningDeadline(year),
        year,
        period: null,
      });
    } else if (t.category === "LONEN") {
      // Extract month from title
      const months = [
        "januari", "februari", "maart", "april", "mei", "juni",
        "juli", "augustus", "september", "oktober", "november", "december",
      ];
      const monthIdx = months.findIndex((m) =>
        t.title.toLowerCase().includes(m)
      );
      if (monthIdx >= 0) {
        tasks.push({
          title: `${t.title} ${year}`,
          category: t.category,
          recurrence: t.recurrence,
          deadline: getLonenDeadline(year, monthIdx),
          year,
          period: months[monthIdx],
        });
      }
    } else {
      // Generic task
      tasks.push({
        title: `${t.title} ${year}`,
        category: t.category,
        recurrence: t.recurrence,
        deadline: new Date(year, 11, 31), // Default: end of year
        year,
        period: null,
      });
    }
  }

  return tasks;
}
