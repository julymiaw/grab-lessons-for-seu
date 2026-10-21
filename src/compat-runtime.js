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
      const input = document.getElementById('input-box');
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
      const panel = document.getElementById('panel');
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
      for (const node of document.querySelectorAll('#input-box, #enroll-button, button.delete-button, button.add-course-button')) {
        node.disabled = busy;
        node.style.opacity = busy ? '0.5' : '1';
        node.style.cursor = busy ? 'not-allowed' : 'pointer';
      }
      const stop = document.getElementById('settings-stop-button');
      if (stop) {
        stop.disabled = searching;
        stop.className = `el-button el-button--${isRunning ? 'danger' : 'info'} el-button--small is-round`;
        stop.textContent = shouldStop ? '正在停止' : isRunning ? '停止抢课' : '扩展设置';
      }
    },
    async enter(event) {
      if (event.key !== 'Enter' || isRunning || searching) return;
      event.preventDefault();
      await methods.resolveCodes(document.getElementById('input-box').value);
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
        document.getElementById('input-box').value = remaining.join(' ');
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
    node.setAttribute('aria-controls', 'panel');
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
