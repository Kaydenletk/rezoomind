#!/usr/bin/env python3
"""
Clear all GitHub jobs from Supabase database
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env.local
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env.local')
load_dotenv(env_path)

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: Please install supabase package: pip3 install supabase")
    sys.exit(1)

def main():
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not url or not key:
        print("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    print(f"Connecting to Supabase at: {url[:30]}...")
    print(f"Using key: {key[:15]}...")

    # Test direct REST API call first
    import requests
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    test_url = f"{url}/rest/v1/job_postings?select=id&limit=1"
    print(f"Testing direct REST API: {test_url[:60]}...")
    resp = requests.get(test_url, headers=headers)
    print(f"REST response: {resp.status_code}")

    if resp.status_code != 200:
        print(f"Direct API call failed: {resp.text[:200]}")
        print("Key might be invalid or for wrong project")
        return

    print("Direct API call succeeded!")

    supabase: Client = create_client(url, key)

    # Count jobs before
    result = supabase.table('job_postings').select('id', count='exact').eq('source', 'github').execute()
    count_before = result.count or 0
    print(f"Found {count_before} GitHub jobs to delete")

    if count_before == 0:
        print("No jobs to delete")
        return

    # Delete all GitHub jobs
    print("Deleting jobs...")
    delete_result = supabase.table('job_postings').delete().eq('source', 'github').execute()

    # Count after
    result_after = supabase.table('job_postings').select('id', count='exact').eq('source', 'github').execute()
    count_after = result_after.count or 0

    print(f"Deleted {count_before - count_after} jobs")
    print(f"Remaining GitHub jobs: {count_after}")
    print("Done! Now run sync to fetch fresh jobs.")

if __name__ == '__main__':
    main()
