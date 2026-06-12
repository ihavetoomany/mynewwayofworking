import { buildDayColumns } from "./dates";
import { getStoredValue, setStoredValue } from "./store";
import { BOARD_KEY, Board, TaskCard } from "./types";

function createEmptyBoard(): Board {
  return {
    columns: buildDayColumns(),
    cards: [],
    updatedAt: new Date().toISOString(),
  };
}

function mergeBoard(stored: Board | null): Board {
  const template = createEmptyBoard();

  if (!stored) {
    return template;
  }

  const cardsByColumn = new Map<string, TaskCard[]>();
  for (const card of stored.cards) {
    if (!template.columns.some((column) => column.id === card.columnId)) {
      continue;
    }

    const existing = cardsByColumn.get(card.columnId) ?? [];
    existing.push(card);
    cardsByColumn.set(card.columnId, existing);
  }

  return {
    columns: template.columns,
    cards: template.columns.flatMap((column) => cardsByColumn.get(column.id) ?? []),
    updatedAt: stored.updatedAt ?? new Date().toISOString(),
  };
}

export async function getBoard(): Promise<Board> {
  const stored = await getStoredValue<Board>(BOARD_KEY);
  return mergeBoard(stored);
}

export async function saveBoard(board: Board): Promise<Board> {
  const nextBoard: Board = {
    ...board,
    updatedAt: new Date().toISOString(),
  };

  await setStoredValue(BOARD_KEY, nextBoard);
  return nextBoard;
}

export async function addCard(input: {
  title: string;
  description?: string;
  columnId: string;
}): Promise<Board> {
  const board = await getBoard();

  if (!board.columns.some((column) => column.id === input.columnId)) {
    throw new Error("Invalid column");
  }

  const card: TaskCard = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    columnId: input.columnId,
    createdAt: new Date().toISOString(),
  };

  return saveBoard({
    ...board,
    cards: [...board.cards, card],
  });
}

export async function updateCard(
  cardId: string,
  updates: Partial<Pick<TaskCard, "title" | "description" | "columnId">>,
): Promise<Board> {
  const board = await getBoard();
  let found = false;

  const cards = board.cards.map((card) => {
    if (card.id !== cardId) {
      return card;
    }

    found = true;

    if (updates.columnId && !board.columns.some((column) => column.id === updates.columnId)) {
      throw new Error("Invalid column");
    }

    return {
      ...card,
      title: updates.title?.trim() ?? card.title,
      description:
        updates.description !== undefined
          ? updates.description.trim() || undefined
          : card.description,
      columnId: updates.columnId ?? card.columnId,
    };
  });

  if (!found) {
    throw new Error("Card not found");
  }

  return saveBoard({ ...board, cards });
}

export async function deleteCard(cardId: string): Promise<Board> {
  const board = await getBoard();
  const cards = board.cards.filter((card) => card.id !== cardId);

  if (cards.length === board.cards.length) {
    throw new Error("Card not found");
  }

  return saveBoard({ ...board, cards });
}
