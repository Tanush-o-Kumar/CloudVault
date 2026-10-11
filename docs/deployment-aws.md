# CloudVault: AWS Production Deployment Manual

This guide outlines the step-by-step procedure to provision infrastructure, configure cloud services, deploy the application, and manage operational costs on Amazon Web Services (AWS).

---

## 1. Target AWS Cloud Architecture

```
Internet
  │
  ├─► AWS CloudFront (HTTPS CDN) ──► S3 Bucket (Frontend Static Website)
  │
  └─► Application Load Balancer (ALB, HTTPS 443)
        │
        ▼ (Port 8000)
      Amazon EC2 Instance (FastAPI + Uvicorn + Systemd / Docker)
        │  [IAM Instance Profile Attached]
        ├─► Amazon S3 Private Bucket (File Object Storage)
        └─► Amazon RDS PostgreSQL (Relational Metadata & Auth)
```

---

## 2. Cost Analysis & Budget Considerations

> [!WARNING]
> Deploying AWS resources will incur cloud infrastructure charges unless covered by active AWS Free Tier allowances or AWS Educate credits. Do not provision resources without reviewing these estimates.

| AWS Resource | Sizing / Tier | Estimated Monthly Cost | Free Tier Eligible? | Cost-Optimization Advice |
| :--- | :--- | :--- | :--- | :--- |
| **Amazon EC2** | `t4g.small` (ARM Graviton) or `t3.micro` | \$3.50 – \$8.50 | Yes (`t3.micro` 750 hrs/mo for 12 mos) | Stop EC2 instance when not testing; use Graviton instances for 20% lower cost. |
| **Public IPv4 Address** | 1 Elastic IP / Public IP | \$3.60 (\$0.005/hr) | No (AWS charges for all in-use IPv4) | Use private EC2 with ALB or CloudFront; release unattached Elastic IPs. |
| **Amazon RDS** | `db.t4g.micro` or `db.t3.micro` (20 GB storage) | \$12.00 – \$15.00 | Yes (`db.t3.micro` 750 hrs/mo for 12 mos) | For lowest cost mini-project, run PostgreSQL in Docker directly on the EC2 instance (\$0 additional RDS cost!). |
| **Amazon S3** | Standard Storage (< 10 GB) | < \$0.25 | Yes (5 GB Standard Storage, 20,000 GETs) | Configure S3 Lifecycle rules to delete files after 30 days. |
| **Amazon CloudFront** | CDN Distribution | \$0.00 | Yes (1 TB data transfer out free/month) | Default cache policies minimize origin requests. |
| **Data Transfer** | Outbound to Internet (< 10 GB) | < \$0.90 | Yes (100 GB/month always free) | Keep test files modest in size. |
| **CloudWatch Logs** | Log ingestion (< 2 GB) | < \$0.50 | Yes (5 GB log data ingestion free) | Retain logs for 7 days only. |

* **Total Estimated Monthly Cost (with Managed RDS):** ~\$20 – \$28
* **Total Estimated Monthly Cost (Single EC2 running Docker Compose):** ~\$8 – \$12

---

## 3. Step-by-Step AWS Provisioning Checklist

### Phase A: Amazon S3 Private Bucket Setup
1. Open the [AWS S3 Management Console](https://s3.console.aws.amazon.com/).
2. Create a bucket named: `cloudvault-storage-<account_id>-prod`.
3. Set **AWS Region** to your closest region (e.g., `us-east-1` or `ap-south-1`).
4. **Block Public Access settings:**
   * Keep **"Block all public access"** checked (Enabled).
5. **Bucket Versioning:** Optional / Enabled.
6. **Default Encryption:**
   * Encryption type: **Server-side encryption with Amazon S3 managed keys (SSE-S3)**.
7. Click **Create Bucket**.

### Phase B: IAM Instance Role Configuration
Create an IAM Role that allows the EC2 backend to read and write to the specific S3 bucket without using hardcoded access keys.

1. Open the [AWS IAM Console](https://console.aws.amazon.com/iam/).
2. Navigate to **Roles** -> **Create Role**.
3. Select **Trusted Entity Type:** **AWS service**, Common use cases: **EC2**.
4. Attach an inline customer-managed policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudVaultS3BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::cloudvault-storage-<account_id>-prod"
    },
    {
      "Sid": "CloudVaultS3ObjectAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::cloudvault-storage-<account_id>-prod/*"
    }
  ]
}
```

5. Name the role: `CloudVaultBackendEC2Role`.
6. Click **Create Role**.

### Phase C: Amazon RDS PostgreSQL (Optional if not using EC2 Docker DB)
1. Open [AWS RDS Console](https://console.aws.amazon.com/rds/).
2. Choose **Create database** -> **Standard create**.
3. Engine: **PostgreSQL 16**.
4. Template: **Free Tier**.
5. DB instance identifier: `cloudvault-db-prod`.
6. Master username: `cloudvault_admin`.
7. Master password: Auto-generate or choose a strong 24+ character password.
8. DB instance class: `db.t4g.micro` or `db.t3.micro`.
9. Storage: 20 GiB General Purpose SSD (gp2).
10. **Connectivity:**
    * VPC: Default VPC (or your project VPC).
    * Public access: **No** (Strict private access).
    * VPC security group: Create new `cloudvault-rds-sg`. Allow Inbound on port 5432 only from `cloudvault-ec2-sg`.

---

## 4. Backend Deployment on Amazon EC2

### 1. Launch EC2 Instance
* **AMI:** Ubuntu 24.04 LTS (HVM) or Amazon Linux 2023.
* **Instance Type:** `t3.micro` or `t4g.small`.
* **IAM Instance Profile:** Select `CloudVaultBackendEC2Role`.
* **Security Group (`cloudvault-ec2-sg`):**
  * SSH (22): Restricted to your personal IP (`your-ip/32`).
  * HTTP (80): Accessible from Anywhere or ALB.
  * Custom TCP (8000): Accessible from ALB / Nginx.

### 2. Connect via SSH and Install Runtime
```bash
ssh -i your-key.pem ubuntu@<ec2-public-ip>

# Update packages and install Python & Git
sudo apt-get update && sudo apt-get install -y python3-pip python3-venv git curl

# Clone the repository
git clone https://github.com/<your-username>/CloudVault.git
cd CloudVault
```

### 3. Create Environment File
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Configure `backend/.env`:
```ini
ENVIRONMENT=production
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=INFO

# Generate with: python3 -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=94b7f8c92a6b4c1d8e3f5a7b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Point to RDS endpoint or local PostgreSQL
DATABASE_URL=postgresql+psycopg://cloudvault_admin:your_rds_password@cloudvault-db-prod.xxxx.us-east-1.rds.amazonaws.com:5432/cloudvault_db

# S3 Configuration (Uses attached EC2 IAM Role automatically)
STORAGE_BACKEND=s3
S3_BUCKET_NAME=cloudvault-storage-<account_id>-prod
AWS_REGION=us-east-1

MAX_UPLOAD_SIZE_BYTES=10485760
PRESIGNED_URL_EXPIRATION_SECONDS=900
CORS_ORIGINS=https://vault.yourdomain.com,https://<cloudfront-id>.cloudfront.net
```

### 4. Run Migrations & Systemd Service
```bash
# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Run Alembic database migrations
PYTHONPATH=. alembic upgrade head

# Create Systemd unit file for FastAPI
sudo nano /etc/systemd/system/cloudvault.service
```

Paste into `/etc/systemd/system/cloudvault.service`:
```ini
[Unit]
Description=CloudVault FastAPI Backend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/CloudVault
EnvironmentFile=/home/ubuntu/CloudVault/backend/.env
ExecStart=/home/ubuntu/CloudVault/.venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable cloudvault
sudo systemctl start cloudvault
sudo systemctl status cloudvault
```

---

## 5. Frontend Build & S3 / CloudFront Hosting

### 1. Build Static Frontend
```bash
cd frontend
# Point to EC2 public endpoint or domain name
echo "VITE_API_URL=https://api.yourdomain.com" > .env.production
npm install
npm run build
```

### 2. Deploy to S3 Static Hosting
```bash
aws s3 sync dist/ s3://cloudvault-frontend-<account_id> --delete
```

### 3. Create CloudFront Distribution
1. Origin domain: `cloudvault-frontend-<account_id>.s3.amazonaws.com`.
2. S3 bucket access: **Origin Access Control (OAC)** (Restricts direct public S3 access).
3. Viewer protocol policy: **Redirect HTTP to HTTPS**.
4. Custom error response: For SPA routing, set HTTP Error code `404` -> Response page path `/index.html` -> HTTP Response code `200`.

---

## 6. Teardown & Resource Cleanup Instructions

When testing is complete or project evaluation concludes, delete resources in the following order to avoid ongoing charges:

1. **Delete S3 Objects & Buckets:**
   ```bash
   aws s3 rm s3://cloudvault-storage-<account_id>-prod --recursive
   aws s3 rb s3://cloudvault-storage-<account_id>-prod
   ```
2. **Terminate EC2 Instance:** Open EC2 Console -> Select Instance -> **Instance state: Terminate**.
3. **Delete RDS Database:** Open RDS Console -> Select `cloudvault-db-prod` -> **Delete** (Uncheck "Create final snapshot").
4. **Disable & Delete CloudFront Distribution:** In CloudFront Console, Disable distribution, then Delete.
5. **Release Elastic IP Addresses:** Ensure no unattached Elastic IPs remain allocated.
