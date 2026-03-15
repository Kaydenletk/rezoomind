import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from agent.models import ChatInteraction, JobMatchScore, TailoredDocument
from jobs.models import JobListing
from users.models import CandidateProfile


pytestmark = pytest.mark.django_db


CHAT_URL = "/api/chat/"
GENERATE_DOC_URL = "/api/generate-document/"
MATCH_SCORE_URL = "/api/match-score/{job_id}/"


def _tool_call_response(tool_name: str, arguments: dict):
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    tool_calls=[
                        SimpleNamespace(
                            function=SimpleNamespace(
                                name=tool_name,
                                arguments=json.dumps(arguments),
                            )
                        )
                    ],
                    content=None,
                )
            )
        ]
    )


def _text_response(content: str):
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    tool_calls=None,
                    content=content,
                )
            )
        ]
    )


@pytest.fixture
def user():
    User = get_user_model()
    return User.objects.create_user(
        username="agent_test_user",
        email="agent-test@example.com",
        password="testpass123!",
    )


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def job():
    return JobListing.objects.create(
        title="Backend Software Engineer Intern",
        company_name="Acme",
        description="Build Django APIs with Python, Redis, and AWS.",
        skills=["Python", "Django", "Redis", "AWS"],
        url="https://example.com/jobs/123",
        location="San Jose, CA",
    )


@pytest.fixture
def profile(user):
    return CandidateProfile.objects.create(
        user=user,
        master_resume_json={
            "summary": "Backend-focused SWE intern",
            "skills": ["Python", "Django", "PostgreSQL"],
            "experience": [
                {
                    "company": "ExampleCo",
                    "bullets": [
                        "Built Django APIs for internal tools",
                        "Improved API response times with query optimization",
                    ],
                }
            ],
        },
    )


def test_chat_intent_routing_tailor_resume_creates_document_and_actions(api_client, user, job, profile):
    with patch("agent.views.client.chat.completions.create") as mock_create:
        mock_create.side_effect = [
            _tool_call_response("tailor_resume", {"constraints": {"max_bullets": 3}}),
            _text_response(
                "- Optimized Django APIs using Redis caching for lower latency.\n"
                "- Built Python ETL workflows to process application events.\n"
                "- Shipped backend features with tests and production monitoring."
            ),
        ]

        response = api_client.post(
            CHAT_URL,
            data={"message": "Tailor my resume for this role.", "job_id": job.id},
            format="json",
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["intent"] == "tailor_resume"
    assert "tailored_document" in payload
    assert payload["tailored_document"]["doc_type"] == "resume"
    assert [a["type"] for a in payload["actions"]] == ["confirm", "tweak", "download_pdf"]

    doc = TailoredDocument.objects.get(id=payload["tailored_document"]["id"])
    assert doc.user_id == user.id
    assert doc.job_id == job.id
    assert doc.is_active is True
    assert doc.version == 1

    # User + assistant messages persisted
    roles = list(
        ChatInteraction.objects.filter(user=user, job=job).order_by("created_at").values_list("role", flat=True)
    )
    assert roles[-2:] == ["user", "assistant"]


def test_chat_feedback_loop_creates_revision_and_merges_constraints(api_client, user, job, profile):
    base_doc = TailoredDocument.objects.create(
        user=user,
        job=job,
        doc_type="resume",
        content="- Existing bullet 1\n- Existing bullet 2",
        constraints={"max_bullets": 5},
        version=1,
        is_active=True,
    )

    with patch("agent.views.client.chat.completions.create") as mock_create:
        mock_create.side_effect = [
            _tool_call_response(
                "update_tailored_resume",
                {"constraints": {"max_bullets": 3, "remove_keywords": ["Docker"]}},
            ),
            _text_response(
                "- Built Python + Django APIs for recruiting workflows.\n"
                "- Reduced p95 latency with Redis-backed caching.\n"
                "- Added observability and tests to improve release confidence."
            ),
        ]

        response = api_client.post(
            CHAT_URL,
            data={"message": "Limit to 3 bullets and remove Docker.", "job_id": job.id},
            format="json",
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["intent"] == "feedback_update"

    base_doc.refresh_from_db()
    assert base_doc.is_active is False

    new_doc = TailoredDocument.objects.get(id=payload["tailored_document"]["id"])
    assert new_doc.parent_id == base_doc.id
    assert new_doc.version == 2
    assert new_doc.is_active is True
    assert new_doc.constraints["max_bullets"] == 3
    assert any(k.lower() == "docker" for k in new_doc.constraints.get("remove_keywords", []))


def test_match_score_endpoint_persists_and_updates_single_record(api_client, user, job, profile):
    url = MATCH_SCORE_URL.format(job_id=job.id)

    with patch("agent.views._embed", side_effect=[[1.0, 0.0], [1.0, 0.0]]):
        first = api_client.get(url)
    assert first.status_code == 200
    first_payload = first.json()
    assert first_payload["strong_match_percent"] == 100

    record = JobMatchScore.objects.get(user=user, job=job)
    assert record.strong_match_percent == 100

    # Call again with different embedding relationship; same DB row should be updated, not duplicated.
    with patch("agent.views._embed", side_effect=[[1.0, 0.0], [0.0, 1.0]]):
        second = api_client.get(url)
    assert second.status_code == 200
    second_payload = second.json()
    assert second_payload["strong_match_percent"] == 50

    assert JobMatchScore.objects.filter(user=user, job=job).count() == 1
    record.refresh_from_db()
    assert record.strong_match_percent == 50


def test_generate_document_endpoint_creates_resume_doc(api_client, user, job, profile):
    with patch("agent.views.client.chat.completions.create") as mock_create:
        mock_create.return_value = _text_response(
            "- Optimized Django APIs using Redis.\n"
            "- Built reliable Python services for internal workflows.\n"
            "- Improved backend test coverage and CI stability."
        )

        response = api_client.post(
            GENERATE_DOC_URL,
            data={"job_id": job.id, "doc_type": "resume", "constraints": {"max_bullets": 3}},
            format="json",
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["doc_type"] == "resume"
    assert [a["type"] for a in payload["actions"]] == ["confirm", "tweak", "download_pdf"]

