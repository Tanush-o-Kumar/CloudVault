# CloudVault: REST API Reference & Specification

Base URL: `http://localhost:8000` (Local) / `https://api.yourdomain.com` (Production)

---

## 1. Authentication Endpoints

### Register User
* **Method:** `POST`
* **Path:** `/api/auth/register`
* **Auth Required:** No
* **Request Body:**
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```
* **Success Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "7b045e0d-b8d9-43c2-8495-23429388cbe1",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "is_active": true,
    "created_at": "2026-10-11T12:00:00Z",
    "updated_at": "2026-10-11T12:00:00Z"
  }
}
```

### Login User
* **Method:** `POST`
* **Path:** `/api/auth/login`
* **Auth Required:** No
* **Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```
* **Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": { ... }
}
```

### Get Current User Profile
* **Method:** `GET`
* **Path:** `/api/auth/me`
* **Auth Required:** Yes (`Authorization: Bearer <token>`)
* **Success Response (200 OK):** User object.

---

## 2. File Management Endpoints

### Upload File
* **Method:** `POST`
* **Path:** `/api/files/upload`
* **Auth Required:** Yes
* **Content-Type:** `multipart/form-data`
* **Body Form Field:** `file` (binary)
* **Success Response (201 Created):**
```json
{
  "id": "e81d86d6-f363-4c5e-85cb-9cf1e27a92ad",
  "original_filename": "architecture_diagram.pdf",
  "content_type": "application/pdf",
  "file_size": 1048576,
  "checksum": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
  "created_at": "2026-10-11T12:10:00Z",
  "updated_at": "2026-10-11T12:10:00Z",
  "owner_id": "7b045e0d-b8d9-43c2-8495-23429388cbe1",
  "is_owner": true,
  "share_count": 0
}
```

### List Files
* **Method:** `GET`
* **Path:** `/api/files`
* **Query Parameters:**
  * `q` (string, optional): Search keyword for filename.
  * `type` (string, optional): `all`, `document`, `image`, `archive`.
  * `page` (int, default: 1)
  * `page_size` (int, default: 20)
* **Success Response (200 OK):**
```json
{
  "items": [ ... ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

### Download File
* **Method:** `GET`
* **Path:** `/api/files/{file_id}/download`
* **Auth Required:** Yes
* **Response:** Binary octet-stream with `Content-Disposition: attachment; filename="<filename>"`.

### Delete File
* **Method:** `DELETE`
* **Path:** `/api/files/{file_id}`
* **Auth Required:** Yes (Owner only)
* **Success Response (200 OK):**
```json
{
  "message": "File deleted successfully.",
  "file_id": "e81d86d6-f363-4c5e-85cb-9cf1e27a92ad"
}
```

---

## 3. Sharing Endpoints

### Share File with Registered User
* **Method:** `POST`
* **Path:** `/api/files/{file_id}/shares`
* **Auth Required:** Yes (Owner only)
* **Request Body:**
```json
{
  "recipient_email": "colleague@example.com",
  "permission": "read"
}
```
* **Success Response (201 Created):**
```json
{
  "id": "4b6b66aa-2838-4e89-8aef-f2eec247657d",
  "file_id": "e81d86d6-f363-4c5e-85cb-9cf1e27a92ad",
  "original_filename": "architecture_diagram.pdf",
  "owner_id": "7b045e0d-b8d9-43c2-8495-23429388cbe1",
  "owner_name": "Jane Doe",
  "owner_email": "jane@example.com",
  "recipient_id": "18cf1b3c-e6bf-46ce-a19f-161b96a40e1f",
  "recipient_name": "John Colleague",
  "recipient_email": "colleague@example.com",
  "permission": "read",
  "created_at": "2026-10-11T12:15:00Z",
  "revoked_at": null,
  "is_active": true
}
```

### Revoke Share Permission
* **Method:** `DELETE`
* **Path:** `/api/files/{file_id}/shares/{share_id}`
* **Auth Required:** Yes (Owner only)
* **Success Response (200 OK):**
```json
{
  "message": "Sharing permission revoked successfully.",
  "share_id": "4b6b66aa-2838-4e89-8aef-f2eec247657d"
}
```

### List Received Shares
* **Method:** `GET`
* **Path:** `/api/shares/received`
* **Auth Required:** Yes
* **Success Response (200 OK):** List of files shared with current user.

### List Sent Shares
* **Method:** `GET`
* **Path:** `/api/shares/sent`
* **Auth Required:** Yes
* **Success Response (200 OK):** List of files shared by current user.

---

## 4. Dashboard & Monitoring Endpoints

### Get Storage & Activity Stats
* **Method:** `GET`
* **Path:** `/api/dashboard/stats`
* **Auth Required:** Yes
* **Success Response (200 OK):**
```json
{
  "total_files": 12,
  "total_storage_bytes": 48234496,
  "storage_limit_bytes": 524288000,
  "storage_percentage": 9.2,
  "shares_received_count": 3,
  "shares_sent_count": 5,
  "recent_files": [ ... ],
  "file_type_distribution": {
    "Documents": 7,
    "Images": 3,
    "Archives": 1,
    "Code/Text": 1,
    "Other": 0
  }
}
```

### Health Check
* **Method:** `GET`
* **Path:** `/health`
* **Auth Required:** No
* **Success Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "CloudVault API",
  "version": "1.0.0",
  "environment": "development",
  "storage_backend": "local"
}
```
