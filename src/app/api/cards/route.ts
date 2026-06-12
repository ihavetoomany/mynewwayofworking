import { NextRequest, NextResponse } from "next/server";
import { addCard } from "@/lib/board";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      columnId?: string;
    };

    if (!body.title?.trim() || !body.columnId) {
      return NextResponse.json(
        { error: "Title and columnId are required" },
        { status: 400 },
      );
    }

    const board = await addCard({
      title: body.title,
      description: body.description,
      columnId: body.columnId,
    });

    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add card" },
      { status: 400 },
    );
  }
}
