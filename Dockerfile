# Use official NVIDIA CUDA image with Python
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Set working directory
WORKDIR /app

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3.10-dev \
    python3-pip \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Python alias
RUN ln -s /usr/bin/python3.10 /usr/bin/python

# Copy requirements
COPY vllm_server/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy vLLM server code
COPY vllm_server/ .

# Set environment variables
ENV HF_HOME=/app/huggingface_cache
ENV MODEL_CACHE=/app/model_cache
ENV PORT=8000
ENV HOST=0.0.0.0
ENV GPU_MEMORY_UTILIZATION=0.9
ENV MAX_NUM_SEQS=256

# Create cache directories
RUN mkdir -p /app/huggingface_cache /app/model_cache

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the vLLM server
CMD ["python3", "-u", "deepseek_vllm_server.py"]
