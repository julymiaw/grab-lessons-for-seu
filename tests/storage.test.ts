import { afterEach, describe, expect, it } from "vitest";
import { loadState } from "../src/storage";

const store = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { value: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) }, configurable: true });
afterEach(() => store.clear());
describe("storage migration", () => {
  it("imports v3 course entries without retaining its token", () => {
    store.set("july", JSON.stringify({ settings: { token: "secret" }, enrollDict: { A: { classID: "id", courseBatch: "batch", courseType: "XGKC", secretVal: "value", courseName: "课程", teacherName: "教师" } } }));
    const state = loadState();
    expect(state.courses.A.classId).toBe("id");
    expect("token" in state.settings).toBe(false);
  });
});
