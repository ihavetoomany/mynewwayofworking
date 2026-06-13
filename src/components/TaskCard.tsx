"use client";

import { useState } from "react";
import type { TaskCard as TaskCardType } from "@/lib/types";

type TaskCardProps = {
  card: TaskCardType;
  index: number;
  columnId: string;
  onDelete: (cardId: string) => void;
  onUpdate: (
    cardId: string,
    updates: Partial<Pick<TaskCardType, "title" | "description">>,
  ) => void;
  onToggleDone: (cardId: string, done: boolean) => void;
  onMoveCard: (cardId: string, columnId: string, index?: number) => void;
};

export function TaskCard({
  card,
  index,
  columnId,
  onDelete,
  onUpdate,
  onToggleDone,
  onMoveCard,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData("text/card-id", card.id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const draggedCardId = event.dataTransfer.getData("text/card-id");
    if (!draggedCardId || draggedCardId === card.id) {
      return;
    }

    onMoveCard(draggedCardId, columnId, index);
  }

  function saveEdits() {
    onUpdate(card.id, { title, description });
    setIsEditing(false);
  }

  return (
    <article
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group rounded-xl border p-3 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isEditing ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${
        isDragOver ? "border-sky-400 ring-2 ring-sky-300/60" : ""
      } ${
        card.done
          ? "border-emerald-300/60 bg-emerald-50/55 dark:border-emerald-500/30 dark:bg-emerald-950/35"
          : "border-white/20 bg-white/60 dark:border-white/15 dark:bg-zinc-900/55"
      }`}
    >
      {isEditing ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Notes..."
            className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEdits}
              className="rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-500"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle(card.title);
                setDescription(card.description ?? "");
                setIsEditing(false);
              }}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <label className="mt-0.5 flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={card.done}
                onChange={(event) => onToggleDone(card.id, event.target.checked)}
                aria-label={card.done ? "Mark task as not done" : "Mark task as done"}
                className="size-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={`text-sm font-semibold leading-snug ${
                    card.done
                      ? "text-zinc-500 line-through dark:text-zinc-400"
                      : "text-zinc-900 dark:text-zinc-50"
                  }`}
                >
                  {card.title}
                </h3>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Edit card"
                    onClick={() => setIsEditing(true)}
                    className="rounded-md px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    aria-label="Delete card"
                    onClick={() => onDelete(card.id)}
                    className="rounded-md px-1.5 py-0.5 text-xs text-rose-500 hover:bg-rose-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {card.description ? (
                <p
                  className={`mt-2 text-xs leading-relaxed ${
                    card.done
                      ? "text-zinc-400 line-through dark:text-zinc-500"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {card.description}
                </p>
              ) : null}
              {card.done ? (
                <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Task done
                </p>
              ) : null}
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export function useColumnDrop(onMoveCard: (cardId: string, columnId: string, index?: number) => void) {
  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: React.DragEvent<HTMLElement>, columnId: string, index: number) {
    event.preventDefault();
    const cardId = event.dataTransfer.getData("text/card-id");
    if (cardId) {
      onMoveCard(cardId, columnId, index);
    }
  }

  return { handleDragOver, handleDrop };
}
