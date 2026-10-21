#!/usr/bin/env node
// 仅离线读取 HAR。输出字段结构，不复制认证头、参数值或个人数据。
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const HOST = 'newxk.urp.seu.edu.cn';
const SENSITIVE = /token|secret|password|authorization|cookie|captcha|verify|loginname|student|xm|xh|sfzh|phone|email/i;

function shape(value, depth = 0) {
  if (value === null) return 'null';
  if (depth >= 7) return Array.isArray(value) ? 'array' : typeof value;
  if (Array.isArray(value)) return { type: 'array', length: value.length, sample: value.length ? shape(value[0], depth + 1) : null };
  if (typeof value === 'object') {
    const result = Object.create(null);
    for (const [key, child] of Object.entries(value).slice(0, 100)) {
      // 不保留可能为动态标识符的长字段名。
      const safeKey = /^[\w\u4e00-\u9fff.-]{1,64}$/.test(key) ? key : '[dynamic-key]';
      result[safeKey] = SENSITIVE.test(key) ? '[redacted]' : shape(child, depth + 1);
    }
    return result;
  }
  return typeof value;
}

function decodeContent(content = {}) {
  if (typeof content.text !== 'string') return '';
  return content.encoding === 'base64' ? Buffer.from(content.text, 'base64').toString('utf8') : content.text;
}

function jsonShape(text) {
  try { return shape(JSON.parse(text)); } catch { return { type: 'non-json', length: text.length }; }
}

function summarize(har) {
  if (!Array.isArray(har?.log?.entries)) throw new Error('不是有效 HAR：缺少 log.entries');
  const result = [];
  for (const entry of har.log.entries) {
    let url;
    try { url = new URL(entry.request.url); } catch { continue; }
    if (url.hostname !== HOST || !url.pathname.startsWith('/xsxk/')) continue;
    // 登录接口与首页个人资料不进入业务请求摘要。
    if (/\/auth\/|\/web\/studentInfo$|\/elective\/(?:seu\/)?user$/.test(url.pathname)) continue;
    const postData = entry.request.postData || {};
    const text = decodeContent(entry.response?.content);
    let businessCode;
    try {
      const code = JSON.parse(text)?.code;
      if (/^\d{3}$/.test(String(code))) businessCode = String(code);
    } catch { /* 静态资源不含业务状态码。 */ }
    result.push({
      path: url.pathname,
      method: entry.request.method,
      httpStatus: entry.response?.status,
      businessCode,
      requestType: postData.mimeType || null,
      requestShape: /json/i.test(postData.mimeType || '') ? jsonShape(postData.text || '') : undefined,
      formKeys: postData.params ? [...new Set(postData.params.map(p => p.name))] : undefined,
      responseType: entry.response?.content?.mimeType || null,
      responseShape: /json/i.test(entry.response?.content?.mimeType || '') ? jsonShape(text) : undefined,
      websocket: Array.isArray(entry._webSocketMessages) ? entry._webSocketMessages.map(message => ({
        direction: message.type,
        shape: jsonShape(message.data || ''),
      })) : undefined,
    });
  }
  return { host: HOST, entryCount: result.length, entries: result };
}

function extractScripts(har, destination) {
  fs.mkdirSync(destination, { recursive: true });
  const manifest = [];
  for (const entry of har.log.entries) {
    let url;
    try { url = new URL(entry.request.url); } catch { continue; }
    if (url.hostname !== HOST || !/^\/xsxk\/profile\/js\/[\w.-]+\.js$/.test(url.pathname)) continue;
    if (entry.response?.status !== 200) continue;
    const source = decodeContent(entry.response.content);
    if (!source) continue;
    const digest = crypto.createHash('sha256').update(source).digest('hex');
    const filename = `${path.basename(url.pathname, '.js')}-${digest.slice(0, 12)}.js`;
    fs.writeFileSync(path.join(destination, filename), source);
    manifest.push({ path: url.pathname, filename, sha256: digest });
  }
  fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

if (require.main === module) {
  const [input, output, scriptDirectory] = process.argv.slice(2);
  if (!input || !output) {
    console.error('用法：node tools/summarize-har.cjs <原始.har> <摘要.json> [官方脚本输出目录]');
    process.exitCode = 1;
  } else {
    const har = JSON.parse(fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, ''));
    const result = summarize(har);
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    const scripts = scriptDirectory ? extractScripts(har, scriptDirectory).length : 0;
    console.log(`已写入 ${result.entryCount} 条字段结构摘要；提取 ${scripts} 个官方静态脚本。`);
  }
}

module.exports = { summarize, extractScripts, shape };
