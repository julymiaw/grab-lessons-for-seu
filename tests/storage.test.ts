import { afterEach, describe, expect, it } from "vitest";
import { loadState, saveState } from "../src/storage";

const store = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { value: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) }, configurable: true });
afterEach(() => store.clear());
describe("storage migration", () => {
  it("imports and rewrites v3 entries with token and compatible fields", () => {
    store.set("july", JSON.stringify({ settings: { token: "secret", mode: { isGrouped: true }, interval: { sync: { single: 300, group: 1200 } } }, enrollDict: { A: { classID: "id", courseBatch: "batch", courseType: "XGKC", secretVal: "value", courseName: "课程", teacherName: "教师" } } }));
    const state = loadState();
    expect(state.courses.A.classId).toBe("id");
    expect(state.settings.token).toBe("secret");
    expect(state.settings.mode.batchSize).toBe(3);
    expect(state.settings.interval.sync.byBatch[3]).toBe(1200);
    saveState(state);
    expect(JSON.parse(store.get("july")!).settings.token).toBe("secret");
  });
});
