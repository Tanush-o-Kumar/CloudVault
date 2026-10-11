# CloudVault: Security Architecture & Threat Defense Model

This document outlines the security architecture, cryptographic parameterization, identity controls, and defensive mechanisms implemented in CloudVault.

---

## 1. Authentication & Cryptographic Hashing

### Argon2id Password Hashing
CloudVault utilizes **Argon2id**, the hybrid version of Argon2 recommended by RFC 9106 and the Password Hashing Competition (PHC). Argon2id combines data-dependent memory access (resisting side-channel attacks) with data-independent memory access (resisting GPU and ASIC accelerated cracking).

```python
# Implemented in backend/app/utils/security.py
ph = PasswordHasher(
    time_cost=2,        # 2 computational passes
    memory_cost=65536,  # 64 MiB RAM per hashing operation
    parallelism=1,      # Single thread
    hash_len=32,        # 256-bit output digest
)
```

* **Plaintext Exclusion:** Plaintext passwords are never saved, cached, or written to server logs.
* **Salt Handling:** Argon2 generates unique cryptographically secure random salts per hash automatically, preventing precomputed rainbow table attacks.
* **Enumeration Resistance:** Login endpoints employ constant-time evaluation to prevent timing attacks that distinguish existing from nonexistent accounts.

### JSON Web Tokens (JWT)
* **Algorithm:** HMAC with SHA-256 (`HS256`).
* **Expiration:** Short-lived access tokens (default 60 minutes).
* **Claims:** Contains user subject (`sub`), registered email (`email`), name, issuance timestamp (`iat`), and issuer (`iss: cloudvault-api`).
* **Signature Verification:** Validated on every protected endpoint before controller execution.

---

## 2. Authorization & IDOR Defense

Insecure Direct Object Reference (IDOR) is among the most prevalent cloud vulnerabilities, occurring when an application provides direct access to objects based on user-supplied input without server-side ownership checks.

### File Access Authorization Matrix:

```
Request to /api/files/{file_id}/download or /api/files/{file_id}
                   │
                   ▼
       Is user the file owner?
         │                │
       [Yes]             [No]
         │                │
         ▼                ▼
   Grant Access    Query file_shares WHERE
                   file_id = :file_id
                   AND recipient_id = :current_user_id
                   AND revoked_at IS NULL
                          │
                   ┌──────┴──────┐
                  [Yes]         [No]
                   │             │
                   ▼             ▼
             Grant Access   Deny Access (403 Forbidden / 404 Not Found)
```

1. **Deletion Guard:** Only the user whose ID matches `File.owner_id` can delete a file. Shares do not grant delete capabilities.
2. **Sharing Guard:** Only the user whose ID matches `File.owner_id` can create or revoke shares.
3. **Instant Revocation:** When an owner revokes a share, `revoked_at` is set to the current UTC timestamp. Subsequent requests immediately fail authorization without cache lag.

---

## 3. Storage Security (Amazon S3)

### Private Bucket & Block Public Access
* **Zero Public Read:** The target S3 bucket has S3 Block Public Access enabled across all four controls (`BlockPublicAcls`, `IgnorePublicAcls`, `BlockPublicPolicy`, `RestrictPublicBuckets`).
* **Isolated Object Keys:** User-supplied filenames are never used as root S3 keys. S3 keys follow the scheme:
  `users/{user_id}/{random_uuid}_{sanitized_filename}`.
  This isolates user spaces, prevents cross-tenant overwrites, and eliminates path traversal exploits.

### Encryption at Rest (SSE-S3)
* Every S3 put request is dispatched with `ServerSideEncryption="AES256"`.
* Amazon S3 encrypts each object with a unique key using 256-bit Advanced Encryption Standard before persisting to disk.

---

## 4. Input Validation & Defense in Depth

### Filename Sanitization
User-provided filenames are processed through `sanitize_filename()`:
* Strips directory traversal vectors (`../`, `..\`, `/`, `\`).
* Removes null bytes (`\0`) and non-printable control characters.
* Collapses multiple periods to prevent extension masking.
* Limits maximum filename length to 200 characters while preserving the extension.

### File Upload Constraints
* **Size Quota:** Files exceeding `MAX_UPLOAD_SIZE_BYTES` (default 10 MB) are rejected immediately with HTTP 413.
* **Extension Whitelisting:** Enforces strict whitelist validation against allowed formats (`pdf`, `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `txt`, `md`, `csv`, `json`, `docx`, `xlsx`, `pptx`, `zip`).

---

## 5. Network & HTTP Security Headers

Every HTTP response returned by CloudVault includes hardened security headers injected via middleware:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains (Production only)
```
