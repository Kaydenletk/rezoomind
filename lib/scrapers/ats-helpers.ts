/**
 * Shared helpers for ATS scrapers (Greenhouse, Lever, Ashby)
 */

export type JobType = 'internship' | 'new-grad' | 'full-time';
export type Region = 'usa' | 'international';

export function inferJobType(title: string): JobType {
  const t = title.toLowerCase();
  if (t.includes('intern') || t.includes('internship')) return 'internship';
  if (
    t.includes('new grad') ||
    t.includes('new-grad') ||
    t.includes('entry level') ||
    t.includes('entry-level') ||
    t.includes('university') ||
    t.includes('graduate')
  ) return 'new-grad';
  return 'full-time';
}

export function inferRegion(location: string | null): Region {
  if (!location) return 'usa';
  const l = location.toLowerCase();
  if (
    l.includes('remote') ||
    l.includes('usa') ||
    l.includes('united states') ||
    l.includes(', ca') ||
    l.includes(', ny') ||
    l.includes(', wa') ||
    l.includes(', tx') ||
    l.includes(', ma') ||
    l.includes(', il') ||
    l.includes(', co') ||
    l.includes(', ga') ||
    l.includes('san francisco') ||
    l.includes('new york') ||
    l.includes('seattle') ||
    l.includes('austin') ||
    l.includes('boston') ||
    l.includes('chicago') ||
    l.includes('los angeles')
  ) return 'usa';
  return 'international';
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
