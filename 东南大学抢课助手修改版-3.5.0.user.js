// ==UserScript==
// @name        东南大学选课助手（稳定版）
// @namespace   http://tampermonkey.net/
// @version     3.5.0
// @description 适配2026选课页面；保留原面板，等待队列最终结果，防止重复提交
// @author      july, nada
// @license     MIT
// @match       https://newxk.urp.seu.edu.cn/xsxk/elective/grablessons*
// @run-at      document-idle
// @grant       none
// ==/UserScript==

(async function () {
  'use strict';
  // Pure protocol/state logic. The userscript build embeds this factory unchanged.
function createSeuCore() {
  const codeOf = value => String(value ?? '');
  const terminal = state => ['success', 'failed', 'cancelled'].includes(state);
  const keyOf = course => `${course.courseBatch}:${course.classID}`;
  const pending = state => ['submitting', 'queued', 'unknown'].includes(state);

  function groupSize(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(parsed))) : 3;
  }

  function intervalMs(value, grouped = false) {
    const parsed = Number(value);
    const minimum = grouped ? 1000 : 1;
    return Number.isFinite(parsed) ? Math.max(minimum, Math.min(60000, Math.trunc(parsed))) : 1000;
  }

  function parseCodes(value) {
    return [...new Set(String(value || '').toUpperCase().split(/[\s,，;；]+/).filter(Boolean))];
  }

  function findCourse(code, rows, type, batch) {
    for (const course of rows || []) {
      const classes = Array.isArray(course.tcList) ? course.tcList : [course];
      for (const teacher of classes) {
        if (`${course.KCH ?? teacher.KCH}${teacher.KXH ?? ''}`.toUpperCase() !== code) continue;
        if (!teacher.JXBID || !teacher.secretVal) return null;
        return {
          courseBatch: String(batch), classID: String(teacher.JXBID), courseType: type,
          secretVal: teacher.secretVal, courseName: course.KCM || teacher.KCM || code,
          teacherName: teacher.SKJS || '', department: teacher.KKDW || course.KKDW || '',
          location: teacher.YPSJDD || '', selectedCount: teacher.YXRS ?? teacher.numberOfSelected ?? '',
          totalCapacity: teacher.KRL ?? teacher.classCapacity ?? '',
          courseNature: teacher.KCXZ || course.KCXZ || '', courseCategory: teacher.KCLB || course.KCLB || '',
          hasTest: codeOf(teacher.hasTest) === '1', hasBook: codeOf(teacher.hasBook) === '1',
          selected: codeOf(teacher.SFYX) === '1', status: 'ready', message: '',
        };
      }
    }
    return null;
  }

  function containsClass(rows, classID) {
    if (!Array.isArray(rows)) throw new Error('已选课程响应结构变化，请在官网核实结果');
    return rows.some(row => String(row.JXBID ?? '') === String(classID) ||
      (Array.isArray(row.tcList) && containsClass(row.tcList, classID)));
  }

  class Ledger {
    constructor(onChange = () => {}) { this.records = new Map(); this.onChange = onChange; }
    start(course) {
      const key = keyOf(course);
      const old = this.records.get(key);
      if (old && pending(old.state)) return null;
      const record = { course, state: 'submitting', message: '正在提交', listeners: new Set() };
      this.records.set(key, record);
      this.change(record, 'submitting', record.message);
      return record;
    }
    restore(course) {
      const record = { course, state: 'unknown', message: '上次提交结果待核实', listeners: new Set() };
      this.records.set(keyOf(course), record);
      return record;
    }
    change(record, state, message) {
      // A WebSocket result can arrive before the HTTP acknowledgement.
      if (terminal(record.state)) return;
      record.state = state;
      record.message = message || '';
      this.onChange(record);
      for (const fn of record.listeners) fn();
    }
    receive(packet, batch) {
      if (!packet || packet.code == null || packet.data === 'heart' || codeOf(packet.data?.operationType) !== '1') return false;
      const data = packet.data;
      if (data.batchId != null && String(data.batchId) !== String(batch)) return false;
      const record = this.records.get(`${batch}:${data.clazzId}`);
      if (!record || !pending(record.state)) return false;
      this.change(record, codeOf(packet.code) === '200' ? 'success' : 'failed', packet.msg || '服务器返回选课处理结果');
      return true;
    }
    wait(record, timeoutMs, signal) {
      if (terminal(record.state) || signal?.aborted) return Promise.resolve(record.state);
      return new Promise(resolve => {
        const done = () => {
          clearTimeout(timer);
          record.listeners.delete(check);
          signal?.removeEventListener('abort', done);
          resolve(record.state);
        };
        const check = () => { if (terminal(record.state)) done(); };
        const timer = setTimeout(done, timeoutMs);
        record.listeners.add(check);
        signal?.addEventListener('abort', done, { once: true });
        if (signal?.aborted) done();
      });
    }
  }

  async function attempt({ course, ledger, submit, confirm, verify, signal, timeoutMs = 20000 }) {
    if (signal?.aborted) return 'cancelled';
    const record = ledger.start(course);
    if (!record) return 'unknown'; // Never replay an unresolved submission.
    try {
      let response = await submit({ clazzType: course.courseType, clazzId: course.classID, secretVal: course.secretVal });
      if (terminal(record.state)) return record.state;
      if (codeOf(response?.code) === '301') {
        const confirmed = signal?.aborted ? false : await untilStopped(confirm(response.msg || '此课程需要再次确认'), signal);
        if (!confirmed) {
          ledger.change(record, 'cancelled', '已取消二次确认');
          return record.state;
        }
        if (signal?.aborted) {
          ledger.change(record, 'cancelled', '已停止');
          return record.state;
        }
        response = await submit({ clazzType: course.courseType, clazzId: course.classID, secretVal: course.secretVal, isConfirm: 1 });
      }
      if (terminal(record.state)) return record.state;
      if (codeOf(response?.code) !== '200') {
        ledger.change(record, 'failed', response?.msg || '服务器拒绝提交');
        return record.state;
      }
      ledger.change(record, 'queued', '已入队，等待最终结果');
      await ledger.wait(record, timeoutMs, signal);
      if (terminal(record.state)) return record.state;
      if (!signal?.aborted && await verify(course)) {
        ledger.change(record, 'success', '已在官方已选课程记录中确认');
        return record.state;
      }
      ledger.change(record, 'unknown', '结果待核实：停止重复提交，请查看官网已选课程');
    } catch (error) {
      // Timeout/abort/invalid JSON after POST does not prove that the server rejected it.
      if (!terminal(record.state)) ledger.change(record, error?.definitive ? 'failed' : 'unknown', error?.message || '网络中断，提交结果待核实');
    }
    return record.state;
  }

  function delay(ms, signal) {
    if (signal?.aborted) return Promise.resolve();
    return new Promise(resolve => {
      const finish = () => { clearTimeout(timer); signal?.removeEventListener('abort', finish); resolve(); };
      const timer = setTimeout(finish, Math.max(0, ms));
      signal?.addEventListener('abort', finish, { once: true });
      if (signal?.aborted) finish();
    });
  }

  function untilStopped(promise, signal) {
    if (signal?.aborted) return Promise.resolve(false);
    return new Promise((resolve, reject) => {
      const stop = () => { cleanup(); resolve(false); };
      const cleanup = () => signal?.removeEventListener('abort', stop);
      signal?.addEventListener('abort', stop, { once: true });
      Promise.resolve(promise).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
      if (signal?.aborted) stop();
    });
  }

  async function run({ getCourses, send, mode, interval, signal, sleep = delay }) {
    const active = new Map();
    let rounds = 0;
    let failed = false, failure;
    const width = mode.isGrouped ? groupSize(mode.groupSize) : 1;
    const pauseMs = intervalMs(interval, mode.isGrouped);
    const limit = mode.isCyclic ? (mode.cycleCount > 0 ? mode.cycleCount : Infinity) : 1;
    try {
      while (!signal.aborted && !failed && rounds++ < limit) {
        const courses = getCourses().filter(c => !pending(c.status) && c.status !== 'cancelled');
        if (!courses.length) break;
        for (let i = 0; i < courses.length && !signal.aborted && !failed; i += width) {
          const batch = [];
          for (const course of courses.slice(i, i + width)) {
            if (signal.aborted || failed) break;
            const key = keyOf(course);
            if (active.has(key)) continue;
            while (active.size >= width && !signal.aborted && !failed) await Promise.race(active.values());
            if (signal.aborted || failed) break;
            // Observe async failures immediately, even while the scheduler sleeps.
            const task = Promise.resolve().then(() => signal.aborted || failed ? undefined : send(course))
              .catch(error => { if (!failed) failure = error; failed = true; })
              .finally(() => active.delete(key));
            active.set(key, task);
            batch.push(task);
          }
          if (!mode.isAsync) await Promise.all(batch);
          if (!signal.aborted && !failed) await sleep(pauseMs, signal);
        }
        // A new cycle cannot overtake unresolved attempts from the previous cycle.
        await Promise.all(active.values());
      }
    } finally {
      await Promise.allSettled(active.values());
    }
    if (failed) throw failure;
  }

  function serializable(enrollDict, settings) {
    const cleanSettings = JSON.parse(JSON.stringify(settings));
    delete cleanSettings.token;
    const cleanCourses = {};
    for (const [key, course] of Object.entries(enrollDict)) {
      const clean = { ...course };
      delete clean.secretVal;
      delete clean.token;
      clean.status = pending(clean.status) ? 'unknown' : 'ready';
      clean.message = ''; // Do not persist server messages.
      cleanCourses[key] = clean;
    }
    return { version: 350, enrollDict: cleanCourses, settings: cleanSettings };
  }

  return { codeOf, pending, keyOf, groupSize, intervalMs, parseCodes, findCourse, containsClass, Ledger, attempt, delay, run, serializable };
}

  const core = createSeuCore();
  const started = Date.now();
  while (!(window.grablessonsVue?.lcParam?.currentBatch?.code && window.axios && document.getElementById('xsxkapp'))) {
    if (Date.now() - started > 30000) { console.warn('[东大选课助手] 页面未就绪，请进入课程列表后刷新'); return; }
    await core.delay(200);
  }
  if (document.getElementById('seu-helper-root')) return;
  const grablessonsVue = window.grablessonsVue;
  const tip = options => grablessonsVue.$message(options);
  const version = [3,5,0];
  let isRunning = false, shouldStop = false;
  let enrollDict = {};
  const defaultSettings = {
    savedCourseCodes: '',
    mode: {isAsync: false, isCyclic: true, isGrouped: false, groupSize: 3, cycleCount: -1, enableSearch: true},
    interval: {sync: {single: 1000, group: 1000}, async: {single: 1000, group: 1000}},
    search: {pageSize: 20, pageDelay: 1000}, announcement: {hasRead: false}
  };
  let settings = JSON.parse(JSON.stringify(defaultSettings));
  const Components = {};
  const app = document.createElement('div');
  app.id = 'seu-helper-root';
  document.body.appendChild(app);
  // 组件生成
  ((self) => {
    // 生成组件
    self.mount = () => {
      self.createTag();
      self.createPanel();
      self.createMask();
      self.addEnrollButton();
    };

    // 生成节点
    self.createNode = ({ tagName, text, HTML, obj, ev, children }) => {
      let node = document.createElement(tagName);
      if (obj) {
        for (let key of Object.keys(obj)) {
          node.setAttribute(key, obj[key]);
        }
      }
      if (text) {
        node.textContent = String(text);
      }
      if (HTML) {
        node.innerHTML = HTML;
      }
      if (ev) {
        for (let key of Object.keys(ev)) {
          node.addEventListener(key, ev[key]);
        }
      }
      if (children) {
        children.map((x) => node.appendChild(x));
      }
      return node;
    };

    // 生成打开和关闭面板的按钮
    self.createTag = () => {
      let node = self.createNode({
        tagName: "div",
        obj: {
          class: "slideMenu",
          style: `
              position: fixed;
              top: 250px;
              left:30px;width:
              40px;z-index: 1314;
          `,
        },
        children: [
          self.createNode({
            tagName: "div",
            obj: {
              class: "centre-btn item el-icon-date",
              style: `background-color: #2b2b2b`,
            },
            ev: {
              mousedown: (e) => {
                methods.drag(e, node);
              },
            },
          }),
        ],
      });
      app.appendChild(node);
    };

    // 生成面板
    self.createPanel = () => {
      app.appendChild(
        self.createNode({
          tagName: "div",
          obj: {
            id: "seu-panel",
            style: `
              position: fixed;
              right: 0;
              top:0 ;
              z-index: 520;
              width: 350px;
              height: 100%;
              background-color: rgba(61,72,105,0.8);
              display: block;
            `,
          },
          children: [
            self.createNode({ tagName: "hr" }),
            self.createNode({
              tagName: "h1",
              text: "东大抢课脚本",
              obj: {
                style: "color: #c7e6e6; text-align: center",
              },
            }),
            self.createNode({ tagName: "hr" }),
            self.createNode({
              tagName: "input",
              obj: {
                id: "seu-input-box",
                class: "el-input__inner",
                style: `
                  width: 96%;
                  margin-left: 2%;
                  height: 30px
                `,
                placeholder: "输入课程代码(不区分大小写)，按回车确定",
              },
              ev: {
                keydown: methods.enter,
              },
            }),
            self.createNode({
              tagName: "div",
              obj: {
                id: "seu-list-wrap",
                style: `
                  overflow: auto;
                  margin: 10px;
                  border:1px solid white;
                  height: 75%
                `,
              },
            }),
            self.createNode({
              tagName: "button",
              obj: {
                id: "seu-enroll-button",
                class: "el-button el-button--primary el-button--small is-round",
                style: `
                  margin: 20px;
                  position: absolute;
                  right:50%;
                  bottom:5%
                `,
              },
              text: "一键抢课",
              ev: {
                click: async () => {
                  if (shouldStop) {
                    tip({
                      type: "error",
                      message: "请稍候，正在终止上一个抢课进程",
                      duration: 1000,
                    });
                    return;
                  }
                  if (isRunning) {
                    return;
                  }
                  isRunning = true;
                  methods.updateUIState();
                  methods.enroll();
                },
              },
            }),
            self.createNode({
              tagName: "button",
              obj: {
                id: "seu-settings-stop-button",
                class: `el-button el-button--${
                  isRunning ? "danger" : "info"
                } el-button--small is-round`,
                style: `
                  margin: 20px;
                  position: absolute;
                  right:20%;
                  bottom:5%
                `,
              },
              text: isRunning ? "停止抢课" : "更多设置",
              ev: {
                click: async () => {
                  if (isRunning) {
                    await methods.stopEnrolling();
                  } else {
                    document.getElementById("seu-mask").style.display = "block";
                    self.updatePopup(settings.mode.enableSearch, settings);
                  }
                },
              },
            }),
            self.createNode({
              tagName: "div",
              obj: {
                style: `
                      margin: 20px;
                      position: absolute;
                      right:2%;
                      bottom:1%;
                      color: white;
                      float: right
                  `,
              },
              text: "ver" + version.join("."),
            }),
          ],
        })
      );
      self.reloadList();
    };

    // 生成抢课表格
    self.reloadList = () => {
      let list_wrap = document.querySelector("#seu-panel #seu-list-wrap");
      list_wrap.innerHTML = "";
      if (JSON.stringify(enrollDict) === "{}") {
        list_wrap.innerHTML =
          "<h3 style='text-align: center;color:lightblue;margin-top: 50%'>还未选择课程</h3>";
      } else {
        list_wrap.appendChild(
          self.createNode({
            tagName: "table",
            obj: {
              width: "100%",
              border: "1",
              style: `
                background-color: rgba(0,0,0,0);
                color: lightblue
            `,
            },
            children: [
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `
                    height: 30px;
                    background-color: #255e95
                `,
                },
                HTML: `
                <th style="text-align:center;width: 55%">课程</th>
                <th style="text-align:center;width: 15%">教师</th>
                <th style="text-align:center;width: 30%">操作</th>
              `,
              }),
              ...Object.keys(enrollDict)
                .filter(
                  (key) =>
                    enrollDict[key].courseBatch ===
                    grablessonsVue.lcParam.currentBatch.code
                )
                .map((key) => {
                  return self.createNode({
                    tagName: "tr",
                    obj: {
                      style: `height: 30px`,
                    },
                    children: [
                      self.createNode({
                        tagName: "td",
                        obj: {
                          style: `text-align: center`,
                        },
                        text: methods.displayCourse(enrollDict[key]),
                      }),
                      self.createNode({
                        tagName: "td",
                        obj: {
                          style: `text-align: center`,
                        },
                        text: enrollDict[key].teacherName,
                      }),
                      self.createNode({
                        tagName: "td",
                        obj: {
                          style: `text-align: center`,
                        },
                        children: [
                          self.createNode({
                            tagName: "button",
                            text: "删除",
                            obj: {
                              class: "delete-button",
                              style: `
                                color: red;
                                background: transparent;
                                border: 1px solid red;
                                border-radius: 6px;
                                text-align: center;
                                cursor: pointer;
                                text-decoration: none;
                                margin-right: 2px
                              `,
                            },
                            ev: {
                              click: () => {
                                const course = enrollDict[key];
                                if (core.pending(course.status)) {
                                  if (!window.confirm('本课程的服务器处理结果尚未确认。删除只移除本地记录，不会取消服务器队列；重新添加后可能再次提交。请先核实官网结果，确认仍要删除本地记录吗？')) return;
                                  ledger.records.delete(core.keyOf(course));
                                }
                                delete enrollDict[key];
                                methods.saveData();
                                tip({
                                  type: "success",
                                  message: `${course.teacherName} 的 ${course.courseName} 已删除`,
                                  duration: 1000,
                                });
                                self.reloadList();
                              },
                            },
                          }),
                          self.createNode({
                            tagName: "button",
                            text: "更多",
                            obj: {
                              style: `
                                color: orange;
                                background: transparent;
                                border: 1px solid orange;
                                border-radius: 6px;
                                text-align: center;
                                cursor: pointer;
                                text-decoration: none;
                                margin-left: 2px
                              `,
                            },
                            ev: {
                              click: () => {
                                document.getElementById("seu-mask").style.display =
                                  "block";
                                self.createPopUp(
                                  "详细信息",
                                  self.showCourseDetails(enrollDict[key]),
                                  null,
                                  40,
                                  50
                                );
                              },
                            },
                          }),
                        ],
                      }),
                    ],
                  });
                }),
            ],
          })
        );
      }
    };

    // 生成遮罩
    self.createMask = () => {
      let node = self.createNode({
        tagName: "div",
        obj: {
          id: "seu-mask",
          style: `
              position: fixed;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              z-index: 2002;
              background-color: rgba(66, 66, 66, 0.6);
              display: none
          `,
        },
        ev: {
          click: () => {
            node.style.display = "none";
            document.querySelectorAll(".seu-temp").forEach((el) => {
              if (el.parentNode) el.parentNode.removeChild(el);
            });
          },
        },
      });
      app.appendChild(node);
    };

    // 生成弹出窗
    self.createPopUp = (title, node, onConfirm, width, height, onExtend) => {
      const popupNode = self.createNode({
        tagName: "div",
        obj: {
          class: "seu-temp",
          style: `
            position: fixed;
            left: ${width ? 50 - 0.5 * width : 30}%;
            top: ${height ? 50 - 0.5 * height : 30}%;
            width: ${width || 40}%;
            height: ${height || 40}%;
            z-index: 2021;
            background-color: white;
            border-radius: 30px;
            overflow: auto;
          `,
        },
        children: [
          self.createNode({
            tagName: "h1",
            obj: {
              style: `
                margin: 20px 0;
                width: 100%;
                text-align: center;
              `,
            },
            text: title,
          }),
          node,
          self.createNode({
            tagName: "div",
            obj: {
              style: `
                position: absolute;
                width: 80%;
                left: 10%;
                bottom: 10%;
                display: flex;
                justify-content: space-between;
                align-items: center;
              `,
            },
            children: [
              // 左侧按钮组
              self.createNode({
                tagName: "div",
                obj: {
                  style: "display: flex; gap: 10%;",
                },
                children: [
                  ...(onExtend
                    ? [
                        self.createNode({
                          tagName: "button",
                          obj: {
                            class:
                              "el-button el-button--primary el-button--large is-round",
                          },
                          text: "更多",
                          ev: { click: onExtend },
                        }),
                      ]
                    : []),
                  // 如果存在其他temp类元素,说明当前不是第一层弹窗
                  ...(document.querySelectorAll(".seu-temp").length > 0
                    ? [
                        self.createNode({
                          tagName: "button",
                          obj: {
                            class:
                              "el-button el-button--warning el-button--large is-round",
                          },
                          text: "返回",
                          ev: {
                            click: () => {
                              // 移除当前弹窗
                              if (popupNode.parentNode) {
                                popupNode.parentNode.removeChild(popupNode);
                              }
                            },
                          },
                        }),
                      ]
                    : []),
                ],
              }),
              // 右侧确认按钮
              self.createNode({
                tagName: "button",
                obj: {
                  class:
                    "el-button el-button--default el-button--large is-round",
                },
                text: "确定",
                ev: {
                  click: () => {
                    if (onConfirm) onConfirm();
                    if (document.querySelectorAll(".seu-temp").length > 1) {
                      if (popupNode.parentNode) {
                        popupNode.parentNode.removeChild(popupNode);
                      }
                    } else {
                      // 否则清除所有弹窗
                      document.getElementById("seu-mask").style.display = "none";
                      document.querySelectorAll(".seu-temp").forEach((el) => {
                        if (el.parentNode) el.parentNode.removeChild(el);
                      });
                    }
                  },
                },
              }),
            ],
          }),
        ],
        ev: {
          // 阻止默认的表单提交行为
          submit: (e) => e.preventDefault(),
          // 阻止回车冒泡
          keydown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
            }
          },
        },
      });

      app.appendChild(popupNode);
      return popupNode;
    };

    self.currentPopup = null;

    // 更新弹窗
    self.updatePopup = (enableSearch, tempSettings) => {
      // 如果存在旧弹窗，先移除
      if (self.currentPopup && self.currentPopup.parentNode) {
        self.currentPopup.parentNode.removeChild(self.currentPopup);
      }

      const mainSettings = self.showSettings(tempSettings);

      // 创建新弹窗
      self.currentPopup = self.createPopUp(
        "设置",
        mainSettings.node,
        () => {
          Object.assign(settings, mainSettings.tempSettings);
          methods.saveData();
          tip({
            type: "success",
            message: "设置已保存",
            duration: 1000,
          });
        },
        30,
        45,
        () => {
              const searchSettings = self.showSearchSettings(mainSettings.tempSettings);
              self.createPopUp(
                "更多设置",
                searchSettings.node,
                () => {
                  mainSettings.tempSettings.mode.groupSize = searchSettings.tempSettings.mode.groupSize;
                  mainSettings.tempSettings.search = searchSettings.tempSettings.search;
                  Object.assign(settings, JSON.parse(JSON.stringify(mainSettings.tempSettings)));
                  methods.saveData();
                  tip({
                    type: "success",
                    message: "设置已保存",
                    duration: 1000,
                  });
                },
                30,
                45
              );
            }
      );
    };

    // 数值输入框
    self.createNumberInput = (options) => {
      const {
        value, // 初始值
        min, // 最小值
        max, // 最大值
        step, // 步进值
        style, // 样式
        onSave, // 保存回调
        updateValue, // 值更新回调(可选)
      } = options;

      let inputElement = null;
      let currentBaseValue = value;

      // 自动保存函数
      const autoSave = () => {
        if (!inputElement) return;
        const parsed = Number(inputElement.value);
        const candidate = inputElement.value.trim() && Number.isFinite(parsed) ? Math.trunc(parsed) : currentBaseValue;
        const currentValue = Math.max(Number(inputElement.min), Math.min(Number(inputElement.max), candidate));
        inputElement.value = currentValue;
        onSave(currentValue);
        currentBaseValue = currentValue;
      };

      // 创建输入框
      inputElement = self.createNode({
        tagName: "input",
        obj: {
          class: "el-input__inner",
          type: "number",
          value: value,
          min: min,
          max: max,
          step: step,
          style:
            style ||
            "width: 60%; margin-left: 2%; margin-right: 2%; height: 30px",
        },
        ev: {
          blur: autoSave, // 失去焦点时自动保存
          wheel: (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -parseInt(step) : parseInt(step);
            const newValue = Math.max(
              parseInt(inputElement.min),
              Math.min(parseInt(inputElement.max), parseInt(e.target.value) + delta)
            );
            e.target.value = newValue;
            autoSave(); // 滚轮修改后立即保存
            if (updateValue) updateValue(newValue);
          },
          keydown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              autoSave(); // 按回车时自动保存
              e.target.blur(); // 失去焦点
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const delta =
                e.key === "ArrowUp" ? parseInt(step) : -parseInt(step);
              const newValue = Math.max(
                parseInt(inputElement.min),
                Math.min(parseInt(inputElement.max), parseInt(e.target.value) + delta)
              );
              e.target.value = newValue;
              autoSave(); // 方向键修改后立即保存
              if (updateValue) updateValue(newValue);
            }
          },
        },
      });

      return {
        input: inputElement,
      };
    };

    // 设置
    self.showSettings = (tempSettings) => {
      tempSettings = tempSettings
        ? JSON.parse(JSON.stringify(tempSettings))
        : JSON.parse(JSON.stringify(settings));

      const intervalInput = self.createNumberInput({
        value: methods.getCurrentInterval(tempSettings),
        min: tempSettings.mode.isGrouped ? "1000" : "1",
        max: "60000",
        step: "1",
        onSave: (value) => {
          const mode = tempSettings.mode.isAsync ? "async" : "sync";
          const type = tempSettings.mode.isGrouped ? "group" : "single";
          tempSettings.interval[mode][type] = value;
        },
      });

      intervalInput.input.id = "seu-interval";
      intervalInput.input.setAttribute("aria-label", "发送间隔（毫秒）");
      const settingsNode = self.createNode({
        tagName: "div",
        obj: {
          style: "margin-left: 10%",
        },
        children: [
          // 抢课方式选择
          self.createNode({
            tagName: "div",
            obj: {
              style: "margin-bottom: 5%",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "抢课方式：",
                obj: {
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "cycle-mode",
                  id: "single-cycle",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isCyclic = !e.target.checked;
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 单次抢课",
                obj: {
                  for: "single-cycle",
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "cycle-mode",
                  id: "multi-cycle",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isCyclic = e.target.checked;
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 循环抢课",
                obj: {
                  for: "multi-cycle",
                },
              }),
            ],
          }),
          // 发送模式选择
          self.createNode({
            tagName: "div",
            obj: {
              style: "margin-bottom: 5%",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "发送模式：",
                obj: {
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "send-mode",
                  id: "sync-mode",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isAsync = !e.target.checked;
                    const newValue = methods.getCurrentInterval(tempSettings);
                    intervalInput.input.value = newValue;
                    intervalInput.input.min = tempSettings.mode.isGrouped ? "1000" : "1";
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 同步模式",
                obj: {
                  for: "sync-mode",
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "send-mode",
                  id: "async-mode",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isAsync = e.target.checked;
                    const newValue = methods.getCurrentInterval(tempSettings);
                    intervalInput.input.value = newValue;
                    intervalInput.input.min = tempSettings.mode.isGrouped ? "1000" : "1";
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 异步模式",
                obj: {
                  for: "async-mode",
                },
              }),
            ],
          }),
          // 发送方式选择
          self.createNode({
            tagName: "div",
            obj: {
              style: "margin-bottom: 5%",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "发送方式：",
                obj: {
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "group-mode",
                  id: "single-send",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isGrouped = !e.target.checked;
                    const newValue = methods.getCurrentInterval(tempSettings);
                    intervalInput.input.value = newValue;
                    intervalInput.input.min = tempSettings.mode.isGrouped ? "1000" : "1";
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 单个发送",
                obj: {
                  for: "single-send",
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "group-mode",
                  id: "group-send",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isGrouped = e.target.checked;
                    const newValue = methods.getCurrentInterval(tempSettings);
                    intervalInput.input.value = newValue;
                    intervalInput.input.min = tempSettings.mode.isGrouped ? "1000" : "1";
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 分组发送",
                obj: {
                  for: "group-send",
                },
              }),
            ],
          }),
          // 时间间隔设置
          self.createNode({
            tagName: "div",
            obj: {
              style: "display: flex; align-items: center",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "时间间隔(ms)：",
                obj: {
                  style: "margin-right: 10px",
                },
              }),
              intervalInput.input,
            ],
          }),
          // 搜索功能启用开关
          self.createNode({
            tagName: "div",
            obj: {
              style: "margin-top: 5%",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "启用搜索功能：",
                obj: {
                  style: "margin-right: 5%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "checkbox",
                  id: "enable-search",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.enableSearch = e.target.checked;
                    self.updatePopup(e.target.checked, tempSettings);
                  },
                },
              }),
            ],
          }),
        ],
      });

      // 创建完成后进行初始化
      setTimeout(() => {
        // 获取所有需要初始化的单选按钮
        const singleCycleInput = settingsNode.querySelector("#single-cycle");
        const multiCycleInput = settingsNode.querySelector("#multi-cycle");
        const syncModeInput = settingsNode.querySelector("#sync-mode");
        const asyncModeInput = settingsNode.querySelector("#async-mode");
        const singleSendInput = settingsNode.querySelector("#single-send");
        const groupSendInput = settingsNode.querySelector("#group-send");
        const enableSearchInput = settingsNode.querySelector("#enable-search");

        // 根据设置初始化抢课方式
        if (tempSettings.mode.isCyclic) {
          multiCycleInput.checked = true;
        } else {
          singleCycleInput.checked = true;
        }

        // 根据设置初始化发送模式
        if (tempSettings.mode.isAsync) {
          asyncModeInput.checked = true;
        } else {
          syncModeInput.checked = true;
        }

        // 根据设置初始化发送方式
        if (tempSettings.mode.isGrouped) {
          groupSendInput.checked = true;
        } else {
          singleSendInput.checked = true;
        }

        // 根据设置初始化搜索功能开关
        if (tempSettings.mode.enableSearch) {
          enableSearchInput.checked = true;
        }
      }, 0);

      return {
        node: settingsNode,
        tempSettings: tempSettings,
      };
    };

    // 搜索设置
    self.showSearchSettings = (source = settings) => {
      // 创建临时设置对象和引用变量
      const tempSettings = JSON.parse(JSON.stringify(source));

      const groupSizeInput = self.createNumberInput({
        value: tempSettings.mode.groupSize,
        min: "1", max: String(Number.MAX_SAFE_INTEGER), step: "1",
        onSave: value => { tempSettings.mode.groupSize = core.groupSize(value); },
      });
      groupSizeInput.input.id = "seu-group-size";
      const pageSizeInput = self.createNumberInput({
        value: tempSettings.search.pageSize,
        min: "10",
        max: "100",
        step: "10",
        onSave: (value) => {
          tempSettings.search.pageSize = value;
        },
      });

      const pageDelayInput = self.createNumberInput({
        value: tempSettings.search.pageDelay,
        min: "1000",
        max: "60000",
        step: "100",
        onSave: (value) => {
          tempSettings.search.pageDelay = value;
        },
      });

      const settingsNode = self.createNode({
        tagName: "div",
        obj: { style: "margin: 10%" },
        children: [
          self.createNode({
            tagName: "div",
            obj: { style: "margin-bottom: 5%" },
            children: [
              self.createNode({ tagName: "label", text: "每组课程数：", obj: { for: "seu-group-size", style: "margin-right: 10%" } }),
              groupSizeInput.input,
            ],
          }),
          // 每页数量设置
          self.createNode({
            tagName: "div",
            obj: { style: "margin-bottom: 5%" },
            children: [
              self.createNode({
                tagName: "label",
                text: "每页数量：",
                obj: { style: "margin-right: 10%" },
              }),
              pageSizeInput.input,
            ],
          }),
          // 翻页延迟设置
          self.createNode({
            tagName: "div",
            obj: { style: "margin-bottom: 5%" },
            children: [
              self.createNode({
                tagName: "label",
                text: "翻页延迟：",
                obj: { style: "margin-right: 10%" },
              }),
              pageDelayInput.input,
            ],
          }),
        ],
      });

      return {
        node: settingsNode,
        tempSettings: tempSettings,
      };
    };

    // 生成课程详情信息
    self.showCourseDetails = (course) => {
      return self.createNode({
        tagName: "div",
        obj: {
          style: `margin:5%`,
        },
        children: [
          self.createNode({
            tagName: "table",
            obj: {
              width: "80%",
              border: "1",
              style: `
            background-color: rgba(0,0,0,0);
            color: black;
            margin: 0 auto;
          `,
            },
            children: [
              // 表头
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `
                height: 30px;
                background-color: #255e95;
                color: lightblue;
              `,
                },
                HTML: `
              <th style="text-align:center;width: 30%">属性</th>
              <th style="text-align:center;width: 70%">值</th>
            `,
              }),
              // 课程号和课程名
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "课程信息",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: `${methods.displayCourse(course)} ${course.message || ""}`,
                  }),
                ],
              }),
              // 学院和教师
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "开课单位/教师",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: `${course.department} ${course.teacherName}`,
                  }),
                ],
              }),
              // 授课地点
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "授课地点",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: course.location || "待定",
                  }),
                ],
              }),
              // 课程性质和类别
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "课程属性",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: `${course.courseNature} ${course.courseCategory}`,
                  }),
                ],
              }),
              // 选课人数
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "选课人数",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: `${course.selectedCount}/${course.totalCapacity}`,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    };

    // 显示公告弹窗
    self.showAnnouncement = () => {
      // 显示弹窗时立即标记为已读
      settings.announcement.hasRead = true;
      methods.saveData();

      const announcementNode = self.createNode({
        tagName: "div",
        obj: {
          style: `
            margin: 5% 10%;
            padding: 20px;
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 10px;
          `,
        },
        children: [
          self.createNode({
            tagName: "p",
            obj: {
              style: `
                color: #333;
                line-height: 1.8;
                text-indent: 2em;
                margin-bottom: 10px;
              `,
            },
            text: "请各位同学秉持诚信原则参与选课，严禁使用脚本、代码等任何手段(无论有意或无意)干扰、破坏选课秩序；学校将对选课数据进行后台异常监测，一经查实违规行为，将直接判定选课结果无效，并根据情节轻重依规给予相应纪律处分。",
          }),
          self.createNode({
            tagName: "p",
            obj: {
              style: `
                color: #333;
                line-height: 1.8;
                text-indent: 2em;
              `,
            },
            text: "在此提醒大家，自觉抵制各类非法课程资源交易。若发现网上存在非法售卖本校课程资源、诱导同学参与违规交易等情况，请第一时间向学院或教务处提供线索。让我们携手监督、共同行动，以实际行动维护公平、诚信、有序的选课氛围，筑牢校园学术诚信防线。",
          }),
        ],
      });

      // 关闭公告弹窗的函数（需要在使用前定义）
      const closeAnnouncement = () => {
        const mask = document.getElementById("seu-mask");
        if (mask) mask.style.display = "none";
        if (popupNode && popupNode.parentNode) {
          popupNode.parentNode.removeChild(popupNode);
        }
      };

      const popupNode = self.createNode({
        tagName: "div",
        obj: {
          class: "announcement-popup",
          style: `
            position: fixed;
            left: 25%;
            top: 20%;
            width: 50%;
            max-height: 60%;
            z-index: 2021;
            background-color: white;
            border-radius: 30px;
            overflow: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          `,
        },
        children: [
          self.createNode({
            tagName: "h1",
            obj: {
              style: `
                margin: 20px 0;
                width: 100%;
                text-align: center;
                color: #d9534f;
              `,
            },
            text: "特别提醒（转）",
          }),
          announcementNode,
          self.createNode({
            tagName: "div",
            obj: {
              style: `
                position: relative;
                width: 80%;
                left: 10%;
                margin: 20px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
              `,
            },
            children: [
              self.createNode({
                tagName: "div",
                obj: {
                  style: "display: flex; align-items: center;",
                },
                children: [
                  self.createNode({
                    tagName: "input",
                    obj: {
                      type: "checkbox",
                      id: "dont-show-again",
                      checked: true,
                      style: "margin-right: 8px; cursor: pointer;",
                    },
                    ev: {
                      change: (e) => {
                        settings.announcement.hasRead = e.target.checked;
                        methods.saveData();
                      },
                    },
                  }),
                  self.createNode({
                    tagName: "label",
                    text: "不再弹出",
                    obj: {
                      for: "dont-show-again",
                      style: "cursor: pointer; user-select: none;",
                    },
                  }),
                ],
              }),
              self.createNode({
                tagName: "button",
                obj: {
                  class:
                    "el-button el-button--primary el-button--large is-round",
                },
                text: "我知道了",
                ev: {
                  click: closeAnnouncement,
                },
              }),
            ],
          }),
        ],
      });

      // 显示遮罩，并设置点击事件
      const mask = document.getElementById("seu-mask");
      if (mask) {
        mask.style.display = "block";
        // 为遮罩添加一次性点击事件监听器
        const maskClickHandler = (e) => {
          if (e.target === mask) {
            closeAnnouncement();
            mask.removeEventListener("click", maskClickHandler);
          }
        };
        mask.addEventListener("click", maskClickHandler);
      }

      app.appendChild(popupNode);
    };

  })(Components);

  // Embedded inside the userscript, after the retained v3 UI definitions.
  let searching = false;
  let runController = null;
  let runPromise = null;
  let attachedSocket = null;
  const controllers = new Set();
  const labels = { ready: '', submitting: '提交中', queued: '排队中', unknown: '待核实', failed: '失败', cancelled: '已取消' };
  const ledger = new core.Ledger(record => {
    const entry = Object.entries(enrollDict).find(([, course]) => core.keyOf(course) === core.keyOf(record.course));
    if (!entry) return;
    const [key, course] = entry;
    course.status = record.state;
    course.message = record.message;
    if (record.state === 'success') {
      delete enrollDict[key];
      tip({ type: 'success', message: `${course.courseName}：已确认选课成功`, duration: 3000 });
    } else if (['failed', 'unknown'].includes(record.state)) {
      tip({ type: 'warning', message: `${course.courseName}：${record.message}`, duration: 4000 });
    }
    methods.saveData();
    Components.reloadList();
    methods.updateUIState();
  });

  function batchId() { return String(grablessonsVue.lcParam.currentBatch.code); }
  function availableTypes() {
    const allowed = ['TJKC', 'FANKC', 'FAWKC', 'TYKC', 'XGKC'];
    const shown = (grablessonsVue.menuData?.menuList || []).map(item => item.teachingClassType);
    return allowed.filter(type => shown.includes(type));
  }
  function attachSocket() {
    const socket = grablessonsVue.sock;
    if (!socket || socket === attachedSocket) return;
    if (attachedSocket) attachedSocket.removeEventListener('message', onSocketMessage);
    attachedSocket = socket;
    socket.addEventListener('message', onSocketMessage);
  }
  function onSocketMessage(event) {
    try { ledger.receive(JSON.parse(event.data), batchId()); } catch { /* Ignore heartbeat/non-JSON frames. */ }
  }
  function clamp(value, min, max, fallback) {
    return Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Math.trunc(Number(value)))) : fallback;
  }
  function definitiveError(message) {
    runController?.abort();
    return Object.assign(new Error(message), { definitive: true });
  }
  function normalizeSettings() {
    for (const mode of ['sync', 'async']) {
      for (const kind of ['single', 'group']) settings.interval[mode][kind] = core.intervalMs(settings.interval[mode][kind], kind === 'group');
    }
    settings.mode.groupSize = core.groupSize(settings.mode.groupSize);
    settings.search.pageSize = clamp(settings.search.pageSize, 10, 100, 20);
    settings.search.pageDelay = clamp(settings.search.pageDelay, 1000, 60000, 1000);
    settings.mode.cycleCount = clamp(settings.mode.cycleCount, -1, 10000, -1) || 1;
  }
  async function post(path, data, { json = false, batch = batchId() } = {}) {
    const base = new URL(window.axios.defaults.baseURL, location.href);
    if (base.origin !== location.origin || base.pathname.replace(/\/$/, '') !== '/xsxk') throw definitiveError('官网接口地址变化，已停止提交');
    const authKey = window.axiosKey || 'Authorization';
    const auth = window.axios.defaults.headers[authKey] || window.axios.defaults.headers.common?.[authKey];
    if (!auth) throw definitiveError('请先在官网登录');
    const controller = new AbortController();
    controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${base.origin}/xsxk${path}`, {
        method: 'POST', credentials: 'same-origin', signal: controller.signal,
        headers: { [authKey]: auth, batchId: batch, 'Content-Type': json ? 'application/json' : 'application/x-www-form-urlencoded' },
        body: json ? JSON.stringify(data) : new URLSearchParams(data).toString(),
      });
      if (!response.ok) {
        if ([401, 403, 429].includes(response.status)) throw definitiveError(`官网拒绝请求（HTTP ${response.status}），已停止，请检查登录状态`);
        throw new Error(`官网请求返回 HTTP ${response.status}，请检查登录和网络`);
      }
      let body;
      try { body = await response.json(); } catch { throw new Error('官网返回了非 JSON 内容，请检查 VPN 或重新登录'); }
      if (['401', '402', '403', '429'].includes(core.codeOf(body?.code))) {
        throw definitiveError('登录失效或请求受限，已停止，请回官网检查');
      }
      if (!body || body.code == null) throw new Error('官网响应结构变化，已停止');
      return body;
    } finally {
      clearTimeout(timer);
      controllers.delete(controller);
    }
  }
  async function selectedRows() {
    const result = await post('/elective/select', {});
    if (core.codeOf(result.code) !== '200' || !Array.isArray(result.data)) throw new Error('无法核对已选课程，请在官网检查');
    return result.data;
  }

  let methods = {
    async init() {
      let raw;
      try { raw = JSON.parse(localStorage.getItem('july') || 'null'); }
      catch { tip({ type: 'warning', message: '旧配置无法读取，使用默认设置', duration: 3000 }); }
      if (raw?.settings && typeof raw.settings === 'object') {
        const merge = (target, source) => {
          for (const key of Object.keys(target)) {
            if (source?.[key] === undefined) continue;
            if (target[key] && typeof target[key] === 'object') merge(target[key], source[key]);
            else if (typeof target[key] === typeof source[key]) target[key] = source[key];
          }
        };
        merge(settings, raw.settings);
      }
      normalizeSettings();
      let restoreCodes = [];
      if (raw?.enrollDict && typeof raw.enrollDict === 'object') {
        for (const [code, saved] of Object.entries(raw.enrollDict)) {
          if (!saved || typeof saved !== 'object') continue;
          const { secretVal, token, ...course } = saved;
          course.courseBatch = String(course.courseBatch || '');
          if (!/^[A-Z0-9]+$/i.test(code) || !course.classID) continue;
          course.status = core.pending(course.status) ? 'unknown' : 'ready';
          course.message = course.status === 'unknown' ? '上次提交结果待核实' : '需要重新获取当前会话课程信息';
          enrollDict[code] = course;
          if (course.status === 'unknown') ledger.restore(course);
          if (course.courseBatch === batchId()) restoreCodes.push(code);
        }
      }
      attachSocket();
      const watch = setInterval(attachSocket, 500);
      window.addEventListener('pagehide', () => {
        clearInterval(watch);
        runController?.abort();
        for (const controller of controllers) controller.abort();
        attachedSocket?.removeEventListener('message', onSocketMessage);
      }, { once: true });
      Components.reloadList();
      methods.updateUIState();
      const input = document.getElementById('seu-input-box');
      input.value = core.parseCodes([settings.savedCourseCodes || '', ...restoreCodes].join(' ')).join(' ');
      // Restored course credentials always come from the current session.
      if (input.value) await methods.resolveCodes(input.value, true);
      methods.saveData();
      if (!settings.announcement.hasRead) Components.showAnnouncement();
    },
    saveData() {
      normalizeSettings();
      try { localStorage.setItem('july', JSON.stringify(core.serializable(enrollDict, settings))); }
      catch { tip({ type: 'warning', message: '本地设置未能保存，请勿在结果未明时刷新重试', duration: 3000 }); }
    },
    togglePanel() {
      const panel = document.getElementById('seu-panel');
      const open = panel.style.display !== 'block';
      panel.style.display = open ? 'block' : 'none';
      document.getElementById('seu-helper-toggle')?.setAttribute('aria-expanded', String(open));
    },
    drag(e, node) {
      if (e.button !== 0) return;
      let moved = false;
      const x = e.pageX - node.offsetLeft, y = e.pageY - node.offsetTop;
      document.onmousemove = event => { node.style.left = `${event.pageX - x}px`; node.style.top = `${event.pageY - y}px`; moved = true; };
      document.onmouseup = () => {
        document.onmousemove = document.onmouseup = null;
        if (!moved) methods.togglePanel();
      };
    },
    updateUIState() {
      const busy = isRunning || searching || shouldStop;
      for (const node of document.querySelectorAll('#seu-input-box, #seu-enroll-button, button.delete-button, button.add-course-button')) {
        node.disabled = busy;
        node.style.opacity = busy ? '0.5' : '1';
        node.style.cursor = busy ? 'not-allowed' : 'pointer';
      }
      const stop = document.getElementById('seu-settings-stop-button');
      if (stop) {
        stop.disabled = searching;
        stop.className = `el-button el-button--${isRunning ? 'danger' : 'info'} el-button--small is-round`;
        stop.textContent = shouldStop ? '正在停止' : isRunning ? '停止抢课' : '扩展设置';
      }
    },
    async enter(event) {
      if (event.key !== 'Enter' || isRunning || searching) return;
      event.preventDefault();
      await methods.resolveCodes(document.getElementById('seu-input-box').value);
    },
    async resolveCodes(value, restoring = false) {
      searching = true;
      methods.updateUIState();
      let remaining = core.parseCodes(value);
      try {
        remaining = methods.addEnrollDict(remaining.join(' '), null, null, !restoring, restoring);
        if (remaining.length && settings.mode.enableSearch) {
          for (const type of availableTypes()) {
            let page = 1;
            const seen = new Set();
            for (let pages = 0; remaining.length && pages < 500; pages++) {
              await core.delay(settings.search.pageDelay);
              const { courseList, total } = await methods.searchCourse(type, page, settings.search.pageSize);
              if (!courseList.length) break;
              const signature = JSON.stringify(courseList.map(c => [c.KCH, c.JXBID, c.tcList?.map(t => t.JXBID)]));
              if (seen.has(signature)) throw new Error('查询重复返回同一页，已停止翻页，请在官网查找剩余课程');
              seen.add(signature);
              remaining = methods.addEnrollDict(remaining.join(' '), type, courseList, false, restoring);
              if ((page - 1) * settings.search.pageSize + courseList.length >= total) break;
              // The official client caches up to three pages per response.
              page += Math.max(1, Math.ceil(courseList.length / settings.search.pageSize));
            }
            if (!remaining.length) break;
          }
        }
      } catch (error) { tip({ type: 'warning', message: error.message, duration: 4000 }); }
      finally {
        document.getElementById('seu-input-box').value = remaining.join(' ');
        settings.savedCourseCodes = remaining.join(' ');
        searching = false;
        methods.saveData();
        Components.reloadList();
        methods.updateUIState();
      }
    },
    addEnrollDict(value, type = null, rows = null, showTip = true, restoring = false) {
      type ||= grablessonsVue.teachingClassType;
      rows ||= grablessonsVue.courseList;
      const remaining = [];
      for (const code of core.parseCodes(value)) {
        const old = enrollDict[code];
        if (old?.secretVal && old.courseBatch === batchId() && !restoring) continue;
        const found = availableTypes().includes(type) ? core.findCourse(code, rows, type, batchId()) : null;
        if (!found) { remaining.push(code); continue; }
        if (old && core.pending(old.status) && core.keyOf(old) === core.keyOf(found)) {
          Object.assign(old, found, { status: old.status, message: old.message });
        } else enrollDict[code] = found;
        if (showTip) tip({ type: 'success', message: `${found.courseName} 已添加到本地待选列表`, duration: 1500 });
      }
      methods.saveData();
      Components.reloadList();
      methods.updateUIState();
      return remaining;
    },
    addSingleCourse(code) {
      if (!isRunning && !searching) methods.addEnrollDict(code);
    },
    getCurrentInterval(value) {
      return core.intervalMs(value.interval[value.mode.isAsync ? 'async' : 'sync'][value.mode.isGrouped ? 'group' : 'single'], value.mode.isGrouped);
    },
    async enroll() {
      if (runPromise || searching) return;
      isRunning = true;
      shouldStop = false;
      runController = new AbortController();
      const signal = runController.signal;
      const originalBatch = batchId();
      methods.updateUIState();
      runPromise = (async () => {
        if (String(grablessonsVue.lcParam.currentBatch.typeCode) === '01') throw new Error('当前为志愿轮次，请使用官网填写志愿；本版自动提交支持普通选课轮次');
        const selected = await selectedRows();
        for (const [key, course] of Object.entries(enrollDict)) {
          if (course.courseBatch !== originalBatch) continue;
          if (core.containsClass(selected, course.classID)) {
            delete enrollDict[key];
            ledger.records.delete(core.keyOf(course));
          }
          else if (course.status === 'cancelled') course.status = 'ready';
        }
        methods.saveData();
        Components.reloadList();
        await core.run({
          signal, mode: { ...settings.mode }, interval: methods.getCurrentInterval(settings),
          getCourses: () => Object.values(enrollDict).filter(c => c.courseBatch === originalBatch),
          send: async course => {
            if (signal.aborted) return;
            if (batchId() !== originalBatch) { runController.abort(); throw new Error('选课轮次已变化，请重新添加课程'); }
            if (!course.secretVal) { course.status = 'cancelled'; course.message = '请重新搜索本课程，获取当前会话信息'; return; }
            if (course.hasTest || (String(grablessonsVue.sysParam.needBook) === '1' && String(grablessonsVue.lcParam.currentBatch.canSelectBook) === '1')) {
              course.status = 'cancelled'; course.message = '本课程需填写实验班或教材选项，请使用官网选择';
              tip({ type: 'warning', message: `${course.courseName}：${course.message}`, duration: 4000 });
              return;
            }
            attachSocket();
            if (attachedSocket?.readyState !== 1) { runController.abort(); throw new Error('官网结果推送连接未就绪，请等待连接恢复或刷新官网'); }
            await core.attempt({ course, ledger, signal,
              submit: data => post('/elective/clazz/add', data, { batch: originalBatch }),
              confirm: async message => {
                if (signal.aborted) return false;
                try { await grablessonsVue.$confirm(`${message}，确认选择这门课程吗？`, '提醒', { type: 'warning', closeOnClickModal: false }); return !signal.aborted; }
                catch { return false; }
              },
              verify: async target => core.containsClass(await selectedRows(), target.classID),
            });
          },
        });
        const unresolved = Object.values(enrollDict).filter(c => c.courseBatch === originalBatch && core.pending(c.status));
        if (unresolved.length) tip({ type: 'warning', message: `${unresolved.length} 门课程结果待核实，已保留并暂停重复提交`, duration: 5000 });
      })();
      try { await runPromise; }
      catch (error) { tip({ type: 'warning', message: error.message || '运行中断，请检查官网', duration: 4000 }); }
      finally {
        runController.abort();
        isRunning = false; shouldStop = false; runPromise = null;
        methods.saveData(); Components.reloadList(); methods.updateUIState();
      }
    },
    async stopEnrolling() {
      shouldStop = true;
      runController?.abort();
      for (const controller of controllers) controller.abort();
      methods.updateUIState();
      // Stopping cannot undo a request already accepted by the server.
      if (runPromise) await runPromise.catch(() => {});
    },
    async searchCourse(type, pageNumber, pageSize) {
      const result = await post('/elective/clazz/list', {
        teachingClassType: type, pageNumber, pageSize, orderBy: '', campus: grablessonsVue.currentCampus.code,
      }, { json: true });
      if (core.codeOf(result.code) !== '200' || !Array.isArray(result.data?.rows) || !Number.isFinite(Number(result.data.total))) throw new Error(result.msg || '课程查询响应结构变化');
      return { courseList: result.data.rows, total: Number(result.data.total) };
    },
    displayCourse(course) { return `${course.courseName}${labels[course.status] ? ` [${labels[course.status]}]` : ''}`; },
  };

  // Keep original page handlers intact. Add one helper button per teaching-class card.
  Components.addEnrollButton = () => {
    let scheduled = false;
    const scan = () => {
      scheduled = false;
      const retained = new Set();
      const supported = availableTypes().includes(grablessonsVue.teachingClassType);
      for (const select of document.querySelectorAll('button.el-button')) {
        if (!supported || select.closest('#seu-helper-root') || select.classList.contains('add-course-button') || !/^选择$/.test(select.textContent.trim())) continue;
        const parent = select.parentElement;
        if (!parent) continue;
        const card = select.closest('.el-card__body') || select.closest('tr');
        if (!card) continue;
        const container = select.closest('.el-collapse-item') || select.closest('td.el-table__expanded-cell')?.parentElement?.previousElementSibling || card;
        const title = container.textContent || '';
        const text = card.textContent || '';
        const matches = [];
        for (const course of grablessonsVue.courseList || []) {
          if (!title.includes(course.KCH)) continue;
          for (const teacher of course.tcList || [course]) {
            const sequence = String(teacher.KXH || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (sequence && new RegExp(`\\[\\s*${sequence}\\s*\\]`).test(text)) matches.push(`${course.KCH}${teacher.KXH}`);
          }
        }
        if (matches.length !== 1) continue;
        let button = parent.querySelector('.add-course-button');
        if (!button) {
          button = document.createElement('button');
          button.type = 'button';
          button.className = 'el-button el-button--primary el-button--mini is-round add-course-button';
          button.textContent = '添加';
          button.addEventListener('click', event => { event.stopPropagation(); methods.addSingleCourse(button.dataset.seuCourseCode); });
          parent.appendChild(button);
        }
        button.dataset.seuCourseCode = matches[0];
        button.disabled = isRunning || searching;
        retained.add(button);
      }
      for (const button of document.querySelectorAll('button.add-course-button')) if (!retained.has(button)) button.remove();
    };
    const observer = new MutationObserver(() => { if (!scheduled) { scheduled = true; setTimeout(scan, 100); } });
    observer.observe(document.getElementById('xsxkapp'), { childList: true, characterData: true, subtree: true });
    scan();
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  };

  // The helper lives outside #xsxkapp: do not depend on host-scoped launcher CSS
  // or Element UI's icon font for the only way to reopen the panel.
  Components.createTag = () => {
    const node = document.createElement('button');
    node.id = 'seu-helper-toggle';
    node.type = 'button';
    node.title = '打开或关闭选课助手（可拖动）';
    node.setAttribute('aria-label', '打开或关闭选课助手');
    node.setAttribute('aria-controls', 'seu-panel');
    node.setAttribute('aria-expanded', 'true');
    node.style.cssText = `position:fixed;top:250px;left:30px;z-index:1314;
      display:flex;align-items:center;justify-content:center;box-sizing:border-box;
      width:40px;height:40px;min-width:40px;min-height:40px;padding:0;margin:0;
      border:0;border-radius:50%;background:#2b2b2b;color:#fff;
      cursor:pointer;user-select:none;box-shadow:0 2px 8px rgba(0,0,0,.25);`;
    node.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" style="display:block;pointer-events:none;flex-shrink:0">
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M16 3v4M8 3v4M3 11h18M7 15h2M11 15h2M15 15h2M7 18h2M11 18h2"/>
    </svg>`;
    node.addEventListener('mousedown', event => methods.drag(event, node));
    // Mouse activation is handled on mouseup, preserving the original drag/click
    // distinction. Native keyboard activation has no mousedown/mouseup pair.
    node.addEventListener('click', event => { if (event.detail === 0) methods.togglePanel(); });
    app.appendChild(node);
  };

  Components.mount();
  methods.init().catch(error => tip({ type: 'warning', message: error.message || '助手初始化失败', duration: 5000 }));

})();
