import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractFencedCodeBlocks,
  extractMarkdownLinks,
  findSuspiciousSecrets,
  slugifyHeading,
  validateJsonBlocks,
  validateRequiredHeading,
} from '../scripts/lib/markdown-validator.mjs';

test('extractMarkdownLinks returns local document targets only', () => {
  const markdown = [
    '[本地](../README.md)',
    '[带锚点](./setup.md#安装)',
    '[网页](https://example.com)',
    '[邮件](mailto:hello@example.com)',
    '[页内](#安装)',
    '![图片](assets/cover.png)',
  ].join(' ');

  assert.deepEqual(extractMarkdownLinks(markdown), [
    { href: '../README.md', line: 1 },
    { href: './setup.md#安装', line: 1 },
  ]);
});

test('extractMarkdownLinks keeps source line numbers', () => {
  const links = extractMarkdownLinks('第一行\n\n[教程](guides/start.md)');
  assert.deepEqual(links, [{ href: 'guides/start.md', line: 3 }]);
});

test('placeholder keys are accepted', () => {
  const markdown = [
    'API_KEY=sk-your-key',
    'API_KEY=YOUR_API_KEY',
    'Authorization: Bearer ${API_KEY}',
    'api_key = "sk-example-placeholder"',
  ].join('\n');

  assert.deepEqual(findSuspiciousSecrets(markdown), []);
});

test('long concrete secret-like values are rejected', () => {
  const findings = findSuspiciousSecrets(
    'API_KEY=sk-8VtP4mQ2xR7nK9wL3cH6jF1sD5aZ0bY',
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 1);
  assert.match(findings[0].message, /疑似真实密钥/);
});

test('invalid JSON blocks report an error', () => {
  const errors = validateJsonBlocks('```json\n{"model":}\n```');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].line, 2);
  assert.match(errors[0].message, /JSON/);
});

test('valid JSON blocks are accepted', () => {
  assert.deepEqual(
    validateJsonBlocks('```json\n{"model":"example-model"}\n```'),
    [],
  );
});

test('document requires exactly one H1 heading', () => {
  assert.equal(validateRequiredHeading('正文').length, 1);
  assert.equal(validateRequiredHeading('# 标题\n\n正文').length, 0);
  assert.equal(validateRequiredHeading('# 标题一\n# 标题二').length, 1);
});

test('headings inside fenced code blocks do not count as document headings', () => {
  const markdown = '# 教程标题\n\n```bash\n# 这是一条 shell 注释\necho ok\n```';
  assert.deepEqual(validateRequiredHeading(markdown), []);
});

test('extractFencedCodeBlocks returns language, code and line', () => {
  assert.deepEqual(extractFencedCodeBlocks('前言\n```python\nprint("ok")\n```'), [
    { language: 'python', code: 'print("ok")', line: 3 },
  ]);
});

test('slugifyHeading follows MkDocs-compatible Chinese anchors', () => {
  assert.equal(slugifyHeading('安装与配置（推荐）'), '安装与配置推荐');
  assert.equal(slugifyHeading('API Key / Base URL'), 'api-key-base-url');
});
