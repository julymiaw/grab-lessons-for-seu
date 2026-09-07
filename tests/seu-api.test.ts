import { afterEach, describe, expect, it, vi } from "vitest";
import { SeuApi } from "../src/seu-api";
import type { CourseSelection } from "../src/types";

const course: CourseSelection = { key: "A", batchId: "B", classId: "RIGHT-ID", courseType: "XGKC", secretVal: "S", courseName: "测试课", teacherName: "教师" };
afterEach(() => vi.unstubAllGlobals());
describe("SeuApi", () => {
  it("uses classId again when confirming a 301 response", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ json: async () => ({ code: 301, msg: "需要确认" }) })
      .mockResolvedValueOnce({ json: async () => ({ code: 200 }) });
    vi.stubGlobal("fetch", fetch);
    await expect(new SeuApi().addCourse(course, new AbortController().signal)).resolves.toMatchObject({ ok: true });
    expect(String(fetch.mock.calls[1][1].body)).toContain("clazzId=RIGHT-ID");
  });
});
