// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { installCourseAddButtons } from "../src/host-page-adapter";

afterEach(() => { document.body.innerHTML = ""; vi.useRealTimers(); });
describe("host page adapter", () => {
  it("adds exactly one button and forwards the normalized course code", async () => {
    document.body.innerHTML = `<table><tr class="el-table__row expanded"><td><span>AB123456</span></td></tr><tr><td class="el-table__expanded-cell"><div class="el-card__body"><div class="one-row"><span>[02]</span></div><div><button class="el-button el-button--primary el-button--mini is-round">选择</button></div></div></td></tr></table>`;
    const add = vi.fn(); installCourseAddButtons(add);
    document.dispatchEvent(new MouseEvent("click"));
    await new Promise((resolve) => setTimeout(resolve, 100));
    const buttons = document.querySelectorAll<HTMLButtonElement>(".seu-grab-add");
    expect(buttons).toHaveLength(1);
    buttons[0].click(); expect(add).toHaveBeenCalledWith("AB12345602");
  });
});
