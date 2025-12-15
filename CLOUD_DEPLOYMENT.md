# Hyper-Jarvis Cloud Deployment Guide

## Complete Setup & Deployment Instructions

This guide covers deploying the complete Hyper-Jarvis AI Browser system on Camber cloud infrastructure.

---

## Architecture Overview

The system consists of three integrated components:

1. **vLLM Server (Backend)** - DeepSeek-R1 LLM inference on Camber GPU
2. **Windows Desktop App** - PyQt5 GUI application 
3. **Mobile App** - React Native for iOS/Android

---

## Part 1: Deploy vLLM Server on Camber

### Prerequisites
- Camber Cloud account with GPU access
- Docker installed locally (for testing)
- Git access to this repository

### Step 1: Build Docker Image

```bash
git clone https://github.com/ujjawalkaushik1110/hyper-jarvis-browser.git
cd hyper-jarvis-browser
docker build -t hyper-jarvis-vllm:latest -f Dockerfile .
```

### Step 2: Deploy on Camber

1. Log into Camber Cloud console
2. Create new Job/Agent
3. Upload the Docker image or push to registry:
   ```bash
   docker tag hyper-jarvis-vllm:latest <your-registry>/hyper-jarvis-vllm:latest
   docker push <your-registry>/hyper-jarvis-vllm:latest
   ```
4. Configure job with:
   - **Image**: hyper-jarvis-vllm:latest
   - **GPU**: A100 or H100 (8GB+ VRAM minimum)
   - **Port**: 8000
   - **Env Variables**:
     - `PORT=8000`
     - `GPU_MEMORY_UTILIZATION=0.9`
     - `MAX_NUM_SEQS=256`

### Step 3: Verify Deployment

```bash
# Test health endpoint
curl http://<server-ip>:8000/health

# Should return:
# {"status": "healthy", "model": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"}
```

---

## Part 2: Set Up Windows Desktop App

### Installation

```bash
# Clone repository
git clone https://github.com/ujjawalkaushik1110/hyper-jarvis-browser.git
cd hyper-jarvis-browser

# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install PyQt5 PyQtWebEngine requests python-dotenv
```

### Configuration

Create `.env` file in project root:

```
LLM_SERVER_URL=http://<camber-ip>:8000
```

### Launch Application

```bash
python desktop_apps/windows_desktop_app.py
```

### Building Executable

To create a standalone .exe:

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --add-data "vllm_server:vllm_server" \\
    desktop_apps/windows_desktop_app.py

# Executable will be in dist/windows_desktop_app.exe
```

---

## Part 3: Set Up Mobile App

### Prerequisites
- Node.js 16+ installed
- React Native CLI installed
- Android Studio or Xcode (for native development)

### Installation

```bash
# Install React Native CLI
npm install -g react-native-cli

# Create React Native project
rpx init HyperJarvisMobile
cd HyperJarvisMobile

# Copy App.tsx
cp ../mobile_app/App.tsx .
```

### Configuration

Update `App.tsx` with Camber server URL:

```typescript
const LLM_SERVER_URL = 'http://<camber-ip>:8000';
```

### Build for Android

```bash
react-native run-android

# For release:
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/
```

### Build for iOS

```bash
react-native run-ios

# For release:
cd ios
pod install
xcodebuild -scheme HyperJarvisMobile -configuration Release -derivedDataPath build
```

---

## Testing

### Desktop App

1. Open Windows Desktop App
2. Verify "LLM Server: Connected" appears
3. Enter task: "Google what is python"
4. Click "Execute Task"
5. Response should appear in output area

### Mobile App

1. Launch app on device/emulator
2. Check server connection indicator
3. Enter browser task
4. Tap "Execute Task"
5. View response

---

## API Endpoints

Both applications use OpenAI-compatible API:

```bash
# Chat Completion
POST /v1/chat/completions
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "task description"}],
  "max_tokens": 512,
  "temperature": 0.7
}

# Text Completion
POST /v1/completions
Content-Type: application/json

{
  "prompt": "task description",
  "max_tokens": 512,
  "temperature": 0.7
}

# Health Check
GET /health
```

---

## Troubleshooting

### "Cannot connect to LLM Server"
- Verify Camber job is running
- Check firewall/security groups allow port 8000
- Verify URL in .env or app config

### Out of Memory
- Reduce MAX_NUM_SEQS in Dockerfile
- Decrease GPU_MEMORY_UTILIZATION
- Use smaller model variant

### Slow Responses
- Increase GPU memory allocation
- Use faster GPU (H100 vs A100)
- Reduce max_tokens

---

## Next Steps

1. Download apps from Releases
2. Deploy vLLM on Camber
3. Configure client applications
4. Test end-to-end functionality
5. Monitor performance metrics

---

## Support

For issues, refer to:
- GitHub Issues: https://github.com/ujjawalkaushik1110/hyper-jarvis-browser/issues
- Camber Docs: https://docs.cambercloud.com
- vLLM Docs: https://docs.vllm.ai
