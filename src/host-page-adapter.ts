/** Keeps the unavoidable knowledge of the university page DOM in one place. */
export function installCourseAddButtons(onAdd: (code: string) => void): void {
  const scan = () => {
    for (const cell of document.querySelectorAll<HTMLElement>("td.el-table__expanded-cell")) {
      const row = cell.parentElement?.previousElementSibling;
      const courseCode = row?.querySelector("td span")?.textContent?.trim();
      if (!courseCode) continue;
      for (const select of cell.querySelectorAll<HTMLButtonElement>("button.el-button--primary.el-button--mini.is-round")) {
        if (!select.textContent?.includes("选择") || select.parentElement?.querySelector(".seu-grab-add")) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "el-button el-button--primary el-button--mini is-round seu-grab-add";
        button.textContent = "添加";
        button.addEventListener("click", () => {
          const sequence = select.closest(".el-card__body")?.querySelector(".one-row span")?.textContent?.replace(/[\[\]\s]/g, "");
          if (sequence) onAdd(`${courseCode}${sequence}`);
        });
        select.parentElement?.append(button);
      }
    }
  };
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("click", () => setTimeout(scan, 80));
  scan();
}
