#!/usr/bin/env python3
"""
GitHub Jobs Fetcher for Rezoomind
Fetches job listings from speedyapply/2026-SWE-College-Jobs
Supports: Supabase storage, SQLite storage, CSV export, stale job detection
"""

import os
import sys
import csv
import sqlite3
import hashlib
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
GITHUB_REPO = "speedyapply/2026-SWE-College-Jobs"
GITHUB_RAW_URL = f"https://raw.githubusercontent.com/{GITHUB_REPO}/main/README.md"
GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO}/commits/main"

# Storage options
USE_SUPABASE = os.getenv("USE_SUPABASE", "true").lower() == "true"
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"
EXPORT_CSV = os.getenv("EXPORT_CSV", "true").lower() == "true"

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_DB_PATH = os.path.join(SCRIPT_DIR, "jobs.db")
CSV_EXPORT_PATH = os.path.join(SCRIPT_DIR, "jobs_export.csv")
LAST_COMMIT_PATH = os.path.join(SCRIPT_DIR, ".last_commit_hash")


class GitHubJobsFetcher:
    """Fetches and parses job listings from GitHub repository"""

    def __init__(self):
        self.last_commit_hash = self._load_last_commit_hash()
        self.current_commit_hash = None

    def _load_last_commit_hash(self) -> Optional[str]:
        """Load the last processed commit hash"""
        if os.path.exists(LAST_COMMIT_PATH):
            with open(LAST_COMMIT_PATH, 'r') as f:
                return f.read().strip()
        return None

    def _save_commit_hash(self, commit_hash: str):
        """Save the current commit hash"""
        with open(LAST_COMMIT_PATH, 'w') as f:
            f.write(commit_hash)

    def check_for_updates(self) -> bool:
        """Check if repository has been updated since last fetch"""
        try:
            response = requests.get(GITHUB_API_URL, timeout=10)
            response.raise_for_status()
            commit_data = response.json()
            self.current_commit_hash = commit_data['sha']

            if self.last_commit_hash == self.current_commit_hash:
                print(f"✓ No updates since last fetch (commit: {self.current_commit_hash[:8]})")
                return False

            print(f"✓ New commit detected: {self.current_commit_hash[:8]}")
            return True
        except Exception as e:
            print(f"⚠ Could not check GitHub API: {e}")
            print("  Proceeding with fetch anyway...")
            return True

    def fetch_markdown(self) -> str:
        """Fetch the README markdown from GitHub"""
        print(f"Fetching from: {GITHUB_RAW_URL}")
        response = requests.get(GITHUB_RAW_URL, timeout=30)
        response.raise_for_status()
        return response.text

    def parse_jobs(self, markdown: str) -> List[Dict]:
        """Parse job listings from markdown tables"""
        jobs = []
        lines = markdown.split('\n')
        current_table_has_salary = False

        for line in lines:
            # Detect table format
            if '| Company | Position | Location | Salary |' in line:
                current_table_has_salary = True
                continue
            if '| Company | Position | Location | Posting |' in line and 'Salary' not in line:
                current_table_has_salary = False
                continue

            # Skip non-table lines
            if not line.strip().startswith('|'):
                continue
            if '---|' in line:
                continue

            # Parse table row
            columns = [col.strip() for col in line.strip('|').split('|')]

            # Skip header rows
            if columns and columns[0].lower() == 'company':
                continue

            # Parse based on table format
            try:
                if current_table_has_salary and len(columns) >= 6:
                    # Format: Company | Position | Location | Salary | Posting | Age
                    company = self._strip_html(columns[0])
                    role = self._strip_html(columns[1])
                    location = self._strip_html(columns[2]) or None
                    posting_url = self._extract_href(columns[4])
                    date_posted = self._parse_age(columns[5])
                elif len(columns) >= 5:
                    # Format: Company | Position | Location | Posting | Age
                    company = self._strip_html(columns[0])
                    role = self._strip_html(columns[1])
                    location = self._strip_html(columns[2]) or None
                    posting_url = self._extract_href(columns[3])
                    date_posted = self._parse_age(columns[4])
                else:
                    continue

                if not company or not role:
                    continue

                # Generate unique source_id
                source_id = self._generate_source_id(company, role, location, posting_url)

                job = {
                    'source_id': source_id,
                    'company': company,
                    'role': role,
                    'location': location,
                    'url': posting_url,
                    'date_posted': date_posted,
                    'source': 'github',
                    'tags': ['internship', '2026-swe'],
                    'created_at': datetime.now().isoformat(),
                    'status': 'active',
                    'last_seen_at': datetime.now().isoformat()
                }

                jobs.append(job)

            except (IndexError, ValueError) as e:
                # Skip malformed rows
                continue

        return jobs

    def _strip_html(self, text: str) -> str:
        """Remove HTML tags from text"""
        return re.sub(r'<[^>]+>', '', text).strip()

    def _extract_href(self, text: str) -> Optional[str]:
        """Extract URL from markdown link format [text](url)"""
        match = re.search(r'href="([^"]+)"', text)
        if match:
            return match.group(1)
        # Also try markdown format
        match = re.search(r'\[([^\]]+)\]\(([^\)]+)\)', text)
        if match:
            return match.group(2)
        return None

    def _parse_age(self, age_str: str) -> Optional[str]:
        """Parse '5d' format to actual date"""
        match = re.search(r'(\d+)\s*d', age_str, re.IGNORECASE)
        if match:
            days = int(match.group(1))
            date = datetime.now() - timedelta(days=days)
            return date.isoformat()
        return None

    def _generate_source_id(self, company: str, role: str, location: Optional[str], url: Optional[str]) -> str:
        """Generate unique source_id using SHA256"""
        content = f"{company}|{role}|{location or ''}|{url or ''}"
        hash_obj = hashlib.sha256(content.encode())
        return f"github|{hash_obj.hexdigest()[:16]}"


class SQLiteStorage:
    """SQLite database storage for jobs"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_database()

    def _init_database(self):
        """Create database schema if it doesn't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_postings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id TEXT UNIQUE NOT NULL,
                company TEXT NOT NULL,
                role TEXT NOT NULL,
                location TEXT,
                url TEXT,
                date_posted TEXT,
                source TEXT NOT NULL,
                tags TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active',
                last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
                marked_inactive_at TEXT
            )
        ''')

        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_source_id ON job_postings(source_id)
        ''')

        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_status ON job_postings(status)
        ''')

        conn.commit()
        conn.close()
        print(f"✓ SQLite database initialized: {self.db_path}")

    def get_existing_source_ids(self, source: str = 'github') -> set:
        """Get all existing source_ids for a given source"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT source_id FROM job_postings WHERE source = ? AND status = "active"', (source,))
        source_ids = {row[0] for row in cursor.fetchall()}
        conn.close()
        return source_ids

    def insert_jobs(self, jobs: List[Dict]) -> int:
        """Insert new jobs into database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        inserted = 0

        for job in jobs:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO job_postings
                    (source_id, company, role, location, url, date_posted, source, tags, status, last_seen_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    job['source_id'],
                    job['company'],
                    job['role'],
                    job['location'],
                    job['url'],
                    job['date_posted'],
                    job['source'],
                    ','.join(job['tags']),
                    'active',
                    job['last_seen_at']
                ))
                if cursor.rowcount > 0:
                    inserted += 1
            except sqlite3.IntegrityError:
                # Duplicate source_id, skip
                continue

        conn.commit()
        conn.close()
        return inserted

    def update_last_seen(self, source_ids: List[str]):
        """Update last_seen_at for jobs that were found in latest fetch"""
        if not source_ids:
            return

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        placeholders = ','.join('?' * len(source_ids))
        cursor.execute(f'''
            UPDATE job_postings
            SET last_seen_at = ?, status = 'active'
            WHERE source_id IN ({placeholders})
        ''', [datetime.now().isoformat()] + source_ids)

        conn.commit()
        conn.close()

    def mark_stale_jobs(self, days_threshold: int = 7):
        """Mark jobs as inactive if not seen in X days"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        threshold_date = (datetime.now() - timedelta(days=days_threshold)).isoformat()

        cursor.execute('''
            UPDATE job_postings
            SET status = 'inactive', marked_inactive_at = ?
            WHERE status = 'active' AND last_seen_at < ?
        ''', (datetime.now().isoformat(), threshold_date))

        marked = cursor.rowcount
        conn.commit()
        conn.close()

        return marked

    def get_all_jobs(self) -> List[Dict]:
        """Get all jobs from database"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM job_postings ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]


class SupabaseStorage:
    """Supabase database storage for jobs"""

    def __init__(self):
        try:
            from supabase import create_client
            self.url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
            self.key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

            if not self.url or not self.key:
                raise ValueError("Missing Supabase credentials in environment")

            self.client = create_client(self.url, self.key)
            print("✓ Supabase client initialized")
        except ImportError:
            print("⚠ supabase library not installed. Run: pip install supabase")
            raise

    def get_existing_source_ids(self, source: str = 'github') -> set:
        """Get all existing source_ids for a given source"""
        try:
            response = self.client.table('job_postings').select('source_id').eq('source', source).execute()
            return {job['source_id'] for job in response.data}
        except Exception as e:
            print(f"⚠ Error fetching existing jobs: {e}")
            return set()

    def insert_jobs(self, jobs: List[Dict]) -> int:
        """Insert new jobs into Supabase"""
        if not jobs:
            return 0

        try:
            # Remove fields not in Supabase schema
            supabase_jobs = []
            for job in jobs:
                supabase_job = {
                    'source_id': job['source_id'],
                    'company': job['company'],
                    'role': job['role'],
                    'location': job['location'],
                    'url': job['url'],
                    'date_posted': job['date_posted'],
                    'source': job['source'],
                    'tags': job['tags']
                }
                supabase_jobs.append(supabase_job)

            # Insert in batches of 50
            inserted = 0
            batch_size = 50
            for i in range(0, len(supabase_jobs), batch_size):
                batch = supabase_jobs[i:i+batch_size]
                try:
                    response = self.client.table('job_postings').insert(batch).execute()
                    inserted += len(batch)
                except Exception as e:
                    print(f"⚠ Batch insert error: {e}")
                    continue

            return inserted
        except Exception as e:
            print(f"⚠ Error inserting jobs to Supabase: {e}")
            return 0


class CSVExporter:
    """Export jobs to CSV format"""

    @staticmethod
    def export(jobs: List[Dict], output_path: str):
        """Export jobs to CSV file"""
        if not jobs:
            print("No jobs to export to CSV")
            return

        fieldnames = ['source_id', 'company', 'role', 'location', 'url', 'date_posted', 'source', 'tags', 'status', 'created_at', 'last_seen_at']

        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()

            for job in jobs:
                # Convert tags list to string
                if isinstance(job.get('tags'), list):
                    job['tags'] = ','.join(job['tags'])
                writer.writerow(job)

        print(f"✓ Exported {len(jobs)} jobs to: {output_path}")


def main():
    """Main execution function"""
    print("=" * 60)
    print("GitHub Jobs Fetcher for Rezoomind")
    print("=" * 60)
    print()

    # Initialize fetcher
    fetcher = GitHubJobsFetcher()

    # Check for updates (incremental sync)
    if not fetcher.check_for_updates():
        print("\n✓ Repository unchanged. Skipping fetch.")
        print("To force fetch, delete:", LAST_COMMIT_PATH)
        return

    # Fetch markdown
    print("\nFetching job listings...")
    try:
        markdown = fetcher.fetch_markdown()
        print(f"✓ Downloaded {len(markdown)} bytes")
    except Exception as e:
        print(f"✗ Error fetching markdown: {e}")
        return

    # Parse jobs
    print("\nParsing job listings...")
    jobs = fetcher.parse_jobs(markdown)
    print(f"✓ Parsed {len(jobs)} jobs")

    if not jobs:
        print("\n⚠ No jobs found in repository")
        return

    # Storage operations
    inserted_sqlite = 0
    inserted_supabase = 0

    # SQLite storage
    if USE_SQLITE:
        print("\n--- SQLite Storage ---")
        try:
            sqlite_storage = SQLiteStorage(SQLITE_DB_PATH)
            existing_ids = sqlite_storage.get_existing_source_ids()
            new_jobs = [j for j in jobs if j['source_id'] not in existing_ids]

            if new_jobs:
                inserted_sqlite = sqlite_storage.insert_jobs(new_jobs)
                print(f"✓ Inserted {inserted_sqlite} new jobs")
            else:
                print("✓ No new jobs to insert")

            # Update last_seen for all current jobs
            all_source_ids = [j['source_id'] for j in jobs]
            sqlite_storage.update_last_seen(all_source_ids)
            print(f"✓ Updated last_seen for {len(all_source_ids)} jobs")

            # Mark stale jobs
            marked_stale = sqlite_storage.mark_stale_jobs(days_threshold=7)
            if marked_stale > 0:
                print(f"✓ Marked {marked_stale} jobs as inactive (not seen in 7+ days)")

        except Exception as e:
            print(f"✗ SQLite storage error: {e}")

    # Supabase storage
    if USE_SUPABASE:
        print("\n--- Supabase Storage ---")
        try:
            supabase_storage = SupabaseStorage()
            existing_ids = supabase_storage.get_existing_source_ids()
            new_jobs = [j for j in jobs if j['source_id'] not in existing_ids]

            if new_jobs:
                inserted_supabase = supabase_storage.insert_jobs(new_jobs)
                print(f"✓ Inserted {inserted_supabase} new jobs")
            else:
                print("✓ No new jobs to insert")

        except Exception as e:
            print(f"✗ Supabase storage error: {e}")

    # CSV export
    if EXPORT_CSV:
        print("\n--- CSV Export ---")
        try:
            if USE_SQLITE:
                sqlite_storage = SQLiteStorage(SQLITE_DB_PATH)
                all_jobs = sqlite_storage.get_all_jobs()
                CSVExporter.export(all_jobs, CSV_EXPORT_PATH)
            else:
                CSVExporter.export(jobs, CSV_EXPORT_PATH)
        except Exception as e:
            print(f"✗ CSV export error: {e}")

    # Save commit hash for incremental updates
    if fetcher.current_commit_hash:
        fetcher._save_commit_hash(fetcher.current_commit_hash)
        print(f"\n✓ Saved commit hash: {fetcher.current_commit_hash[:8]}")

    # Summary
    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  Total jobs fetched: {len(jobs)}")
    if USE_SQLITE:
        print(f"  New jobs (SQLite): {inserted_sqlite}")
    if USE_SUPABASE:
        print(f"  New jobs (Supabase): {inserted_supabase}")
    if EXPORT_CSV:
        print(f"  CSV exported: {CSV_EXPORT_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
