"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchBoard } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";
import { LoginForm } from "@/components/LoginForm";
import { Workspace } from "@/components/Workspace";

type AuthState = "loading" | "unauthenticated" | "authenticated";

export const AppGate = () => {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [board, setBoard] = useState<BoardData | null>(null);
  const [boardError, setBoardError] = useState(false);

  const loadBoard = useCallback(() => {
    setBoardError(false);
    fetchBoard()
      .then(setBoard)
      .catch(() => setBoardError(true));
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((response) => {
        if (response.ok) {
          setAuthState("authenticated");
          loadBoard();
        } else {
          setAuthState("unauthenticated");
        }
      })
      .catch(() => setAuthState("unauthenticated"));
  }, [loadBoard]);

  const handleLoginSuccess = useCallback(() => {
    setAuthState("authenticated");
    loadBoard();
  }, [loadBoard]);

  const handleLogout = useCallback(() => {
    fetch("/api/logout", { method: "POST" }).finally(() => {
      setBoard(null);
      setAuthState("unauthenticated");
    });
  }, []);

  if (authState === "unauthenticated") {
    return <LoginForm onSuccess={handleLoginSuccess} />;
  }

  if (boardError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm font-semibold text-[var(--gray-text)]">
          Could not load your board.
        </p>
        <button
          type="button"
          onClick={loadBoard}
          className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
        Loading
      </div>
    );
  }

  return <Workspace initialBoard={board} onLogout={handleLogout} />;
};
