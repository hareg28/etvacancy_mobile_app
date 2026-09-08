export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getInitials(firstName?: string | null, lastName?: string | null, email?: string | null): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return '??';
}

export function getFullName(firstName?: string | null, lastName?: string | null, fullName?: string | null): string {
  if (fullName) return fullName;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || lastName || 'Anonymous';
}

export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function humanizeEnumValue(value: string): string {
  if (!value) return '';
  return value
    .split(/[_-\s]+/)
    .map((word) => capitalize(word))
    .join(' ');
}

export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  let html = markdown;

  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/&amp;#(\d+);/g, '&#$1;');

  html = html.replace(/^\s*```([\s\S]*?)```\s*$/gm, (_m, code) => {
    return `<pre style="background:#1e293b;color:#f1f5f9;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;"><code>${code.trim()}</code></pre>`;
  });

  html = html.replace(/^### (.*?)$/gm, '<h3 style="font-size:15px;font-weight:700;margin:14px 0 8px 0;color:#0f172a;">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 style="font-size:16px;font-weight:700;margin:16px 0 10px 0;color:#0f172a;">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 style="font-size:18px;font-weight:800;margin:18px 0 12px 0;color:#0f172a;">$1</h1>');
  html = html.replace(/^#### (.*?)$/gm, '<h4 style="font-size:14px;font-weight:700;margin:12px 0 6px 0;color:#0f172a;">$1</h4>');

  html = html.replace(/^---+$/gm, '<hr style="border:0;border-top:1px solid #e2e8f0;margin:14px 0;"/>');

  html = html.replace(/\|\s*(.*?)\s*\|/g, (_m, cell) => {
    const cells = cell.split('|').map((c: string) => c.trim());
    return `<tr>${cells.map((c: string) => `<td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">${c}</td>`).join('')}</tr>`;
  });
  html = html.replace(/(<tr>.*?<\/tr>)/gs, (_m, row) => {
    if (row.includes('---')) return '';
    return row;
  });
  html = html.replace(/((?:<tr>.*?<\/tr>\s*)+)/gs, '<table style="border-collapse:collapse;margin:10px 0;width:100%;">$1</table>');

  html = html.replace(/^\s*[-•*+]\s+(.*)$/gm, '<li style="margin:4px 0 4px 4px;">$1</li>');
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li style="margin:4px 0 4px 4px;">$2</li>');
  html = html.replace(/(<li[^>]*>.*?<\/li>(?:\s*<li[^>]*>.*?<\/li>)*)/gs, (_m, list) => {
    const hasNumbers = /<li[^>]*>\s*\d/.test(list);
    const tag = hasNumbers ? 'ol' : 'ul';
    return `<${tag} style="margin:8px 0;padding-left:20px;">${list}</${tag}>`;
  });

  const paragraphs: string[] = [];
  const lines = html.split('\n');
  let currentPara = '';
  let inBlock = false;
  for (const line of lines) {
    if (/^<(h[1-4]|ul|ol|table|pre|hr)/i.test(line.trimStart())) {
      if (currentPara.trim()) {
        paragraphs.push(`<p style="margin:6px 0;line-height:1.55;">${currentPara.trim()}</p>`);
        currentPara = '';
      }
      paragraphs.push(line);
      inBlock = true;
    } else if (/^<\/(ul|ol|table|pre)>/i.test(line.trimStart())) {
      paragraphs.push(line);
      inBlock = false;
    } else if (line.trim() === '' && !inBlock) {
      if (currentPara.trim()) {
        paragraphs.push(`<p style="margin:6px 0;line-height:1.55;">${currentPara.trim()}</p>`);
        currentPara = '';
      }
    } else {
      currentPara += (currentPara ? ' ' : '') + line;
    }
  }
  if (currentPara.trim()) {
    paragraphs.push(`<p style="margin:6px 0;line-height:1.55;">${currentPara.trim()}</p>`);
  }
  html = paragraphs.join('\n');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:#0f172a;">$1</strong>');
  html = html.replace(/\*(?!\s)(.*?)(?<!\s)\*/g, '<em style="font-style:italic;">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:11px;color:#be123c;">$1</code>');

  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#1d4ed8;text-decoration:underline;">$1</a>');

  return html;
}

export function markdownToHtmlDark(markdown: string): string {
  let html = markdownToHtml(markdown);
  html = html.replace(/color:#0f172a;/g, 'color:#f8fafc;');
  html = html.replace(/color:#1d4ed8;/g, 'color:#60a5fa;');
  html = html.replace(/background:#f1f5f9;/g, 'background:#334155;');
  html = html.replace(/color:#be123c;/g, 'color:#fda4af;');
  html = html.replace(/border:1px solid #e2e8f0;/g, 'border:1px solid #334155;');
  html = html.replace(/border-top:1px solid #e2e8f0;/g, 'border-top:1px solid #334155;');
  html = html.replace(/background:#1e293b;/g, 'background:#0f172a;');
  return html;
}
