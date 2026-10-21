const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/seu-core.js');
const sample = () => ({ courseBatch: 'batch-a', classID: 'class-a', courseType: 'TJKC', secretVal: 'PRIVATE', status: 'ready' });
const packet = (code = 200, operationType = '1', clazzId = 'class-a') => ({ code, msg: 'result', data: { operationType, clazzId } });
function setup() {
  const course = sample();
  const ledger = new core.Ledger(record => { course.status = record.state; });
  const controller = new AbortController();
  return { course, ledger, controller, signal: controller.signal, timeoutMs: 5, confirm: async () => true, verify: async () => false };
}

test('HTTP 200 只表示入队；未知结果不能重发，迟到的推送仍能结算', async () => {
  const options = setup();
  let calls = 0;
  options.submit = async () => { calls++; return { code: '200' }; };
  assert.equal(await core.attempt(options), 'unknown');
  assert.equal(options.course.status, 'unknown');
  assert.equal(await core.attempt(options), 'unknown');
  assert.equal(calls, 1);
  assert.equal(options.ledger.receive(packet('200'), 'batch-a'), true);
  assert.equal(options.course.status, 'success');
});

test('WebSocket 最终成功先到，HTTP 响应后到，不会回退成排队', async () => {
  const options = setup();
  options.submit = async () => { options.ledger.receive(packet(), 'batch-a'); return { code: 200 }; };
  assert.equal(await core.attempt(options), 'success');
});

test('WebSocket 失败先到，不被后续入队响应覆盖', async () => {
  const options = setup();
  options.submit = async () => { options.ledger.receive(packet(500), 'batch-a'); return { code: 200 }; };
  assert.equal(await core.attempt(options), 'failed');
});

test('退课、其他教学班、其他批次、心跳不能误判选课成功', () => {
  const options = setup();
  options.ledger.start(options.course);
  for (const [msg, batch] of [
    [packet(200, '2'), 'batch-a'], [packet(200, '1', 'other'), 'batch-a'],
    [packet(), 'batch-b'], [{ code: 200, data: 'heart' }, 'batch-a'],
    [{ ...packet(), data: { ...packet().data, batchId: 'other' } }, 'batch-a'],
  ]) assert.equal(options.ledger.receive(msg, batch), false);
  assert.equal(options.course.status, 'submitting');
});

test('301 再确认保持同一个 clazzId 和凭据，字符串状态码也适用', async () => {
  const options = setup();
  const bodies = [];
  options.submit = async body => {
    bodies.push(body);
    if (bodies.length === 1) return { code: '301', msg: '需要确认' };
    options.ledger.receive(packet(), 'batch-a');
    return { code: '200' };
  };
  assert.equal(await core.attempt(options), 'success');
  assert.deepEqual(bodies[1], { ...bodies[0], isConfirm: 1 });
  assert.equal(bodies[1].clazzId, 'class-a');
});

test('取消301确认不发送第二个请求', async () => {
  const options = setup();
  let calls = 0;
  options.submit = async () => { calls++; return { code: 301 }; };
  options.confirm = async () => false;
  assert.equal(await core.attempt(options), 'cancelled');
  assert.equal(calls, 1);
});

test('确认对话框尚未关闭时也能停止，稍后确认不会继续提交', async () => {
  const options = setup();
  let calls = 0, finishConfirm;
  options.submit = async () => { calls++; return { code: 301 }; };
  options.confirm = () => new Promise(resolve => { finishConfirm = resolve; options.controller.abort(); });
  assert.equal(await core.attempt(options), 'cancelled');
  finishConfirm(true);
  await Promise.resolve();
  assert.equal(calls, 1);
});

test('无WebSocket结果时，官方已选列表可证实成功；列表缺失不是失败证据', async () => {
  const options = setup();
  options.submit = async () => ({ code: 200 });
  options.verify = async course => core.containsClass([{ JXBID: course.classID }], course.classID);
  assert.equal(await core.attempt(options), 'success');
  assert.equal(core.containsClass([], 'class-a'), false);
  assert.throws(() => core.containsClass({}, 'class-a'));
});

test('停止排队等待不触发补发或已选查询，保留不确定状态', async () => {
  const options = setup();
  options.submit = async () => { options.controller.abort(); return { code: 200 }; };
  options.verify = async () => assert.fail('停止后不得再查询');
  assert.equal(await core.attempt(options), 'unknown');
});

test('网络错误不能当成服务端明确拒绝，禁止自动重发', async () => {
  const options = setup();
  options.submit = async () => { throw new Error('network lost'); };
  assert.equal(await core.attempt(options), 'unknown');
});

test('普通失败保留课程，可在下一轮重试', async () => {
  const options = setup();
  options.submit = async () => ({ code: 500, msg: 'capacity' });
  assert.equal(await core.attempt(options), 'failed');
  assert.equal(await core.attempt(options), 'failed');
});

test('明确的认证拒绝与网络不确定性区分，缺失状态码的推送不结算', async () => {
  const options = setup();
  options.submit = async () => { throw Object.assign(new Error('auth denied'), { definitive: true }); };
  assert.equal(await core.attempt(options), 'failed');
  const next = setup();
  next.ledger.start(next.course);
  assert.equal(next.ledger.receive({ data: packet().data }, 'batch-a'), false);
  assert.equal(next.course.status, 'submitting');
});

test('课程解析兼容嵌套和直接教学班，以及新版容量字段', () => {
  const item = { KCH: 'B09P0001', KXH: '01', JXBID: 'class-a', secretVal: 'PRIVATE', YXRS: 8, KRL: 20 };
  for (const rows of [[item], [{ KCH: item.KCH, tcList: [item] }]]) {
    const result = core.findCourse('B09P000101', rows, 'TJKC', 'batch-a');
    assert.equal(result.selectedCount, 8);
    assert.equal(result.totalCapacity, 20);
  }
  assert.deepEqual(core.parseCodes('b09p000101， B09P000101\nB09P000102'), ['B09P000101', 'B09P000102']);
});

test('持久化不含 token、secretVal、服务端消息，重载保留未知状态', () => {
  const result = core.serializable({ CODE: { ...sample(), status: 'queued', message: 'PRIVATE_MSG' } }, { token: 'PRIVATE_TOKEN' });
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|secretVal|token/);
  assert.equal(result.enrollDict.CODE.status, 'unknown');
  const ledger = new core.Ledger();
  ledger.restore(result.enrollDict.CODE);
  assert.equal(ledger.start(result.enrollDict.CODE), null);
});

for (const size of [2, 5]) test(`异步分组按配置每组 ${size} 门发送，慢响应不重复提交，循环次数有效`, async () => {
  const courses = Array.from({ length: 7 }, (_, i) => ({ ...sample(), classID: `class-${i}` }));
  const active = new Set();
  const calls = new Map();
  let high = 0;
  await core.run({
    getCourses: () => courses, signal: new AbortController().signal,
    mode: { isAsync: true, isGrouped: true, groupSize: size, isCyclic: true, cycleCount: 2 }, interval: 1000, sleep: async () => {},
    send: async course => {
      assert.equal(active.has(course.classID), false);
      active.add(course.classID); high = Math.max(high, active.size);
      calls.set(course.classID, (calls.get(course.classID) || 0) + 1);
      await new Promise(resolve => setTimeout(resolve, 2));
      active.delete(course.classID);
    },
  });
  assert.equal(high, size);
  assert.deepEqual([...calls.values()], Array(7).fill(2));
});

test('单个同步和异步调度均接受 1 毫秒，分组保持原有最小间隔', async () => {
  for (const isAsync of [false, true]) for (const isGrouped of [false, true]) {
    const pauses = [], sent = [];
    await core.run({
      getCourses: () => [sample(), { ...sample(), classID: 'class-b' }],
      signal: new AbortController().signal, mode: { isAsync, isGrouped, groupSize: 2 }, interval: 1,
      sleep: async ms => { pauses.push(ms); }, send: async course => { sent.push(course.classID); },
    });
    assert.equal(sent.length, 2);
    assert.deepEqual(pauses, isGrouped ? [1000] : [1, 1]);
  }
});

test('停止之后不派发剩余课程', async () => {
  const controller = new AbortController();
  let calls = 0;
  await core.run({
    getCourses: () => [sample(), { ...sample(), classID: 'class-b' }], signal: controller.signal,
    mode: { isCyclic: true }, interval: 1000, sleep: async () => {},
    send: async () => { calls++; controller.abort(); },
  });
  assert.equal(calls, 1);
});

test('异步任务异常会停止后续派发，并等待其他在途任务完成再报告错误', async () => {
  const courses = Array.from({ length: 6 }, (_, i) => ({ ...sample(), classID: `class-${i}` }));
  const calls = [], release = [];
  let active = 0, settled = false;
  const running = core.run({
    getCourses: () => courses, signal: new AbortController().signal,
    mode: { isAsync: true, isGrouped: true, isCyclic: true, cycleCount: 3 },
    interval: 1000, sleep: async () => { await Promise.resolve(); },
    send: async course => {
      calls.push(course.classID);
      active++;
      try {
        if (course.classID === 'class-1') throw new Error('socket unavailable');
        await new Promise(resolve => release.push(resolve));
      } finally { active--; }
    },
  });
  running.then(() => { settled = true; }, () => { settled = true; });
  const rejection = assert.rejects(running, /socket unavailable/);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, false);
  assert.equal(active, 2);
  assert.deepEqual(calls, ['class-0', 'class-1', 'class-2']);
  release.forEach(resolve => resolve());
  await rejection;
  assert.equal(active, 0);
  assert.equal(calls.length, 3);
});
