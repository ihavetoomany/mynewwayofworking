"use client";

import { useState } from "react";
import type { DayColumn, TaskCard as TaskCardType } from "@/lib/types";
import { TaskCard, useCardDrop } from "./TaskCard";

type DayColumnProps = {
  column: DayColumn;
  cards: TaskCardType[];
  onAddCard: (columnId: string, title: string) => Promise<void>;
  onMoveCard: (cardId: string, columnId: string) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onUpdateCard: (
    cardId: string,
    updates: Partial<Pick<TaskCardType, "title" | "description">>,
  ) => Promise<void>;
};

export function DayColumnView({
  column,
  cards,
  onAddCard,
  onMoveCard,
  onDeleteCard,
  onUpdateCard,
}: DayColumnProps) {
  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { handleDragOver, handleDrop } = useCardDrop((cardId, columnId) => {
    void onMoveCard(cardId, columnId);
  });

  async function submitCard() {
    const title = draft.trim();
    if (!title) {
      return;
    }

    await onAddCard(column.id, title);
    setDraft("");
    setIsAdding(false);
  }

  return (
    <section
      className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 backdrop-blur-md ${
        column.isVacation
          ? "border-amber-300/40 bg-amber-50/70 dark:border-amber-400/30 dark:bg-amber-500/10"
          : "border-white/10 bg-white/40 dark:bg-zinc-900/40"
      }`}
      onDragOver={handleDragOver}
      onDrop={(event) => handleDrop(event, column.id)}
    >
      <header className="mb-3 px-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {column.label}
          </h2>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
            {cards.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {column.isVacation ? "🏖️ Vacation starts" : column.subtitle}
        </p>
      </header>

      <div className="flex min-h-32 flex-1 flex-col gap-2 overflow-y-auto pb-2">
        {cards.map((card) => (
          <TaskCard
            key={card.id}
            card={card}
            onDelete={(cardId) => void onDeleteCard(cardId)}
            onUpdate={(cardId, updates) => void onUpdateCard(cardId, updates)}
          />
        ))}
      </div>

      {isAdding ? (
        <div className="mt-2 space-y-2 rounded-xl border border-dashed border-zinc-300/80 p-2 dark:border-zinc-700">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="What needs to happen this day?"
            className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitCard();
              }
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void submitCard()}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
            >
              Add card
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft("");
                setIsAdding(false);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-2 rounded-xl border border-dashed border-zinc-300/80 px-3 py-2 text-left text-sm font-medium text-zinc-600 transition hover:border-sky-400 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-sky-300"
        >
          + Add a card
        </button>
      )}
    </section>
  );
}
