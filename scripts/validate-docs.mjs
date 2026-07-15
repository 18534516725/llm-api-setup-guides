#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  extractFencedCodeBlocks,
  extractHeadingSlugs,
  extractMarkdownLinks,
  findSuspiciousSecrets,
  slugifyHeading,
  validateJsonBlocks,
  validateRequiredHeading,
} from './lib/markdown-validator.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set(['.git', '.venv-docs', 'node_modules', 'site']);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
      const absolute = resolve(directory, entry.name);
      return entry.isDirectory() ? walk(absolute) : [absolute];
    })
    .sort();
}

function formatPath(path) {
  return relative(root, path).split('\\').join('/');
}

function report(errors, file, line, message) {
  errors.push(`${formatPath(file)}:${line} ${message}`);
}

function resolveLinkTarget(sourceFile, href) {
  const [rawPath, rawAnchor = ''] = href.split('#', 2);
  let decodedPath;
  let decodedAnchor;
  try {
    decodedPath = decodeURIComponent(rawPath.split('?', 1)[0]);
    decodedAnchor = decodeURIComponent(rawAnchor);
  } catch {
    return { error: '链接包含无效的 URL 编码' };
  }

  let target = resolve(dirname(sourceFile), decodedPath);
  if (existsSync(target) && statSync(target).isDirectory()) {
    const indexCandidate = resolve(target, 'index.md');
    const readmeCandidate = resolve(target, 'README.md');
    target = existsSync(indexCandidate) ? indexCandidate : readmeCandidate;
  }

  return { target, anchor: decodedAnchor };
}

function validateLinks(file, markdown, errors) {
  for (const link of extractMarkdownLinks(markdown)) {
    const resolved = resolveLinkTarget(file, link.href);
    if (resolved.error) {
      report(errors, file, link.line, resolved.error);
      continue;
    }

    if (!existsSync(resolved.target)) {
      report(errors, file, link.line, `内部链接目标不存在：${link.href}`);
      continue;
    }

    if (resolved.anchor && extname(resolved.target).toLowerCase() === '.md') {
      const targetMarkdown = readFileSync(resolved.target, 'utf8');
      const anchors = extractHeadingSlugs(targetMarkdown);
      const expected = slugifyHeading(resolved.anchor);
      if (!anchors.has(expected)) {
        report(errors, file, link.line, `内部链接锚点不存在：${link.href}`);
      }
    }
  }
}

function validatePythonBlocks(file, markdown, errors) {
  for (const block of extractFencedCodeBlocks(markdown)) {
    if (!['python', 'py'].includes(block.language)) continue;
    const result = spawnSync('python3', ['-c', 'import sys; compile(sys.stdin.read(), "<markdown>", "exec")'], {
      input: block.code,
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      const detail = (result.stderr || '未知 Python 语法错误').trim().split('\n').at(-1);
      report(errors, file, block.line, `Python 代码块语法错误：${detail}`);
    }
  }
}

function main() {
  const markdownFiles = walk(root).filter((file) => extname(file).toLowerCase() === '.md');
  const errors = [];
  let jsonBlocks = 0;
  let pythonBlocks = 0;

  for (const file of markdownFiles) {
    const markdown = readFileSync(file, 'utf8');
    for (const finding of validateRequiredHeading(markdown)) {
      report(errors, file, finding.line, finding.message);
    }
    for (const finding of validateJsonBlocks(markdown)) {
      report(errors, file, finding.line, finding.message);
    }
    for (const finding of findSuspiciousSecrets(markdown)) {
      report(errors, file, finding.line, finding.message);
    }

    validateLinks(file, markdown, errors);
    validatePythonBlocks(file, markdown, errors);

    const blocks = extractFencedCodeBlocks(markdown);
    jsonBlocks += blocks.filter((block) => block.language === 'json').length;
    pythonBlocks += blocks.filter((block) => ['python', 'py'].includes(block.language)).length;
  }

  if (errors.length > 0) {
    console.error(`文档校验失败，共 ${errors.length} 个问题：`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `文档校验通过：${markdownFiles.length} 个 Markdown 文件，${jsonBlocks} 个 JSON 代码块，${pythonBlocks} 个 Python 代码块。`,
  );
}

main();
