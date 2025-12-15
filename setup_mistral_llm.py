#!/usr/bin/env python3
"""
Setup Mistral 7B LLM from Hugging Face and Deploy on Camber GPU

Usage:
    python setup_mistral_llm.py --download-only
    python setup_mistral_llm.py --start-server
"""

import os
import subprocess
import argparse
import sys
from pathlib import Path

class MistralLLMSetup:
    def __init__(self):
        self.model_name = "mistralai/Mistral-7B-Instruct-v0.2"
        self.cache_dir = Path(os.getenv("HF_HOME", "~/.cache/huggingface")).expanduser()
        self.models_dir = self.cache_dir / "hub" / self.model_name.replace("/", "--")
        
    def install_dependencies(self):
        """Install required Python packages"""
        print("Installing required packages...")
        packages = [
            "vllm==0.3.1",
            "torch --index-url https://download.pytorch.org/whl/cu118",
            "transformers",
            "sentencepiece",
            "pydantic",
        ]
        
        for package in packages:
            print(f"  Installing {package}...")
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "-q"] + package.split(),
                check=True
            )
        print("✓ Dependencies installed")
    
    def download_model(self):
        """Download Mistral 7B from Hugging Face"""
        print(f"\nDownloading {self.model_name}...")
        print(f"Cache location: {self.models_dir}")
        print(f"Size: ~15 GB (will take 5-15 min depending on internet)\n")
        
        os.environ["HF_HOME"] = str(self.cache_dir)
        
        # Create a simple Python script to download the model
        download_script = '''
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_name = "mistralai/Mistral-7B-Instruct-v0.2"
print(f"Downloading {model_name}...")

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto"
)

print(f"✓ {model_name} downloaded successfully!")
print(f"Model loaded on GPU: {next(model.parameters()).device}")
'''
        
        # Execute download
        subprocess.run([sys.executable, "-c", download_script], check=True)
        
    def create_vllm_server(self):
        """Create vLLM inference server script"""
        server_script = Path("mistral_vllm_server.py")
        
        content = '''#!/usr/bin/env python3
"""
vLLM Inference Server for Mistral 7B
Provides REST API for LLM reasoning in Hyper-Jarvis
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from vllm import LLM, SamplingParams
import torch
import json

app = FastAPI(title="Hyper-Jarvis Mistral LLM Server")

class InferenceRequest(BaseModel):
    prompt: str
    max_tokens: int = 2048
    temperature: float = 0.7
    top_p: float = 0.95

class InferenceResponse(BaseModel):
    text: str
    stop_reason: str

# Initialize vLLM
print("Initializing Mistral 7B with vLLM...")
llm = LLM(
    model="mistralai/Mistral-7B-Instruct-v0.2",
    tensor_parallel_size=torch.cuda.device_count(),
    dtype="float16",
    gpu_memory_utilization=0.90,
    max_model_len=4096,
)
print("✓ vLLM server ready!")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "Mistral-7B", "gpu_count": torch.cuda.device_count()}

@app.post("/infer", response_model=InferenceResponse)
async def infer(request: InferenceRequest):
    try:
        sampling_params = SamplingParams(
            temperature=request.temperature,
            top_p=request.top_p,
            max_tokens=request.max_tokens,
        )
        
        outputs = llm.generate([request.prompt], sampling_params)
        text = outputs[0].outputs[0].text
        
        return InferenceResponse(
            text=text,
            stop_reason=outputs[0].outputs[0].finish_reason
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reason")
async def browser_reasoning(request: InferenceRequest):
    """LLM reasoning for browser automation"""
    try:
        # Add system prompt for browser automation
        system = """You are an AI browser automation agent. Given a user command and current page state,
generateJSONplan with browser actions. Return only valid JSON."""
        
        full_prompt = f"{system}\n\n{request.prompt}"
        
        sampling_params = SamplingParams(
            temperature=request.temperature,
            top_p=request.top_p,
            max_tokens=request.max_tokens,
        )
        
        outputs = llm.generate([full_prompt], sampling_params)
        response_text = outputs[0].outputs[0].text
        
        # Try to extract JSON
        try:
            json_data = json.loads(response_text)
            return {"plan": json_data, "raw": response_text}
        except:
            return {"plan": None, "raw": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("\n" + "="*50)
    print("Mistral 7B vLLM Server Starting...")
    print("="*50)
    print("Health: http://localhost:8000/health")
    print("Docs: http://localhost:8000/docs")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''
        
        server_script.write_text(content)
        print(f"✓ vLLM server script created: {server_script}")
        return server_script
    
    def start_server(self):
        """Start the vLLM inference server"""
        print("\nStarting vLLM Inference Server...")
        print("Server will be available at: http://localhost:8000")
        
        subprocess.run([sys.executable, "mistral_vllm_server.py"], check=True)

def main():
    parser = argparse.ArgumentParser(description="Setup Mistral 7B LLM")
    parser.add_argument(
        "--download-only",
        action="store_true",
        help="Only download the model, don't start server"
    )
    parser.add_argument(
        "--start-server",
        action="store_true",
        help="Start the vLLM inference server"
    )
    parser.add_argument(
        "--full-setup",
        action="store_true",
        default=True,
        help="Full setup: install, download, create server (default)"
    )
    
    args = parser.parse_args()
    setup = MistralLLMSetup()
    
    try:
        if args.download_only:
            setup.install_dependencies()
            setup.download_model()
        elif args.start_server:
            setup.start_server()
        else:  # Full setup
            setup.install_dependencies()
            setup.download_model()
            setup.create_vllm_server()
            print("\n✓ Setup complete!")
            print("\nNext steps:")
            print("  1. Start server: python setup_mistral_llm.py --start-server")
            print("  2. Or on Camber: camber submit mistral_vllm_server.py --gpu L4")
            print("  3. Test: curl http://localhost:8000/health")
    
    except Exception as e:
        print(f"\n✗ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
