import { fetchBoard, saveBoard } from "@/lib/api";
import { initialData } from "@/lib/kanban";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("api client", () => {
  it("fetchBoard returns the board", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialData),
    });
    await expect(fetchBoard()).resolves.toEqual(initialData);
    expect(mockFetch).toHaveBeenCalledWith("/api/board");
  });

  it("fetchBoard throws on failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(fetchBoard()).rejects.toThrow("Failed to load board");
  });

  it("saveBoard PUTs the board", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    await saveBoard(initialData);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/board",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("saveBoard throws on failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(saveBoard(initialData)).rejects.toThrow("Failed to save board");
  });
});
