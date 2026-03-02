// Re-export Prisma types for convenience
export type {
  Client,
  Entity,
  Contact,
  Task,
  TaskLog,
  TaskTemplate,
  TaskTemplateItem,
  Tenant,
  TenantUser,
} from "@prisma/client";

export type {
  ClientType,
  ClientStatus,
  EntityType,
  TaskCategory,
  TaskStatus,
  TaskPriority,
  Recurrence,
} from "@prisma/client";

// Extended types with relations
export interface ClientWithCounts {
  id: string;
  name: string;
  type: string;
  status: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  _count: {
    entities: number;
    contacts: number;
  };
  openTasks: number;
  nextDeadline: Date | null;
}

export interface EntityWithRelations {
  id: string;
  clientId: string;
  parentEntityId: string | null;
  name: string;
  type: string;
  kvkNumber: string | null;
  btwNumber: string | null;
  fiscalNumber: string | null;
  fiscalYearEnd: string | null;
  children: EntityWithRelations[];
  _count: {
    tasks: number;
  };
}

export interface TaskWithRelations {
  id: string;
  entityId: string | null;
  contactId: string | null;
  title: string;
  category: string;
  status: string;
  deadline: Date | null;
  priority: string;
  year: number;
  period: string | null;
  notes: string | null;
  assignedTo: string | null;
  sortOrder: number;
  completedAt: Date | null;
  createdAt: Date;
  entity?: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface DashboardKPIs {
  activeClients: number;
  openTasks: number;
  deadlinesThisWeek: number;
  overdueTasks: number;
  upcomingTasks: TaskWithRelations[];
}
