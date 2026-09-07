import { describe, expect, it } from "vitest";
import { defaultSettings, type CourseSelection } from "../src/types";
import { EnrollmentRunner } from "../src/enrollment-runner";

const course: CourseSelection = { key: "A", batchId: "B", classId: "C", courseType: "XGKC", secretVal: "S", courseName: "测试课", teacherName: "教师" };
describe("EnrollmentRunner", () => {
  it("handles a failed request and returns to idle", async () => {
    const runner = new EnrollmentRunner();
    const api = { addCourse: async () => { throw new Error("offline"); } };
    const messages: string[] = [];
    await runner.start({ api: api as never, settings: { ...defaultSettings, mode: { ...defaultSettings.mode, isCyclic: false } }, getCourses: () => [course], remove: () => undefined, notify: (_, message) => messages.push(message) });
    expect(runner.running).toBe(false);
    expect(messages[0]).toContain("请求失败");
  });
  it("submits groups of three and does not repeat a course in async cyclic mode", async () => {
    const runner = new EnrollmentRunner();
    const calls: string[] = []; let remaining = [course, { ...course, key: "B" }, { ...course, key: "C" }];
    const api = { addCourse: async (item: CourseSelection) => { calls.push(item.key); return { ok: true, message: "ok" }; } };
    await runner.start({ api: api as never, settings: { ...defaultSettings, mode: { ...defaultSettings.mode, isAsync: true, isGrouped: true }, interval: { ...defaultSettings.interval, async: { single: 0, group: 0 } } }, getCourses: () => remaining, remove: (key) => { remaining = remaining.filter((item) => item.key !== key); }, notify: () => undefined });
    expect(calls).toEqual(["A", "B", "C"]);
  });
});
