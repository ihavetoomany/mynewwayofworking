import { NextResponse } from "next/server";
import { getBoard } from "@/lib/board";
import { getStorageMode } from "@/lib/store";

export async function GET() {
  const board = await getBoard();

  return NextResponse.json({
    board,
    storageMode: getStorageMode(),
  });
}
