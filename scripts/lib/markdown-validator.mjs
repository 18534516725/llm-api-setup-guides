const PLACEHOLDER_MARKERS = [
  'your-',
  'your_',
  'your ',
  'example',
  'placeholder',
  'replace',
  'test-key',
  'demo-key',
  'xxx',
  'abcdefghijklmnopqrstuvwxyz',
  '${',
  '{{',
  '<',
];

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

export function extractMarkdownLinks(markdown) {
  const links = [];
  const linkPattern = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g;

  for (const match of markdown.matchAll(linkPattern)) {
    const href = match[1].trim();
    if (
      href.startsWith('#') ||
      /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(href)
    ) {
      continue;
    }

    links.push({ href, line: lineNumberAt(markdown, match.index) });
  }

  return links;
}

export function extractFencedCodeBlocks(markdown) {
  const blocks = [];
  const fencePattern = /^```([^\n`]*)\n([\s\S]*?)^```[ \t]*$/gm;

  for (const match of markdown.matchAll(fencePattern)) {
    const language = match[1].trim().split(/[ ,{]/, 1)[0].toLowerCase();
    const openingLine = lineNumberAt(markdown, match.index);
    blocks.push({
      language,
      code: match[2].replace(/\n$/, ''),
      line: openingLine + 1,
    });
  }

  return blocks;
}

export function findSuspiciousSecrets(markdown) {
  const findings = [];
  const candidates = [
    /\bsk-[A-Za-z0-9_-]{24,}\b/g,
    /\b(?:api[_-]?key|token|secret)\s*[:=]\s*['"]?([A-Za-z0-9_./+-]{28,})['"]?/gi,
    /\bBearer\s+([A-Za-z0-9_./+-]{28,})\b/gi,
  ];

  for (const pattern of candidates) {
    for (const match of markdown.matchAll(pattern)) {
      const value = (match[1] ?? match[0]).toLowerCase();
      if (PLACEHOLDER_MARKERS.some((marker) => value.includes(marker))) {
        continue;
      }

      findings.push({
        line: lineNumberAt(markdown, match.index),
        message: '发现疑似真实密钥，请改用明确占位符',
      });
    }
  }

  return findings.filter(
    (finding, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.line === finding.line && candidate.message === finding.message,
      ) === index,
  );
}

export function validateJsonBlocks(markdown) {
  const errors = [];

  for (const block of extractFencedCodeBlocks(markdown)) {
    if (block.language !== 'json') continue;

    try {
      JSON.parse(block.code);
    } catch (error) {
      errors.push({
        line: block.line,
        message: `JSON 代码块语法错误：${error.message}`,
      });
    }
  }

  return errors;
}

export function validateRequiredHeading(markdown) {
  const proseOnly = markdown.replace(/^```[^\n`]*\n[\s\S]*?^```[ \t]*$/gm, '');
  const headings = proseOnly.match(/^#\s+\S.*$/gm) ?? [];
  if (headings.length === 1) return [];

  return [
    {
      line: 1,
      message:
        headings.length === 0
          ? '文档缺少一级标题（# 标题）'
          : '文档只能包含一个一级标题（# 标题）',
    },
  ];
}

export function slugifyHeading(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[（）()]/g, '')
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, ' ')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractHeadingSlugs(markdown) {
  const slugs = new Set();
  const counts = new Map();

  for (const match of markdown.matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
    const base = slugifyHeading(match[1]);
    if (!base) continue;
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}_${count}`);
  }

  return slugs;
}
