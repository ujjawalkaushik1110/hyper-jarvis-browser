# hyper-jarvis-browser
Hyper-Jarvis: AI-native browser with agentic reasoning. Controls browser automation, runs complex multi-step tasks, integrates with LLM reasoning (GPT/Claude/DeepSeek), and deploys on Camber's GPU compute. Built with Electron + Node.js/Playwright + Reasoning LLM.

## Quick Start - Download & Deploy Mistral 7B LLM

### Step 1: Clone the Repository
```bash
git clone https://github.com/ujjawalkaushik1110/hyper-jarvis-browser.git
cd hyper-jarvis-browser
```

### Step 2: Install Dependencies & Download Model
```bash
python setup_mistral_llm.py
```
This will:
- Install vLLM, PyTorch, Transformers
- Download Mistral 7B from Hugging Face (~15 GB)
- Create vLLM inference server

### Step 3: Start LLM Server Locally
```bash
python setup_mistral_llm.py --start-server
```
Server will be available at: `http://localhost:8000`

### Step 4: Test the LLM
```bash
curl http://localhost:8000/health
```

## Deploy on Camber GPU Cluster

```bash
# Submit to Camber with L4 GPU
camber submit mistral_vllm_server.py --gpu L4 --timeout 3600

# Get the endpoint
camber logs <job-id> -f
```

## Documentation
- **LLM-DEPLOYMENT.md** - Comprehensive guide for LLM setup & deployment
- **setup_mistral_llm.py** - Automated setup script

## Tech Stack
- **Frontend**: Electron + React
- **Backend**: Node.js + Express + Playwright
- **LLM**: Mistral 7B (via vLLM) on Camber GPU
- **Automation**: Playwright for browser control
- **Reasoning**: Agentic LLM for multi-step task planning

## Features
✨ AI-native browser automation  
✨ Open-source LLM reasoning (DeepSeek/Mistral/Llama)  
✨ GPU-optimized inference on Camber  
✨ Multi-step task workflows  
✨ Research, shopping, form-filling modes  

## License
MIT

