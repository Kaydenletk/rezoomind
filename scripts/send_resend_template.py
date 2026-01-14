#!/usr/bin/env python3
import os
import sys
from typing import Any, Dict, List

import requests
import resend

TEMPLATE_ID = "f9c919ef-b419-4565-b111-979644beffc5"
FROM_ADDRESS = "onboarding@resend.dev"


def get_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}")
    return value


def is_subscribed(email: str) -> bool:
    supabase_url = get_env("SUPABASE_URL")
    service_key = get_env("SUPABASE_SERVICE_ROLE_KEY")
    table = os.getenv("SUPABASE_SUBSCRIBERS_TABLE", "profiles")
    flag_column = os.getenv("SUPABASE_SUBSCRIBED_COLUMN", "is_subscribed")

    url = f"{supabase_url}/rest/v1/{table}"
    params = {
        "select": flag_column,
        "email": f"eq.{email}",
        "limit": "1",
    }
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }

    response = requests.get(url, params=params, headers=headers, timeout=10)
    response.raise_for_status()
    rows = response.json()
    if not rows:
        return False
    return bool(rows[0].get(flag_column))


def build_internships() -> List[Dict[str, Any]]:
    return [
        {
            "company": "NVIDIA",
            "role": "Software Engineering Intern",
            "location": "Santa Clara, CA",
            "url": "https://www.nvidia.com",
        },
        {
            "company": "Adobe",
            "role": "AI/ML Intern",
            "location": "San Jose, CA",
            "url": "https://www.adobe.com",
        },
        {
            "company": "Notion",
            "role": "Backend Engineering Intern",
            "location": "San Francisco, CA",
            "url": "https://www.notion.so",
        },
        {
            "company": "Stripe",
            "role": "Data Engineering Intern",
            "location": "Remote",
            "url": "https://stripe.com",
        },
        {
            "company": "Ramp",
            "role": "Frontend Engineering Intern",
            "location": "New York, NY",
            "url": "https://ramp.com",
        },
    ]


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: send_resend_template.py <email>")
        return 1

    email = sys.argv[1].strip().lower()
    if not email:
        print("Email is required.")
        return 1

    resend.api_key = get_env("RESEND_API_KEY")

    if not is_subscribed(email):
        print(f"Skipping send: {email} is not subscribed.")
        return 0

    payload = {
        "from": FROM_ADDRESS,
        "to": [email],
        "subject": "Your Rezoomind internship alerts",
        "template_id": TEMPLATE_ID,
        "template_params": {
            "internships": build_internships(),
        },
    }

    resend.Emails.send(payload)
    print(f"Email sent to {email}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
