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
    existing.push({ ...card, done: card.done ?? false });
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
    done: false,
    createdAt: new Date().toISOString(),
  };

  return saveBoard({
    ...board,
    cards: [...board.cards, card],
  });
}

function getColumnCardIds(board: Board, columnId: string): string[] {
  return board.cards.filter((card) => card.columnId === columnId).map((card) => card.id);
}

function applyBoardOrder(board: Board, orderByColumn: Map<string, string[]>): TaskCard[] {
  const cardMap = new Map(board.cards.map((card) => [card.id, card]));

  return board.columns.flatMap((column) => {
    const ids = orderByColumn.get(column.id) ?? [];

    return ids.map((id) => {
      const card = cardMap.get(id);
      if (!card) {
        throw new Error("Card not found");
      }

      return { ...card, columnId: column.id };
    });
  });
}

export async function moveCard(
  cardId: string,
  columnId: string,
  index?: number,
): Promise<Board> {
  const board = await getBoard();
  const card = board.cards.find((entry) => entry.id === cardId);

  if (!card) {
    throw new Error("Card not found");
  }

  if (!board.columns.some((column) => column.id === columnId)) {
    throw new Error("Invalid column");
  }

  const orderByColumn = new Map<string, string[]>();
  for (const column of board.columns) {
    orderByColumn.set(column.id, getColumnCardIds(board, column.id));
  }

  const sourceColumnId = card.columnId;
  const sourceIds = orderByColumn.get(sourceColumnId) ?? [];
  const sourceIndex = sourceIds.indexOf(cardId);

  if (sourceIndex === -1) {
    throw new Error("Card not found");
  }

  sourceIds.splice(sourceIndex, 1);
  orderByColumn.set(sourceColumnId, sourceIds);

  const targetIds = orderByColumn.get(columnId) ?? [];
  let insertAt = index ?? targetIds.length;

  if (sourceColumnId === columnId && sourceIndex < insertAt) {
    insertAt -= 1;
  }

  insertAt = Math.max(0, Math.min(insertAt, targetIds.length));
  targetIds.splice(insertAt, 0, cardId);
  orderByColumn.set(columnId, targetIds);

  const cards = applyBoardOrder(board, orderByColumn);
  return saveBoard({ ...board, cards });
}

export async function updateCard(
  cardId: string,
  updates: Partial<Pick<TaskCard, "title" | "description" | "columnId" | "done">>,
): Promise<Board> {
  if (updates.columnId) {
    return moveCard(cardId, updates.columnId);
  }

  const board = await getBoard();
  let found = false;

  const cards = board.cards.map((card) => {
    if (card.id !== cardId) {
      return card;
    }

    found = true;

    return {
      ...card,
      title: updates.title?.trim() ?? card.title,
      description:
        updates.description !== undefined
          ? updates.description.trim() || undefined
          : card.description,
      done: updates.done ?? card.done,
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
