import "./grab-lessons-app";
import { EnrollmentRunner } from "./enrollment-runner";
import { SeuApi } from "./seu-api";
import { loadState, saveState } from "./storage";
import type { CourseType, SeuPage } from "./types";
import { GrabLessonsApp } from "./grab-lessons-app";
import { installCourseAddButtons } from "./host-page-adapter";
import { selectionFrom } from "./course-parser";

declare global { interface Window { grablessonsVue?: SeuPage } }

const waitForPage = async (): Promise<SeuPage> => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const page = window.grablessonsVue;
    if (page && document.querySelector("#xsxkapp")) return page;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("选课页面未能在 10 秒内完成初始化");
};

const notify = (page: SeuPage, type: "success" | "warning" | "error", message: string) => page.$message({ type, message, duration: 1800 });

async function main(): Promise<void> {
  const page = await waitForPage();
  const state = loadState();
  const api = new SeuApi();
  const runner = new EnrollmentRunner();
  const app = document.createElement("seu-grab-lessons-app") as GrabLessonsApp;
  const root = document.querySelector("#xsxkapp") ?? document.body;
  root.append(app);

  const render = () => { app.courses = Object.values(state.courses).filter((course) => course.batchId === page.lcParam.currentBatch.code); app.settings = state.settings; app.running = runner.running; app.requestUpdate(); };
  const persist = () => saveState(state);
  app.onRemove = (key) => { delete state.courses[key]; persist(); render(); };
  app.onSettingsChange = (settings) => { state.settings = settings; persist(); render(); };
  const addCodes = async (input: string) => {
    if (runner.running) { notify(page, "warning", "抢课进行中，暂不能修改课程列表"); return; }
    const failed: string[] = [];
    for (const code of input.split(/\s+/)) {
      const selection = selectionFrom(code, page.courseList, page.teachingClassType, page.lcParam.currentBatch.code);
      if (selection) state.courses[selection.key] = selection; else failed.push(code);
    }
    if (failed.length && state.settings.mode.enableSearch) {
      const remaining = new Set(failed);
      const controller = new AbortController();
      const types: CourseType[] = ["TJKC", "FANKC", "FAWKC", "TYKC", "XGKC"];
      for (const type of types) {
        for (let pageNumber = 1; remaining.size; pageNumber += 1) {
          try {
            await new Promise((resolve) => setTimeout(resolve, state.settings.search.pageDelay));
            const result = await api.search(type, pageNumber, state.settings.search.pageSize, page.currentCampus.code, controller.signal);
            for (const code of [...remaining]) {
              const selection = selectionFrom(code, result.rows, type, page.lcParam.currentBatch.code);
              if (selection) { state.courses[selection.key] = selection; remaining.delete(code); }
            }
            notify(page, "success", `已搜索 ${type} 第 ${pageNumber} 页，剩余 ${remaining.size} 门`);
            if (!result.rows.length || pageNumber * state.settings.search.pageSize >= result.total) break;
          } catch (error) {
            notify(page, "warning", `搜索 ${type} 失败：${error instanceof Error ? error.message : "未知错误"}`);
            break;
          }
        }
      }
      failed.splice(0, failed.length, ...remaining);
    }
    persist(); render();
    notify(page, failed.length ? "warning" : "success", failed.length ? `未找到：${failed.join(" ")}` : "课程已加入列表");
  };
  app.onAdd = (input) => { void addCodes(input); };
  installCourseAddButtons((code) => { void addCodes(code); });
  app.onStart = () => { void runner.start({ api, settings: state.settings, getCourses: () => Object.values(state.courses).filter((course) => course.batchId === page.lcParam.currentBatch.code), remove: (key) => { delete state.courses[key]; persist(); render(); }, notify: (type, message) => notify(page, type, message) }).finally(render); render(); };
  app.onStop = () => { void runner.stop().finally(render); render(); };
  render();
}

void main().catch((error) => console.error("[grab-lessons-for-seu]", error));
