const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../tools/summarize-har.cjs');

test('选课摘要保留接口和响应结构，排除凭据及个人值', () => {
  const result = summarize({ log: { entries: [{
    request: {
      url: 'https://newxk.urp.seu.edu.cn/xsxk/elective/clazz/add?token=PRIVATE_QUERY', method: 'POST',
      headers: [{ name: 'Authorization', value: 'PRIVATE_AUTH' }],
      postData: { mimeType: 'application/x-www-form-urlencoded', params: [
        { name: 'clazzId', value: 'PRIVATE_CLASS' }, { name: 'secretVal', value: 'PRIVATE_SECRET' },
      ] },
    },
    response: { status: 200, content: { mimeType: 'application/json', text: JSON.stringify({
      code: 200, msg: 'PRIVATE_NAME 已入队', data: { token: 'PRIVATE_TOKEN', clazzId: 'PRIVATE_CLASS', state: 0 },
    }) } },
  }] } });
  assert.equal(result.entries[0].path, '/xsxk/elective/clazz/add');
  assert.equal(result.entries[0].businessCode, '200');
  assert.equal(result.entries[0].responseShape.data.token, '[redacted]');
  assert.deepEqual(result.entries[0].formKeys, ['clazzId', 'secretVal']);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_/);
});

test('排除其他站点、登录请求和个人资料响应', () => {
  const entries = ['/auth/login', '/elective/user', '/elective/seu/user', '/web/studentInfo'].map(p => ({
    request: { url: `https://newxk.urp.seu.edu.cn/xsxk${p}`, method: 'POST' },
  }));
  entries.push({ request: { url: 'https://example.com/private' } });
  assert.equal(summarize({ log: { entries } }).entryCount, 0);
});

test('WebSocket 仅保存方向和结构，不输出消息正文', () => {
  const result = summarize({ log: { entries: [{
    request: { url: 'wss://newxk.urp.seu.edu.cn/xsxk/result?token=PRIVATE_TOKEN', method: 'GET' },
    _webSocketMessages: [{ type: 'receive', data: JSON.stringify({ msg: 'PRIVATE_NAME', clazzId: 'PRIVATE_CLASS' }) }],
  }] } });
  assert.equal(result.entries[0].websocket[0].shape.clazzId, 'string');
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_/);
});
