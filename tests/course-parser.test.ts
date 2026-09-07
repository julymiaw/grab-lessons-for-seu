import { describe, expect, it } from "vitest";
import { selectionFrom } from "../src/course-parser";

describe("course parser", () => {
  it("parses a non-XGKC course using its teacher list", () => {
    const result = selectionFrom("ab12345602", [{ KCH: "AB123456", KCM: "类型系统", tcList: [{ JXBID: "class-2", KXH: "02", secretVal: "secret", SKJS: "张老师" }] }], "FANKC", "batch");
    expect(result).toMatchObject({ key: "AB12345602", classId: "class-2", secretVal: "secret", teacherName: "张老师" });
  });
  it("parses XGKC fields from the course itself and rejects an invalid class", () => {
    const xgkc = [{ KCH: "CD123456", KCM: "通选", KXH: "01", JXBID: "class-1", secretVal: "secret", SKJS: "李老师" }];
    expect(selectionFrom("CD12345601", xgkc, "XGKC", "batch")?.classId).toBe("class-1");
    expect(selectionFrom("CD12345699", xgkc, "XGKC", "batch")).toBeNull();
  });
});
