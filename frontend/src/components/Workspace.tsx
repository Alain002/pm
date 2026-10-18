"use client";

import { useEffect, useRef, useState } from "react";
import { saveBoard } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";
import { ChatSidebar } from "@/components/ChatSidebar";
import { KanbanBoard } from "@/components/KanbanBoard";

type WorkspaceProps = {
  initialBoard: BoardData;
  onLogout: () => void;
};

export const Workspace = ({ initialBoard, onLogout }: WorkspaceProps) => {
  const [board, setBoard] = useState<BoardData>(() => initialBoard);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveBoard(board).catch(() => {
      // A failed save leaves local state intact; the next change retries.
    });
  }, [board]);

  return (
    <div className="flex">
      <div className="min-w-0 flex-1">
        <KanbanBoard board={board} onBoardChange={setBoard} onLogout={onLogout} />
      </div>
      <ChatSidebar onBoardUpdate={setBoard} />
    </div>
  );
};
