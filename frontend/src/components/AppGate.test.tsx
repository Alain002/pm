import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppGate } from "@/components/AppGate";
import { initialData } from "@/lib/kanban";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const boardResponse = () => ({
  ok: true,
  json: () => Promise.resolve(initialData),
});

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((url: string) =>
    Promise.resolve(
      url === "/api/board" ? boardResponse() : { ok: false, status: 401 }
    )
  );
});

describe("AppGate", () => {
  it("shows the login form when unauthenticated", async () => {
    render(<AppGate />);
    expect(
      await screen.findByRole("heading", { name: "Sign in" })
    ).toBeInTheDocument();
  });

  it("loads and shows the board when authenticated", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true }); // GET /api/me
    render(<AppGate />);
    expect(
      await screen.findByRole("heading", { name: "Kanban Studio" })
    ).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith("/api/board");
  });

  it("signs in with valid credentials and loads the board", async () => {
    render(<AppGate />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/username/i), "user");
    await user.type(screen.getByLabelText(/password/i), "password");
    mockFetch.mockResolvedValueOnce({ ok: true }); // POST /api/login
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(
      await screen.findByRole("heading", { name: "Kanban Studio" })
    ).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({ method: "POST" })
    );
    expect(mockFetch).toHaveBeenCalledWith("/api/board");
  });

  it("shows an error on invalid credentials", async () => {
    render(<AppGate />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/username/i), "user");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 }); // POST /api/login
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid username or password/i
    );
  });

  it("shows an error and retries when the board fails to load", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true }); // GET /api/me
    mockFetch.mockRejectedValueOnce(new Error("network")); // GET /api/board
    render(<AppGate />);
    expect(
      await screen.findByText(/could not load your board/i)
    ).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(
      await screen.findByRole("heading", { name: "Kanban Studio" })
    ).toBeInTheDocument();
  });

  it("signs out and returns to the login form", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true }); // GET /api/me
    render(<AppGate />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /sign out/i }));
    expect(
      await screen.findByRole("heading", { name: "Sign in" })
    ).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/logout",
      expect.objectContaining({ method: "POST" })
    );
  });
});
