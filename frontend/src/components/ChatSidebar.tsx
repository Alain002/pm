"use client";

import { useState, type FormEvent } from "react";
import clsx from "clsx";
import type { BoardData } from "@/lib/kanban";

type ChatMessageItem = {
  role: "user" | "assistant";
  content: string;
};

type ChatSidebarProps = {
  onBoardUpdate: (board: BoardData) => void;
};

export const ChatSidebar = ({ onBoardUpdate }: ChatSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) {
      return;
    }
    const nextMessages: ChatMessageItem[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });
      if (!response.ok) {
        throw new Error("Chat request failed");
      }
      const data = (await response.json()) as {
        reply: string;
        board: BoardData | null;
      };
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      if (data.board) {
        onBoardUpdate(data.board);
      }
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI assistant"
        className="fixed bottom-6 right-6 z-10 rounded-full bg-[var(--secondary-purple)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[var(--shadow)] transition hover:brightness-110"
      >
        AI Assistant
      </button>
    );
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[360px] shrink-0 flex-col border-l border-[var(--stroke)] bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-[var(--stroke)] px-5 py-4">
        <div>
          <div className="h-1 w-8 rounded-full bg-[var(--accent-yellow)]" />
          <h2 className="mt-2 font-display text-lg font-semibold text-[var(--navy-dark)]">
            AI Assistant
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--gray-text)]">
            Ask questions or let it update your board.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close AI assistant"
          className="rounded-full border border-[var(--stroke)] px-3 py-1 text-xs font-semibold text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
        >
          Hide
        </button>
      </header>
      <div
        className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
        data-testid="chat-messages"
      >
        {messages.length === 0 ? (
          <p className="rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--gray-text)]">
            Try: &quot;Summarize my board&quot; or &quot;Move Align roadmap themes
            to Done&quot;.
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              data-testid={`${message.role}-message`}
              className={clsx(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                message.role === "user"
                  ? "ml-auto bg-[var(--primary-blue)] text-white"
                  : "bg-[var(--surface)] text-[var(--navy-dark)]"
              )}
            >
              {message.content}
            </div>
          ))
        )}
        {sending ? (
          <div className="max-w-[85%] rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm text-[var(--gray-text)]">
            Thinking...
          </div>
        ) : null}
      </div>
      <form
        onSubmit={handleSubmit}
        className="border-t border-[var(--stroke)] p-4"
      >
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask the assistant"
            aria-label="Chat message"
            className="w-full rounded-full border border-[var(--stroke)] bg-white px-4 py-2.5 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-[var(--secondary-purple)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:brightness-110 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
};
