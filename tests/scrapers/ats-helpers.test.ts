import { describe, it, expect } from 'vitest';
import { inferJobType, inferRegion, stripHtml } from '@/lib/scrapers/ats-helpers';

describe('inferJobType', () => {
  it('detects internship from "Software Engineer Intern"', () => {
    expect(inferJobType('Software Engineer Intern')).toBe('internship');
  });

  it('detects internship from "Summer Internship 2026"', () => {
    expect(inferJobType('Summer Internship 2026')).toBe('internship');
  });

  it('detects new-grad from "New Grad Software Engineer"', () => {
    expect(inferJobType('New Grad Software Engineer')).toBe('new-grad');
  });

  it('detects new-grad from "University Graduate - Engineering"', () => {
    expect(inferJobType('University Graduate - Engineering')).toBe('new-grad');
  });

  it('falls back to full-time for senior roles', () => {
    expect(inferJobType('Senior Software Engineer')).toBe('full-time');
  });
});

describe('inferRegion', () => {
  it('returns usa for San Francisco, CA', () => {
    expect(inferRegion('San Francisco, CA')).toBe('usa');
  });

  it('returns usa for New York, NY', () => {
    expect(inferRegion('New York, NY')).toBe('usa');
  });

  it('returns usa for Remote', () => {
    expect(inferRegion('Remote')).toBe('usa');
  });

  it('returns usa for United States', () => {
    expect(inferRegion('United States')).toBe('usa');
  });

  it('returns international for London, UK', () => {
    expect(inferRegion('London, UK')).toBe('international');
  });

  it('returns usa for null location (default)', () => {
    expect(inferRegion(null)).toBe('usa');
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('collapses whitespace', () => {
    expect(stripHtml('<p>Hello</p><p>world</p>')).toBe('Hello world');
  });

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
  });
});
