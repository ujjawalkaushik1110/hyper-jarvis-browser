#!/usr/bin/env python3
"""
DeepSeek vLLM Server for Hyper-Jarvis
Production-ready server with OpenAI API compatibility
Deployed on Camber GPU cluster
"""

import os
import json
import logging
import asyncio
import sys
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

try:
    from vllm import AsyncLLMEngine, SamplingParams, AsyncEngineArgs
    from vllm.lora.request import LoRARequest
except ImportError:
    print("Installing vLLM...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "vllm"])
    from vllm import AsyncLLMEngine, SamplingParams, AsyncEngineArgs

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
import uvicorn
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configuration
MODEL_NAME = "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"
GPU_MEMORY_UTILIZATION = float(os.environ.get("GPU_MEMORY_UTILIZATION", "0.9"))
MAX_NUM_SEQS = int(os.environ.get("MAX_NUM_SEQS", "256"))
TENSOR_PARALLEL_SIZE = int(os.environ.get("TENSOR_PARALLEL_SIZE", "1"))
PIPELINE_PARALLEL_SIZE = int(os.environ.get("PIPELINE_PARALLEL_SIZE", "1"))

# API Models
class Message(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str = Field(default=MODEL_NAME)
    messages: List[Message]
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(default=512, ge=1, le=4096)
    stream: bool = False
    stop: Optional[List[str]] = None

class CompletionRequest(BaseModel):
    model: str = Field(default=MODEL_NAME)
    prompt: str
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(default=512, ge=1, le=4096)
    stream: bool = False
    stop: Optional[List[str]] = None

class HealthResponse(BaseModel):
    status: str
    model: str
    timestamp: float

# Global engine
engine = None

async def initialize_engine():
    """Initialize vLLM engine with DeepSeek model"""
    global engine
    logger.info(f"Initializing vLLM engine with {MODEL_NAME}...")
    
    engine_args = AsyncEngineArgs(
        model=MODEL_NAME,
        trust_remote_code=True,
        gpu_memory_utilization=GPU_MEMORY_UTILIZATION,
        max_num_seqs=MAX_NUM_SEQS,
        tensor_parallel_size=TENSOR_PARALLEL_SIZE,
        pipeline_parallel_size=PIPELINE_PARALLEL_SIZE,
        dtype="auto",
        enforce_eager=False,
    )
    
    engine = AsyncLLMEngine.from_engine_args(engine_args)
    logger.info(f"Engine initialized successfully")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage engine lifecycle"""
    await initialize_engine()
    yield
    if engine:
        engine.stop()

app = FastAPI(
    title="Hyper-Jarvis vLLM Server",
    description="DeepSeek-R1 LLM Server with OpenAI API Compatibility",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/health")
async def health_check() -> HealthResponse:
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model=MODEL_NAME,
        timestamp=time.time()
    )

@app.post("/v1/chat/completions")
async def chat_completion(request: ChatCompletionRequest):
    """OpenAI-compatible chat completion endpoint"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    # Format messages into prompt
    prompt = ""
    for message in request.messages:
        if message["role"] == "system":
            prompt += f"System: {message['content']}\n"
        elif message["role"] == "user":
            prompt += f"User: {message['content']}\n"
        elif message["role"] == "assistant":
            prompt += f"Assistant: {message['content']}\n"
    prompt += "Assistant:"
    
    # Create sampling params
    sampling_params = SamplingParams(
        temperature=request.temperature,
        top_p=request.top_p,
        max_tokens=request.max_tokens,
        stop=request.stop,
    )
    
    # Generate
    request_id = f"hyper-jarvis-{int(time.time() * 1000)}"
    results = await engine.generate(prompt, sampling_params, request_id)
    
    # Format response
    return {
        "id": request_id,
        "object": "chat.completion",
        "created": int(time.time()),
        "model": request.model,
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": results[0].outputs[0].text
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": len(prompt.split()),
            "completion_tokens": len(results[0].outputs[0].text.split()),
            "total_tokens": len(prompt.split()) + len(results[0].outputs[0].text.split())
        }
    }

@app.post("/v1/completions")
async def completion(request: CompletionRequest):
    """OpenAI-compatible completion endpoint"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    sampling_params = SamplingParams(
        temperature=request.temperature,
        top_p=request.top_p,
        max_tokens=request.max_tokens,
        stop=request.stop,
    )
    
    request_id = f"hyper-jarvis-{int(time.time() * 1000)}"
    results = await engine.generate(request.prompt, sampling_params, request_id)
    
    return {
        "id": request_id,
        "object": "text_completion",
        "created": int(time.time()),
        "model": request.model,
        "choices": [{
            "text": results[0].outputs[0].text,
            "index": 0,
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": len(request.prompt.split()),
            "completion_tokens": len(results[0].outputs[0].text.split()),
            "total_tokens": len(request.prompt.split()) + len(results[0].outputs[0].text.split())
        }
    }

@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "object": "list",
        "data": [{
            "id": MODEL_NAME,
            "object": "model",
            "created": int(time.time()),
            "owned_by": "deepseek-ai",
            "permission": [],
            "root": MODEL_NAME,
            "parent": None
        }]
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
