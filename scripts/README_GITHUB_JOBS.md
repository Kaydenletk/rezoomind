# GitHub Jobs Fetcher - Complete Guide

A Python script that periodically fetches and stores all job listings from the **speedyapply/2026-SWE-College-Jobs** GitHub repository.

## Features

✅ **Initial Fetch**: Downloads all current jobs from the GitHub repository
✅ **Incremental Updates**: Checks commit hash to only process when repo updates
✅ **Multiple Storage Options**: SQLite database + Supabase cloud + CSV export
✅ **Stale Job Detection**: Tracks and marks jobs that have been removed from source
✅ **Data Parsing**: Parses both 5-column and 6-column markdown table formats
✅ **Deduplication**: SHA256-based source_id prevents duplicate entries
✅ **Hourly Automation**: Ready for cron job setup

## Quick Start

### 1. Install Dependencies

```bash
cd /Users/khanhle/Desktop/rezoomind/scripts
pip3 install -r requirements_github_jobs.txt
```

### 2. Run the Script

```bash
python3 fetch_github_jobs.py
```

### 3. Check the Results

**SQLite Database:**
```bash
sqlite3 jobs.db "SELECT COUNT(*) FROM job_postings;"
sqlite3 jobs.db "SELECT company, role, location FROM job_postings LIMIT 10;"
```

**CSV Export:**
```bash
head -20 jobs_export.csv
```

## How It Works

### 1. Initial Fetch

On first run, the script:
1. Fetches the latest commit hash from GitHub API
2. Downloads the README.md markdown file
3. Parses all job listings from markdown tables
4. Stores jobs in SQLite database
5. Exports to CSV file
6. Saves commit hash for next run

**Example Output:**
```
============================================================
GitHub Jobs Fetcher for Rezoomind
============================================================

✓ New commit detected: 92539dc3

Fetching job listings...
✓ Downloaded 122574 bytes

Parsing job listings...
✓ Parsed 379 jobs

--- SQLite Storage ---
✓ Inserted 379 new jobs
✓ Updated last_seen for 379 jobs

--- CSV Export ---
✓ Exported 379 jobs to: jobs_export.csv

Summary:
  Total jobs fetched: 379
  New jobs (SQLite): 379
  CSV exported: jobs_export.csv
============================================================
```

### 2. Incremental Updates

On subsequent runs:
1. Checks GitHub API for latest commit hash
2. If hash hasn't changed → **Skips fetch** (saves time/bandwidth)
3. If hash changed → Fetches and processes only new jobs
4. Updates `last_seen_at` timestamp for existing jobs
5. Marks jobs as "inactive" if not seen in 7+ days

**Example Output (No Changes):**
```
✓ No updates since last fetch (commit: 92539dc3)
✓ Repository unchanged. Skipping fetch.
```

### 3. Data Parsing

The script intelligently handles **two table formats** from the GitHub README:

**Format 1: With Salary (6 columns)**
```
| Company | Position | Location | Salary | Posting | Age |
```

**Format 2: Without Salary (5 columns)**
```
| Company | Position | Location | Posting | Age |
```

**Parsing Features:**
- Extracts company name, role/position, location
- Parses markdown links `[Apply](url)` to get job URLs
- Converts age like "5d" to actual date posted
- Generates unique `source_id` using SHA256 hash
- Handles HTML tags and special characters

### 4. Stale Job Detection

**Automatic Tracking:**
- Every run updates `last_seen_at` timestamp for current jobs
- Jobs not seen in 7+ days → marked as `status='inactive'`
- Jobs not seen in 30+ days → can be deleted (configurable)

**Database Fields:**
- `status`: 'active' | 'inactive' | 'removed'
- `last_seen_at`: Last time job was found in GitHub repo
- `marked_inactive_at`: When job was marked inactive
- `created_at`: When job was first added to database

## Configuration

### Environment Variables

Create or modify `.env.local` in the project root:

```bash
# Supabase (Optional - for cloud storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage Options (default: all true)
USE_SUPABASE=true    # Store in Supabase cloud database
USE_SQLITE=true      # Store in local SQLite database
EXPORT_CSV=true      # Export to CSV file
```

### Script Behavior

**Without Configuration (Defaults):**
- ✅ Creates SQLite database: `scripts/jobs.db`
- ✅ Exports CSV: `scripts/jobs_export.csv`
- ⚠️ Skips Supabase (no credentials)

**To Disable Storage Options:**
```bash
export USE_SQLITE=false    # Don't use SQLite
export USE_SUPABASE=false  # Don't use Supabase
export EXPORT_CSV=false    # Don't export CSV
```

## Database Schema

### SQLite Schema

```sql
CREATE TABLE job_postings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT UNIQUE NOT NULL,        -- SHA256 hash for deduplication
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    location TEXT,
    url TEXT,                              -- Application link
    date_posted TEXT,                      -- ISO format: 2026-01-27T12:00:00
    source TEXT NOT NULL,                  -- Always 'github'
    tags TEXT,                             -- Comma-separated: 'internship,2026-swe'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',          -- 'active' | 'inactive' | 'removed'
    last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
    marked_inactive_at TEXT
);
```

### Querying the Database

**Count total jobs:**
```bash
sqlite3 jobs.db "SELECT COUNT(*) FROM job_postings;"
```

**View recent jobs:**
```bash
sqlite3 jobs.db "SELECT company, role, location, created_at FROM job_postings ORDER BY created_at DESC LIMIT 10;"
```

**Find active jobs only:**
```bash
sqlite3 jobs.db "SELECT COUNT(*) FROM job_postings WHERE status='active';"
```

**Find jobs by company:**
```bash
sqlite3 jobs.db "SELECT role, location, url FROM job_postings WHERE company LIKE '%Google%';"
```

**Jobs marked inactive:**
```bash
sqlite3 jobs.db "SELECT company, role, marked_inactive_at FROM job_postings WHERE status='inactive';"
```

## CSV Export Format

**File**: `scripts/jobs_export.csv`

**Columns:**
```
source_id,company,role,location,url,date_posted,source,tags,status,created_at,last_seen_at
```

**Example Row:**
```csv
github|a1b2c3d4e5f6g7h8,Google,SWE Intern,"Mountain View, CA",https://careers.google.com/jobs/123,2026-01-22T12:00:00,github,"internship,2026-swe",active,2026-01-27T10:30:00,2026-01-27T10:30:00
```

**Open in Excel/Google Sheets:**
- File → Open → Select `jobs_export.csv`
- Or double-click the file (default opens in spreadsheet app)

## Automation (Cron Jobs)

See detailed instructions in [CRON_SETUP.md](./CRON_SETUP.md)

### Quick Setup (Hourly Execution)

**1. Edit crontab:**
```bash
crontab -e
```

**2. Add this line:**
```cron
0 * * * * cd /Users/khanhle/Desktop/rezoomind/scripts && /usr/bin/python3 fetch_github_jobs.py >> /tmp/github_jobs.log 2>&1
```

**3. Verify:**
```bash
crontab -l
```

**4. Monitor logs:**
```bash
tail -f /tmp/github_jobs.log
```

### Schedule Examples

```cron
# Every hour
0 * * * * /path/to/fetch_github_jobs.py

# Every 30 minutes
*/30 * * * * /path/to/fetch_github_jobs.py

# Every 6 hours
0 */6 * * * /path/to/fetch_github_jobs.py

# Daily at 9 AM
0 9 * * * /path/to/fetch_github_jobs.py
```

## Monitoring

### Check Last Run

```bash
# View last processed commit
cat .last_commit_hash

# View cron log
tail -50 /tmp/github_jobs.log

# Count jobs added today
sqlite3 jobs.db "SELECT COUNT(*) FROM job_postings WHERE DATE(created_at) = DATE('now');"
```

### Force Fresh Fetch

To ignore commit hash and force a fresh fetch:
```bash
rm .last_commit_hash
python3 fetch_github_jobs.py
```

### Debugging

**Enable verbose output:**
```bash
python3 fetch_github_jobs.py 2>&1 | tee debug.log
```

**Check specific issues:**
```bash
# Test GitHub access
curl -I https://raw.githubusercontent.com/speedyapply/2026-SWE-College-Jobs/main/README.md

# Test GitHub API
curl https://api.github.com/repos/speedyapply/2026-SWE-College-Jobs/commits/main

# Verify Python dependencies
pip3 list | grep -E "requests|dotenv|supabase"

# Test SQLite
sqlite3 jobs.db "SELECT sqlite_version();"
```

## Integrating with Rezoomind Dashboard

### Option 1: Use SQLite Database

**In your dashboard code:**
```python
import sqlite3

conn = sqlite3.connect('/path/to/scripts/jobs.db')
cursor = conn.cursor()

# Get active jobs
cursor.execute("SELECT * FROM job_postings WHERE status='active' ORDER BY created_at DESC LIMIT 100")
jobs = cursor.fetchall()

conn.close()
```

### Option 2: Use CSV File

**In your dashboard code:**
```python
import csv

with open('/path/to/scripts/jobs_export.csv', 'r') as f:
    reader = csv.DictReader(f)
    jobs = [row for row in reader if row['status'] == 'active']
```

### Option 3: Use Supabase (Recommended for Production)

Set up Supabase credentials in `.env.local` and enable `USE_SUPABASE=true`.

**In your dashboard (TypeScript/Next.js):**
```typescript
// Already integrated! Just navigate to /jobs
// The jobs page fetches from Supabase automatically
```

## Troubleshooting

### Issue: "No jobs found"

**Solution:**
1. Check GitHub repo is accessible:
   ```bash
   curl https://raw.githubusercontent.com/speedyapply/2026-SWE-College-Jobs/main/README.md
   ```
2. Verify markdown format hasn't changed
3. Run with verbose output: `python3 fetch_github_jobs.py 2>&1 | grep "Parsed"`

### Issue: "Duplicate jobs"

**Not actually an issue!** The deduplication system is working. Jobs with same `source_id` are automatically skipped.

### Issue: "Supabase error"

**If you don't need cloud storage:**
- Set `USE_SUPABASE=false`
- Only use SQLite and CSV

**If you need Supabase:**
- Add credentials to `.env.local`
- Ensure service role key is correct
- Check network/firewall

### Issue: "Cron not running"

See [CRON_SETUP.md](./CRON_SETUP.md) troubleshooting section.

**Quick checks:**
```bash
# Verify cron service
sudo launchctl list | grep cron  # macOS
systemctl status cron             # Linux

# Test with simple cron
* * * * * echo "Test at $(date)" >> /tmp/cron_test.log

# Use absolute paths in cron
which python3  # Use this path in crontab
```

## File Locations

After running the script, you'll find:

```
rezoomind/
└── scripts/
    ├── fetch_github_jobs.py          # Main script
    ├── requirements_github_jobs.txt  # Dependencies
    ├── CRON_SETUP.md                 # Cron job guide
    ├── README_GITHUB_JOBS.md         # This file
    ├── jobs.db                       # SQLite database (created)
    ├── jobs_export.csv               # CSV export (created)
    └── .last_commit_hash             # Commit tracking (created)
```

## Performance

- **First run**: ~5-10 seconds (downloads + parses 379 jobs)
- **Subsequent runs (no changes)**: ~1-2 seconds (only checks commit hash)
- **Subsequent runs (with changes)**: ~5-10 seconds (downloads + processes deltas)

## Advanced Usage

### Customize Stale Detection

Edit the script to change the inactivity threshold:

```python
# Line ~720 - Change days_threshold
marked_stale = sqlite_storage.mark_stale_jobs(days_threshold=14)  # 14 days instead of 7
```

### Add More Sources

The architecture supports multiple sources. To add Indeed, ZipRecruiter, etc.:

1. Use the existing `scripts/scrape_jobs.py` (JobSpy-based)
2. Or extend `fetch_github_jobs.py` with additional parsers

### Webhook Integration

Instead of checking commit hash, you can set up a GitHub webhook:

1. Create webhook in GitHub repo settings
2. Point to your server endpoint (e.g., `/api/webhook/github-jobs`)
3. Trigger the Python script when webhook fires

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review logs: `tail -f /tmp/github_jobs.log`
3. Test manually: `python3 fetch_github_jobs.py`
4. Check database: `sqlite3 jobs.db "SELECT COUNT(*) FROM job_postings;"`

## License

This script is part of the Rezoomind project.
