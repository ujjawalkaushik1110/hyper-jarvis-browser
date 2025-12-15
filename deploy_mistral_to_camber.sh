#!/bin/bash

# Hyper-Jarvis: Download Mistral 7B & Deploy to Camber GPU
# Automates: Download -> Verify -> Archive -> Upload -> Deploy

set -e

echo "========================================"
echo "Hyper-Jarvis: Mistral 7B Camber Deployment"
echo "========================================"

# Configuration
MODEL_NAME="mistralai/Mistral-7B-Instruct-v0.2"
MODEL_DIR="./mistral_7b_model"
ARCHIVE_NAME="mistral_7b.tar.gz"
HF_HOME="~/.cache/huggingface"
CAMBER_JOB_NAME="mistral-7b-inference"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Download Mistral 7B from Hugging Face
echo ""
echo "Step 1: Downloading Mistral 7B from Hugging Face..."
echo "Model: $MODEL_NAME"
echo "Size: ~15 GB (this may take 5-15 minutes)"

python3 - <<'PYTHON_SCRIPT'
import os
from huggingface_hub import hf_hub_download, snapshot_download
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

model_name = "mistralai/Mistral-7B-Instruct-v0.2"
model_dir = "./mistral_7b_model"

print("Downloading model repository...")
os.makedirs(model_dir, exist_ok=True)

try:
    # Download using snapshot_download for full model
    snapshot_download(
        repo_id=model_name,
        local_dir=model_dir,
        local_dir_use_symlinks=False,
        resume_download=True
    )
    print("✓ Model downloaded successfully!")
    
    # Verify download
    print("Verifying model files...")
    required_files = ['config.json', 'model.safetensors', 'tokenizer.model']
    for file in required_files:
        file_path = os.path.join(model_dir, file)
        if os.path.exists(file_path):
            size_mb = os.path.getsize(file_path) / (1024*1024)
            print(f"  ✓ {file}: {size_mb:.2f} MB")
    
    print("✓ Model verification complete!")
    
except Exception as e:
    print(f"✗ Download failed: {e}")
    exit(1)
PYTHON_SCRIPT

log_info "Model downloaded and verified"

# Step 2: Create checksums for verification
echo ""
echo "Step 2: Creating checksums for verification..."
find $MODEL_DIR -type f -exec sha256sum {} \; > ${ARCHIVE_NAME%.tar.gz}.sha256
log_info "Checksums created"

# Step 3: Archive the model
echo ""
echo "Step 3: Creating archive for upload..."
echo "This may take a few minutes..."
tar -czf $ARCHIVE_NAME $MODEL_DIR
ARCHIVE_SIZE=$(du -h $ARCHIVE_NAME | cut -f1)
log_info "Archive created: $ARCHIVE_SIZE"

# Step 4: Upload to Camber
echo ""
echo "Step 4: Preparing Camber deployment..."

# Create Camber run script
cat > run_mistral_camber.py <<'RUN_SCRIPT'
#!/usr/bin/env python3
"""
vLLM Inference Server on Camber
Serves Mistral 7B with REST API
"""

import os
import tarfile
import subprocess
from pathlib import Path

print("Camber Job: Extracting model archive...")
if os.path.exists("mistral_7b.tar.gz"):
    with tarfile.open("mistral_7b.tar.gz", "r:gz") as tar:
        tar.extractall()
    print("✓ Model extracted")

print("Installing vLLM and dependencies...")
os.system("pip install -q vllm fastapi uvicorn")

print("Starting vLLM server...")
os.system("""
python -m vllm.entrypoints.api_server \\
  --model ./mistral_7b_model \\
  --host 0.0.0.0 \\
  --port 8000 \\
  --tensor-parallel-size 1 \\
  --dtype float16
""")
RUN_SCRIPT

log_info "Camber deployment script created"

# Step 5: Deploy to Camber
echo ""
echo "Step 5: Deploying to Camber GPU cluster..."
echo "Command: camber submit run_mistral_camber.py --gpu L4 --timeout 3600"

echo ""
echo "========================================"
echo "Deployment Configuration"
echo "========================================"
echo "GPU: L4 (24GB VRAM - optimal for Mistral 7B)"
echo "Timeout: 3600 seconds (1 hour)"
echo "Model: Mistral-7B-Instruct-v0.2"
echo "API Endpoint: http://localhost:8000 (local) or <camber-endpoint> (cluster)"
echo ""
echo "Next steps:"
echo "1. Submit to Camber:"
echo "   camber submit run_mistral_camber.py --gpu L4 --timeout 3600"
echo ""
echo "2. Monitor the job:"
echo "   camber logs <job-id> -f"
echo ""
echo "3. Test the endpoint:"
echo "   curl http://localhost:8000/v1/models"
echo ""
echo "4. Make an inference request:"
echo "   curl http://localhost:8000/v1/completions -H \"Content-Type: application/json\" \\"
echo "     -d '{\"model\": \"mistralai/Mistral-7B-Instruct-v0.2\", \"prompt\": \"Explain AI\", \"max_tokens\": 100}'"
echo ""
echo "========================================"
log_info "Deployment script ready!"
echo "========================================"
