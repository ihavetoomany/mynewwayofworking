export type TaskCard = {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  createdAt: string;
};

export type DayColumn = {
  id: string;
  date: string;
  label: string;
  subtitle: string;
  isVacation: boolean;
};

export type Board = {
  columns: DayColumn[];
  cards: TaskCard[];
  updatedAt: string;
};

export const BOARD_KEY = "vacation-plan:board";
export const VACATION_DATE = "2026-07-11";
export const START_DATE = "2026-06-13";
