"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Board, TaskCard } from "@/lib/types";
import { START_DATE, VACATION_DATE } from "@/lib/types";
import { DayColumnView } from "./DayColumn";

type BoardResponse = {
  board: Board;
  storageMode: string;
};

export function VacationBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [storageMode, setStorageMode] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadBoard = useCallback(async () => {
    setError(null);
    const response = await fetch("/api/board");
    if (!response.ok) {
      throw new Error("Failed to load board");
    }

    const data = (await response.json()) as BoardResponse;
    setBoard(data.board);
    setStorageMode(data.storageMode);
  }, []);

  useEffect(() => {
    void loadBoard().catch(() => {
      setError("Could not load your vacation board.");
    });
  }, [loadBoard]);

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, TaskCard[]>();
    if (!board) {
      return map;
    }

    for (const column of board.columns) {
      map.set(column.id, []);
    }

    for (const card of board.cards) {
      const bucket = map.get(card.columnId);
      if (bucket) {
        bucket.push(card);
      }
    }

    return map;
  }, [board]);

  async function refreshFromResponse(response: Response) {
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(payload?.error ?? "Request failed");
    }

    const data = (await response.json()) as { board: Board };
    setBoard(data.board);
  }

  async function withSaving<T>(action: () => Promise<T>) {
    setIsSaving(true);
    setError(null);
    try {
      return await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
      throw caught;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddCard(columnId: string, title: string) {
    await withSaving(async () => {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId, title }),
      });
      await refreshFromResponse(response);
    });
  }

  async function handleMoveCard(cardId: string, columnId: string) {
    await withSaving(async () => {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId }),
      });
      await refreshFromResponse(response);
    });
  }

  async function handleDeleteCard(cardId: string) {
    await withSaving(async () => {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });
      await refreshFromResponse(response);
    });
  }

  async function handleUpdateCard(
    cardId: string,
    updates: Partial<Pick<TaskCard, "title" | "description">>,
  ) {
    await withSaving(async () => {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await refreshFromResponse(response);
    });
  }

  async function handleToggleDone(cardId: string, done: boolean) {
    await withSaving(async () => {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      await refreshFromResponse(response);
    });
  }

  if (!board) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-white/80">Loading your vacation plan...</p>
      </div>
    );
  }

  const totalCards = board.cards.length;
  const doneCards = board.cards.filter((card) => card.done).length;
  const daysUntilVacation = board.columns.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-white/20 px-6 py-5">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Vacation countdown board
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Plan every day until July 11
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
              Drag cards between days, capture priorities, and keep momentum from{" "}
              {START_DATE} through vacation on {VACATION_DATE}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm text-white backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">Days mapped</p>
              <p className="mt-1 text-lg font-semibold">{daysUntilVacation}</p>
            </div>
            <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm text-white backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">Tasks done</p>
              <p className="mt-1 text-lg font-semibold">
                {doneCards} / {totalCards}
              </p>
            </div>
            <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm text-white backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">Storage</p>
              <p className="mt-1 text-sm font-medium capitalize">
                {storageMode.replace("-", " ")}
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-4 min-h-6 max-w-[1600px]">
          {error ? (
            <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : (
            <p
              aria-live="polite"
              className={`text-xs text-white/70 ${isSaving ? "opacity-100" : "opacity-0"}`}
            >
              Saving changes...
            </p>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-6 py-6">
        <div className="mx-auto flex h-full min-w-max gap-4 pb-4">
          {board.columns.map((column) => (
            <DayColumnView
              key={column.id}
              column={column}
              cards={cardsByColumn.get(column.id) ?? []}
              onAddCard={handleAddCard}
              onMoveCard={handleMoveCard}
              onDeleteCard={handleDeleteCard}
              onUpdateCard={handleUpdateCard}
              onToggleDone={handleToggleDone}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
