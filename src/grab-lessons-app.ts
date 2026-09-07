import { LitElement, css, html } from "lit";
import type { CourseSelection, Settings } from "./types";

export class GrabLessonsApp extends LitElement {
  static properties = { courses: { state: true }, settings: { state: true }, running: { state: true } };
  courses: CourseSelection[] = [];
  settings!: Settings;
  running = false;
  onStart?: () => void;
  onStop?: () => void;
  onRemove?: (key: string) => void;
  onAdd?: (codes: string) => void;
  onSettingsChange?: (settings: Settings) => void;

  static styles = css`
    :host { color: #182235; font: 14px/1.45 system-ui, -apple-system, sans-serif; }
    button,input { font: inherit; } .launcher { position: fixed; right: 22px; bottom: 22px; z-index: 2147483646; border: 0; border-radius: 999px; background: #1d4ed8; color: white; padding: 12px 16px; box-shadow: 0 8px 24px #0004; cursor: pointer; }
    .panel { position: fixed; right: 22px; bottom: 76px; z-index: 2147483646; width: min(390px, calc(100vw - 32px)); max-height: min(650px, calc(100vh - 104px)); overflow: auto; box-sizing: border-box; border-radius: 16px; background: #fff; box-shadow: 0 16px 48px #0004; padding: 18px; }
    header { display:flex; justify-content:space-between; align-items:center; gap:8px; } h2 { margin:0; font-size:18px; } .muted { color:#64748b; font-size:12px; } .entry { display:flex; gap:8px; margin:16px 0; } input { min-width:0; flex:1; border:1px solid #cbd5e1; border-radius:8px; padding:8px 10px; } button { border:0; border-radius:8px; padding:8px 10px; cursor:pointer; } .primary { background:#1d4ed8; color:white; } .danger { background:#dc2626; color:white; } .course { display:grid; grid-template-columns:1fr auto; gap:8px; border-top:1px solid #e2e8f0; padding:10px 0; } .course strong,.course span { display:block; } .course span { color:#64748b; font-size:12px; } .remove { color:#b91c1c; background:#fee2e2; align-self:center; } .empty { text-align:center; color:#64748b; padding:20px; }
  `;
  #open = true;
  render() {
    return html`
      <button class="launcher" @click=${() => { this.#open = !this.#open; this.requestUpdate(); }} aria-label="打开抢课助手">选课助手</button>
      ${this.#open ? html`<section class="panel" aria-label="抢课助手">
        <header><div><h2>选课助手</h2><div class="muted">v4 · ${this.running ? "正在提交" : "准备就绪"}</div></div><button class=${this.running ? "danger" : "primary"} @click=${() => this.running ? this.onStop?.() : this.onStart?.()}>${this.running ? "停止" : "开始"}</button></header>
        <div class="entry"><input id="codes" ?disabled=${this.running} placeholder="课程号 + 教学班序号，以空格分隔" @keydown=${(event: KeyboardEvent) => event.key === "Enter" && this.#add()}><button ?disabled=${this.running} @click=${this.#add}>添加</button></div>
        <details><summary class="muted">${this.settings?.mode.isCyclic ? "循环" : "单次"} · ${this.settings?.mode.isAsync ? "异步" : "同步"} · ${this.settings?.mode.isGrouped ? "每组 3 门" : "逐门"} · 设置</summary>
          <div class="settings">
            ${this.#toggle("循环提交", "isCyclic")} ${this.#toggle("异步发送", "isAsync")} ${this.#toggle("每组 3 门", "isGrouped")} ${this.#toggle("自动搜索", "enableSearch")}
            <label>发送间隔（ms）<input type="number" min="100" max="5000" .value=${String(this.#interval())} @change=${this.#setInterval}></label>
            <label>搜索页大小<input type="number" min="10" max="100" step="10" .value=${String(this.settings?.search.pageSize ?? 20)} @change=${this.#setPageSize}></label>
            <label>搜索翻页延迟（ms）<input type="number" min="100" max="5000" step="100" .value=${String(this.settings?.search.pageDelay ?? 500)} @change=${this.#setPageDelay}></label>
          </div>
        </details>
        ${this.courses.length ? this.courses.map((course) => html`<article class="course"><div><strong>${course.courseName}</strong><span>${course.teacherName} · ${course.key}</span></div><button class="remove" ?disabled=${this.running} @click=${() => this.onRemove?.(course.key)}>删除</button></article>`) : html`<div class="empty">还没有待提交课程</div>`}
      </section>` : null}`;
  }
  #add() { const input = this.renderRoot.querySelector<HTMLInputElement>("#codes"); if (!input?.value.trim()) return; this.onAdd?.(input.value); input.value = ""; }
  #toggle(label: string, key: keyof Settings["mode"]) { return html`<label><input type="checkbox" .checked=${Boolean(this.settings?.mode[key])} @change=${(event: Event) => this.#setMode(key, (event.target as HTMLInputElement).checked)}>${label}</label>`; }
  #setMode(key: keyof Settings["mode"], value: boolean) { this.onSettingsChange?.({ ...this.settings, mode: { ...this.settings.mode, [key]: value } }); }
  #interval() { const mode = this.settings?.mode.isAsync ? "async" : "sync"; const type = this.settings?.mode.isGrouped ? "group" : "single"; return this.settings?.interval[mode][type] ?? 300; }
  #setInterval = (event: Event) => { const value = Number((event.target as HTMLInputElement).value); if (!Number.isFinite(value)) return; const mode = this.settings.mode.isAsync ? "async" : "sync"; const type = this.settings.mode.isGrouped ? "group" : "single"; this.onSettingsChange?.({ ...this.settings, interval: { ...this.settings.interval, [mode]: { ...this.settings.interval[mode], [type]: value } } }); };
  #setPageSize = (event: Event) => this.onSettingsChange?.({ ...this.settings, search: { ...this.settings.search, pageSize: Number((event.target as HTMLInputElement).value) } });
  #setPageDelay = (event: Event) => this.onSettingsChange?.({ ...this.settings, search: { ...this.settings.search, pageDelay: Number((event.target as HTMLInputElement).value) } });
}
customElements.define("seu-grab-lessons-app", GrabLessonsApp);
