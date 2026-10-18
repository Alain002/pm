import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatSidebar } from "@/components/ChatSidebar";
import { initialData } from "@/lib/kanban";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("ChatSidebar", () => {
  it("sends a message and shows the reply", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reply: "Nice board!", board: null }),
    });
    const onBoardUpdate = vi.fn();
    render(<ChatSidebar onBoardUpdate={onBoardUpdate} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/chat message/i), "Summarize my board");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Nice board!")).toBeInTheDocument();
    expect(screen.getByText("Summarize my board")).toBeInTheDocument();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/chat");
    expect(JSON.parse(options.body as string).message).toBe("Summarize my board");
    expect(onBoardUpdate).not.toHaveBeenCalled();
  });

  it("applies board updates from the AI", async () => {
    const updated = {
      ...initialData,
      columns: initialData.columns.map((column, index) =>
        index === 0 ? { ...column, title: "Ideas" } : column
      ),
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reply: "Renamed!", board: updated }),
    });
    const onBoardUpdate = vi.fn();
    render(<ChatSidebar onBoardUpdate={onBoardUpdate} />);
    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText(/chat message/i),
      "Rename Backlog to Ideas"
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Renamed!")).toBeInTheDocument();
    expect(onBoardUpdate).toHaveBeenCalledWith(updated);
  });

  it("shows an error message when the request fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    render(<ChatSidebar onBoardUpdate={vi.fn()} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/chat message/i), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
  });

  it("can be hidden and reopened", async () => {
    render(<ChatSidebar onBoardUpdate={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /close ai assistant/i }));
    expect(
      screen.queryByText(/Ask questions or let it update your board/i)
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open ai assistant/i }));
    expect(
      screen.getByText(/Ask questions or let it update your board/i)
    ).toBeInTheDocument();
  });
});
