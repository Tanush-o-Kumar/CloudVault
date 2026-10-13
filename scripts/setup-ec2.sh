#!/bin/bash
# ============================================================
# CloudVault EC2 Bootstrap Script
# ============================================================
# Run this ONCE on a fresh Ubuntu 24.04 EC2 instance.
# It installs Docker, clones the repo, and starts all services.
#
# HOW TO USE:
#   1. SSH into your EC2:  ssh -i key.pem ubuntu@<EC2_IP>
#   2. Run:  curl -fsSL https://raw.githubusercontent.com/Tanush-o-Kumar/CloudVault/main/scripts/setup-ec2.sh | bash
#   OR copy this file to EC2 and run:  bash setup-ec2.sh
# ============================================================

set -e  # Exit on any error

echo "╔══════════════════════════════════════════╗"
echo "║   CloudVault EC2 Bootstrap Starting...   ║"
echo "╚══════════════════════════════════════════╝"

# ── 1. System update ────────────────────────────────────────
echo "[1/7] Updating system packages..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

# ── 2. Install Docker ───────────────────────────────────────
echo "[2/7] Installing Docker..."
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# Apply group without needing to logout
sudo -u ubuntu docker info > /dev/null 2>&1 || true

# Install Docker Compose plugin (v2)
sudo apt-get install -y docker-compose-plugin

# ── 3. Clone repository ─────────────────────────────────────
echo "[3/7] Cloning CloudVault repository..."
cd /home/ubuntu
if [ -d "CloudVault" ]; then
    echo "  → Repository already exists, pulling latest changes..."
    cd CloudVault && git pull origin main
else
    git clone https://github.com/Tanush-o-Kumar/CloudVault.git
    cd CloudVault
fi

# ── 4. Generate secret key ──────────────────────────────────
echo "[4/7] Generating secret key..."
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")

# ── 5. Create backend production env file ───────────────────
echo "[5/7] Creating backend/.env.prod..."
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ⚠  YOU NEED TO FILL IN THESE VALUES  ⚠  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  S3_BUCKET_NAME  → your file storage bucket name"
echo "  AWS_REGION      → your AWS region (e.g. us-east-1)"
echo ""

# Prompt for required values
read -rp "Enter your S3 bucket name (e.g. cloudvault-files-123456789): " S3_BUCKET
read -rp "Enter your AWS region (press Enter for us-east-1): " AWS_REGION
AWS_REGION="${AWS_REGION:-us-east-1}"
read -rp "Enter CloudFront URL or EC2 IP for CORS (e.g. http://3.84.x.x or https://xxxx.cloudfront.net): " CORS_URL

# Generate secure passwords
DB_PASS=$(python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(24)))")

cat > /home/ubuntu/CloudVault/backend/.env.prod << EOF
# ── CloudVault Production Environment ──
ENVIRONMENT=production
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=INFO

# Security — auto-generated, do not share!
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database — PostgreSQL running in Docker on this EC2 instance
DATABASE_URL=postgresql+psycopg://cloudvault_user:${DB_PASS}@db:5432/cloudvault_db

# Storage — Amazon S3 (IAM role handles auth automatically)
STORAGE_BACKEND=s3
S3_BUCKET_NAME=${S3_BUCKET}
AWS_REGION=${AWS_REGION}
# AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are NOT needed — IAM role is attached to this EC2

# Upload limits
MAX_UPLOAD_SIZE_BYTES=10485760
PRESIGNED_URL_EXPIRATION_SECONDS=900

# CORS — your CloudFront URL or EC2 IP
CORS_ORIGINS=${CORS_URL}
EOF

# Also create .env for Docker Compose variable substitution
cat > /home/ubuntu/CloudVault/docker/.env << EOF
POSTGRES_USER=cloudvault_user
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=cloudvault_db
SECRET_KEY=${SECRET_KEY}
S3_BUCKET_NAME=${S3_BUCKET}
AWS_REGION=${AWS_REGION}
EOF

echo "  ✅ backend/.env.prod created"
echo "  ✅ docker/.env created"

# ── 6. Start all containers ─────────────────────────────────
echo "[6/7] Building and starting Docker containers..."
cd /home/ubuntu/CloudVault

sudo -u ubuntu docker compose -f docker/docker-compose.prod.yml up -d --build

echo "[7/7] Waiting for services to be healthy..."
sleep 20

# ── 7. Verify deployment ────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║           Deployment Status Check                ║"
echo "╚═══════════════════════════════════════════════════╝"

# Check containers
docker compose -f /home/ubuntu/CloudVault/docker/docker-compose.prod.yml ps

# Check health endpoint
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo ""
echo "Testing backend health..."
curl -s "http://localhost/health" | python3 -m json.tool || echo "⚠ Health check not yet ready — wait 30 seconds and try: curl http://localhost/health"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    🎉 DEPLOYMENT COMPLETE!                ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  EC2 Public IP  :  http://${EC2_IP}                      "
echo "║  API Base URL   :  http://${EC2_IP}/api/                 "
echo "║  Health Check   :  http://${EC2_IP}/health               "
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next step: Build the frontend and upload to S3!"
echo "See the deployment guide for instructions."
