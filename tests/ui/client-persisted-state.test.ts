import {
  getInitialAppliedJobs,
  getInitialMarketBannerState,
  getInitialThemeMode,
  isDarkThemeEnabled,
} from "@/lib/client-persisted-state";

describe("client-persisted-state", () => {
  test("reads dark theme from the document class", () => {
    expect(isDarkThemeEnabled({ contains: (name: string) => name === "dark" })).toBe(true);
    expect(isDarkThemeEnabled({ contains: () => false })).toBe(false);
  });

  test("derives market banner state from persisted storage", () => {
    expect(getInitialMarketBannerState("dismissed", true)).toEqual({
      dismissed: true,
      open: true,
    });

    expect(getInitialMarketBannerState("closed", true)).toEqual({
      dismissed: false,
      open: false,
    });

    expect(getInitialMarketBannerState("open", true)).toEqual({
      dismissed: false,
      open: true,
    });

    expect(getInitialMarketBannerState("dismissed", false)).toEqual({
      dismissed: false,
      open: true,
    });
  });

  test("parses applied jobs from persisted storage", () => {
    expect(Array.from(getInitialAppliedJobs('["job-1","job-2"]'))).toEqual(["job-1", "job-2"]);
    expect(Array.from(getInitialAppliedJobs("not-json"))).toEqual([]);
    expect(Array.from(getInitialAppliedJobs('{"id":"job-1"}'))).toEqual([]);
  });

  test("resolves explicit persisted theme before system preference", () => {
    expect(getInitialThemeMode("dark", false)).toBe("dark");
    expect(getInitialThemeMode("light", true)).toBe("light");
    expect(getInitialThemeMode(null, true)).toBe("dark");
    expect(getInitialThemeMode(null, false)).toBe("light");
  });
});
