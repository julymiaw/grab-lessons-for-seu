import type { CourseSelection, Settings } from "./types";
import { SeuApi } from "./seu-api";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class EnrollmentRunner {
  #controller: AbortController | null = null;
  #inFlight = new Set<Promise<void>>();
  get running(): boolean { return this.#controller !== null; }

  async start(options: { api: SeuApi; settings: Settings; getCourses: () => CourseSelection[]; remove: (key: string) => void; notify: (type: "success" | "warning" | "error", message: string) => void }): Promise<void> {
    if (this.running) await this.stop();
    const controller = new AbortController();
    this.#controller = controller;
    const interval = options.settings.interval[options.settings.mode.isAsync ? "async" : "sync"][options.settings.mode.isGrouped ? "group" : "single"];
    try {
      do {
        const snapshot = options.getCourses();
        if (!snapshot.length) break;
        const size = options.settings.mode.isGrouped ? 3 : 1;
        for (let offset = 0; offset < snapshot.length && !controller.signal.aborted; offset += size) {
          const group = snapshot.slice(offset, offset + size);
          const tasks = group.map((course) => this.#submit(course, options, controller.signal));
          if (options.settings.mode.isAsync) tasks.forEach((task) => void task);
          else await Promise.all(tasks);
          if (!controller.signal.aborted) await delay(interval);
        }
        // Never start a new cycle while requests from the previous one can still
        // succeed; otherwise slow responses cause duplicate submissions.
        if (options.settings.mode.isAsync) await Promise.allSettled([...this.#inFlight]);
      } while (options.settings.mode.isCyclic && !controller.signal.aborted && options.getCourses().length > 0);
    } finally {
      if (this.#controller === controller) this.#controller = null;
    }
  }

  async stop(): Promise<void> {
    this.#controller?.abort();
    await Promise.allSettled([...this.#inFlight]);
    this.#controller = null;
  }

  #submit(course: CourseSelection, options: Parameters<EnrollmentRunner["start"]>[0], signal: AbortSignal): Promise<void> {
    const task = (async () => {
      try {
        const result = await options.api.addCourse(course, signal);
        options.notify(result.ok ? "success" : "warning", `${course.teacherName} 的 ${course.courseName}：${result.message}`);
        if (result.ok) options.remove(course.key);
      } catch (error) {
        if (!signal.aborted) options.notify("error", `${course.courseName} 请求失败：${error instanceof Error ? error.message : "未知错误"}`);
      }
    })();
    this.#inFlight.add(task);
    void task.finally(() => this.#inFlight.delete(task));
    return task;
  }
}
