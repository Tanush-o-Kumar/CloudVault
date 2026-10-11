import io
import pytest


def get_token(client, email, name):
    res = client.post("/api/auth/register", json={
        "full_name": name,
        "email": email,
        "password": "Password123!"
    })
    return res.json()["access_token"]


def test_file_sharing_workflow(client):
    owner_token = get_token(client, "share_owner@example.com", "Share Owner")
    recipient_token = get_token(client, "recipient@example.com", "Recipient User")

    # 1. Owner uploads a file
    upload_res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {owner_token}"},
        files={"file": ("project_spec.pdf", io.BytesIO(b"Cloud project specification contents"), "application/pdf")}
    )
    file_id = upload_res.json()["id"]

    # 2. Owner shares file with recipient
    share_res = client.post(
        f"/api/files/{file_id}/shares",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"recipient_email": "recipient@example.com", "permission": "read"}
    )
    assert share_res.status_code == 201
    share_data = share_res.json()
    assert share_data["recipient_email"] == "recipient@example.com"
    assert share_data["is_active"] is True
    share_id = share_data["id"]

    # 3. Recipient views received shares
    rec_res = client.get("/api/shares/received", headers={"Authorization": f"Bearer {recipient_token}"})
    assert rec_res.status_code == 200
    received_items = rec_res.json()
    assert len(received_items) == 1
    assert received_items[0]["original_filename"] == "project_spec.pdf"
    assert received_items[0]["owner_email"] == "share_owner@example.com"

    # 4. Recipient downloads shared file
    down_res = client.get(f"/api/files/{file_id}/download", headers={"Authorization": f"Bearer {recipient_token}"})
    assert down_res.status_code == 200
    assert down_res.content == b"Cloud project specification contents"

    # 5. Owner checks sent shares list
    sent_res = client.get("/api/shares/sent", headers={"Authorization": f"Bearer {owner_token}"})
    assert sent_res.status_code == 200
    sent_items = sent_res.json()
    assert len(sent_items) == 1
    assert sent_items[0]["recipient_email"] == "recipient@example.com"

    # 6. Owner revokes share
    revoke_res = client.delete(
        f"/api/files/{file_id}/shares/{share_id}",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert revoke_res.status_code == 200
    assert revoke_res.json()["share_id"] == share_id

    # 7. Recipient is immediately denied download access after revocation
    denied_down = client.get(f"/api/files/{file_id}/download", headers={"Authorization": f"Bearer {recipient_token}"})
    assert denied_down.status_code == 403

    # 8. Recipient received shares list is now empty
    rec_after = client.get("/api/shares/received", headers={"Authorization": f"Bearer {recipient_token}"})
    assert rec_after.status_code == 200
    assert len(rec_after.json()) == 0


def test_cannot_share_with_self(client):
    token = get_token(client, "self_share@example.com", "Self Sharer")
    upload_res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("self.txt", io.BytesIO(b"Hello"), "text/plain")}
    )
    file_id = upload_res.json()["id"]

    res = client.post(
        f"/api/files/{file_id}/shares",
        headers={"Authorization": f"Bearer {token}"},
        json={"recipient_email": "self_share@example.com"}
    )
    assert res.status_code == 400
    assert "cannot share a file with yourself" in res.json()["detail"].lower()


def test_cannot_share_with_nonexistent_user(client):
    token = get_token(client, "valid_owner@example.com", "Valid Owner")
    upload_res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("file.txt", io.BytesIO(b"Hello"), "text/plain")}
    )
    file_id = upload_res.json()["id"]

    res = client.post(
        f"/api/files/{file_id}/shares",
        headers={"Authorization": f"Bearer {token}"},
        json={"recipient_email": "nonexistent_ghost@example.com"}
    )
    assert res.status_code == 404
    assert "no registered account found" in res.json()["detail"].lower()


def test_cannot_share_unowned_file(client):
    owner_token = get_token(client, "file_owner_real@example.com", "Real Owner")
    hacker_token = get_token(client, "hacker_user@example.com", "Hacker")
    third_token = get_token(client, "third_user@example.com", "Third")

    upload_res = client.post(
        "/api/files/upload",
        headers={"Authorization": f"Bearer {owner_token}"},
        files={"file": ("vault_secrets.txt", io.BytesIO(b"Secret"), "text/plain")}
    )
    file_id = upload_res.json()["id"]

    # Hacker tries to share real owner's file
    res = client.post(
        f"/api/files/{file_id}/shares",
        headers={"Authorization": f"Bearer {hacker_token}"},
        json={"recipient_email": "third_user@example.com"}
    )
    assert res.status_code == 403
    assert "only share files that you own" in res.json()["detail"].lower()
