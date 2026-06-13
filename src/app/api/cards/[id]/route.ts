import { NextRequest, NextResponse } from "next/server";
import { deleteCard, getBoard, moveCard, updateCard } from "@/lib/board";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      columnId?: string;
      done?: boolean;
      index?: number;
    };

    if (body.columnId !== undefined || body.index !== undefined) {
      let columnId = body.columnId;
      if (!columnId) {
        const currentBoard = await getBoard();
        const card = currentBoard.cards.find((entry) => entry.id === id);
        if (!card) {
          throw new Error("Card not found");
        }
        columnId = card.columnId;
      }

      const board = await moveCard(id, columnId, body.index);
      return NextResponse.json({ board });
    }

    const board = await updateCard(id, body);
    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update card" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const board = await deleteCard(id);
    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete card" },
      { status: 400 },
    );
  }
}
