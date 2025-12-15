# Hyper-Jarvis: Open-Source LLM Integration & Camber GPU Deployment Guide

## Overview
This guide covers integrating advanced open-source LLMs (DeepSeek, Mistral 7B, Llama 2 70B) with Hyper-Jarvis and deploying on Camber's GPU compute cluster.

## Supported LLMs

### 1. DeepSeek (Recommended - Most Advanced)
- **Model**: DeepSeek-67B-Chat or DeepSeek-7B
- **Performance**: State-of-the-art reasoning, best for complex tasks
- **VRAM**: 67B = 140GB (requires H100/A100), 7B = 16GB (L4 sufficient)
- **Speed**: Fast inference with optimized tensor operations

### 2. Mistral 7B (Resource-Efficient)
- **Model**: Mistral-7B-Instruct-v0.2
- **VRAM**: ~16GB
- **Performance**: Excellent for research/shopping workflows
- **Speed**: Fast, ~50 tokens/sec on L4 GPU

### 3. Llama 2 70B (Balanced)
- **Model**: Llama-2-70b-chat-hf
- **VRAM**: ~140GB
- **Performance**: Strong reasoning, good for multi-step tasks
- **Speed**: Slower but more capable than Mistral

## Setup on Camber GPU Cluster

### Step 1: Detect Available GPU & Select Model
```bash
# Check GPU memory on Camber cluster
camber run --gpu nvidia-smi

# Based on output:
# - H100 (80GB NVMe) -> DeepSeek-67B or Llama 2 70B
# - A100 (40GB) -> DeepSeek-7B or Mistral 7B
# - L4 (24GB) -> Mistral 7B (recommended)
# - T4 (16GB) -> Mistral 7B (tight fit)
```

### Step 2: Install vLLM for Efficient Serving
```bash
# Create Camber job
camber init hyper-jarvis-llm

# Install dependencies
pip install vllm==0.3.1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install transformers sentencepiece

# Download model weights (runs on first inference)
export HF_TOKEN=your_huggingface_token
```

### Step 3: Create LLM Server Script
```python
# llm_server.py
from vllm import LLM, SamplingParams
import torch
import json
from typing import List

class HyperJarvisLLM:
    def __init__(self, model_name: str = "mistralai/Mistral-7B-Instruct-v0.2"):
        # Auto-detect GPU
        device_count = torch.cuda.device_count()
        if device_count == 0:
            raise RuntimeError("No GPU found. Cannot run LLM.")
        
        # Initialize vLLM for efficient inference
        self.llm = LLM(
            model=model_name,
            tensor_parallel_size=device_count,
            dtype="float16",
            gpu_memory_utilization=0.90,
            enforce_eager=True
        )
        self.sampling_params = SamplingParams(
            temperature=0.7,
            top_p=0.95,
            max_tokens=2048
        )
    
    def reasoning_step(self, command: str, page_context: dict) -> dict:
        """Break down user command into actionable steps"""
        prompt = f"""
You are an AI browser automation agent. Given a user command and current page context, 
generate a JSON plan of browser actions.

User Command: {command}
Current Page:
- URL: {page_context.get('url', 'unknown')}
- Title: {page_context.get('title', 'unknown')}
- Visible Text: {page_context.get('visible_text', '')[:500]}

Respond with JSON:
{{
  "reasoning": "Your thought process",
  "steps": [
    {{"action": "navigate", "url": "..."}},
    {{"action": "click", "selector": "..."}},
    {{"action": "type", "selector": "...", "text": "..."}}
  ],
  "confidence": 0.95
}}
"""
        outputs = self.llm.generate([prompt], self.sampling_params)
        return json.loads(outputs[0].outputs[0].text)
    
    def extract_data(self, page_context: dict, schema: dict) -> dict:
        """Extract structured data from page"""
        prompt = f"""
Extract the following fields from the page:
{json.dumps(schema, indent=2)}

Page Content:
{page_context.get('visible_text', '')}

Respond with JSON matching the schema.
"""
        outputs = self.llm.generate([prompt], self.sampling_params)
        return json.loads(outputs[0].outputs[0].text)

# Start vLLM server
if __name__ == "__main__":
    llm = HyperJarvisLLM("mistralai/Mistral-7B-Instruct-v0.2")
    print("LLM server ready. Listening for inference requests...")
```

### Step 4: Deploy to Camber
```bash
# Submit job to Camber
camber submit llm_server.py --gpu L4 --timeout 3600

# Monitor job
camber logs <job-id> -f

# Get inference endpoint
INFERENCE_URL=$(camber get-endpoint <job-id>)
echo $INFERENCE_URL  # Use this in backend
```

### Step 5: Integrate with Hyper-Jarvis Backend
```python
# backend/modules/llm_handler.py
import requests
import os

class LLMReasoner:
    def __init__(self):
        self.llm_endpoint = os.getenv('LLM_ENDPOINT', 'http://localhost:8000')
    
    def get_next_action(self, user_command: str, page_state: dict):
        """Get LLM decision for next browser action"""
        response = requests.post(
            f"{self.llm_endpoint}/reason",
            json={
                "command": user_command,
                "page_context": page_state
            }
        )
        return response.json()['steps']
```

## Testing Workflows

### Research Workflow
```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Compare quantum computers from IBM and Google",
    "max_steps": 10,
    "sources": ["arxiv.org", "wikipedia.org"]
  }'
```

### Shopping Workflow
```bash
curl -X POST http://localhost:3000/api/shop \
  -H "Content-Type: application/json" \
  -d '{
    "item": "gaming laptop",
    "budget_max": 1500,
    "sites": ["amazon.com", "newegg.com"],
    "criteria": ["GPU RTX 4070", "16GB RAM", "SSD 512GB"]
  }'
```

## Monitoring & Optimization

### GPU Memory
```bash
camber run --gpu nvidia-smi -q -d MEMORY,COMPUTE_CAP
```

### Model Selection Logic
```python
def select_llm_by_vram():
    vram = get_gpu_vram_gb()
    if vram >= 140:  # H100
        return "deepseek/deepseek-67b-chat"
    elif vram >= 40:  # A100
        return "mistralai/Mistral-7B-Instruct-v0.2"
    elif vram >= 24:  # L4
        return "mistralai/Mistral-7B-Instruct-v0.2"
    else:
        raise RuntimeError(f"Insufficient GPU VRAM: {vram}GB")
```

## Next Steps
1. Deploy LLM server to Camber
2. Test with sample research/shopping commands
3. Integrate with Electron frontend
4. Build demo workflows
5. Launch Hyper-Jarvis browser beta

## Resources
- vLLM Docs: https://docs.vllm.ai/
- Camber Jobs API: https://docs.cambercloud.com/jobs
- DeepSeek Model Card: https://huggingface.co/deepseek-ai
- Mistral 7B: https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2
