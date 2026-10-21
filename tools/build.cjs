const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { version: release, author } = require(path.join(root, 'package.json'));
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
// Retained UI is checked in directly; the original 3.4.1 file is no longer required.
const ui = read('src/legacy-ui.js');

const core = read('src/seu-core.js').split("if (typeof module !== 'undefined'")[0];
const runtime = read('src/compat-runtime.js');
let output = `// ==UserScript==
// @name        东南大学选课助手（稳定版）
// @namespace   http://tampermonkey.net/
// @version     ${release}
// @description 适配2026选课页面；保留原面板，等待队列最终结果，防止重复提交
// @author      ${author}
// @license     MIT
// @match       https://newxk.urp.seu.edu.cn/xsxk/elective/grablessons*
// @run-at      document-idle
// @grant       none
// ==/UserScript==

(async function () {
  'use strict';
  ${core}
  const core = createSeuCore();
  const started = Date.now();
  while (!(window.grablessonsVue?.lcParam?.currentBatch?.code && window.axios && document.getElementById('xsxkapp'))) {
    if (Date.now() - started > 30000) { console.warn('[东大选课助手] 页面未就绪，请进入课程列表后刷新'); return; }
    await core.delay(200);
  }
  if (document.getElementById('seu-helper-root')) return;
  const grablessonsVue = window.grablessonsVue;
  const tip = options => grablessonsVue.$message(options);
  const version = ${JSON.stringify(release.split('.').map(Number))};
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
${ui}
${runtime}
})();
`;
// Namespace old generic IDs/classes while retaining all original visual styles.
for (const id of ['panel', 'mask', 'input-box', 'list-wrap', 'enroll-button', 'settings-stop-button']) {
  output = output.replace(new RegExp(`(?<=["'#])${id}(?![\\w-])`, 'g'), `seu-${id}`);
}
output = output.replaceAll('class: "temp"', 'class: "seu-temp"').replaceAll('".temp"', '".seu-temp"');
fs.writeFileSync(path.join(root, `东南大学抢课助手修改版-${release}.user.js`), output);
console.log(`已生成 ${release}：保留原 UI，替换兼容层和队列状态逻辑。`);
