import {
  format,
  differenceInDays,
  isPast,
  isToday,
  addDays,
  endOfQuarter,
  endOfMonth,
  startOfYear,
  parseISO,
} from "date-fns";
import { nl } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy", { locale: nl });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM", { locale: nl });
}

export function getDeadlineColor(deadline: Date | string | null): string {
  if (!deadline) return "";
  const d = typeof deadline === "string" ? parseISO(deadline) : deadline;
  const daysUntil = differenceInDays(d, new Date());

  if (isPast(d) && !isToday(d)) return "text-red-400";
  if (daysUntil <= 3) return "text-orange-400";
  if (daysUntil <= 7) return "text-amber-400";
  return "text-muted-foreground";
}

export function getDeadlineLabel(deadline: Date | string | null): string {
  if (!deadline) return "Geen deadline";
  const d = typeof deadline === "string" ? parseISO(deadline) : deadline;
  const daysUntil = differenceInDays(d, new Date());

  if (isPast(d) && !isToday(d))
    return `${Math.abs(daysUntil)} dagen te laat`;
  if (isToday(d)) return "Vandaag";
  if (daysUntil === 1) return "Morgen";
  if (daysUntil <= 7) return `Over ${daysUntil} dagen`;
  return formatDate(d);
}

// Bereken deadline voor een taak op basis van periode en offset
export function calculateDeadline(
  year: number,
  quarter?: number,
  month?: number,
  offsetDays: number = 0
): Date {
  let periodEnd: Date;

  if (month) {
    periodEnd = endOfMonth(new Date(year, month - 1));
  } else if (quarter) {
    periodEnd = endOfQuarter(new Date(year, (quarter - 1) * 3));
  } else {
    // Annual: fiscal year end (default 31 dec)
    periodEnd = new Date(year, 11, 31);
  }

  return addDays(periodEnd, offsetDays);
}

// Standaard deadline berekeningen voor Nederlandse belastingaangiftes
export function getBtwDeadline(year: number, quarter: number): Date {
  // BTW: laatste dag van de maand volgend op het kwartaal
  const monthAfterQuarter = quarter * 3; // 3, 6, 9, 12 → +1 maand
  return endOfMonth(new Date(year, monthAfterQuarter));
}

export function getVpbDeadline(year: number): Date {
  // VPB: 1 juni volgend jaar
  return new Date(year + 1, 5, 1);
}

export function getIbDeadline(year: number): Date {
  // IB: 1 mei volgend jaar
  return new Date(year + 1, 4, 1);
}

export function getJaarrekeningDeadline(year: number): Date {
  // Jaarrekening: binnen 5 maanden na boekjaar (31 mei volgend jaar)
  return new Date(year + 1, 4, 31);
}

export function getPublicatieDeadline(year: number): Date {
  // Publicatie KvK: binnen 12 maanden na boekjaar
  return new Date(year + 1, 11, 31);
}

export function getLonenDeadline(year: number, month: number): Date {
  // Loonheffing: laatste dag van de volgende maand
  return endOfMonth(new Date(year, month));
}
