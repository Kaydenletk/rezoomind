#!/usr/bin/env python3
"""
JobSpy scraper for Rezoomind
Scrapes jobs from multiple boards and saves to Supabase
"""

import os
import sys
from datetime import datetime
from typing import List, Dict
import pandas as pd
from jobspy import scrape_jobs
from supabase import create_client, Client

# Supabase setup
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def scrape_all_jobs(
    search_terms: List[str],
    locations: List[str],
    job_types: List[str] = ['internship'],
    hours_old: int = 24,
    results_per_site: int = 50
) -> pd.DataFrame:
    """Scrape jobs from multiple job boards"""
    all_jobs = []

    for search_term in search_terms:
        for location in locations:
            for job_type in job_types:
                print(f"Scraping: {search_term} | {location} | {job_type}")

                try:
                    jobs = scrape_jobs(
                        site_name=[
                            "indeed",      # Best - no rate limiting
                            "zip_recruiter",
                            "google",
                        ],
                        search_term=search_term,
                        location=location,
                        distance=50,
                        job_type=job_type,
                        is_remote=(location.lower() == 'remote'),
                        results_wanted=results_per_site,
                        hours_old=hours_old,
                        country_indeed='USA',
                        description_format='markdown',
                    )

                    if jobs is not None and len(jobs) > 0:
                        jobs['search_term'] = search_term
                        jobs['scraped_at'] = datetime.now().isoformat()
                        all_jobs.append(jobs)
                        print(f"  Found {len(jobs)} jobs")
                    else:
                        print(f"  No jobs found")

                except Exception as e:
                    print(f"  Error: {str(e)}")
                    continue

    if not all_jobs:
        return pd.DataFrame()

    combined = pd.concat(all_jobs, ignore_index=True)
    combined = combined.drop_duplicates(subset=['job_url'], keep='first')

    print(f"\nTotal jobs scraped: {len(combined)}")
    return combined

def save_to_supabase(jobs_df: pd.DataFrame) -> Dict[str, int]:
    """Save jobs to Supabase database"""
    if jobs_df.empty:
        return {'total': 0, 'new': 0, 'duplicates': 0}

    new_count = 0
    duplicate_count = 0

    for _, job in jobs_df.iterrows():
        source_id = f"{job.get('site', 'unknown')}|{job.get('job_url', '')}"

        existing = supabase.table('job_postings').select('id').eq('source_id', source_id).execute()

        if existing.data:
            duplicate_count += 1
            continue

        job_data = {
            'source_id': source_id,
            'company': str(job.get('company', 'Unknown'))[:200],
            'role': str(job.get('title', 'Unknown'))[:200],
            'location': str(job.get('location', ''))[:200] if pd.notna(job.get('location')) else None,
            'url': str(job.get('job_url', ''))[:500] if pd.notna(job.get('job_url')) else None,
            'description': str(job.get('description', ''))[:5000] if pd.notna(job.get('description')) else None,
            'date_posted': job.get('date_posted').isoformat() if pd.notna(job.get('date_posted')) else None,
            'source': str(job.get('site', 'unknown')),
            'tags': [
                str(job.get('job_type', '')).lower() if pd.notna(job.get('job_type')) else 'unknown',
                str(job.get('search_term', '')).lower().replace(' ', '_'),
            ],
            'salary_min': float(job.get('min_amount')) if pd.notna(job.get('min_amount')) else None,
            'salary_max': float(job.get('max_amount')) if pd.notna(job.get('max_amount')) else None,
            'salary_interval': str(job.get('interval', '')) if pd.notna(job.get('interval')) else None,
        }

        try:
            supabase.table('job_postings').insert(job_data).execute()
            new_count += 1
        except Exception as e:
            print(f"Error inserting job: {str(e)}")
            continue

    return {
        'total': len(jobs_df),
        'new': new_count,
        'duplicates': duplicate_count,
    }

def main():
    """Main scraping function"""
    SEARCH_TERMS = [
        'software engineer intern',
        'software engineering internship',
        'data science intern',
        'machine learning intern',
        'frontend developer intern',
        'backend developer intern',
        'full stack intern',
    ]

    LOCATIONS = [
        'San Francisco, CA',
        'New York, NY',
        'Seattle, WA',
        'Austin, TX',
        'Remote',
        'Boston, MA',
        'Los Angeles, CA',
    ]

    print("=" * 60)
    print("Starting JobSpy Scraper for Rezoomind")
    print("=" * 60)

    jobs_df = scrape_all_jobs(
        search_terms=SEARCH_TERMS,
        locations=LOCATIONS,
        job_types=['internship'],
        hours_old=24,
        results_per_site=50,
    )

    if jobs_df.empty:
        print("\nNo jobs found")
        return 1

    print("\nSaving to database...")
    stats = save_to_supabase(jobs_df)

    print("\n" + "=" * 60)
    print("Scraping Complete!")
    print("=" * 60)
    print(f"Total scraped: {stats['total']}")
    print(f"New jobs saved: {stats['new']}")
    print(f"Duplicates skipped: {stats['duplicates']}")
    print("=" * 60)

    return 0

if __name__ == '__main__':
    sys.exit(main())
