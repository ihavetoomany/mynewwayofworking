import { DayColumn, START_DATE, VACATION_DATE } from "./types";

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatSubtitle(date: Date, isVacation: boolean) {
  if (isVacation) {
    return "Vacation day";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1) return `${diffDays} days away`;
  return `${Math.abs(diffDays)} days ago`;
}

export function buildDayColumns(): DayColumn[] {
  const start = parseDate(START_DATE);
  const end = parseDate(VACATION_DATE);
  const columns: DayColumn[] = [];

  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const date = new Date(cursor);
    const id = formatDateId(date);
    const isVacation = id === VACATION_DATE;

    columns.push({
      id,
      date: id,
      label: formatLabel(date),
      subtitle: formatSubtitle(date, isVacation),
      isVacation,
    });
  }

  return columns;
}
