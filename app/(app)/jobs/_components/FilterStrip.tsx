'use client';

import {
  ROLE_CATEGORIES,
  JOB_TYPE_FILTERS,
  REGION_FILTERS,
  TIER_FILTERS,
  SORT_OPTIONS,
} from '@/lib/job-utils';
import { FilterChip } from './FilterChip';

interface LocationOption {
  value: string;
  label: string;
}

interface FilterCounts {
  jobType: Map<string, number>;
  region: Map<string, number>;
  tier: Map<string, number>;
}

export function FilterStrip({
  searchTerm,
  setSearchTerm,
  selectedJobType,
  setSelectedJobType,
  selectedTier,
  setSelectedTier,
  selectedRegion,
  setSelectedRegion,
  savedOnly,
  setSavedOnly,
  savedCount,
  selectedLocation,
  setSelectedLocation,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  locationOptions,
  filterCounts,
  activeFilters,
  clearAllFilters,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedJobType: string;
  setSelectedJobType: (v: string) => void;
  selectedTier: string;
  setSelectedTier: (v: string) => void;
  selectedRegion: string;
  setSelectedRegion: (v: string) => void;
  savedOnly: boolean;
  setSavedOnly: (fn: (v: boolean) => boolean) => void;
  savedCount: number;
  selectedLocation: string;
  setSelectedLocation: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  locationOptions: LocationOption[];
  filterCounts: FilterCounts;
  activeFilters: string[];
  clearAllFilters: () => void;
}) {
  return (
    <div className="sticky top-[107px] z-10 border-b border-line bg-surface/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Role, company, or skill…"
              className="w-full bg-transparent border-0 border-b border-line py-2 pl-8 pr-3 text-sm font-mono text-fg placeholder:text-fg-subtle outline-none transition focus:border-orange-600"
            />
          </div>

          {/* Quick-filter chips */}
          {JOB_TYPE_FILTERS.filter((o) => o.value !== 'all').map((option) => (
            <FilterChip
              key={`jt-${option.value}`}
              active={selectedJobType === option.value}
              label={`${option.label}${filterCounts.jobType.get(option.value) ? ` ${filterCounts.jobType.get(option.value)}` : ''}`}
              onClick={() => setSelectedJobType(selectedJobType === option.value ? 'all' : option.value)}
            />
          ))}
          {TIER_FILTERS.filter((o) => o.value !== 'all').map((option) => (
            <FilterChip
              key={`tr-${option.value}`}
              active={selectedTier === option.value}
              label={option.label}
              onClick={() => setSelectedTier(selectedTier === option.value ? 'all' : option.value)}
            />
          ))}
          {REGION_FILTERS.filter((o) => o.value !== 'all').map((option) => (
            <FilterChip
              key={`rg-${option.value}`}
              active={selectedRegion === option.value}
              label={option.label}
              onClick={() => setSelectedRegion(selectedRegion === option.value ? 'all' : option.value)}
            />
          ))}
          <FilterChip
            active={savedOnly}
            label={`Saved${savedCount > 0 ? ` (${savedCount})` : ''}`}
            onClick={() => setSavedOnly((v) => !v)}
          />

          {/* Location + Category selects */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-transparent border-0 border-b border-line px-3 py-2 text-sm font-mono text-fg-muted outline-none transition focus:border-orange-600"
          >
            {locationOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-surface-raised text-fg">{o.label}</option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-0 border-b border-line px-3 py-2 text-sm font-mono text-fg-muted outline-none transition focus:border-orange-600"
          >
            {ROLE_CATEGORIES.map((o) => (
              <option key={o.value} value={o.value} className="bg-surface-raised text-fg">{o.label}</option>
            ))}
          </select>

          {/* Sort + clear */}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-0 bg-transparent text-sm font-mono text-fg-subtle outline-none focus:text-fg"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-surface-raised text-fg">{o.label}</option>
              ))}
            </select>
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-mono text-fg-subtle hover:text-orange-600 dark:hover:text-orange-400 transition"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
