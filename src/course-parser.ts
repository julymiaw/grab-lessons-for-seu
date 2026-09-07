import type { CourseSelection, CourseType, SeuCourse } from "./types";

export function selectionFrom(code: string, courses: SeuCourse[], type: CourseType, batchId: string): CourseSelection | null {
  const normalized = code.trim().toUpperCase();
  if (normalized.length <= 8) return null;
  const courseCode = normalized.slice(0, 8);
  const sequence = normalized.slice(8);
  const course = courses.find((item) => item.KCH === courseCode);
  if (!course) return null;
  if (type === "XGKC" && course.KXH !== sequence) return null;
  const teacher = type === "XGKC" ? course as SeuCourse : course.tcList?.find((item) => item.KXH === sequence);
  if (!teacher || !("JXBID" in teacher) || !teacher.JXBID || !("secretVal" in teacher) || !teacher.secretVal) return null;
  return { key: normalized, batchId, classId: teacher.JXBID, courseType: type, secretVal: teacher.secretVal, courseName: course.KCM, teacherName: teacher.SKJS || "待定", department: teacher.KKDW, location: teacher.YPSJDD, selectedCount: teacher.numberOfSelected, totalCapacity: teacher.classCapacity };
}
