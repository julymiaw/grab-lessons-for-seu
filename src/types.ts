export type CourseType = "TJKC" | "FANKC" | "FAWKC" | "TYKC" | "XGKC";

export interface CourseSelection {
  key: string;
  batchId: string;
  classId: string;
  courseType: CourseType;
  secretVal: string;
  courseName: string;
  teacherName: string;
  department?: string;
  location?: string;
  selectedCount?: number;
  totalCapacity?: number;
}

export interface Settings {
  schemaVersion: 1;
  mode: { isAsync: boolean; isCyclic: boolean; isGrouped: boolean; enableSearch: boolean };
  interval: { sync: { single: number; group: number }; async: { single: number; group: number } };
  search: { pageSize: number; pageDelay: number };
  announcement: { hasRead: boolean };
}

export const defaultSettings: Settings = {
  schemaVersion: 1,
  mode: { isAsync: false, isCyclic: true, isGrouped: false, enableSearch: true },
  interval: { sync: { single: 300, group: 1000 }, async: { single: 350, group: 1000 } },
  search: { pageSize: 20, pageDelay: 500 },
  announcement: { hasRead: false }
};

export interface StoredState { settings: Settings; courses: Record<string, CourseSelection> }

export interface SeuTeacher { JXBID: string; KXH: string; secretVal: string; SKJS: string; KKDW?: string; YPSJDD?: string; numberOfSelected?: number; classCapacity?: number }
export interface SeuCourse { KCH: string; KCM: string; tcList?: SeuTeacher[]; KXH?: string; JXBID?: string; secretVal?: string; SKJS?: string; KKDW?: string; YPSJDD?: string; numberOfSelected?: number; classCapacity?: number }
export interface SeuPage { lcParam: { currentBatch: { code: string } }; teachingClassType: CourseType; courseList: SeuCourse[]; currentCampus: { code: string }; $message: (options: { type: string; message: string; duration?: number }) => void }
