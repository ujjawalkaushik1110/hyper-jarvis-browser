# Hyper-Jarvis Browser v1.0-beta - Windows Installation Guide

## Admin Information
**Admins**: Ujjawal Kaushik, Jiya Singh
**Version**: 1.0-beta
**Type**: AI-Native Browser with Reasoning Capabilities

## System Requirements
- Windows 10/11 (64-bit)
- Python 3.8+
- 4GB RAM minimum
- Internet connection

## Installation Steps

### Method 1: Direct Python Launcher (Recommended)
1. Install Python from https://www.python.org (3.8+)
2. Open Command Prompt and install dependencies:
   ```
   pip install PyQt5 PyQtWebEngine requests
   ```
3. Run the launcher:
   ```
   python HyperJarvisBrowser_launcher.py
   ```

### Method 2: Executable (Coming Soon)
Pre-built .exe files will be available in the next release.

## Features
- AI-powered web browsing with reasoning
- Cloud-based vLLM integration
- Multi-model support (DeepSeek-R1, Qwen, etc.)
- Real-time response streaming
- Cross-platform support

## Troubleshooting

### PyQt5 Installation Issues
If PyQt5 fails to install, try:
```
pip install PyQt5 --no-cache-dir
```

### Port Already in Use
If port 8000 is already in use, modify the vLLM configuration.

## Support
For issues and feedback, please visit: https://github.com/ujjawalkaushik1110/hyper-jarvis-browser
