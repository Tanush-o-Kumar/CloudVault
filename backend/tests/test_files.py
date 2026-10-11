import io
import pytest
from backend.app.config import settings


def get_auth_token(client, email="user1@example.com", name="User One"):
    res = client.post("/api/auth/register", json={
        "full_name": name,
        "email": email,
        "password": "Password123!"
    })
    return res.json()["access_token"]


def test_file_upload_success(client):
    token = get_auth_token(client, "uploader@example.com", "Uploader")
    file_content = b"CloudVault securely stores documents in AWS S3 with encryption."
    file = io.BytesIO(file_content)

    res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("report.pdf", file, "application/pdf")}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["original_filename"] == "report.pdf"
    assert data["file_size"] == len(file_content)
    assert data["content_type"] == "application/pdf"
    assert "checksum" in data
    assert data["is_owner"] is True


def test_file_upload_oversized_rejection(client):
    token = get_auth_token(client, "oversize_user@example.com")
    # Generate content larger than MAX_UPLOAD_SIZE_BYTES
    oversized_bytes = b"0" * (settings.MAX_UPLOAD_SIZE_BYTES + 1024)
    file = io.BytesIO(oversized_bytes)

    res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("huge.zip", file, "application/zip")}
    )
    assert res.status_code == 413
    assert "exceeds" in res.json()["detail"].lower()


def test_file_upload_invalid_type_rejection(client):
    token = get_auth_token(client, "invalid_type@example.com")
    file = io.BytesIO(b"echo 'malicious script'")

    res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("script.exe", file, "application/x-msdownload")}
    )
    assert res.status_code == 400
    assert "unsupported file type" in res.json()["detail"].lower()


def test_list_only_current_users_files(client):
    token1 = get_auth_token(client, "owner1@example.com", "Owner One")
    token2 = get_auth_token(client, "owner2@example.com", "Owner Two")

    # User 1 uploads a file
    client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token1}"},
        files={"file": ("user1_doc.pdf", io.BytesIO(b"User 1 private document"), "application/pdf")}
    )

    # User 2 uploads a file
    client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token2}"},
        files={"file": ("user2_doc.pdf", io.BytesIO(b"User 2 private document"), "application/pdf")}
    )

    # User 1 lists files -> should only see user1_doc.pdf
    res1 = client.get("/api/files", headers={"Authorization": f"Bearer {token1}"})
    assert res1.status_code == 200
    files1 = res1.json()["items"]
    assert len(files1) == 1
    assert files1[0]["original_filename"] == "user1_doc.pdf"

    # User 2 lists files -> should only see user2_doc.pdf
    res2 = client.get("/api/files", headers={"Authorization": f"Bearer {token2}"})
    assert res2.status_code == 200
    files2 = res2.json()["items"]
    assert len(files2) == 1
    assert files2[0]["original_filename"] == "user2_doc.pdf"


def test_prevent_idor_cross_user_file_access(client):
    token1 = get_auth_token(client, "alice_idor@example.com")
    token2 = get_auth_token(client, "mallory_idor@example.com")

    # Alice uploads a secret file
    upload_res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token1}"},
        files={"file": ("confidential.pdf", io.BytesIO(b"Secret corporate document"), "application/pdf")}
    )
    file_id = upload_res.json()["id"]

    # Mallory attempts to retrieve metadata of Alice's file
    res = client.get(f"/api/files/{file_id}", headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 404

    # Mallory attempts to download Alice's file directly
    down_res = client.get(f"/api/files/{file_id}/download", headers={"Authorization": f"Bearer {token2}"})
    assert down_res.status_code == 403


def test_download_own_file(client):
    token = get_auth_token(client, "download_user@example.com")
    sample_data = b"Sample text file to verify download integrity."

    upload_res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("notes.txt", io.BytesIO(sample_data), "text/plain")}
    )
    file_id = upload_res.json()["id"]

    down_res = client.get(f"/api/files/{file_id}/download", headers={"Authorization": f"Bearer {token}"})
    assert down_res.status_code == 200
    assert down_res.content == sample_data
    assert "attachment; filename=\"notes.txt\"" in down_res.headers["Content-Disposition"]


def test_file_deletion_by_owner(client):
    token = get_auth_token(client, "delete_owner@example.com")

    upload_res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("temp.png", io.BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")}
    )
    file_id = upload_res.json()["id"]

    # Delete file
    del_res = client.delete(f"/api/files/{file_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == 200
    assert del_res.json()["file_id"] == file_id

    # Verify file is no longer accessible
    get_res = client.get(f"/api/files/{file_id}", headers={"Authorization": f"Bearer {token}"})
    assert get_res.status_code == 404


def test_prevent_unauthorized_deletion(client):
    token1 = get_auth_token(client, "real_owner@example.com")
    token2 = get_auth_token(client, "attacker@example.com")

    upload_res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token1}"},
        files={"file": ("essential.pdf", io.BytesIO(b"Important data"), "application/pdf")}
    )
    file_id = upload_res.json()["id"]

    # Attacker tries to delete owner's file
    del_res = client.delete(f"/api/files/{file_id}", headers={"Authorization": f"Bearer {token2}"})
    assert del_res.status_code == 403


def test_dashboard_stats(client):
    token = get_auth_token(client, "stats_user@example.com")

    client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("doc.pdf", io.BytesIO(b"PDF Content"), "application/pdf")}
    )
    client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("img.png", io.BytesIO(b"PNG Content"), "image/png")}
    )

    stats_res = client.get("/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert data["total_files"] == 2
    assert data["total_storage_bytes"] > 0
    assert len(data["recent_files"]) == 2
    assert data["file_type_distribution"]["Documents"] == 1
    assert data["file_type_distribution"]["Images"] == 1
