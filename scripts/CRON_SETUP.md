# Cron Job Setup for GitHub Jobs Fetcher

This guide shows how to set up the Python script to run automatically every hour.

## Prerequisites

1. **Install Python dependencies:**
```bash
cd /Users/khanhle/Desktop/rezoomind/scripts
pip install -r requirements_github_jobs.txt
```

2. **Make script executable:**
```bash
chmod +x fetch_github_jobs.py
```

3. **Test the script manually:**
```bash
python3 fetch_github_jobs.py
```

## Configuration

The script uses environment variables from `.env.local`. You can override these:

```bash
# Enable/disable storage options
export USE_SUPABASE=true      # Store in Supabase (default: true)
export USE_SQLITE=true         # Store in SQLite (default: true)
export EXPORT_CSV=true         # Export to CSV (default: true)
```

## Cron Job Setup

### Option 1: User Crontab (Recommended for Development)

1. **Edit your crontab:**
```bash
crontab -e
```

2. **Add this line to run every hour:**
```cron
0 * * * * cd /Users/khanhle/Desktop/rezoomind/scripts && /usr/bin/python3 fetch_github_jobs.py >> /tmp/github_jobs_cron.log 2>&1
```

3. **Save and exit** (Press `Esc`, then `:wq` in vim)

4. **Verify cron job is scheduled:**
```bash
crontab -l
```

### Option 2: System-wide Cron (Requires sudo)

1. **Create a cron file:**
```bash
sudo vim /etc/cron.d/rezoomind-github-jobs
```

2. **Add this content:**
```cron
# Fetch GitHub jobs every hour
0 * * * * yourusername cd /Users/khanhle/Desktop/rezoomind/scripts && /usr/bin/python3 fetch_github_jobs.py >> /tmp/github_jobs_cron.log 2>&1
```

Replace `yourusername` with your actual username.

3. **Set permissions:**
```bash
sudo chmod 644 /etc/cron.d/rezoomind-github-jobs
```

### Option 3: Launchd (macOS Native)

1. **Create a plist file:**
```bash
vim ~/Library/LaunchAgents/com.rezoomind.githubj obs.plist
```

2. **Add this content:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rezoomind.githubjobs</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/khanhle/Desktop/rezoomind/scripts/fetch_github_jobs.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/khanhle/Desktop/rezoomind/scripts</string>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>StandardOutPath</key>
    <string>/tmp/github_jobs.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/github_jobs_error.log</string>
</dict>
</plist>
```

3. **Load the job:**
```bash
launchctl load ~/Library/LaunchAgents/com.rezoomind.githubjobs.plist
```

4. **Check status:**
```bash
launchctl list | grep rezoomind
```

## Cron Schedule Examples

```cron
# Every hour at minute 0
0 * * * * /path/to/script

# Every 30 minutes
*/30 * * * * /path/to/script

# Every 4 hours
0 */4 * * * /path/to/script

# Every day at 9 AM
0 9 * * * /path/to/script

# Every weekday at 8 AM
0 8 * * 1-5 /path/to/script
```

## Monitoring

### View Cron Logs

**User crontab logs:**
```bash
tail -f /tmp/github_jobs_cron.log
```

**Launchd logs:**
```bash
tail -f /tmp/github_jobs.log
tail -f /tmp/github_jobs_error.log
```

**System logs (macOS):**
```bash
log stream --predicate 'process == "cron"' --level debug
```

### Check Last Run

The script saves the last processed commit hash:
```bash
cat /Users/khanhle/Desktop/rezoomind/scripts/.last_commit_hash
```

### Check SQLite Database

```bash
sqlite3 /Users/khanhle/Desktop/rezoomind/scripts/jobs.db "SELECT COUNT(*) FROM job_postings;"
sqlite3 /Users/khanhle/Desktop/rezoomind/scripts/jobs.db "SELECT * FROM job_postings ORDER BY created_at DESC LIMIT 5;"
```

### Check CSV Export

```bash
wc -l /Users/khanhle/Desktop/rezoomind/scripts/jobs_export.csv
head -10 /Users/khanhle/Desktop/rezoomind/scripts/jobs_export.csv
```

## Troubleshooting

### Cron not running?

1. **Check if cron service is running:**
```bash
# macOS
sudo launchctl list | grep cron

# Linux
systemctl status cron
```

2. **Check cron permissions (macOS Catalina+):**
   - System Preferences → Security & Privacy → Privacy → Full Disk Access
   - Add Terminal or Cron

3. **Use absolute paths:**
   - Python: `/usr/bin/python3` or `/usr/local/bin/python3`
   - Find with: `which python3`

4. **Test with simplified cron:**
```cron
* * * * * echo "Cron works at $(date)" >> /tmp/cron_test.log
```

### Script errors?

1. **Run manually to see errors:**
```bash
cd /Users/khanhle/Desktop/rezoomind/scripts
python3 fetch_github_jobs.py
```

2. **Check environment variables:**
```bash
# Cron has limited environment, source .env.local explicitly
0 * * * * cd /Users/khanhle/Desktop/rezoomind && source .env.local && cd scripts && python3 fetch_github_jobs.py
```

3. **Check Python path in cron:**
```bash
which python3
# Use the full path in your cron job
```

### No new jobs inserted?

This means:
- Repository hasn't been updated (check commit hash)
- All jobs are already in database (working correctly)
- To force a fresh fetch: `rm /Users/khanhle/Desktop/rezoomind/scripts/.last_commit_hash`

## Stopping the Cron Job

**User crontab:**
```bash
crontab -e
# Comment out or delete the line
```

**Launchd:**
```bash
launchctl unload ~/Library/LaunchAgents/com.rezoomind.githubjobs.plist
```

## Production Deployment

For production, consider:
1. **Containerization** (Docker) for consistent environment
2. **Cloud cron services** (AWS EventBridge, Google Cloud Scheduler)
3. **Monitoring** (Sentry, DataDog) for error tracking
4. **Alerting** on failures
5. **Database backups** (especially for SQLite)

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `pip install -r requirements_github_jobs.txt` |
| Run manually | `python3 fetch_github_jobs.py` |
| Edit crontab | `crontab -e` |
| List cron jobs | `crontab -l` |
| View cron logs | `tail -f /tmp/github_jobs_cron.log` |
| Check database | `sqlite3 scripts/jobs.db "SELECT COUNT(*) FROM job_postings;"` |
| Force fresh fetch | `rm scripts/.last_commit_hash` |
| Test cron syntax | `crontab -l \| grep github` |
