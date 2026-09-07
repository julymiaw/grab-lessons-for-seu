import type { CourseSelection, CourseType, SeuCourse } from "./types";

export class SeuApi {
  async addCourse(course: CourseSelection, signal: AbortSignal): Promise<{ ok: boolean; message: string }> {
    const submit = async (isConfirm = false) => {
      const body = new URLSearchParams({ clazzType: course.courseType, clazzId: course.classId, secretVal: course.secretVal, ...(isConfirm ? { isConfirm: "1" } : {}) });
      const response = await fetch("/elective/clazz/add", { method: "POST", signal, headers: { batchId: course.batchId, "content-type": "application/x-www-form-urlencoded" }, body });
      return response.json() as Promise<{ code: number; msg?: string }>;
    };
    const first = await submit();
    if (first.code === 200) return { ok: true, message: "已添加到选课队列" };
    if (first.code === 301) {
      const confirmed = await submit(true);
      return { ok: confirmed.code === 200, message: confirmed.code === 200 ? "已确认并添加到选课队列" : (confirmed.msg ?? "确认失败") };
    }
    return { ok: false, message: first.msg ?? "提交失败" };
  }

  async search(type: CourseType, pageNumber: number, pageSize: number, campus: string, signal: AbortSignal): Promise<{ rows: SeuCourse[]; total: number }> {
    const response = await fetch("/elective/clazz/list", { method: "POST", signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ teachingClassType: type, pageNumber, pageSize, orderBy: "", campus }) });
    const payload = await response.json() as { code?: number; data?: { rows?: SeuCourse[]; total?: number }; msg?: string };
    if (payload.code !== 200 || !payload.data) throw new Error(payload.msg ?? "搜索课程失败");
    return { rows: payload.data.rows ?? [], total: payload.data.total ?? 0 };
  }
}
