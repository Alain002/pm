import { request } from "@playwright/test";
import { initialData } from "../src/lib/kanban";

// Resets the container's board to the default state via the API.
// Uses a separate request context so the page's cookies stay untouched.
export async function resetBoard(baseURL: string | undefined) {
  const context = await request.newContext({ baseURL });
  await context.post("/api/login", {
    data: { username: "user", password: "password" },
  });
  await context.put("/api/board", { data: initialData });
  await context.dispose();
}
