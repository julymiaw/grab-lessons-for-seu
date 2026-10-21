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
if (typeof module !== 'undefined' && module.exports) module.exports = createSeuCore();
