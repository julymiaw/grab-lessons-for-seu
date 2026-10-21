const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const release = require('../package.json').version;
const script = fs.readFileSync(path.join(__dirname, `../东南大学抢课助手修改版-${release}.user.js`), 'utf8');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const teacher = { JXBID: 'fixture-class', KXH: '01', KCM: '测试课程', SKJS: '测试教师', secretVal: 'fixture-secret', YXRS: 5, KRL: 20 };
// Teaching-class ancestry and bracket spacing verified against the live page.
const card = '<div class="el-card jxb-card is-hover-shadow"><div class="el-card__body"><div class="card-item"><div class="one-row"><span>[01  ]</span>测试教师</div><div class="el-row"><button class="el-button el-button--primary el-button--mini is-round">选择</button></div></div></div></div>';

async function fixture(layout = 'mobile', stored, strategy = 'success') {
  const markup = layout === 'mobile'
    ? `<div class="el-collapse-item"><div class="el-collapse-item__header">课程号: B09P0001</div>${card}</div>`
    : `<table><tbody><tr class="el-table__row expanded"><td><span>B09P0001</span></td></tr><tr><td class="el-table__expanded-cell">${card}</td></tr></tbody></table>`;
  const dom = new JSDOM(`<div id="xsxkapp">${markup}</div>`, { url: 'https://fixture.invalid/xsxk/elective/grablessons', runScripts: 'outside-only' });
  const w = dom.window;
  const calls = [], messages = [];
  let officialMessages = 0;
  const socket = new w.EventTarget();
  socket.readyState = 1;
  socket.addEventListener('message', () => officialMessages++);
  w.axios = { defaults: { baseURL: 'https://fixture.invalid/xsxk', headers: { Authorization: 'fixture-token' } } };
  w.grablessonsVue = {
    $message: info => messages.push(info), $confirm: async () => {}, sock: socket,
    lcParam: { currentBatch: { code: 'fixture-batch', typeCode: '02' } }, sysParam: {}, currentCampus: { code: 'fixture-campus' },
    menuData: { menuList: [{ teachingClassType: 'TJKC' }] }, teachingClassType: 'TJKC',
    courseList: [{ KCH: 'B09P0001', KCM: '测试课程', tcList: [{ ...teacher }] }],
  };
  w.fetch = async (url, options) => {
    calls.push({ path: new URL(url).pathname, ...options });
    if (url.endsWith('/elective/select')) return { ok: true, json: async () => ({ code: '200', data: [] }) };
    if (url.endsWith('/elective/clazz/add')) {
      if (strategy === 'success') w.setTimeout(() => socket.dispatchEvent(new w.MessageEvent('message', { data: JSON.stringify({ code: '200', data: { operationType: '1', clazzId: teacher.JXBID } }) })), 5);
      return { ok: true, json: async () => ({ code: 200 }) };
    }
    if (url.endsWith('/elective/clazz/list')) return { ok: true, json: async () => ({ code: 200, data: { rows: w.grablessonsVue.courseList, total: 1 } }) };
    throw new Error(`Unexpected route: ${new URL(url).pathname}`);
  };
  w.localStorage.setItem('july', stored ?? JSON.stringify({ settings: { announcement: { hasRead: true } } }));
  await w.eval(script);
  await sleep(10);
  return { dom, w, calls, messages, officialMessages: () => officialMessages };
}

for (const layout of ['mobile', 'desktop']) test(`${layout}：原面板挂载，教学班添加按钮幂等且正确绑定`, async () => {
  const f = await fixture(layout);
  try {
    assert.ok(f.w.document.getElementById('seu-panel'));
    assert.equal(f.w.document.querySelectorAll('.add-course-button').length, 1);
    f.w.document.querySelector('.add-course-button').click();
    assert.match(f.w.document.getElementById('seu-list-wrap').textContent, /测试课程/);
    f.w.document.getElementById('xsxkapp').appendChild(f.w.document.createElement('span'));
    await sleep(140);
    assert.equal(f.w.document.querySelectorAll('.add-course-button').length, 1);
    const stored = JSON.parse(f.w.localStorage.getItem('july'));
    assert.ok(stored.enrollDict.B09P000101);
    assert.doesNotMatch(JSON.stringify(stored), /fixture-secret|fixture-token/);
  } finally { f.dom.window.close(); }
});

test('实际生成文件：发送正确请求，只在最终推送后移除课程，保留官网监听器', async () => {
  const f = await fixture();
  try {
    f.w.document.querySelector('.add-course-button').click();
    f.w.document.getElementById('seu-enroll-button').click();
    assert.equal(f.w.document.getElementById('seu-input-box').disabled, true);
    await sleep(50);
    const adds = f.calls.filter(c => c.path.endsWith('/clazz/add'));
    assert.equal(adds.length, 1);
    assert.equal(new URLSearchParams(adds[0].body).get('clazzId'), 'fixture-class');
    assert.equal(adds[0].headers.batchId, 'fixture-batch');
    assert.equal(adds[0].headers.Authorization, 'fixture-token');
    assert.equal(f.officialMessages(), 1);
    assert.match(f.w.document.getElementById('seu-list-wrap').textContent, /还未选择课程/);
    f.w.document.getElementById('seu-settings-stop-button').click();
    await sleep(20);
    assert.equal(f.w.document.getElementById('seu-input-box').disabled, false);
  } finally { f.dom.window.close(); }
});

test('生成文件：只有入队响应时保留课程，停止后重新开始也不补发', async () => {
  const f = await fixture('mobile', undefined, 'queued');
  try {
    f.w.document.querySelector('.add-course-button').click();
    f.w.document.getElementById('seu-enroll-button').click();
    await sleep(20);
    assert.match(f.w.document.getElementById('seu-list-wrap').textContent, /排队中/);
    f.w.document.getElementById('seu-settings-stop-button').click();
    await sleep(20);
    assert.match(f.w.document.getElementById('seu-list-wrap').textContent, /待核实/);
    f.w.document.getElementById('seu-enroll-button').click();
    await sleep(20);
    assert.equal(f.calls.filter(c => c.path.endsWith('/clazz/add')).length, 1);
  } finally { f.dom.window.close(); }
});

test('损坏的旧配置不会让整个助手无法启动', async () => {
  const f = await fixture('mobile', '{broken');
  try {
    assert.ok(f.w.document.getElementById('seu-panel'));
    assert.ok(f.messages.some(m => /旧配置无法读取/.test(m.message)));
  } finally { f.dom.window.close(); }
});

test('悬浮入口不依赖官网样式或图标字体，鼠标和键盘均能关闭并重新打开面板', async () => {
  const f = await fixture();
  try {
    const button = f.w.document.getElementById('seu-helper-toggle');
    const panel = f.w.document.getElementById('seu-panel');
    const style = f.w.getComputedStyle(button);
    assert.equal(style.width, '40px');
    assert.equal(style.height, '40px');
    assert.equal(style.color, 'rgb(255, 255, 255)');
    assert.equal(style.backgroundColor, 'rgb(43, 43, 43)');
    assert.equal(button.getAttribute('aria-controls'), panel.id);
    assert.ok(button.querySelector('svg path'));
    assert.equal(button.querySelector('img, use'), null);
    // A real mouse activation includes click after mouseup: it must toggle once.
    const mouseClick = () => {
      button.dispatchEvent(new f.w.MouseEvent('mousedown', { bubbles: true, button: 0 }));
      button.dispatchEvent(new f.w.MouseEvent('mouseup', { bubbles: true, button: 0 }));
      button.dispatchEvent(new f.w.MouseEvent('click', { bubbles: true, detail: 1 }));
    };
    mouseClick();
    assert.equal(panel.style.display, 'none');
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.notEqual(f.w.getComputedStyle(button).display, 'none');
    mouseClick();
    assert.equal(panel.style.display, 'block');
    button.click(); // Native keyboard/programmatic click has detail === 0.
    assert.equal(panel.style.display, 'none');
    button.click();
    assert.equal(panel.style.display, 'block');
    assert.equal(button.getAttribute('aria-expanded'), 'true');
    assert.equal(f.calls.length, 0);
  } finally { f.dom.window.close(); }
});

test('拖动悬浮入口只改变位置，不误开关面板', async () => {
  const f = await fixture();
  try {
    const button = f.w.document.getElementById('seu-helper-toggle');
    const panel = f.w.document.getElementById('seu-panel');
    button.dispatchEvent(new f.w.MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 40, clientY: 260 }));
    f.w.document.dispatchEvent(new f.w.MouseEvent('mousemove', { clientX: 120, clientY: 320 }));
    f.w.document.dispatchEvent(new f.w.MouseEvent('mouseup', { button: 0 }));
    button.dispatchEvent(new f.w.MouseEvent('click', { bubbles: true, detail: 1 }));
    assert.notEqual(button.style.left, '30px');
    assert.notEqual(button.style.top, '250px');
    assert.equal(panel.style.display, 'block');
    assert.equal(f.w.document.onmousemove, null);
    assert.equal(f.w.document.onmouseup, null);
  } finally { f.dom.window.close(); }
});

test('设置切换后仍可保存同步和异步单个间隔 1 毫秒，更多设置的每组数量持久化', async () => {
  const f = await fixture();
  let restored;
  try {
    assert.match(script, /\/\/ @version\s+3\.5\.0\s/);
    assert.match(script, /\/\/ @author\s+july, nada\s/);
    assert.match(f.w.document.getElementById('seu-panel').textContent, /ver3\.5\.0/);
    f.w.document.getElementById('seu-settings-stop-button').click();
    await sleep(5);
    const main = f.w.document.querySelector('.seu-temp');
    const interval = main.querySelector('#seu-interval');
    const choose = id => {
      const input = main.querySelector(`#${id}`);
      input.checked = true;
      input.dispatchEvent(new f.w.Event('change', { bubbles: true }));
    };
    const fill = (input, value) => {
      input.value = String(value);
      input.dispatchEvent(new f.w.Event('blur'));
    };
    const clickText = (parent, text) => [...parent.querySelectorAll('button')].find(button => button.textContent === text).click();
    choose('group-send');
    assert.equal(interval.min, '1000');
    choose('single-send');
    assert.equal(interval.min, '1');
    assert.equal(interval.step, '1');
    fill(interval, 1);
    choose('async-mode');
    fill(interval, 1);
    // Exercise the old stale-value bug: saving the initial value in another mode.
    fill(interval, 1000);
    choose('sync-mode');
    assert.equal(interval.value, '1');
    choose('async-mode');
    assert.equal(interval.value, '1000');
    fill(interval, 1);
    choose('group-send');
    clickText(main, '更多');
    const more = [...f.w.document.querySelectorAll('.seu-temp')].at(-1);
    const size = more.querySelector('#seu-group-size');
    fill(size, 5);
    clickText(more, '确定');
    clickText(main, '确定');
    const raw = f.w.localStorage.getItem('july');
    const saved = JSON.parse(raw).settings;
    assert.equal(saved.interval.sync.single, 1);
    assert.equal(saved.interval.async.single, 1);
    assert.equal(saved.mode.groupSize, 5);
    assert.equal(saved.mode.isGrouped, true);
    restored = await fixture('mobile', raw);
    assert.equal(JSON.parse(restored.w.localStorage.getItem('july')).settings.mode.groupSize, 5);
    assert.equal(JSON.parse(restored.w.localStorage.getItem('july')).settings.interval.async.single, 1);
  } finally { restored?.dom.window.close(); f.dom.window.close(); }
});

test('禁用搜索仍可进入更多设置；返回未确认的每组数量不会被保存', async () => {
  const f = await fixture('mobile', JSON.stringify({ settings: { mode: { enableSearch: false }, announcement: { hasRead: true } } }));
  try {
    f.w.document.getElementById('seu-settings-stop-button').click();
    const main = f.w.document.querySelector('.seu-temp');
    [...main.querySelectorAll('button')].find(button => button.textContent === '更多').click();
    const more = [...f.w.document.querySelectorAll('.seu-temp')].at(-1);
    const size = more.querySelector('#seu-group-size');
    const initial = size.value;
    size.value = '8';
    size.dispatchEvent(new f.w.Event('blur'));
    [...more.querySelectorAll('button')].find(button => button.textContent === '返回').click();
    [...main.querySelectorAll('button')].find(button => button.textContent === '确定').click();
    assert.equal(JSON.parse(f.w.localStorage.getItem('july')).settings.mode.groupSize, Number(initial));
  } finally { f.dom.window.close(); }
});

test('Vue 复用卡片节点后，添加按钮重新绑定教学班；退选按钮旁移除旧添加按钮', async () => {
  const f = await fixture();
  try {
    const firstButton = f.w.document.querySelector('.add-course-button');
    const course = f.w.grablessonsVue.courseList[0];
    course.tcList[0].KXH = '02';
    course.tcList[0].JXBID = 'fixture-class-2';
    f.w.document.querySelector('.one-row span').firstChild.data = '[02  ]';
    await sleep(140);
    assert.equal(f.w.document.querySelector('.add-course-button'), firstButton);
    firstButton.click();
    const stored = JSON.parse(f.w.localStorage.getItem('july'));
    assert.equal(stored.enrollDict.B09P000102.classID, 'fixture-class-2');
    assert.equal(stored.enrollDict.B09P000101, undefined);
    f.w.document.querySelector('.el-row button').textContent = '退选';
    await sleep(140);
    assert.equal(f.w.document.querySelector('.add-course-button'), null);
  } finally { f.dom.window.close(); }
});
