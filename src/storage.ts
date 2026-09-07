import { defaultSettings, type Settings, type StoredState } from "./types";

const key = "grab-lessons-for-seu:v4";
const cloneDefaults = (): Settings => structuredClone(defaultSettings);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadState(): StoredState {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? localStorage.getItem("july") ?? "null");
    if (!isRecord(raw)) return { settings: cloneDefaults(), courses: {} };
    const settings = isRecord(raw.settings) ? raw.settings : {};
    const oldCourses = isRecord(raw.enrollDict) ? raw.enrollDict : {};
    const courses = isRecord(raw.courses) ? raw.courses : Object.fromEntries(Object.entries(oldCourses).flatMap(([courseKey, value]) => {
      if (!isRecord(value) || typeof value.classID !== "string" || typeof value.courseBatch !== "string" || typeof value.courseType !== "string" || typeof value.secretVal !== "string") return [];
      return [[courseKey, { key: courseKey, batchId: value.courseBatch, classId: value.classID, courseType: value.courseType, secretVal: value.secretVal, courseName: String(value.courseName ?? courseKey), teacherName: String(value.teacherName ?? "待定"), department: typeof value.department === "string" ? value.department : undefined, location: typeof value.location === "string" ? value.location : undefined }]];
    }));
    return {
      settings: {
        ...cloneDefaults(),
        schemaVersion: 1,
        mode: { ...cloneDefaults().mode, ...(isRecord(settings.mode) ? settings.mode : {}) },
        interval: { ...cloneDefaults().interval, ...(isRecord(settings.interval) ? settings.interval : {}) },
        search: { ...cloneDefaults().search, ...(isRecord(settings.search) ? settings.search : {}) },
        announcement: { ...cloneDefaults().announcement, ...(isRecord(settings.announcement) ? settings.announcement : {}) }
      } as Settings,
      courses: courses as StoredState["courses"]
    };
  } catch {
    return { settings: cloneDefaults(), courses: {} };
  }
}

export function saveState(state: StoredState): void { localStorage.setItem(key, JSON.stringify(state)); }
