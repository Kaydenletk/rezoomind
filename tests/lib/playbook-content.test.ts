import { describe, it, expect } from "vitest";
import { PLAYBOOK_ARTICLES } from "@/content/playbook";

describe("PLAYBOOK_ARTICLES data integrity", () => {
  const slugs = Object.keys(PLAYBOOK_ARTICLES) as Array<
    keyof typeof PLAYBOOK_ARTICLES
  >;

  it("has all three expected slugs", () => {
    expect(new Set(slugs)).toEqual(
      new Set(["before-you-apply", "the-timing-game", "hidden-gems"]),
    );
  });

  it("every article's slug field matches its map key (no drift)", () => {
    for (const key of slugs) {
      expect(PLAYBOOK_ARTICLES[key].slug).toBe(key);
    }
  });

  it("every article has non-empty title, lede, and at least 3 sections", () => {
    for (const key of slugs) {
      const a = PLAYBOOK_ARTICLES[key];
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.lede.length).toBeGreaterThan(40);
      expect(a.sections.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("every article has at least 3 takeaways", () => {
    for (const key of slugs) {
      expect(PLAYBOOK_ARTICLES[key].takeaways.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("section headings are unique within an article", () => {
    for (const key of slugs) {
      const headings = PLAYBOOK_ARTICLES[key].sections.map((s) => s.heading);
      expect(new Set(headings).size).toBe(headings.length);
    }
  });

  it("every callout has either 'rule' or 'anti' kind", () => {
    const valid = new Set(["rule", "anti"]);
    for (const key of slugs) {
      for (const section of PLAYBOOK_ARTICLES[key].sections) {
        if (section.callout) {
          expect(valid.has(section.callout.kind)).toBe(true);
          expect(section.callout.text.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("every CTA has an href and a label", () => {
    for (const key of slugs) {
      const cta = PLAYBOOK_ARTICLES[key].cta;
      expect(cta.label.length).toBeGreaterThan(0);
      expect(cta.href.startsWith("/") || cta.href.startsWith("#")).toBe(true);
    }
  });
});
